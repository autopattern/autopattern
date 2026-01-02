# Updated Files - Reference Guide

## 1️⃣ background.js - Complete Refactor ✅

**Purpose**: Service worker managing workflow recording state and storage

**Key Functions**:
- `startRecording(workflowName)` - Begin recording with optional name
- `stopRecording()` - End recording and save to IndexedDB
- `getDB()` - Open/create AutomationDB
- Message listener handling all extension communications

**Message Actions Supported**:
```javascript
START_RECORDING(workflowName)    → Begins recording
STOP_RECORDING                   → Saves workflow
RECORD_EVENT(event)              → Adds to current workflow
GET_RECORDING_STATE              → Check if recording
GET_WORKFLOWS                    → Fetch all workflows
DELETE_WORKFLOW(id)              → Remove workflow
RENAME_WORKFLOW(id, newName)     → Update workflow name
```

**Database Structure**:
```javascript
workflows: {
  id: timestamp,           // Primary key
  name: "User Workflow",
  createdAt: timestamp,
  events: [
    { event: "click", timestamp, url, title, data }
  ],
  eventCount: 5
}
```

---

## 2️⃣ content.js - Simplified Capture ✅

**Purpose**: Records essential user actions on web pages

**Only Records** (when recording is active):
- **click**: { tag, id, classes, selector, x, y, bbox }
- **input**: { tag, name, placeholder, fieldLength }
- **navigation**: { url, title, referrer }
- **scroll**: { scrollY, scrollDelta, viewport }
- **page_visit**: { url, title, referrer }

**Does NOT Record**:
- Heartbeat/keep-alive events
- Focus/blur events
- Mouse movements
- Drag/drop
- Right-click
- Rapid duplicate events

**Key Functions**:
- `recordEvent(eventData)` - Send to background if recording
- `buildEventObject(type, data)` - Create event with timestamp
- `getElementInfo(element)` - Extract essential properties only
- Debounced handlers for input/scroll

**Event Object Structure**:
```javascript
{
  event: "click|input|navigation|scroll",
  timestamp: number,
  url: string,
  title: string,
  data: { ... }  // Event-specific data
}
```

---

## 3️⃣ popup.html - Recording Control Panel ✅

**UI Elements**:
```html
<h3>Automation Recorder</h3>

<!-- Status Indicator -->
<div class="status">
  <span id="recording-status">⚪ Stopped</span>
</div>

<!-- Workflow Name Input -->
<input id="workflow-name" placeholder="Enter workflow name (optional)" />

<!-- Recording Controls -->
<button id="start-recording">Start Recording</button>
<button id="stop-recording" disabled>Stop Recording</button>

<!-- Navigation -->
<button id="open-dashboard">Open Dashboard</button>

<!-- Info Section -->
<div class="info">
  Recordings capture:
  - Clicks
  - Text input
  - Navigation
  - Scrolls (meaningful)
</div>
```

**Styling**:
- Green Start button (disabled while recording)
- Red Stop button (disabled when not recording)
- Light theme, responsive, clean layout
- Status indicator: 🔴 Recording / ⚪ Stopped

---

## 4️⃣ popup.js - Recording Controller ✅

**Main Functions**:
- `setRecordingUI(recording)` - Update button states based on status
- DOMContentLoaded handler - Initialize UI and attach listeners

**State Management**:
```javascript
let isRecording = false;

// Button states controlled by setRecordingUI():
// Recording ON:
//   - Start button: disabled
//   - Stop button: enabled
//   - Name input: disabled
//   - Status: "🔴 Recording..."

// Recording OFF:
//   - Start button: enabled
//   - Stop button: disabled
//   - Name input: enabled
//   - Status: "⚪ Stopped"
```

**Event Handlers**:
1. Start Recording button:
   - Gets name from input (or generates timestamp-based)
   - Sends START_RECORDING message
   - Updates UI to recording state

2. Stop Recording button:
   - Sends STOP_RECORDING message
   - Shows confirmation alert with saved workflow name
   - Updates UI to stopped state

3. Open Dashboard button:
   - Opens dashboard.html in new tab

---

## 5️⃣ dashboard.html - Workflow Manager UI ✅

