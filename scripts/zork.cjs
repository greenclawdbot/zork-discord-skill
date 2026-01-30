#!/usr/bin/env node

/**
 * Zork Discord Integration for Clawdbot
 * Play Zork via Discord chat using the Z-Machine API
 * 
 * Usage: This script integrates with Clawdbot's message system
 * Run from clawd directory with proper env vars set
 */

const http = require('http');
const { URL } = require('url');

// Configuration
const API_URL = process.env.ZORK_API_URL || 'http://localhost:3000';

// Session storage per channel
const sessions = new Map();

class ZorkClient {
  constructor(apiUrl = API_URL) {
    this.apiUrl = apiUrl;
  }

  async request(path, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.apiUrl);
      
      const options = {
        hostname: url.hostname,
        port: url.port || 80,
        path: url.pathname + url.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(body);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(json);
            } else {
              reject(new Error(json.error || `HTTP ${res.statusCode}`));
            }
          } catch (e) {
            reject(new Error(`Invalid JSON: ${body}`));
          }
        });
      });

      req.on('error', reject);
      if (data) req.write(JSON.stringify(data));
      req.end();
    });
  }

  async startSession(gamePath = null) {
    const data = gamePath ? { gamePath } : {};
    return await this.request('/api/sessions', 'POST', data);
  }

  async sendCommand(sessionId, command) {
    return await this.request(`/api/sessions/${sessionId}/input`, 'POST', { command });
  }

  async deleteSession(sessionId) {
    return await this.request(`/api/sessions/${sessionId}`, 'DELETE');
  }

  async listGames() {
    return await this.request('/api/games');
  }
}

const client = new ZorkClient();

// Handle a Discord message and return response
async function handleMessage(message, channelId) {
  const text = message.trim();
  
  // Get or create session
  let sessionId = sessions.get(channelId);
  
  // Parse command
  const lowerMsg = text.toLowerCase();
  const parts = text.split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1).join(' ');

  try {
    // Help command
    if (cmd === '!zork' && (args === 'help' || args === '')) {
      return `**🎮 Zork Discord Commands**

**Game Commands:**
\`!zork start\` - Start a new game
\`!zork look\` - Look around
\`!zork go [direction]\` - Move (north/south/east/west)
\`!zork open [thing]\` - Open something
\`!zork take [item]\` - Pick up item
\`!zork inventory\` - Check inventory
\`!zork quit\` - End game

**Examples:**
\`!zork open mailbox\`
\`!zork take brochure\`
\`!zork go east\``;
    }

    // Start command
    if (cmd === '!zork' && args === 'start') {
      if (sessionId) {
        await client.deleteSession(sessionId);
      }
      const res = await client.startSession();
      sessions.set(channelId, res.sessionId);
      return formatZorkOutput(res.output, true);
    }

    // Quit command - handles both !zork quit and just quit
    if ((cmd === '!zork' && (args === 'quit' || args === 'stop')) || cmd === 'quit' || cmd === 'stop') {
      if (sessionId) {
        await client.deleteSession(sessionId);
        sessions.delete(channelId);
        return '🎮 Game ended! Thanks for playing Zork!';
      }
      return 'No active game in this channel.';
    }

    // Any other !zork command is a game command
    if (cmd === '!zork') {
      const command = text.substring(5).trim();
      
      if (!sessionId) {
        // Auto-start if no session
        const res = await client.startSession();
        sessions.set(channelId, res.sessionId);
        sessionId = res.sessionId;
        return formatZorkOutput(res.output, true) + '\n\n*Now processing your command...*\n' + 
               formatZorkOutput((await client.sendCommand(sessionId, command)).output, false);
      }
      
      const res = await client.sendCommand(sessionId, command);
      return formatZorkOutput(res.output, false);
    }

    // Direct game commands (no !zork prefix needed when session is active)
    if (sessionId) {
      const res = await client.sendCommand(sessionId, text);
      return formatZorkOutput(res.output, false);
    }

    // Not a zork command
    return null;
  } catch (error) {
    return `❌ Error: ${error.message}`;
  }
}

function formatZorkOutput(output, isFirstOutput = false) {
  let text = output.trim();
  
  // Remove trailing prompt
  if (text.endsWith('>')) {
    text = text.slice(0, -1).trim();
  }
  
  // For subsequent outputs, try to show just the room/response
  if (!isFirstOutput && text.includes('ZORK I:')) {
    // Find the last room description
    const lines = text.split('\n');
    let startIdx = 0;
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].match(/^(West of House|Front Porch|Kitchen|.*You are standing|.*You are on|.*You are in)/)) {
        startIdx = i;
        break;
      }
    }
    text = lines.slice(startIdx).join('\n');
  }
  
  // Escape Discord markdown
  text = text.replace(/([*_`~])/g, '\\$1');
  
  // Truncate if too long
  if (text.length > 1900) {
    text = text.substring(0, 1900) + '\n...';
  }
  
  return text;
}

// Export for use by Clawdbot or other integrations
module.exports = { handleMessage, ZorkClient, client };

// CLI test mode
if (require.main === module) {
  async function test() {
    console.log('🕹️  Zork Discord - CLI Test Mode');
    console.log(`API: ${API_URL}\n`);

    // Test sequence
    console.log('=== Starting game ===');
    let resp = await handleMessage('!zork start', 'test-cli');
    console.log(resp);

    console.log('\n=== Looking ===');
    resp = await handleMessage('!zork look', 'test-cli');
    console.log(resp);

    console.log('\n=== Opening mailbox ===');
    resp = await handleMessage('!zork open mailbox', 'test-cli');
    console.log(resp);

    console.log('\n=== Taking brochure ===');
    resp = await handleMessage('!zork take brochure', 'test-cli');
    console.log(resp);

    console.log('\n=== Inventory ===');
    resp = await handleMessage('!zork inventory', 'test-cli');
    console.log(resp);

    console.log('\n=== Quitting ===');
    resp = await handleMessage('!zork quit', 'test-cli');
    console.log(resp);

    process.exit(0);
  }

  test().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
