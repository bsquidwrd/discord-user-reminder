import {
  ActionRowBuilder,
  ApplicationCommandType,
  ButtonBuilder,
  ButtonStyle,
  ContextMenuCommandBuilder,
  MessageContextMenuCommandInteraction,
  EmbedBuilder,
  MessageFlags,
} from 'discord.js';

export const REMIND_CONTEXT_NAME = 'Remind me';

export const remindContextCommand = new ContextMenuCommandBuilder()
  .setName(REMIND_CONTEXT_NAME)
  .setType(ApplicationCommandType.Message);

export async function handleRemindContext(i: MessageContextMenuCommandInteraction) {
  const targetMessage = i.options.getMessage('message', true);
  const content = typeof targetMessage.content === 'string' ? targetMessage.content : '';
  const excerpt = content.length > 300 ? content.slice(0, 297) + '…' : content;
  const link = targetMessage.url;

  const embed = new EmbedBuilder()
    .setTitle('Create reminder')
    .setDescription(`About this message:\n${excerpt || '*no text content*'}`)
    .addFields({ name: 'Jump', value: `[Open message](${link})` })
    .setFooter({ text: `From ${(targetMessage.author as any)?.tag ?? 'user'}`});

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('remind_preset:3600').setStyle(ButtonStyle.Primary).setLabel('In 1 hour'),
    new ButtonBuilder().setCustomId('remind_preset:86400').setStyle(ButtonStyle.Primary).setLabel('In 1 day'),
    new ButtonBuilder().setCustomId('remind_preset:604800').setStyle(ButtonStyle.Secondary).setLabel('In 1 week'),
    new ButtonBuilder().setCustomId('remind_preset:2592000').setStyle(ButtonStyle.Secondary).setLabel('In 1 month'),
    new ButtonBuilder().setCustomId('remind_custom').setStyle(ButtonStyle.Success).setLabel('Custom…'),
  );

  await i.reply({ embeds: [embed], components: [row], flags: MessageFlags.Ephemeral });
}