**Layout**:
```
┌────────────────────────────────────────────┐
│  Header: 🤖 Automation Workflows           │
├────────────────────────────────────────────┤
│  Stats: Workflows | Total Events            │
├────────────────────────────────────────────┤
│  Main Content:                              │
│  ┌──────────────────────────────────────┐  │
│  │ Workflow Card                        │  │
│  │ ┌──────────────────────────────────┐ │  │
│  │ │ Workflow Name        Date/Time   │ │  │
│  │ │ 5 events                         │ │  │
│  │ │ [View] [Rename] [Generate] [Del] │ │  │
│  │ └──────────────────────────────────┘ │  │
│  └──────────────────────────────────────┘  │
│  (Grid layout, 3 columns responsive)       │
└────────────────────────────────────────────┘
```

**Hidden Elements**:
- `#workflow-details` - Modal for viewing workflow events
- `.modal` - Modal for generated script

**Styling**:
- Light theme (white cards, gray background)
- Responsive grid layout (320px minimum card width)
- Color-coded action buttons:
  - View: Gray
  - Rename: Blue
  - Generate Script: Purple
  - Delete: Red

---

## 6️⃣ dashboard.js - Workflow Manager Logic ✅

**Core Functions**:

### Loading
- `loadWorkflows()` - Fetch all from IndexedDB
- `renderWorkflows()` - Display in grid

### Workflow Operations
- `viewWorkflow(id)` - Show events in modal
- `renameWorkflow(id)` - Prompt for new name
- `deleteWorkflow(id)` - Confirm and remove
- `closeDetails()` - Close modal

### Script Generation
- `prepareForScriptGeneration(workflow)` - Format for script
- `generateScript(id)` - Open script modal
- `generatePlaywrightScript(scriptData)` - Create Node.js code
- `copyToClipboard(btn)` - Copy to clipboard

### Utilities
- `escapeHtml(str)` - Prevent XSS
- `escapeJsString(str)` - Escape for JavaScript
- `updateStats(workflowCount, eventCount)` - Update display

**Workflow Data Format**:
```javascript
{
  id: 1704099600000,
  name: "Login Workflow",
  createdAt: 1704099600000,
  events: [
    {
      event: "page_visit",
      timestamp: 1704099601000,
      url: "https://example.com",
      title: "Example Site",
      data: { referrer: "" }
    },
    {
      event: "click",
      timestamp: 1704099602000,
      url: "https://example.com",
      title: "Example Site",
      data: { selector: "#login-btn", x: 100, y: 50 }
    }
  ],
  eventCount: 2
}
```

**Generated Playwright Script Template**:
```javascript
// Automated script: Workflow Name
// Generated from workflow recorder

const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    try {
        // Navigate to starting page
        await page.goto('https://example.com');

        // Step 1: Click
        await page.click('#login-btn');

        // Step 2: Input text
        await page.fill('#email', 'YOUR_TEXT_HERE');

        // All steps completed
        console.log('Automation completed successfully');
    } catch (error) {
        console.error('Automation failed:', error);
    } finally {
        await browser.close();
    }
})();
```

---

## Migration Path (If Needed)

### Old Event Database
```
indexedDB.open('TaskMiningDB', 5)
  └── events
      ├── id
      ├── timestamp
      ├── event
      ├── url
      ├── raw {}
      └── canonical {}
```

### New Workflow Database
```
indexedDB.open('AutomationDB', 1)
  └── workflows
      ├── id
      ├── name
      ├── createdAt
      ├── events []
      └── eventCount
```

### To Migrate Old Data (Optional)
```javascript
// Would need custom migration script
// Load from TaskMiningDB, group events, save to AutomationDB
// Not implemented by default - old DB remains untouched
```

---

## Testing Checklist

- [ ] Start recording from popup
- [ ] Enter workflow name (optional)
- [ ] Perform actions: click, type, navigate
- [ ] Stop recording
- [ ] See workflow in dashboard
- [ ] View workflow events
- [ ] Rename workflow
- [ ] Generate script
- [ ] Copy script to clipboard
- [ ] Delete workflow
- [ ] Test with multiple workflows

---

## Performance Impact

### Improvements
- Fewer events logged (4 types vs 15+)
- Smaller event objects (less metadata)
- No canonicalization processing
- Faster dashboard rendering

### Trade-offs
- Less granular data capture
- Manual recording management
- Requires user input for workflow names
- Generated scripts need manual adjustment

---

## Known Limitations

1. **No Auto-Save**: Recording must be manually stopped
2. **No Session Recovery**: If extension crashes, recording is lost
3. **No Cloud Sync**: Workflows stored only locally
4. **No Version Control**: No workflow history/rollback
5. **No Advanced Selectors**: Uses basic CSS selectors only
6. **Script Generation**: Templates require manual tweaking
7. **No Screenshot Capture**: No visual verification
8. **No Cross-Tab Recording**: Only records active tab
