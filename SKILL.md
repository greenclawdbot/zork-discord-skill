---
name: zork-discord
description: Play Zork and other Z-machine games via Discord chat using the Z-Machine API
homepage: https://github.com/greenclawdbot/zmachine-api
metadata: {"clawdbot":{"emoji":"🎮","requires":{"bins":["node"],"env":["ZORK_API_URL"]},"primaryEnv":"ZORK_API_URL","install":[]}}
---

# Zork Discord

Play Zork and other Z-machine interactive fiction games directly in Discord chat — **naturally**, without needing a command prefix!

## Prerequisites

1. **Z-Machine API Server** - Must be running
   ```bash
   cd ~/Github/zmachine-api
   npm run start:dfrotz
   ```

2. **frotz** - Z-machine interpreter
   ```bash
   brew install frotz
   ```

3. **discord.js** - For Discord bot
   ```bash
   cd ~/clawd/skills/zork-discord
   npm install discord.js
   ```

## Running the Discord Bot

### Quick Start

```bash
cd ~/clawd/skills/zork-discord

# Set environment variables
export ZORK_API_URL=http://localhost:3000
export DISCORD_BOT_TOKEN=your_discord_bot_token
export ZORK_CHANNEL_ID=your_discord_channel_id  # optional

# Start the bot
node scripts/discord-bot.cjs
```

### Setting Up Discord Bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to "Bot" section and create a bot
4. Copy the bot token
5. Invite the bot to your server with appropriate permissions (Send Messages, Read Message History)
6. Get the channel ID where you want to play Zork (enable Developer Mode in Discord, right-click channel → Copy ID)

### Running in Terminal (No Discord)

For testing without Discord:
```bash
cd ~/clawd/skills/zork-discord
export ZORK_API_URL=http://localhost:3000
node scripts/discord-bot.cjs
```

## Two Modes

### 🎮 Conversation Mode (Default)
Once you start a game, just type commands naturally:

```
!zork start        → Start the game
look               → Look around
open mailbox       → Open the mailbox
take brochure      → Pick up items
go east            → Move around
inventory          → Check what you're carrying
quit               → End the game
```

**No `!zork` prefix needed while playing!** Just chat like you're exploring together.

### 📟 Command Mode
If you prefer explicit commands:
```
!zork start
!zork look
!zork open mailbox
!zork take brochure
!zork inventory
!zork quit
```

| Command | Action |
|---------|--------|
| `!zork start` | Start a new Zork game |
| `!zork look` | Look around current location |
| `!zork go [direction]` | Move (north/south/east/west) |
| `!zork open [thing]` | Open mailbox, door, etc. |
| `!zork take [item]` | Pick up brochure, knife, etc. |
| `!zork inventory` / `i` | Check what you're carrying |
| `!zork quit` | End the game |
| `!zork help` | Show help |

## Example Session

```
User: !zork start
Bot:  ZORK I: The Great Underground Empire
      Release 119 / Serial number 880429
      
      West of House
      You are standing in an open field west of a white house...
      
User: !zork open mailbox
Bot:  You open the mailbox. Inside, you see a brochure.
      
User: !zork take brochure
Bot:  Taken.
      
User: !zork inventory
Bot:  You are carrying:
       brochure
```

## Features

- ✅ Full Zork I support via dfrotz
- ✅ Session isolation per Discord channel
- ✅ Clean output formatting for Discord
- ✅ Auto-start on first command
- ✅ Markdown escaping for code blocks

## Environment Variables

- `ZORK_API_URL` - URL of Z-Machine API server (default: http://localhost:3000)
