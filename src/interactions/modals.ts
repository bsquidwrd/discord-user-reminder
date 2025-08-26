import { ModalSubmitInteraction, MessageFlags } from 'discord.js';
import { parseWhen } from '../time.js';
import { insertReminder } from '../db.js';

export async function handleCustomModal(i: ModalSubmitInteraction) {
  const when = i.fields.getTextInputValue('when');
  const parsed = parseWhen(when, i.user.id);
  if (!parsed) {
    return i.reply({ content: 'Sorry, I could not parse that time. Try like: `Aug 20 3pm`, `in 2h`, `tomorrow 9:00`.', flags: MessageFlags.Ephemeral });
  }

  const target = i.message?.embeds?.[0];
  const jumpField = target?.data?.fields?.find(f => f.name === 'Jump')?.value ?? '';
  const linkMatch = jumpField.match(/\((.+)\)/);
  const link = linkMatch ? linkMatch[1] : null;

  insertReminder({
    user_id: i.user.id,
    source_guild_id: i.guildId,
    source_channel_id: i.channelId,
    source_message_id: null,
    message_link: link,
    message_excerpt: target?.data?.description ?? null,
    due_at: parsed.epoch,
  });

  await i.reply({ content: `⏰ Scheduled for ${parsed.display}`, flags: MessageFlags.Ephemeral });
}
