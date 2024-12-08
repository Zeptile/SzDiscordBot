# Source Server Query Discord Bot

A Discord Server Query Bot that implements the Valve Source Engine Query Protocol to fetch information from Source engine game servers (CS:GO, TF2, etc.).

## Features

- `/query` command to get detailed server information including:
- Current map
- Player count and bot count
- Game type and version
- VAC status
- Server type
- Automatic server status monitoring
- Player count notifications with configurable thresholds
- Multi-server support
- Real-time bot username updates showing server status
- Timeout handling for unresponsive servers
- Challenge-response protocol support

## Features in Detail

### Server Monitoring

- Automatic status updates every 60 seconds
- Bot username updates to show current player count
- Monitors multiple servers in rotation

### Player Count Notifications

- Configurable player count thresholds
- Channel notifications when thresholds are reached
- Automatic threshold reset when player count decreases

### Query Command

The `/query` command provides detailed server information in a clean embed format, including:

- Server name and current map
- Player counts (total and bots)
- Game information
- Server configuration details

## Requirements

- Node.js 18 or higher
- Discord Bot Token
- Discord Application ID

## Installation

1. Clone the repository
2. Install dependencies with `npm install`
3. Create a `.env` file in the root directory with:
   ```
   DISCORD_TOKEN=your_discord_bot_token
   CLIENT_ID=your_discord_application_id
   ```
4. Configure your servers in `src/config/servers.json`:
   ```json
   {
     "servers": [
       {
         "host": "your-server-host.com",
         "port": 27015,
         "name": "Server Name"
       }
     ],
     "notificationChannelId": "YOUR_DISCORD_CHANNEL_ID",
     "playerThresholds": [3, 5, 10]
   }
   ```

## Development

Run the bot in development mode with hot reload:

```bash
npm run dev
```

## Production

Build and run the Docker container:

```bash
docker build -t source-server-bot .
docker run -d --env-file .env source-server-bot
```
