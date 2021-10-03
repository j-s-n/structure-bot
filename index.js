
import dotenv  from 'dotenv';
import cron from 'node-cron';
import jsoning from 'jsoning';
import { Client, Intents } from 'discord.js';
import { toMessages, fromMessage, toMessage, incrementTask } from './messages.js';
import parseConfig from './parseConfig.js';

dotenv.config({ path: '.env' });

const configDB = new jsoning("config.json");
const token = process.env.DISCORD_TOKEN;
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

client.login(token);

const channelTasks = {};
const configObject = await configDB.all();

function configureChannel (id, config) {
  console.log(`Registering schedule for channel ${id}`);
  console.log(config);

  for (let task of channelTasks[id] || []) {
    task.stop();
  }

  const channel = client.channels.cache.get(id);
  channelTasks[id] = config.map((entry) => (
    cron.schedule(entry.schedule, () => {
      for (const message of toMessages(entry)) {
        channel.send(message);
      }
    })
  ));
}

client.on('interactionCreate', async (interaction) => {
  if (interaction.isButton()) {
    const entry = fromMessage(interaction.message);
    incrementTask(entry, interaction.customId);
    interaction.update(toMessage(entry));

  } else if (interaction.isContextMenu()) {

    if (interaction.commandName === 'config') {
      const id = interaction.targetId;
      const channelId = interaction.channelId;
      const msg = await interaction.channel.messages.fetch(id);
      let newConfig = null;
      try {
        newConfig = parseConfig(msg.content);
        interaction.reply("👍");
      } catch (error) {
        interaction.reply("👎 " + error);
      }

      if (newConfig) {
        configureChannel(channelId, newConfig);
        configDB.set(channelId, newConfig);
      }
    }
  }
});

client.once('ready', () => {
  for (const [id, config] of Object.entries(configObject)) {
    configureChannel(id, config);
  }
    
  for (const [, guild] of client.guilds.cache) {
    guild.commands.set([{ name: 'config', type: 'MESSAGE' }]);
  }
});
