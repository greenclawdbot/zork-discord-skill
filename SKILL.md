---
name: zork-discord
description: Play Zork and other Z-machine games via Discord chat using the Z-Machine API
homepage: https://github.com/greenclawdbot/zmachine-api
metadata: {"clawdbot":{"emoji":"🎮","requires":{"bins":["node"],"env":["ZORK_API_URL"]},"primaryEnv":"ZORK_API_URL","install":[]}}
---

# Zork Discord

Play Zork and other Z-machine interactive fiction games directly in Discord chat using Clawdbot.

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

## Integration with Clawdbot

### Option 1: Direct Script (Recommended for Testing)

Run the Discord integration script directly:
```bash
cd ~/clawd/skills/zork-discord
export ZORK_API_URL=http://localhost:3000
node scripts/zork.cjs
```

This runs in CLI test mode. For actual Discord integration, use the message handler.

### Option 2: Clawdbot Message Handler

Add to your Clawdbot configuration to auto-handle `!zork` messages:

```javascript
// In your Clawdbot config or session handler
const { handleMessage } = require('~/clawd/skills/zork-discord/scripts/zork.cjs');

// When a message starts with !zork, call:
const response = await handleMessage(messageText, channelId);
if (response) {
  await message.reply(response);
}
```

## Discord Commands

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
