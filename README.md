# Source Server Query Discord Bot

A Discord bot that implements the Valve Source Engine Query Protocol to fetch information from Source engine game servers (CS:GO, TF2, etc.).

## Features

- Slash command `/query` to get server information
- Real-time server status including players, map, and game type
- Handles server challenge-response protocol
- Timeout handling for unresponsive servers

## Requirements

- Node.js 18 or higher
- Discord Bot Token
- Discord Application ID

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory with:

```env
DISCORD_TOKEN=your_discord_bot_token
CLIENT_ID=your_discord_application_id
```

## Development

Run the bot in development mode with hot reload:

```bash
npm run dev
```
