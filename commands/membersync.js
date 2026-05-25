// to sync members into a database automatically so ion gotta worry bout text files no mo

import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import db from "../db.js";

export default {
  data: new SlashCommandBuilder()
    .setName("membersync")
    .setDescription("Sync all server members to the database.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    // are you an admin broski
    if (
      !interaction.member.permissions.has(PermissionFlagsBits.Administrator)
    ) {
      return interaction.reply({
        content: "Ay mate, you need to be an administrator to do this!",
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      await interaction.guild.members.fetch();
      const members = interaction.guild.members.cache;
      const humanMembers = members.filter((m) => !m.user.bot);
      const sortedMembers = [...humanMembers.values()].sort((a, b) => {
        return a.joinedAt.getTime() - b.joinedAt.getTime();
      });

      const syncedCount = db.syncAllMembers(sortedMembers);

      await interaction.editReply({
        content: `<a:Success:1332309501377773619> **Member Sync Complete!**\n-# <a:Arrow:1332309464065249282> **Total members synced:** ${syncedCount}`,
      });

      console.log(
        `🔄 Member sync executed by ${interaction.user.tag}: ${syncedCount} members synced`,
      );
    } catch (error) {
      console.error("Error syncing members:", error);
      await interaction.editReply({
        content: `❌ Error syncing members: ${error.message}`,
      });
    }
  },
};
