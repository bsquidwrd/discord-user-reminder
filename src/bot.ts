import { Client, GatewayIntentBits, Events, Partials, MessageFlags } from 'discord.js';
import { CONFIG } from './config.js';
import { handleRemindContext } from './commands/remindContext.js';
import { handleRemindersSlash } from './commands/remindersSlash.js';
import { handleTimezoneSlash } from './commands/timezoneSlash.js';
import { handlePresetButton, handleSnoozeButton, openCustomModal } from './interactions/buttons.js';
import { handleCustomModal } from './interactions/modals.js';
import { startScheduler } from './scheduler.js';
import { handleRemindSlash } from './commands/remindSlash.js';

// Intents for both DMs and guild interactions
const client = new Client({ 
  intents: [
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.Guilds
  ], 
  partials: [Partials.Channel] 
});

client.once(Events.ClientReady, () => {
  console.log(`Ready as ${client.user?.tag}`);
  client.user?.setPresence({
    status: 'online'
  });
  startScheduler(client);
});

client.on(Events.InteractionCreate, async (i) => {
  try {
    if (i.isMessageContextMenuCommand() && i.commandName === 'Remind me') {
      return handleRemindContext(i);
    }
    if (i.isChatInputCommand()) {
      if (i.commandName === 'remind') return handleRemindSlash(i);
      if (i.commandName === 'reminders') return handleRemindersSlash(i);
      if (i.commandName === 'timezone') return handleTimezoneSlash(i);
    }
    if (i.isButton()) {
      if (i.customId.startsWith('remind_preset:')) {
        const seconds = parseInt(i.customId.split(':')[1], 10);
        return handlePresetButton(i, seconds);
      }
      if (i.customId.startsWith('reminder_snooze:')) {
        const [, id, seconds] = i.customId.split(':');
        return handleSnoozeButton(i, parseInt(id, 10), parseInt(seconds, 10));
      }
      if (i.customId === 'remind_custom') return openCustomModal(i);
    }
    if (i.isModalSubmit() && i.customId === 'remind_custom_modal') {
      return handleCustomModal(i);
    }
  } catch (err) {
    console.error('Interaction error', err);
    if (!i.isRepliable()) return;
    try { await i.reply({ content: 'Something went wrong. Try again.', flags: MessageFlags.Ephemeral }); } catch {}
  }
});

client.login(CONFIG.token);
