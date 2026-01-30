#!/usr/bin/env node

/**
 * Zork Discord Bot - Natural Conversation Mode
 * Play Zork via Discord chat - no prefix needed once game starts!
 * 
 * Modes:
 * 1. IDLE - Waiting for !zork start
 * 2. PLAYING - Direct conversation with Zork
 */

const { Client, GatewayIntentBits } = require('discord.js');

// Configuration
const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN || '';
const ZORK_API_URL = process.env.ZORK_API_URL || 'http://localhost:3000';
const ZORK_CHANNEL_ID = process.env.ZORK_CHANNEL_ID || '';

// Session storage per channel
const sessions = new Map();
const gameStates = new Map(); // 'idle' or 'playing'

const { handleMessage, client: zorkClient } = require('./zork.cjs');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

async function handleDirectMessage(message) {
  const channelId = message.channel.id;
  const text = message.content.trim();

  // Check if we should handle this channel
  if (ZORK_CHANNEL_ID && channelId !== ZORK_CHANNEL_ID) {
    return;
  }

  // Ignore bot messages
  if (message.author.bot) return;

  const state = gameStates.get(channelId) || 'idle';

  try {
    if (state === 'playing') {
      // Direct conversation mode - send straight to Zork
      const response = await handleMessage(text, channelId);
      if (response) {
        // Check if this was a quit command (handles !zork quit too)
        if (response.includes('Game ended') || text.toLowerCase() === 'quit' || text.toLowerCase() === '!zork quit') {
          gameStates.set(channelId, 'idle');
        }
        await sendResponse(message, response);
      }
    } else {
      // Idle mode - handle commands with !zork prefix
      if (text.toLowerCase().startsWith('!zork')) {
        const response = await handleMessage(text, channelId);
        if (response) {
          // Check if starting a game
          if (response.includes('West of House') || response.includes('ZORK I:')) {
            gameStates.set(channelId, 'playing');
            await message.reply("🎮 **Game started!** You can now play Zork by typing commands directly (no prefix needed).\nType `quit` to end the game.");
          }
          await sendResponse(message, response);
        }
      } else if (text.toLowerCase() === 'help' || text.toLowerCase() === '!help') {
        await message.reply("🎮 **Zork Discord Bot**\n\nTo start playing: `!zork start`\nOnce started, just type commands naturally!\n\nExamples:\n- `look` - Look around\n- `open mailbox` - Open the mailbox\n- `take brochure` - Pick up items\n- `quit` - End the game");
      }
    }
  } catch (error) {
    await message.reply(`❌ Error: ${error.message}`);
  }
}

async function sendResponse(message, response) {
  // Split long messages
  if (response.length > 1900) {
    const chunks = response.match(/.{1,1900}/g);
    for (const chunk of chunks) {
      await message.reply(chunk);
    }
  } else {
    await message.reply(response);
  }
}

client.on('messageCreate', async (message) => {
  await handleDirectMessage(message);
});

client.on('ready', () => {
  console.log(`🎮 Zork Discord Bot ready!`);
  console.log(`API: ${ZORK_API_URL}`);
  if (ZORK_CHANNEL_ID) {
    console.log(`Restricted to channel: ${ZORK_CHANNEL_ID}`);
  }
  console.log('\nModes:');
  console.log('  IDLE:     Type !zork start to begin');
  console.log('  PLAYING:  Just type commands naturally!\n');
});

// Error handling
client.on('error', (error) => {
  console.error('Discord client error:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// CLI mode (no Discord)
if (require.main === module) {
  if (!DISCORD_TOKEN) {
    console.log('🎮 Zork Discord Bot - Interactive CLI Mode');
    console.log(`API: ${ZORK_API_URL}`);
    console.log('\nNo DISCORD_BOT_TOKEN set - running in CLI test mode.\n');
    console.log('Type commands naturally (no prefix needed):\n');

    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '> '
    });

    let gameStarted = false;

    rl.on('line', async (line) => {
      const text = line.trim();
      if (!text) {
        rl.prompt();
        return;
      }

      // Check for quit
      if (text.toLowerCase() === 'quit' || text.toLowerCase() === 'exit') {
        if (gameStarted) {
          await handleMessage('!zork quit', 'cli');
          console.log('\n🎮 Game ended! Thanks for playing!\n');
        }
        process.exit(0);
      }

      // Start command
      if (text.toLowerCase() === '!zork start' || text.toLowerCase() === 'start') {
        const resp = await handleMessage('!zork start', 'cli');
        console.log('\n' + resp + '\n');
        gameStarted = true;
        console.log('You can now type commands directly!\n');
        rl.setPrompt('> ');
      } else {
        const response = await handleMessage(text, 'cli');
        if (response) {
          console.log('\n' + response + '\n');
        }
      }
      rl.prompt();
    });

    rl.prompt();
  } else {
    client.login(DISCORD_TOKEN);
  }
}

module.exports = { client, handleDirectMessage };
