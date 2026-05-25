// publish commands to discord

import { REST, Routes } from "discord.js";
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import "dotenv/config";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commands = [];
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = pathToFileURL(path.join(commandsPath, file)).href;
  const command = await import(filePath);
  if ("data" in command.default && "execute" in command.default) {
    commands.push(command.default.data.toJSON());
    console.log(`🔄 Loaded command: ${command.default.data.name}`);
  }
}

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

try {
  console.log(`⏳ Pushing ${commands.length} slash command(s)...`);

  const data = await rest.put(
    Routes.applicationGuildCommands(
      process.env.CLIENT_ID,
      process.env.GUILD_ID,
    ),
    { body: commands },
  );
  console.log(`✅ Pushed ${data.length} command(s).`);
} catch (error) {
  console.error(error);
}
