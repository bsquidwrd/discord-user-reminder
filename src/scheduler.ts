import { Client, EmbedBuilder } from 'discord.js';
import { getDueReminders, claimReminder, markReminderStatus, deleteReminder } from './db.js';

export function startScheduler(client: Client) {
  setInterval(async () => {
    const now = Math.floor(Date.now() / 1000);
    const due = getDueReminders(now);
    for (const r of due) {
      try {
        if (!claimReminder(r.id)) continue;
        const user = await client.users.fetch(r.user_id);
        const embed = new EmbedBuilder()
          .setTitle('⏰ Reminder')
          .setDescription((r.message_excerpt || '').slice(0, 4000) || '(no message preview)')
          .setFooter({ text: `Reminder #${r.id}` });
        if (r.message_link) embed.addFields({ name: 'Jump', value: `[Open original message](${r.message_link})` });
        const dm = await user.createDM();
        await dm.send({ embeds: [embed] });
        markReminderStatus(r.id, 'sent');
        // Delete the reminder after successful delivery
        deleteReminder(r.id);
      } catch (err) {
        console.error('Failed to deliver reminder', r.id, err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        markReminderStatus(r.id, 'failed', errorMessage);
      }
    }
  }, 20_000);
}
