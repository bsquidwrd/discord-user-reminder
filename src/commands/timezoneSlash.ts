import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { setUserTimezone, getUserTimezone } from '../db.js';
import { DateTime } from 'luxon';

export const timezoneSlash = new SlashCommandBuilder()
  .setName('timezone')
  .setDescription('Set or show your timezone')
  .addSubcommand(s => s
    .setName('set')
    .setDescription('Set your timezone (IANA name like America/Los_Angeles)')
    .addStringOption(o => o.setName('tz').setDescription('e.g., America/Los_Angeles').setRequired(true)))
  .addSubcommand(s => s
    .setName('show')
    .setDescription('Show your current timezone'));

export async function handleTimezoneSlash(i: ChatInputCommandInteraction) {
  const sub = i.options.getSubcommand();
  if (sub === 'set') {
    const tz = i.options.getString('tz', true);
    const ok = DateTime.now().setZone(tz).isValid;
    if (!ok) return i.reply({ content: 'Invalid timezone. Use an IANA zone, e.g., `America/Los_Angeles`.', flags: MessageFlags.Ephemeral });
    setUserTimezone(i.user.id, tz);
    return i.reply({ content: `Saved timezone: **${tz}**`, flags: MessageFlags.Ephemeral });
  }
  if (sub === 'show') {
    const tz = getUserTimezone(i.user.id) || 'UTC';
    return i.reply({ content: `Your timezone: **${tz}**`, flags: MessageFlags.Ephemeral });
  }
}
