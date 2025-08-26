import * as chrono from 'chrono-node';
import { DateTime } from 'luxon';
import { CONFIG } from './config.js';
import { getUserTimezone } from './db.js';

export function resolveUserTz(userId: string): string {
  return getUserTimezone(userId) || CONFIG.defaultTz || 'UTC';
}

export function parseWhen(input: string, userId: string): { epoch: number; display: string } | null {
  const tz = resolveUserTz(userId);
  const now = DateTime.now().setZone(tz);
  
  // Handle "today" explicitly to avoid chrono's forwardDate behavior
  const normalizedInput = input.toLowerCase().trim();
  let useForwardDate = true;
  
  // If the input explicitly mentions "today", we want to be more permissive
  if (normalizedInput.includes('today')) {
    useForwardDate = false;
  }
  
  // Use chrono-node with explicit timezone offset to parse text
  const ref = { instant: now.toJSDate(), timezone: now.offset };
  const parsed = chrono.parse(input, ref, { forwardDate: useForwardDate });
  if (!parsed?.length) return null;

  const result = parsed[0];
  let targetTime = DateTime.fromJSDate(result.date(), { zone: tz });
  
  // If we parsed "today" but got a past time, and forwardDate was disabled,
  // check if we should move it to tomorrow
  if (normalizedInput.includes('today') && targetTime < now) {
    // Only move to tomorrow if the time is significantly in the past (more than 1 minute)
    const diffMinutes = now.diff(targetTime, 'minutes').minutes;
    if (diffMinutes > 1) {
      targetTime = targetTime.plus({ days: 1 });
    }
  }
  
  if (!targetTime.isValid) {
    return null;
  }
  
  const utcTime = targetTime.toUTC();
  const epoch = Math.floor(utcTime.toSeconds());
  const display = `<t:${epoch}:F> (<t:${epoch}:R>)`;
  
  return { epoch, display };
}

export function addSnooze(epoch: number, seconds: number) {
  return epoch + seconds;
}
