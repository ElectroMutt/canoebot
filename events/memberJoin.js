// someone joined, gotta give a license

import { AttachmentBuilder } from "discord.js";
import { generateLicenseImage, formatJoinDate } from "../imageGenerator.js";
import db from "../db.js";

async function handleMemberJoin(member, client) {
  try {
    const channel = member.guild.systemChannel;
    if (!channel) return;
    let totalMembers = 0;
    for (const guild of client.guilds.cache.values()) {
      totalMembers += guild.memberCount - 1;
    }
    const memberNumber = db.addNewMember(member.id, member.joinedAt);
    const joinDate = formatJoinDate(member.joinedAt);
    const avatarUrl = member.user.displayAvatarURL({
      extension: "png",
      size: 256,
    });
    const imageBuffer = await generateLicenseImage({
      avatarUrl,
      username: member.user.tag,
      memberNumber: totalMembers,
      joinDate,
    });
    const attachment = new AttachmentBuilder(imageBuffer, {
      name: "license.jpg",
    });
    await channel.send(`Hello ${member}, welcome to ${member.guild.name}!`);
    await channel.send({ files: [attachment] });

    console.log(`🛶 New member: ${member.user.tag} (Member #${memberNumber})`);
  } catch (error) {
    console.error("❌ Error when member join:", error);
  }
}

export { handleMemberJoin };
