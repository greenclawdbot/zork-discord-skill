#!/usr/bin/env node

/**
 * Zork Discord Bot
 * Standalone Discord bot for playing Zork via the Z-Machine API
 * 
 * Run this alongside Clawdbot:
 *   cd ~/clawd/skills/zork-discord
 *   node scripts/discord-bot.cjs
 */

const { Client, GatewayIntentBits, TextChannel } = require('discord.js');
const { handleMessage, client: zorkClient } = require('./zork.cjs');

// Configuration
const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN || '';
const ZORK_API_URL = process.env.ZORK_API_URL || 'http://localhost:3000';
const ZORK_CHANNEL_ID = process.env.ZORK_CHANNEL_ID || '';

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Session storage per channel
const sessions = new Map();

async function handleZorkCommand(message) {
  const channelId = message.channel.id;
  const text = message.content.trim();

  try {
    const response = await handleMessage(text, channelId);
    if (response) {
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
  } catch (error) {
    await message.reply(`❌ Error: ${error.message}`);
  }
}

client.on('messageCreate', async (message) => {
  // Ignore bot messages
  if (message.author.bot) return;

  // Check for !zork commands
  if (message.content.trim().toLowerCase().startsWith('!zork')) {
    await handleZorkCommand(message);
  }
});

client.on('ready', () => {
  console.log(`🎮 Zork Discord Bot logged in as ${client.user.tag}`);
  console.log(`API URL: ${ZORK_API_URL}`);
  if (ZORK_CHANNEL_ID) {
    console.log(`Restricted to channel: ${ZORK_CHANNEL_ID}`);
  }
  console.log('Ready for !zork commands!\n');
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
    console.log('🎮 Zork Discord Bot - CLI Test Mode');
    console.log(`API: ${ZORK_API_URL}`);
    console.log('\nTo run as a Discord bot, set DISCORD_BOT_TOKEN env var.');
    console.log('To restrict to a channel, set ZORK_CHANNEL_ID.\n');
    
    // Run CLI test
    const { handleMessage } = require('./zork.cjs');
    
    async function cliTest() {
      console.log('=== Starting game ===');
      let resp = await handleMessage('!zork start', 'cli-test');
      console.log(resp.substring(0, 500));
      console.log('...\n');

      console.log('=== Opening mailbox ===');
      resp = await handleMessage('!zork open mailbox', 'cli-test');
      console.log(resp);

      console.log('=== Taking brochure ===');
      resp = await handleMessage('!zork take brochure', 'cli-test');
      console.log(resp);

      console.log('=== Inventory ===');
      resp = await handleMessage('!zork inventory', 'cli-test');
      console.log(resp);

      console.log('=== Going east ===');
      resp = await handleMessage('!zork go east', 'cli-test');
      console.log(resp);

      console.log('=== Quitting ===');
      resp = await handleMessage('!zork quit', 'cli-test');
      console.log(resp);
    }
    
    cliTest().then(() => process.exit(0)).catch(err => {
      console.error(err);
      process.exit(1);
    });
  } else {
    // Run as Discord bot
    client.login(DISCORD_TOKEN);
  }
}

module.exports = { client, handleZorkCommand };
