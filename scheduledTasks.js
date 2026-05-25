import "dotenv/config";
import db from "./db.js";

const songChannelId = process.env.SONG_CHANNEL_ID;
const memeChannelId = process.env.MEME_CHANNEL_ID;

export function startSongPostTask(client) {
  setInterval(async () => {
    try {
      const now = new Date();
      const etTime = new Date(
        now.toLocaleString("en-US", { timeZone: "America/New_York" }),
      );

      if (etTime.getHours() === 12 && etTime.getMinutes() === 0) {
        const channel = await client.channels
          .fetch(songChannelId)
          .catch(() => null);
        if (!channel) return;

        const songCount = db.songQueries.getSongCount.get().count;
        if (songCount === 0) {
          await channel.send("Song List is Empty");
          return;
        }

        let lineNum = db.getLineNum();
        if (lineNum >= songCount) {
          await channel.send(
            "Aye mate, I've reached the end of the song list!",
          );
          return;
        }

        const song = db.songQueries.getSongByIndex.get(lineNum);
        if (song) {
          const songNumber = lineNum + 1;
          await channel.send("**Remy's Song of The Day!**");
          await channel.send(`Song #${songNumber}: ${song.song_url}`);
          lineNum = (lineNum + 1) % songCount;
          db.setLineNum(lineNum);
        }
      }
    } catch (error) {
      console.error("❌ Error w/ song post task:", error);
    }
  }, 60000);
}

export function startMemeTask(client) {
  setInterval(async () => {
    try {
      const now = new Date();
      const mtTime = new Date(
        now.toLocaleString("en-US", { timeZone: "America/New_York" }),
      );

      if (
        mtTime.getDay() === 1 &&
        mtTime.getHours() === 0 &&
        mtTime.getMinutes() === 45
      ) {
        const channel = await client.channels
          .fetch(memeChannelId)
          .catch(() => null);
        if (!channel) return;

        const memes = db.memeQueries.getTopMemes.all();

        if (memes.length === 0) return; // no memez :(

        const maxVotes = memes[0].vote_count;
        const winners = memes.filter((m) => m.vote_count === maxVotes);

        await channel.send(
          `**Meme of the Week!**\n\n**Winner(s) with: ${maxVotes} Votes!**\n`,
        );

        for (const winner of winners) {
          await channel.send(`<@${winner.author_id}>`);
        }

        await channel.send("\n**The Meme(s):**");

        for (const winner of winners) {
          await channel.send(winner.attachment_url);
        }

        db.memeQueries.clearMemes.run();
      }
    } catch (error) {
      console.error("❌ Error w/ meme task:", error);
    }
  }, 60000);
}
