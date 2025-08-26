import { ActionRowBuilder, ButtonInteraction, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { DateTime } from 'luxon';
import { insertReminder, rescheduleReminder } from '../db.js';
import { resolveUserTz } from '../time.js';

export async function handlePresetButton(i: ButtonInteraction, seconds: number) {
  const target = i.message?.embeds?.[0];
  const jumpField = target?.data?.fields?.find(f => f.name === 'Jump')?.value ?? '';
  const linkMatch = jumpField.match(/\((.+)\)/);
  const link = linkMatch ? linkMatch[1] : null;

  const due = Math.floor(Date.now() / 1000) + seconds;
  insertReminder({
    user_id: i.user.id,
    source_guild_id: i.guildId,
    source_channel_id: i.channelId,
    source_message_id: null,
    message_link: link,
    message_excerpt: target?.data?.description ?? null,
    due_at: due,
  });
  await i.update({ content: `⏰ Scheduled for <t:${due}:F> (<t:${due}:R>)`, components: [], embeds: i.message.embeds });
}

export async function openCustomModal(i: ButtonInteraction) {
  const modal = new ModalBuilder().setCustomId('remind_custom_modal').setTitle('Custom reminder time');
  const whenInput = new TextInputBuilder()
    .setCustomId('when')
    .setLabel('When? (e.g., "tomorrow 9am", "Aug 21 15:30")')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);
  modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(whenInput));
  await i.showModal(modal);
}

export async function handleSnoozeButton(i: ButtonInteraction, reminderId: number, seconds: number) {
  const tz = resolveUserTz(i.user.id);
  const newEpoch = Math.floor(DateTime.now().setZone(tz).plus({ seconds }).toSeconds());
  rescheduleReminder(reminderId, newEpoch);
  await i.update({
    content: `⏰ Snoozed to <t:${newEpoch}:F> (<t:${newEpoch}:R>)`,
    components: [],
    embeds: i.message.embeds,
  });
}
