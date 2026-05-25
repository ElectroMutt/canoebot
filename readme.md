# Canoe Bot

This bot is to handle canoe licenses, songs of the day, and memes of the week for the Camp Remy Discord server.

## Features

- **Licenses**: Generate licenses for server members
- **Member Sync**: Sync all members to database ordered by join date
- **Song of the Day**: Daily song posting feature
- **Meme of the Week**: Weekly meme competition with voting

## Commands

| Command               | Description                                          | Executable By  |
| --------------------- | ---------------------------------------------------- | -------------- |
| `/license`            | Returns canoe license card for the user.             | Everyone       |
| `/membersync`         | Sync current members to the database.                | Administrators |
| `/sotd add <text>`    | Add a song to the database.                          | Moderators     |
| `/sotd delete <id>`   | Remove a song from the database by line identifier.  | Moderators     |
| `/sotd import <.txt>` | Takes a text file and adds each line to the song db. | Moderators     |
| `/sotd randomize`     | Randomizes the order of all songs in the database.   | Moderators     |
| `/sotd viewday`       | Returns the song that is being posted.               | Moderators     |
| `/sotd viewweek`      | Returns next 7 days of dongs to be posted.           | Moderators     |
| `/sotd viewall`       | Brings up an interactive menu to manage all songs.   | Moderators     |

## Github Version Improvement

The revision now utilizes a database instead of plain json files. When you run `/membersync`, it will:

1. Fetch all guild members
2. Sort them by join date
3. Assign license numbers sequentially
4. Store in the database

This ensures accurate license numbers can be easily synced if the bot goes offline or from scratch if the database is accidently deleted _cough_.

## Database Schema

The bot now uses SQLite with the following tables:

- **members**: Tracks member join order
- **memes**: Tracks meme votes
- **songs**: Stores song of the day entries
- **settings**: Some config values

## License

> This is free and unencumbered software released into the public domain.

> Anyone is free to copy, modify, publish, use, compile, sell, or
> distribute this software, either in source code form or as a compiled
> binary, for any purpose, commercial or non-commercial, and by any
> means.

> In jurisdictions that recognize copyright laws, the author or authors
> of this software dedicate any and all copyright interest in the
> software to the public domain. We make this dedication for the benefit
> of the public at large and to the detriment of our heirs and
> successors. We intend this dedication to be an overt act of
> relinquishment in perpetuity of all present and future rights to this
> software under copyright law.

> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
> EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
> MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
> IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
> OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
> ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
> OTHER DEALINGS IN THE SOFTWARE.

> For more information, please refer to <https://unlicense.org/> 💙 H2S3
