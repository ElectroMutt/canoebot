// generates and send license to user

import { SlashCommandBuilder, AttachmentBuilder } from "discord.js";
import { generateLicenseImage, formatJoinDate } from "../imageGenerator.js";
import db from "../db.js";

export default {
  data: new SlashCommandBuilder()
    .setName("license")
    .setDescription("Get your license!"),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const member = interaction.member;
      let memberNumber = db.getMemberNumber(member.id);
      if (!memberNumber) {
        memberNumber = db.addNewMember(member.id, member.joinedAt);
      }
      const joinDate = formatJoinDate(member.joinedAt);
      const avatarUrl = member.user.displayAvatarURL({
        extension: "png",
        size: 256,
      });

      const imageBuffer = await generateLicenseImage({
        avatarUrl,
        username: member.user.tag,
        memberNumber,
        joinDate,
      });

      const attachment = new AttachmentBuilder(imageBuffer, {
        name: "license.jpg",
      });

      await interaction.editReply({
        content: "Ay mate! Here be your license:",
        files: [attachment],
      });
    } catch (error) {
      console.error("❌ Error generating license:", error);
      await interaction.editReply({
        content:
          "Ay mate, there was an error generating your license, report this to the developer!",
      });
    }
  },
};
