import { ChatInputCommandInteraction, SlashCommandBuilder, MessageFlags } from 'discord.js';
import { getUserReminders, cancelReminder, rescheduleReminder } from '../db.js';
import { parseWhen } from '../time.js';

export const remindersSlash = new SlashCommandBuilder()
  .setName('reminders')
  .setDescription('View or manage your reminders')
  .addSubcommand(s => s
    .setName('list')
    .setDescription('List your scheduled reminders'))
  .addSubcommand(s => s
    .setName('cancel')
    .setDescription('Cancel a reminder by id')
    .addIntegerOption(o => o.setName('id').setDescription('Reminder id').setRequired(true)))
  .addSubcommand(s => s
    .setName('snooze')
    .setDescription('Snooze a reminder by id (1h/1d/1w)')
    .addIntegerOption(o => o.setName('id').setDescription('Reminder id').setRequired(true))
    .addStringOption(o => o.setName('preset').setDescription('How long').setRequired(true)
      .addChoices({ name: '1h', value: '3600' }, { name: '1d', value: '86400' }, { name: '1w', value: '604800' })))
  .addSubcommand(s => s
    .setName('reschedule')
    .setDescription('Reschedule a reminder by id to a new time')
    .addIntegerOption(o => o.setName('id').setDescription('Reminder id').setRequired(true))
    .addStringOption(o => o.setName('when').setDescription('e.g., "tomorrow 9am"').setRequired(true)));

export async function handleRemindersSlash(i: ChatInputCommandInteraction) {
  const sub = i.options.getSubcommand();
  if (sub === 'list') {
    const reminders = getUserReminders(i.user.id, { limit: 25 });
    if (reminders.length === 0) return i.reply({ content: 'You have no scheduled reminders.', flags: MessageFlags.Ephemeral });
    const lines = reminders.map(r => `#${r.id} — due <t:${r.due_at}:F> (<t:${r.due_at}:R>)${r.message_link ? ` — [jump](${r.message_link})` : ''}`);
    return i.reply({ content: ['Your reminders:', ...lines].join('\n'), flags: MessageFlags.Ephemeral });
  }
  if (sub === 'cancel') {
    const id = i.options.getInteger('id', true);
    cancelReminder(id);
    return i.reply({ content: `Canceled reminder #${id}.`, flags: MessageFlags.Ephemeral });
  }
  if (sub === 'snooze') {
    const id = i.options.getInteger('id', true);
    const preset = parseInt(i.options.getString('preset', true), 10);
    const newEpoch = Math.floor(Date.now() / 1000) + preset;
    rescheduleReminder(id, newEpoch);
    return i.reply({ content: `Snoozed reminder #${id} to <t:${newEpoch}:F> (<t:${newEpoch}:R>).`, flags: MessageFlags.Ephemeral });
  }
  if (sub === 'reschedule') {
    const id = i.options.getInteger('id', true);
    const when = i.options.getString('when', true);
    const parsed = parseWhen(when, i.user.id);
    if (!parsed) return i.reply({ content: 'Could not parse time. Try like: `in 1h`, `tomorrow 9am`, `Aug 21 15:30`.', flags: MessageFlags.Ephemeral });
    rescheduleReminder(id, parsed.epoch);
    return i.reply({ content: `Rescheduled reminder #${id} to ${parsed.display}.`, flags: MessageFlags.Ephemeral });
  }
}
