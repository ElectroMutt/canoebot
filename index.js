import "dotenv/config";
import {
  Client,
  GatewayIntentBits,
  Collection,
  ActivityType,
  Events,
} from "discord.js";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import fs from "fs";
import { handleMemberJoin } from "./events/memberJoin.js";
import {
  handleReactionAdd,
  handleReactionRemove,
} from "./events/reactions.js";
import { startSongPostTask, startMemeTask } from "./scheduledTasks.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
  ],
});
client.commands = new Collection();
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = pathToFileURL(path.join(commandsPath, file)).href;
  const command = await import(filePath);
  if ("data" in command.default && "execute" in command.default) {
    client.commands.set(command.default.data.name, command.default);
  }
}
const memeChannelId = process.env.MEME_CHANNEL_ID;

client.once(Events.ClientReady, async () => {
  console.log(`${client.user.tag} be online!`);
  let members = 0;
  for (const guild of client.guilds.cache.values()) {
    members += guild.memberCount - 1;
  }
  client.user.setPresence({
    activities: [
      {
        type: ActivityType.Watching,
        name: `⛵ ${members} members in the rapids...`,
        // What a wonderful place!
      },
    ],
  });
  startSongPostTask(client);
  startMemeTask(client);
});
client.on(Events.GuildMemberAdd, async (member) => {
  await handleMemberJoin(member, client);
});
client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isAutocomplete()) {
    const command = client.commands.get(interaction.commandName);
    if (!command || !command.autocomplete) return;

    try {
      await command.autocomplete(interaction);
    } catch (error) {
      console.error("❌ Autocomplete error:", error);
    }
  } else if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction, client);
    } catch (error) {
      console.error("❌ Execution error:", error);
      const reply = {
        content: "Ay mate, there was an unknown error executing this command.",
        ephemeral: true,
      };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply);
      } else {
        await interaction.reply(reply);
      }
    }
  }
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  if (message.channel.id === memeChannelId && message.attachments.size > 0) {
    await message.react("🔺");
  }
});
// lovely red triangle

client.on(Events.MessageReactionAdd, handleReactionAdd);
client.on(Events.MessageReactionRemove, handleReactionRemove);
client.login(process.env.TOKEN);
