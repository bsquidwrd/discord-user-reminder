import { REST, Routes, ApplicationCommandType } from 'discord.js';
import { CONFIG } from '../config.js';
import { remindContextCommand } from './remindContext.js';
import { remindersSlash } from './remindersSlash.js';
import { timezoneSlash } from './timezoneSlash.js';
import { remindSlash } from './remindSlash.js';

const rest = new REST({ version: '10' }).setToken(CONFIG.token);

async function main() {
  const commands = [
    {
      name: remindContextCommand.name,
      type: ApplicationCommandType.Message,
      integration_types: [0, 1], // GUILD_INSTALL and USER_INSTALL
      contexts: [0, 1, 2],       // GUILD, BOT_DM, PRIVATE_CHANNEL
    },
    Object.assign(remindSlash.toJSON(), { integration_types: [0, 1], contexts: [0, 1, 2] }),
    Object.assign(remindersSlash.toJSON(), { integration_types: [0, 1], contexts: [0, 1, 2] }),
    Object.assign(timezoneSlash.toJSON(), { integration_types: [0, 1], contexts: [0, 1, 2] }),
  ];

  await rest.put(Routes.applicationCommands(CONFIG.clientId), { body: commands });
  console.log('✅ Registered global commands (User Install + Guild Install, All Contexts)');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
