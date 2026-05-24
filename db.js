import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'

const adapter = new JSONFile('db.json')

const defaultData = {
  // { [userId]: { memberNumber: int, joinedAt: ISO string } }
  licenses: {},

  // tracks which line in songs.txt to post next
  sotdLineNum: 0,

  // { [attachmentUrl]: { authorId, votes: int } } — cleared weekly after motw announcement
  memes: {},
}

export const db = new Low(adapter, defaultData)

export async function initDb() {
  await db.read()
  await db.write()
}
