import { REST, Routes } from 'discord.js'
import { readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import 'dotenv/config'

const __dirname = dirname(fileURLToPath(import.meta.url))

const commands = []
const commandFiles = readdirSync(join(__dirname, 'commands')).filter(f => f.endsWith('.js'))
for (const file of commandFiles) {
  const { data } = await import(join(__dirname, 'commands', file))
  commands.push(data.toJSON())
}

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN)

try {
  console.log(`⏳ Pushing ${commands.length} slash command(s)...`)
  const data = await rest.put(
    Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
    { body: commands },
  )
  console.log(`✅ Pushed ${data.length} command(s).`)
} catch (err) {
  console.error(err)
}
