# Architecture Changes - Visual Guide

## OLD Architecture (Event-Based)
```
┌─────────────────────────────────────────────────────────────┐
│                    Web Page (content.js)                     │
│  Captures: clicks, inputs, focus, blur, scroll, drag, etc.  │
└──────────────────────┬──────────────────────────────────────┘
                       │ Every event
                       ↓
        ┌──────────────────────────────┐
        │   background.js (service)    │
        │  • Canonicalize event        │
        │  • Add raw/canonical data    │
        │  • Store in IndexedDB        │
        └──────────────────┬───────────┘
                           │
                           ↓
        ┌──────────────────────────────┐
        │   IndexedDB: TaskMiningDB    │
        │  ObjectStore: events         │
        │  (Individual event storage)  │
        └──────────────────┬───────────┘
                           │
                           ↓
        ┌──────────────────────────────┐
        │   dashboard.js               │
        │  • Load all events           │
        │  • Group by time (heuristic) │
        │  • Calculate statistics      │
        │  • Export to CSV             │
        └──────────────────────────────┘
```

## NEW Architecture (Workflow-Based)
```
┌──────────────────────────────────────┐
│         popup.html                   │
│  ┌────────────────────────────────┐ │
│  │ Start Recording                │ │
│  │ [Workflow Name Input]          │ │
│  │ Stop Recording                 │ │
│  └────────────────────────────────┘ │
└──────────────────┬───────────────────┘
                   │ Start/Stop messages
                   ↓
┌──────────────────────────────────────────────────────────┐
│            background.js (Recording Manager)            │
│  ┌─────────────────────────────────────────────────────┐│
│  │ recordingState = {                                   ││
│  │   isRecording: boolean                              ││
│  │   currentWorkflow: [],     ← Events accumulate here ││
│  │   workflowName: string                              ││
│  │   startTime: timestamp                              ││
│  │ }                                                    ││
│  └─────────────────────────────────────────────────────┘│
└──────────────────┬──────────────────────────────────────┘
                   │ Controlled by popup
                   ↓
┌──────────────────────────────────────────┐
│  Web Page (content.js - Simplified)      │
│  Records ONLY when isRecording = true    │
│  • Clicks                                │
│  • Text inputs                           │
│  • Navigation                            │
│  • Meaningful scrolls                    │
└──────────────────┬───────────────────────┘
                   │ Only essential events
                   ↓
        ┌──────────────────────────────────┐
        │  background.js accumulates       │
        │  events in currentWorkflow[]     │
        └──────────────────┬───────────────┘
                           │
                    (User clicks STOP)
                           ↓
        ┌──────────────────────────────────┐
        │   Save Complete Workflow         │
        │  {                               │
        │    id, name, createdAt,          │
        │    events[], eventCount          │
        │  }                               │
        └──────────────────┬───────────────┘
                           │
                           ↓
        ┌──────────────────────────────────┐
        │  IndexedDB: AutomationDB         │
        │  ObjectStore: workflows          │
        │  (Workflow-level storage)        │
        └──────────────────┬───────────────┘
                           │
                           ↓
        ┌──────────────────────────────────┐
        │      dashboard.js                │
        │  • Load workflows                │
        │  • Display in grid               │
        │  • View, Rename, Delete          │
        │  • Generate Script               │
        └──────────────────┬───────────────┘
                           │
                           ↓
        ┌──────────────────────────────────┐
        │   prepareForScriptGeneration()   │
        │   generatePlaywrightScript()     │
        └──────────────────┬───────────────┘
                           │
                           ↓
        ┌──────────────────────────────────┐
        │    Playwright Script Template    │
        │    (Copy to clipboard)           │
        │    Ready to run with Node.js     │
        └──────────────────────────────────┘
```

## File Changes Summary

```
📁 extension/src/
│
├── 📄 background/background.js
│   OLD: Event storage + canonicalization
│   NEW: Workflow recording state machine
│   CHANGE: -150 lines (removed complexity), +80 lines (workflow logic)
│
├── 📄 content/content.js
│   OLD: Complex event capture + noise reduction
│   NEW: Minimal essential event recording
│   CHANGE: -200 lines (removed features), -100 lines (removed dependencies)
│
├── 📄 ui/
│   ├── popup.html
│   │   OLD: Single button
│   │   NEW: Recording control panel
│   │
│   ├── popup.js
│   │   OLD: Just open dashboard
│   │   NEW: Start/Stop/Status management
│   │
│   ├── dashboard.html
│   │   OLD: Sidebar + content layout
│   │   NEW: Grid card layout
│   │
│   ├── dashboard.js
│   │   OLD: Event aggregation + exports
│   │   NEW: Workflow management + script generation
│   │
│   └── (removed dependency)
│       csvExporter.js: No longer needed
│       noiseReduction.js: No longer used in content.js
│
└── utils/
    └── (no changes needed)
```

## Feature Comparison

### Event Recording
| Feature | Old | New |
|---------|-----|-----|
| Recording Start | Automatic | Manual button |
| Recording Stop | Manual timeout | Manual button |
| Event Types | 15+ (verbose) | 4 (essential) |
| Noise Filtering | Yes (ML) | No (manual selection) |
| Metadata | Rich + Canonical | Minimal |
| Storage | Per-event | Per-workflow |

### Workflow Management
| Feature | Old | New |
|---------|-----|-----|
| List Workflows | Text list | Card grid |
| Rename | No | Yes |
| Delete | No | Yes |
| View Events | Tree view | Expandable details |
| Export | CSV only | Playwright script |
| Script Generation | No | Yes |

## Key Improvements

### Performance
- ✅ Fewer events recorded (only essential)
- ✅ Simpler event objects (less data)
- ✅ No canonicalization overhead
- ✅ Faster dashboard rendering

### Usability
- ✅ Clear start/stop controls
- ✅ Named workflows
- ✅ Simple grid interface
- ✅ One-click script generation

### Maintainability
- ✅ Removed 300+ lines of complex logic
- ✅ Fewer dependencies
- ✅ Simpler data structures
- ✅ Clear separation of concerns

### Extensibility
- ✅ Easy to add new event types
- ✅ Simple workflow format
- ✅ Script templates easy to customize
- ✅ Plugin-friendly message passing
