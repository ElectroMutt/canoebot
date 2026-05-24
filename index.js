import { Client, Collection, Events, GatewayIntentBits } from "discord.js";
import { readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import "dotenv/config";
import { initDb } from "./db.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
  ],
});

// load slash commands
client.commands = new Collection();
const commandFiles = readdirSync(join(__dirname, "commands")).filter((f) =>
  f.endsWith(".js"),
);
for (const file of commandFiles) {
  const command = await import(join(__dirname, "commands", file));
  client.commands.set(command.data.name, command);
}

// load event handlers
const eventFiles = readdirSync(join(__dirname, "events")).filter((f) =>
  f.endsWith(".js"),
);
for (const file of eventFiles) {
  const event = await import(join(__dirname, "events", file));
  const fn = (...args) => event.execute(...args, client);
  event.once ? client.once(event.name, fn) : client.on(event.name, fn);
}

client.once(Events.ClientReady, async (c) => {
  await initDb();
  console.log(`✅ Logged in as ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(err);
    const reply = { content: "Something went wrong.", ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply);
    } else {
      await interaction.reply(reply);
    }
  }
});

client.login(process.env.TOKEN);
