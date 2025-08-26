import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { insertReminder } from '../db.js';
import { parseWhen } from '../time.js';

export const remindSlash = new SlashCommandBuilder()
  .setName('remind')
  .setDescription('Create a reminder by link or note (works anywhere in Discord)')
  .addStringOption(o => o.setName('when').setDescription('When? e.g., "in 2h", "Aug 21 15:30"').setRequired(true))
  .addStringOption(o => o.setName('link').setDescription('Optional Discord message link'))
  .addStringOption(o => o.setName('note').setDescription('Optional note to include in the reminder'));

export async function handleRemindSlash(i: ChatInputCommandInteraction) {
  const when = i.options.getString('when', true);
  const link = i.options.getString('link') ?? undefined;
  const note = i.options.getString('note') ?? undefined;

  const parsed = parseWhen(when, i.user.id);
  if (!parsed) return i.reply({ content: 'Could not parse time. Try like: `in 1h`, `tomorrow 9am`, `Aug 21 15:30`.', flags: MessageFlags.Ephemeral });

  const id = insertReminder({
    user_id: i.user.id,
    source_guild_id: i.guildId,
    source_channel_id: i.channelId,
    source_message_id: null,
    message_link: link ?? null,
    message_excerpt: note ?? null,
    due_at: parsed.epoch,
  });

  return i.reply({ content: `⏰ Scheduled reminder #${id} for ${parsed.display}${link ? `\nLink: ${link}` : ''}${note ? `\nNote: ${note}` : ''}`, flags: MessageFlags.Ephemeral });
}
