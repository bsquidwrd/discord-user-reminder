import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Client, EmbedBuilder } from 'discord.js';
import { getDueReminders, claimReminder, markReminderStatus } from './db.js';
import { CONFIG } from './config.js';

export function startScheduler(client: Client) {
  let running = false;

  const run = async () => {
    if (running) return;
    running = true;
    while (true) {
      const now = Math.floor(Date.now() / 1000);
      const batch = getDueReminders(now, CONFIG.schedulerBatchSize);
      if (batch.length === 0) break;
      await Promise.all(
        batch.map(async (r) => {
          try {
            if (!claimReminder(r.id)) return;
            const user = await client.users.fetch(r.user_id);
            const embed = new EmbedBuilder()
              .setTitle('⏰ Reminder')
              .setDescription((r.message_excerpt || '').slice(0, 4000) || '(no message preview)')
              .setFooter({ text: `Reminder #${r.id}` });
            if (r.message_link)
              embed.addFields({ name: 'Jump', value: `[Open original message](${r.message_link})` });
            const dm = await user.createDM();
            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setCustomId(`reminder_snooze:${r.id}:3600`)
                .setLabel('Snooze 1h')
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`reminder_snooze:${r.id}:86400`)
                .setLabel('Snooze 1d')
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`reminder_snooze:${r.id}:604800`)
                .setLabel('Snooze 1w')
                .setStyle(ButtonStyle.Secondary)
            );
            await dm.send({ embeds: [embed], components: [row] });
            markReminderStatus(r.id, 'sent');
          } catch (err) {
            console.error('Failed to deliver reminder', r.id, err);
            const errorMessage = err instanceof Error ? err.message : String(err);
            markReminderStatus(r.id, 'failed', errorMessage);
          }
        })
      );
      }
      running = false;
    };

  run().catch((err) => {
    running = false;
    console.error('Scheduler run failed', err);
  });
  setInterval(() => {
    run().catch((err) => {
      running = false;
      console.error('Scheduler run failed', err);
    });
  }, CONFIG.schedulerIntervalMs);
}
