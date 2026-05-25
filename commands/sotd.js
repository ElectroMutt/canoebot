import {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import db from "../db.js";

const songChannelId = process.env.SONG_CHANNEL_ID;

// export all commands
export default {
  data: new SlashCommandBuilder()
    .setName("sotd")
    .setDescription("Song of the Day commands")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Add a song to the Song of the Day list")
        .addStringOption((option) =>
          option
            .setName("song")
            .setDescription("The song URL or name to add")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("viewweek")
        .setDescription("View the next 7 songs of the day"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("viewday")
        .setDescription("View the next song of the day"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("viewall")
        .setDescription("View all songs in the database with pagination"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("delete")
        .setDescription("Delete a song from the database by its ID")
        .addIntegerOption((option) =>
          option
            .setName("id")
            .setDescription("The ID of the song to delete")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("randomize")
        .setDescription("Randomize the order of all songs in the database"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("import")
        .setDescription("Import songs from a text file (one song per line)")
        .addAttachmentOption((option) =>
          option
            .setName("file")
            .setDescription("Text file with songs (one per line)")
            .setRequired(true),
        ),
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    // channel restriction for these commands
    if (subcommand !== "viewday" && interaction.channel.id !== songChannelId) {
      return interaction.reply({
        content:
          "Ay mate, this command can only be used in the designated song channel.",
        ephemeral: true,
      });
    }

    // perm check for modifying commands
    const modCommands = ["add", "import", "delete", "randomize"];
    if (
      modCommands.includes(subcommand) &&
      !interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)
    ) {
      return interaction.reply({
        content: "Ay mate, you need to be a moderator to use this command.",
        ephemeral: true,
      });
    }

    switch (subcommand) {
      case "add":
        await handleAdd(interaction);
        break;
      case "import":
        await handleImport(interaction);
        break;
      case "viewweek":
        await handleViewWeek(interaction);
        break;
      case "viewday":
        await handleViewDay(interaction);
        break;
      case "viewall":
        await handleViewAll(interaction);
        break;
      case "delete":
        await handleDelete(interaction);
        break;
      case "randomize":
        await handleRandomize(interaction);
        break;
    }
  },
};

async function handleAdd(interaction) {
  const song = interaction.options.getString("song");

  try {
    db.songQueries.addSong.run(song, interaction.user.id);
    const embed = new EmbedBuilder()
      .setTitle("Music of the Day")
      .setThumbnail(interaction.user.displayAvatarURL())
      .addFields({
        name: song,
        value: `Was just added to the Music List by ${interaction.member.displayName}`,
      });

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error("❌ Error adding song:", error);
    await interaction.reply({
      content: "Ay mate, there was an error adding the song.",
      ephemeral: true,
    });
  }
}

// show next week of songs
async function handleViewWeek(interaction) {
  try {
    const currentIndex = db.getLineNum();
    const songs = db.songQueries.getNextSongs.all(7, currentIndex);

    if (songs.length === 0) {
      return interaction.reply({
        content:
          "Ay mate, no upcoming songs in the database. You should add a few!",
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setTitle("🎵 Next 7 Songs of the Day")
      .setColor(0x1db954);

    const fields = songs.map((song, index) => ({
      name: `Day ${index + 1} (ID: ${song.id})`,
      value: song.song_url,
      inline: false,
    }));

    embed.addFields(fields);

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error("❌ Error viewing week:", error);
    await interaction.reply({
      content:
        "Ay mate, there was an error viewing the songs coming this week.",
      ephemeral: true,
    });
  }
}

// show next song of day
async function handleViewDay(interaction) {
  try {
    const currentIndex = db.getLineNum();
    const song = db.songQueries.getSongByIndex.get(currentIndex);

    if (!song) {
      return interaction.reply({
        content:
          "Ay mate, no upcoming songs in the database for today. You should add a few!",
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setTitle("🎵 Next Song of the Day")
      .setColor(0x1db954)
      .addFields({
        name: `ID: ${song.id}`,
        value: song.song_url,
      });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  } catch (error) {
    console.error("❌ Error viewing day:", error);
    await interaction.reply({
      content: "Ay mate, there was an error viewing the song for today.",
      ephemeral: true,
    });
  }
}

// menu for viewing all songs in the db
async function handleViewAll(interaction) {
  try {
    const allSongs = db.songQueries.getAllSongs.all();

    if (allSongs.length === 0) {
      return interaction.reply({
        content: "No songs in the database.",
        ephemeral: true,
      });
    }

    const songsPerPage = 10;
    const totalPages = Math.ceil(allSongs.length / songsPerPage);
    let currentPage = 0;

    const generateEmbed = (page) => {
      const start = page * songsPerPage;
      const end = start + songsPerPage;
      const pageSongs = allSongs.slice(start, end);

      const embed = new EmbedBuilder()
        .setTitle("🎵 All Songs of the Day")
        .setColor(0x1db954)
        .setFooter({
          text: `Page ${page + 1}/${totalPages} • Total: ${
            allSongs.length
          } songs`,
        });

      const fields = pageSongs.map((song) => ({
        name: `ID: ${song.id}`,
        value:
          song.song_url.length > 1024
            ? song.song_url.substring(0, 1021) + "..."
            : song.song_url,
        inline: false,
      }));

      embed.addFields(fields);
      return embed;
    };

    const generateButtons = (page) => {
      return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("sotd_first")
          .setLabel("⏮️")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page === 0),
        new ButtonBuilder()
          .setCustomId("sotd_prev")
          .setLabel("◀️")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === 0),
        new ButtonBuilder()
          .setCustomId("sotd_next")
          .setLabel("▶️")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === totalPages - 1),
        new ButtonBuilder()
          .setCustomId("sotd_last")
          .setLabel("⏭️")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page === totalPages - 1),
      );
    };

    const message = await interaction.reply({
      embeds: [generateEmbed(currentPage)],
      components: [generateButtons(currentPage)],
      fetchReply: true,
    });

    const collector = message.createMessageComponentCollector({
      time: 300000,
    });

    collector.on("collect", async (i) => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({
          content: "Ay mate, you cannot use these buttons.",
          ephemeral: true,
        });
      }

      switch (i.customId) {
        case "sotd_first":
          currentPage = 0;
          break;
        case "sotd_prev":
          currentPage = Math.max(0, currentPage - 1);
          break;
        case "sotd_next":
          currentPage = Math.min(totalPages - 1, currentPage + 1);
          break;
        case "sotd_last":
          currentPage = totalPages - 1;
          break;
      }

      await i.update({
        embeds: [generateEmbed(currentPage)],
        components: [generateButtons(currentPage)],
      });
    });

    collector.on("end", async () => {
      try {
        await message.edit({ components: [] });
      } catch (err) {
        // ?
      }
    });
  } catch (error) {
    console.error("❌ Error viewing all songs:", error);
    await interaction.reply({
      content: "Ay mate, there was an error viewing the songs.",
      ephemeral: true,
    });
  }
}

async function handleDelete(interaction) {
  const songId = interaction.options.getInteger("id");

  try {
    const song = db.songQueries.getSongById.get(songId);

    if (!song) {
      return interaction.reply({
        content: `Ay mate, no song found with ID ${songId}.`,
        ephemeral: true,
      });
    }

    db.songQueries.deleteSongById.run(songId);

    const embed = new EmbedBuilder()
      .setTitle("Song Deleted")
      .setColor(0xff0000)
      .addFields({
        name: `ID: ${songId}`,
        value: song.song_url,
      })
      .setFooter({ text: `Deleted by ${interaction.member.displayName}` });

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error("❌ Error deleting song:", error);
    await interaction.reply({
      content: "Ay mate, there was an error deleting the song.",
      ephemeral: true,
    });
  }
}

// randomize all songs currently in the database
async function handleRandomize(interaction) {
  await interaction.deferReply();

  try {
    const allSongs = db.songQueries.getAllSongs.all();

    if (allSongs.length === 0) {
      return interaction.editReply({
        content: "Ay mate, no songs in the database to randomize.",
      });
    }

    // shuffly shuffle
    const shuffled = [...allSongs];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // clear out and replace w/ shuffled
    db.songQueries.clearAllSongs.run();
    db.songQueries.resetSongAutoIncrement.run();

    for (const song of shuffled) {
      db.songQueries.addSong.run(song.song_url, song.added_by);
    }

    db.setLineNum(0);

    const embed = new EmbedBuilder()
      .setTitle("🔀 Songs Randomized")
      .setColor(0x9b59b6)
      .setDescription(
        `Successfully randomized **${shuffled.length}** songs in the database.\nThe song index has been reset to the beginning.`,
      )
      .setFooter({ text: `Randomized by ${interaction.member.displayName}` });

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error("❌ Error randomizing songs:", error);
    await interaction.editReply({
      content: "Ay mate, there was an random error randomizing the songs.",
    });
  }
}

// take the old text file and add it db
async function handleImport(interaction) {
  const attachment = interaction.options.getAttachment("file");

  if (!attachment.name.endsWith(".txt")) {
    return interaction.reply({
      content: "Ay mate, I can only accept a text file.",
      ephemeral: true,
    });
  }

  await interaction.deferReply();

  try {
    const response = await fetch(attachment.url);
    const text = await response.text();
    const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");

    let addedCount = 0;
    for (const line of lines) {
      try {
        db.songQueries.addSong.run(line.trim(), interaction.user.id);
        addedCount++;
      } catch (err) {
        console.error(`❌ Error adding song "${line}":`, err);
      }
    }

    const embed = new EmbedBuilder()
      .setTitle("Songs Imported")
      .setColor(0x00ff00)
      .setDescription(
        `Successfully imported **${addedCount}** songs from the file.`,
      )
      .setFooter({ text: `Imported by ${interaction.member.displayName}` });

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error("❌ Error importing songs:", error);
    await interaction.editReply({
      content: "Ay mate, There was an error importing the songs.",
    });
  }
}

// changeeeee everythinggggg youuuuu areeeeeeeee ... anddd everythingggg youuu wereeeeee....
