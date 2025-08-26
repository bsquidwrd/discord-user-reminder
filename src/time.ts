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
  
  // Create reference date in user's local time
  const refDate = new Date(now.year, now.month - 1, now.day, now.hour, now.minute, now.second);
  
  // Parse with appropriate forward date setting
  const parsed = chrono.parse(input, refDate, { forwardDate: useForwardDate });
  if (!parsed?.length) return null;
  
  const result = parsed[0];
  const parsedDate = result.date();
  
  // Extract components
  const year = parsedDate.getFullYear();
  const month = parsedDate.getMonth() + 1;
  const day = parsedDate.getDate();
  const hour = parsedDate.getHours();
  const minute = parsedDate.getMinutes();
  const second = parsedDate.getSeconds();
  
  // Create target time in user's timezone
  let targetTime = DateTime.fromObject({
    year, month, day, hour, minute, second
  }, { zone: tz });
  
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
