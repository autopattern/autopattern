# Automation Execution Layer

This folder contains the components for executing automated workflows using Playwright.

## Structure
- `generators/`: JSON → Playwright code generators
  - `playwrightGenerator.js` - Converts recorded events to executable Playwright scripts
- `runners/`: Execution engines
  - `server.js` - Express server that executes Playwright scripts
- `llm/`: Prompts & logic for selector healing/generalization (future)
- `api/`: REST API endpoints (future)

## Quick Start

### 1. Install Dependencies
```bash
npm install
npm run install-playwright
```

### 2. Start the Automation Server
```bash
npm run server
```

The server will run at `http://localhost:3000`

### 3. Use the Extension
- Record a workflow using the extension
- Click "Automate" in the dashboard
- Watch Playwright execute it automatically!

## API Endpoints

### POST `/api/automate`
Execute a workflow with Playwright.

**Request:**
```json
{
  "workflow": {
    "name": "My Workflow",
    "events": [...]
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Workflow automated successfully",
  "output": "...",
  "errors": null
}
```

### POST `/api/generate-code`
Generate Playwright code without executing.

### GET `/api/health`
Check if server is running.

## How It Works

1. **Extension records** user actions (clicks, inputs, etc.)
2. **User clicks "Automate"** in the dashboard
3. **Extension sends** workflow JSON to local server
4. **Server generates** Playwright code from events
5. **Playwright executes** in a new browser window
6. **Results** are sent back to the extension

## Architecture

```
Extension (Browser) → Local Server (Node.js) → Playwright (New Browser)
     ↓                       ↓                         ↓
  Records events     Generates code              Executes automation
     ↓                       ↓                         ↓
  Stores in DB       Runs script                Returns results
```

## Troubleshooting

- **"Server is not running"**: Start it with `npm run server`
- **Port 3000 in use**: Change PORT in `server.js`
- **Automation fails**: Check error details in the modal or server console

## Future Enhancements
- Selector healing with LLM
- Cloud execution option
- Scheduled workflows
- Better error recovery

