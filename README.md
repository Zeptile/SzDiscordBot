<div align="center">
  <img src="src/assets/SZ_LOGO_256.png" alt="Source Server Query Bot" width="64" height="64">
  <h1>SnipeZilla's Server Aware Discord bot</h1>
</div>

A Discord Server Query Bot that implements the Valve Source Engine Query Protocol to fetch information from Source engine game servers (CS:GO, TF2, etc.) with database persistence and role-based notifications.

## Features

### Server Commands

- `/query` - Query any Source engine server via IP or steam:// URL
- `/servers` - Quick access to predefined server list with one-click join buttons

### Server Administration

- `/server-admin add` - Add new game servers to the database
- `/server-admin remove` - Remove servers by ID
- `/server-admin update` - Update existing server configurations
- `/server-admin list` - List all configured servers with IDs

### Configuration Management

- `/config set-base-url` - Configure the base URL for Steam server links
- `/config set-thresholds` - Set player count notification thresholds
- `/config view` - View current bot configuration

### Real-time Monitoring

- Automatic status updates every 30 seconds
- Player count notifications with configurable thresholds
- Bot status shows current server player count and map
- Smart threshold notifications (only triggers once per threshold until players drop below)

### Role-based Notifications

- Reaction role system for notification opt-in/opt-out
- Users can react with 🔔 to receive server notifications
- Automatic role assignment and removal based on reactions
- Persistent message storage in database

### Database Features

- SQLite database with persistent storage
- Server configurations stored in database (not just JSON)
- Bot configuration management
- Reaction role message tracking
- Automatic database migrations

### Server Info Display

- Current map and game type
- Player counts with bot detection (shows actual human players)
- VAC status and server version
- One-click join button with configurable base URL

## Requirements

- Node.js 18 or higher
- Discord Bot Token
- Discord Application ID

## Setup

1. Clone the repository
2. Install dependencies with `npm install`
3. Create your `.env` file with the following variables:

   ```
   DISCORD_TOKEN=your_discord_bot_token
   CLIENT_ID=your_discord_application_id
   NOTIFICATION_CHANNEL_ID=your_notification_channel_id
   ROLE_CHANNEL_ID=channel_id_for_reaction_roles
   PINGABLE_ROLE_ID=role_id_to_assign_for_notifications
   ADMIN_ROLE_ID=role_id_for_server_admin_commands
   SQLITE_DB_PATH=sz-discord-bot.db
   NODE_ENV=production
   ```

4. (Optional) Pre-configure servers in `src/config/servers.json`:

   ```json
   {
     "baseUrl": "https://your-domain.com/steam",
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

   Note: Servers can also be managed entirely through Discord commands after setup.

## Development

Run the bot in development mode with hot reload:

```bash
npm run dev
```

Build TypeScript:

```bash
npm run build
```

## Production

Build and run the Docker container:

```bash
docker build -t source-server-bot .
docker run -d --env-file .env source-server-bot
```

Or run directly:

```bash
npm start
```

## Database

The bot uses SQLite for persistent storage with the following features:

- Game servers configuration
- Bot settings (base URL, player thresholds)
- Reaction role message tracking
- Automatic schema migrations

The database file is created automatically on first run.

## Permissions

The bot requires the following Discord permissions:

- Send Messages
- Use Slash Commands
- Add Reactions
- Manage Roles (for reaction role system)
- Embed Links
- Attach Files

Make sure the bot's role is positioned higher than the notification role in your server's role hierarchy.

## Contributing

1. Branch off the main branch
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Troubleshooting

- Ensure all environment variables are set correctly in `.env`
- Check Discord bot permissions and role hierarchy
- Verify server ports are accessible from your host
- Monitor logs for connection errors or timeouts
- For reaction roles, ensure the bot has "Manage Roles" permission
- For server admin commands, ensure users have the configured admin role

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
