// actually proper database this time, no text files and incompetent db solutions

import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "data/canoe.db");
const db = new Database(dbPath);

// make tables if they don exist
function initializeTables() {
  // members
  db.exec(`
        CREATE TABLE IF NOT EXISTS members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT UNIQUE NOT NULL,
            member_number INTEGER NOT NULL,
            joined_at DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

  // funny stuff, the memes
  db.exec(`
        CREATE TABLE IF NOT EXISTS memes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            attachment_url TEXT UNIQUE NOT NULL,
            author_id TEXT NOT NULL,
            vote_count INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

  // lalalala songs
  db.exec(`
        CREATE TABLE IF NOT EXISTS songs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            song_url TEXT NOT NULL,
            added_by TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

  // config stuff
  db.exec(`
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )
    `);

  // if line num for sotd don exist create it
  const lineNum = db
    .prepare("SELECT value FROM settings WHERE key = ?")
    .get("line_num");
  if (!lineNum) {
    db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run(
      "line_num",
      "0",
    );
  }
}
initializeTables();

// member functions
const memberQueries = {
  getMember: db.prepare("SELECT * FROM members WHERE user_id = ?"),
  addMember: db.prepare(`
        INSERT OR IGNORE INTO members (user_id, member_number, joined_at)
        VALUES (?, ?, ?)
    `),
  getMemberCount: db.prepare("SELECT COUNT(*) as count FROM members"),
  getAllMembers: db.prepare("SELECT * FROM members ORDER BY joined_at ASC"),
  updateMemberNumber: db.prepare(
    "UPDATE members SET member_number = ? WHERE user_id = ?",
  ),
  deleteMember: db.prepare("DELETE FROM members WHERE user_id = ?"),
};

// funny functions, memes be serious stuff
const memeQueries = {
  getMeme: db.prepare("SELECT * FROM memes WHERE attachment_url = ?"),
  upsertMeme: db.prepare(`
        INSERT INTO memes (attachment_url, author_id, vote_count)
        VALUES (?, ?, ?)
        ON CONFLICT(attachment_url) DO UPDATE SET
            vote_count = excluded.vote_count
    `),
  getTopMemes: db.prepare("SELECT * FROM memes ORDER BY vote_count DESC"),
  clearMemes: db.prepare("DELETE FROM memes"),
  deleteMeme: db.prepare("DELETE FROM memes WHERE attachment_url = ?"),
};

// falalala song functions
const songQueries = {
  addSong: db.prepare("INSERT INTO songs (song_url, added_by) VALUES (?, ?)"),
  getAllSongs: db.prepare("SELECT * FROM songs ORDER BY id ASC"),
  getSongByIndex: db.prepare(
    "SELECT * FROM songs ORDER BY id ASC LIMIT 1 OFFSET ?",
  ),
  getSongCount: db.prepare("SELECT COUNT(*) as count FROM songs"),
  deleteSongById: db.prepare("DELETE FROM songs WHERE id = ?"),
  getSongById: db.prepare("SELECT * FROM songs WHERE id = ?"),
  getNextSongs: db.prepare(
    "SELECT * FROM songs ORDER BY id ASC LIMIT ? OFFSET ?",
  ),
  clearAllSongs: db.prepare("DELETE FROM songs"),
  resetSongAutoIncrement: db.prepare(
    "DELETE FROM sqlite_sequence WHERE name = 'songs'",
  ),
};

// settinz
const settingsQueries = {
  getSetting: db.prepare("SELECT value FROM settings WHERE key = ?"),
  setSetting: db.prepare(`
        INSERT INTO settings (key, value) VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `),
};

export default {
  db,
  memberQueries,
  memeQueries,
  songQueries,
  settingsQueries,

  // helpers
  getMemberNumber: (userId) => {
    const member = memberQueries.getMember.get(userId);
    return member ? member.member_number : null;
  },

  addNewMember: (userId, joinedAt) => {
    const count = memberQueries.getMemberCount.get().count;
    const newNumber = count + 1;
    memberQueries.addMember.run(userId, newNumber, joinedAt.toISOString());
    return newNumber;
  },

  getNextMemberNumber: () => {
    const count = memberQueries.getMemberCount.get().count;
    return count + 1;
  },

  syncAllMembers: (members) => {
    const sortedMembers = [...members].sort((a, b) => a.joinedAt - b.joinedAt);

    const insert = db.prepare(`
            INSERT OR REPLACE INTO members (user_id, member_number, joined_at)
            VALUES (?, ?, ?)
        `);

    const syncMany = db.transaction((members) => {
      let memberNumber = 1;
      for (const member of members) {
        if (!member.user.bot) {
          insert.run(member.id, memberNumber, member.joinedAt.toISOString());
          memberNumber++;
        }
      }
      return memberNumber - 1;
    });

    return syncMany(sortedMembers);
  },

  getLineNum: () => {
    const result = settingsQueries.getSetting.get("line_num");
    return result ? parseInt(result.value) : 0;
  },

  setLineNum: (num) => {
    settingsQueries.setSetting.run("line_num", num.toString());
  },
};
