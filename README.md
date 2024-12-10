<div align="center">
  <img src="src/assets/SZ_LOGO_256.png" alt="Source Server Query Bot" width="64" height="64">
  <h1>Source Server Query Discord Bot</h1>
</div>

A Discord Server Query Bot that implements the Valve Source Engine Query Protocol to fetch information from Source engine game servers (CS:GO, TF2, etc.).

## Features

### Server Commands

- `/query` - Query any Source engine server via IP or steam:// URL
- `/servers` - Quick access to predefined server list

### Real-time Monitoring

- Automatic status updates every 60 seconds
- Player count notifications with configurable thresholds
- Bot status shows current server player count and map

### Server Info Display

- Current map and game type
- Player counts with bot detection
- VAC status and server version
- One-click join button

## Requirements

- Node.js 18 or higher
- Discord Bot Token
- Discord Application ID

## Setup

1. Clone the repository
2. Install dependencies with `npm install`
3. Copy .env.example:
   ```bash
    cp .env.example .env
   ```
4. Fill in your configuration values in `.env`:
   ```
    DISCORD_TOKEN=your_discord_bot_token
    CLIENT_ID=your_discord_application_id
    NOTIFICATION_CHANNEL_ID=your_notification_channel_id
   ```
5. Configure your servers in `src/config/servers.json`:
   ```json
   {
     "servers": [
       {
         "host": "your-server-host.com",
         "port": 27015,
         "name": "Server Name",
         "friendlyName": "Display Name"
       }
     ],
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

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Troubleshooting

- Ensure all environment variables are set correctly in `.env`
- Check Discord bot permissions and role hierarchy
- Verify server ports are accessible from your host
- Monitor logs for connection errors or timeouts

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
