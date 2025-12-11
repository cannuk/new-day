# New Day MCP Server

An MCP (Model Context Protocol) server that allows Claude to add tasks to your New Day task management app.

## Setup

### 1. Build the MCP Server

```bash
cd mcp-server
npm install
npm run build
```

### 2. Get Your API Key

1. Open the New Day app in your browser
2. Log in with your Google account
3. Click the Settings (gear) icon in the navbar
4. Click "Generate API Key" if you don't have one
5. Copy your API key

### 3. Configure Claude Desktop

Add the following to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "new-day": {
      "command": "node",
      "args": ["/path/to/new-day/mcp-server/dist/index.js"],
      "env": {
        "NEW_DAY_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

Replace:
- `/path/to/new-day` with the actual path to this project
- `your-api-key-here` with your API key from the New Day app

### 4. Restart Claude Desktop

After updating the config, restart Claude Desktop for the changes to take effect.

## Usage

Once configured, you can ask Claude to:

- "Add a task to remember to buy groceries"
- "Create a todo: Review the pull request"
- "Add 'Call mom' to my task list"
- "Put 'Finish report' in my most important tasks"

## Available Tools

### add_task

Adds a task to your New Day app.

Parameters:
- `text` (required): The task description
- `type` (optional): Task type - "Most", "Other", "Quick", or "PDP". Defaults to "Other"
- `notes` (optional): Additional notes for the task

### list_days

Lists recent days from your New Day app. Useful for seeing what days are available.

## Troubleshooting

### "API key not set" error

Make sure `NEW_DAY_API_KEY` is set in your Claude Desktop config.

### "Invalid API key" error

1. Check that your API key is correct
2. Try regenerating your API key in the New Day app settings

### Connection errors

Make sure the Cloud Functions are deployed. Run:
```bash
cd functions
firebase deploy --only functions
```

## Development

To run the MCP server locally for testing:

```bash
export NEW_DAY_API_KEY="your-api-key"
npm start
```
