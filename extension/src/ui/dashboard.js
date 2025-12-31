// ---------- IndexedDB Connection ----------
// listen for refresh and debounce reload
let refreshTimeout;
chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.action === 'refresh_dashboard') {
        clearTimeout(refreshTimeout);
        refreshTimeout = setTimeout(() => {
            console.log('Dashboard: refreshing due to new events');
            start();
        }, 150);
    }
});

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("TaskMiningDB", 5);

        request.onupgradeneeded = (e) => {
            console.log("Dashboard upgrade needed — stores:", e.target.result.objectStoreNames);
            const db = e.target.result;
            if (!db.objectStoreNames.contains('events')) {
                const store = db.createObjectStore('events', { keyPath: 'id', autoIncrement: true });
                store.createIndex('event_ts', 'timestamp', { unique: false });
                store.createIndex('event_type', 'event', { unique: false });
                store.createIndex('url', 'url', { unique: false });
            }
        };

        request.onsuccess = (e) => {
            const db = e.target.result;
            console.log("Dashboard DB opened — stores:", db.objectStoreNames);
            resolve(db); 
        };

        request.onerror = () => reject("DB open failed");
    });
}

// ---------- Load All Events from DB ----------
async function loadEvents() {
    const db = await openDB();

    return new Promise((resolve, reject) => {
        try {
            const tx = db.transaction("events", "readonly");
            const store = tx.objectStore("events");

            const req = store.getAll();

            req.onsuccess = () => {
                resolve(req.result.sort((a, b) => a.timestamp - b.timestamp));
            };

            req.onerror = () => {
                reject("Failed to read events");
            };

        } catch (error) {
            reject(error);
        }
    });
}

// ---------- Group Events Into Workflows ----------
function groupWorkflows(events) {
    if (!events.length) return [];

    events.sort((a, b) => a.timestamp - b.timestamp);

    const workflows = [];
    let current = [];

    const GAP = 5 * 60 * 1000; // 5 minutes

    events.forEach((event, idx) => {
        if (idx === 0) {
            current.push(event);
            return;
        }

        const timeDiff = event.timestamp - events[idx - 1].timestamp;

        if (timeDiff > GAP) {
            workflows.push(current);
            current = [event];
        } else {
            current.push(event);
        }
    });

    if (current.length > 0) workflows.push(current);

    return workflows;
}

// ---------- Calculate Statistics ----------
function calculateStats(events, workflows) {
    const eventTypes = new Set();
    let filteredCount = 0;

    events.forEach(event => {
        eventTypes.add(event.event);
        if (event.combinedCount && event.combinedCount > 1) {
            filteredCount += (event.combinedCount - 1);
        }
    });

    return {
        total: events.length,
        workflows: workflows.length,
        filtered: filteredCount,
        types: eventTypes.size
    };
}

// ---------- Update Stats Display ----------
function updateStats(stats) {
    document.getElementById('stat-total').textContent = stats.total;
    document.getElementById('stat-workflows').textContent = stats.workflows;
    document.getElementById('stat-filtered').textContent = stats.filtered;
    document.getElementById('stat-types').textContent = stats.types;
}

// ---------- Render Sidebar List ----------
function renderWorkflowList(workflows) {
    const list = document.getElementById("workflow-list");
    list.innerHTML = "";

    if (!workflows.length) {
        list.innerHTML = "<p style='padding:10px;color:#aaa;'>No workflows found</p>";
        return;
    }

    workflows.forEach((wf, idx) => {
        const div = document.createElement("div");
        div.className = "workflow-item";
        
        const filteredEvents = wf.filter(e => e.combinedCount && e.combinedCount > 1);
        const isFiltered = filteredEvents.length > 0;
        
        if (isFiltered) {
            div.classList.add('filtered');
        }
        
        div.innerHTML = `
            Workflow ${idx + 1} (${wf.length} events)
            ${isFiltered ? '<span class="filter-badge">Filtered</span>' : ''}
        `;

        div.onclick = () => renderWorkflowDetails(wf, idx + 1);

        list.appendChild(div);
    });
}

