// upvote reaction handler
import db from "../db.js";

const memeChannelId = process.env.MEME_CHANNEL_ID;
const voteEmoji = "🔺";

async function handleReactionAdd(reaction, user) {
  if (user.bot) return;

  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch (error) {
      console.error("❌ Error fetchin reaction:", error);
      return;
    }
  }

  if (reaction.emoji.name !== voteEmoji) return;
  if (reaction.message.channel.id !== memeChannelId) return;
  if (reaction.count >= 2 && reaction.message.attachments.size > 0) {
    for (const attachment of reaction.message.attachments.values()) {
      db.memeQueries.upsertMeme.run(
        attachment.url,
        reaction.message.author.id,
        reaction.count,
      );
    }
  }
}

// someome removed a reaction, booooooooooooooooooooo
async function handleReactionRemove(reaction, user) {
  if (user.bot) return;

  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch (error) {
      console.error("z❌ Error fetchin reaction:", error);
      return;
    }
  }

  if (reaction.emoji.name !== voteEmoji) return;
  if (reaction.message.channel.id !== memeChannelId) return;
  if (reaction.message.attachments.size > 0) {
    for (const attachment of reaction.message.attachments.values()) {
      if (reaction.count >= 1) {
        db.memeQueries.upsertMeme.run(
          attachment.url,
          reaction.message.author.id,
          reaction.count,
        );
      } else {
        db.memeQueries.deleteMeme.run(attachment.url);
      }
    }
  }
}

export { handleReactionAdd, handleReactionRemove };
