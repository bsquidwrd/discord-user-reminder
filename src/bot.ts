import { Client, GatewayIntentBits, Events, Options, Partials, MessageFlags } from 'discord.js';
import { CONFIG } from './config.js';
import { handleRemindContext } from './commands/remindContext.js';
import { handleRemindersSlash } from './commands/remindersSlash.js';
import { handleTimezoneSlash } from './commands/timezoneSlash.js';
import { handlePresetButton, handleSnoozeButton, openCustomModal } from './interactions/buttons.js';
import { handleCustomModal } from './interactions/modals.js';
import { startScheduler } from './scheduler.js';
import { handleRemindSlash } from './commands/remindSlash.js';

// Internal sharding keeps every shard in this one process, so the scheduler runs exactly once.
const shards =
  CONFIG.shardCount === 'auto'
    ? { shards: 'auto' as const }
    : { shards: [...Array(CONFIG.shardCount).keys()], shardCount: CONFIG.shardCount };

// Nothing reads cached messages, and fetched users are only needed long enough to open a DM.
export const client = new Client({
  intents: [
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.Guilds
  ],
  partials: [Partials.Channel],
  ...shards,
  makeCache: Options.cacheWithLimits({
    ...Options.DefaultMakeCacheSettings,
    MessageManager: 0,
    UserManager: {
      maxSize: 200,
      keepOverLimit: user => user.id === user.client.user.id,
    },
  }),
});

client.once(Events.ClientReady, () => {
  console.log(`Ready as ${client.user?.tag} (shards ${client.ws.shards.map(s => s.id).join(',')})`);
  client.user?.setPresence({
    status: 'online'
  });
  startScheduler(client);
});

client.on(Events.InteractionCreate, async (i) => {
  try {
    if (i.isMessageContextMenuCommand() && i.commandName === 'Remind me') {
      return await handleRemindContext(i);
    }
    if (i.isChatInputCommand()) {
      if (i.commandName === 'remind') return await handleRemindSlash(i);
      if (i.commandName === 'reminders') return await handleRemindersSlash(i);
      if (i.commandName === 'timezone') return await handleTimezoneSlash(i);
    }
    if (i.isButton()) {
      if (i.customId.startsWith('remind_preset:')) {
        const seconds = parseInt(i.customId.split(':')[1], 10);
        return await handlePresetButton(i, seconds);
      }
      if (i.customId.startsWith('reminder_snooze:')) {
        const [, id, seconds] = i.customId.split(':');
        return await handleSnoozeButton(i, parseInt(id, 10), parseInt(seconds, 10));
      }
      if (i.customId === 'remind_custom') return await openCustomModal(i);
    }
    if (i.isModalSubmit() && i.customId === 'remind_custom_modal') {
      return await handleCustomModal(i);
    }
  } catch (err) {
    console.error('Interaction error', err);
    if (!i.isRepliable()) return;
    try { await i.reply({ content: 'Something went wrong. Try again.', flags: MessageFlags.Ephemeral }); } catch {}
  }
});