// ---------- Render Workflow Details ----------
function renderWorkflowDetails(workflow, number) {
    document.getElementById("workflow-title").textContent = `Workflow ${number}`;
    const container = document.getElementById("workflow-events");
    container.innerHTML = "";

    workflow.forEach((event, idx) => {
        const div = document.createElement("div");
        div.className = "event";

        const isCombined = event.combinedCount && event.combinedCount > 1;
        if (isCombined) div.classList.add('filtered');

        // ---------- Header ----------
        const header = `
            <div style="font-weight:bold;">
                ${idx + 1}. ${event.event}
                <span style="color:#888;font-size:12px;">
                    (${new Date(event.timestamp).toLocaleTimeString()})
                </span>
                ${isCombined ? `<span class="combined-badge">Combined ${event.combinedCount}x</span>` : ''}
            </div>
        `;

        // ---------- Canonical DATA (single source of truth) ----------
        const canonical = event.canonical || {};

        const core = `
            <div style="margin-left:10px;">
                <div><strong>Canonical ID:</strong> ${canonical.canonical_id || "N/A"}</div>
                <div><strong>Selector:</strong> ${canonical.selector || "N/A"}</div>
                <div><strong>XPath:</strong> ${canonical.xpath || "N/A"}</div>
                <div><strong>Type:</strong> ${canonical.type || "N/A"}</div>
                <hr>
                <div><strong>URL:</strong> ${event.url}</div>
                <div><strong>Title:</strong> ${event.title}</div>
                <div><strong>ScrollY:</strong> ${event.scrollY}</div>
                <div><strong>Viewport:</strong> ${JSON.stringify(event.viewport)}</div>
                <div><strong>Page Fingerprint:</strong> ${event.page_fingerprint}</div>
            </div>
        `;

        // ---------- Canonical Only Interaction (removed raw DOM noise) ----------
        const interaction = `
            <details style="margin-left:10px;margin-top:5px;">
                <summary>Canonical Interaction</summary>
                <pre>${JSON.stringify(canonical, null, 2)}</pre>
            </details>
        `;

        div.innerHTML = header + core + interaction;
        container.appendChild(div);
    });
}


// ---------- CSV Export Handlers ----------
const csvExporter = new CSVExporter();
let currentEvents = [];
let currentWorkflows = [];

window.addEventListener("DOMContentLoaded", () => {
    const fullExportBtn = document.getElementById("export-full-db");
    if (fullExportBtn) fullExportBtn.onclick = exportAllIndexedDBToCSV;
});


document.getElementById('export-csv').onclick = () => {
    if (currentEvents.length === 0) {
        alert('No events to export');
        return;
    }
    csvExporter.exportEvents(currentEvents);
};

document.getElementById('export-workflows-csv').onclick = () => {
    if (currentWorkflows.length === 0) {
        alert('No workflows to export');
        return;
    }
    csvExporter.exportWorkflows(currentWorkflows);
};

document.getElementById('export-summary').onclick = () => {
    if (currentEvents.length === 0) {
        alert('No events to export');
        return;
    }
    csvExporter.exportSummary(currentEvents);
};

// ---------- INIT ----------
async function start() {
    try {
        console.log("Loading events...");
        const events = await loadEvents();

        console.log("Loaded events:", events);

        const workflows = groupWorkflows(events);

        console.log("Grouped workflows:", workflows);

        // Store for export
        currentEvents = events;
        currentWorkflows = workflows;

        // Calculate and update stats
        const stats = calculateStats(events, workflows);
        updateStats(stats);

        renderWorkflowList(workflows);
    } catch (err) {
        console.error("Error loading dashboard:", err);
        const list = document.getElementById("workflow-list");
        if (list) {
            list.innerHTML = `<p style='padding:10px;color:red;'>Error loading data: ${err.message || err}</p>`;
        }
    }
}

start();

// ---------- EXPORT FULL INDEXEDDB TO CSV (RAW + CANONICAL) ----------
async function exportAllIndexedDBToCSV() {
    const db = await openDB();
    const tx = db.transaction("events", "readonly");
    const store = tx.objectStore("events");
    const req = store.getAll();

    req.onsuccess = () => {
        const rows = req.result;
        if (!rows.length) {
            alert("No events stored yet.");
            return;
        }

        // CSV Headers
        const headers = [
            "id","timestamp","event","url",
            "canonical_id","selector","xpath","type"
        ];

        // Build CSV rows
        const csvData = rows.map(r => ([
            r.id ?? "",
            r.timestamp ?? "",
            r.event ?? "",
            r.url ?? "",
            r?.canonical?.canonical_id ?? "",
            r?.canonical?.selector ?? "",
            r?.canonical?.xpath ?? "",
            r?.canonical?.type ?? ""
        ].map(String).join(",")));

        const csvText = headers.join(",") + "\n" + csvData.join("\n");

        // Trigger download
        const blob = new Blob([csvText], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "taskmining_export_full.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    req.onerror = () => alert("Failed to export DB to CSV");
}

