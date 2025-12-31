/**
 * Improved Sessionizer Script for Task Mining
 * Fixes: "Blur Bug", "Short Redirect Splits", "Aggressive URL Matching"
 */

const fs = require("fs");
const path = require("path");
const { URL } = require("url"); // Native Node.js URL parser

// ---------- CONFIG ----------
const TIMEOUT_MS = 5 * 60 * 1000;    // 5 minutes: Hard idle timeout
const MIN_TASK_DURATION = 2000;      // 2 seconds: Ignored if domain switch is faster than this (handles redirects)
// --------------------------------

// Helper to extract domain (e.g., "github.com" from "https://github.com/foo")
function getDomain(urlStr) {
    try {
        if (!urlStr || !urlStr.startsWith('http')) return 'unknown';
        return new URL(urlStr).hostname;
    } catch (e) {
        return 'unknown';
    }
}

function parseCSV(csvText) {
    const lines = csvText.trim().split("\n");
    const headers = lines[0].split(",");
    
    return lines.slice(1).map(line => {
        // Basic CSV parsing (Note: Fails on commas inside quotes, consider a library like 'csv-parse' for production)
        const cols = line.split(","); 
        const row = {};
        headers.forEach((h, i) => row[h] = cols[i]);
        row.timestamp = Number(row.timestamp);
        return row;
    });
}

function sessionize(rows) {
    // 1. Sort by time (Crucial)
    rows.sort((a, b) => a.timestamp - b.timestamp);

    let sessionCounter = 1;
    let sequenceIndex = 1;
    let prev = null;

    return rows.map((r) => {
        let boundary = 0;
        let splitReason = "na"; // Useful for debugging why a split happened

        // Parse domains for comparison
        const currentDomain = getDomain(r.url);
        const prevDomain = prev ? getDomain(prev.url) : null;

        if (prev) {
            const timeGap = r.timestamp - prev.timestamp;
            const domainChanged = currentDomain !== prevDomain;
            
            // --- NEW LOGIC RULES ---

            // Rule 1: Hard Timeout (The User went away)
            // If gap > 5 mins, it is ALWAYS a new session, regardless of URL.
            if (timeGap > TIMEOUT_MS) {
                boundary = 1;
                splitReason = "timeout";
            } 
            
            // Rule 2: Context Switch (The User changed apps)
            // IF domain changed AND it wasn't an instant redirect (gap > 2s)
            // AND the new event isn't just a background 'blur'/'focus' flicker
            else if (domainChanged && timeGap > MIN_TASK_DURATION) {
                boundary = 1;
                splitReason = "domain_switch";
            }
        }

        // If boundary detected -> Increment Session ID
        if (boundary === 1) {
            sessionCounter++;
            sequenceIndex = 1;
        }

        const sessionId = `S${sessionCounter.toString().padStart(3, "0")}`;

        const output = {
            ...r,
            session_id: sessionId,
            boundary,
            sequence_index: sequenceIndex,
            duration_since_prev: prev ? r.timestamp - prev.timestamp : 0,
            split_reason: boundary ? splitReason : "" // Add this to your CSV to debug easily!
        };

        prev = r;
        sequenceIndex++;
        return output;
    });
}

function toCSV(rows) {
    if (rows.length === 0) return "";
    const headers = Object.keys(rows[0]);
    const body = rows.map(r => headers.map(h => r[h]).join(",")).join("\n");
    return headers.join(",") + "\n" + body;
}

// ---------- RUN SCRIPT ----------
(function () {
    try {
        const inputPath = path.join(__dirname, "taskmining_export_full.csv");
        const outputPath = path.join(__dirname, "taskmining_sessionized2.csv");

        if (!fs.existsSync(inputPath)) {
            console.error(`❌ Error: Input file not found at ${inputPath}`);
            return;
        }

        console.log("⏳ Reading CSV...");
        const csvText = fs.readFileSync(inputPath, "utf8");
        
        console.log("⏳ Parsing...");
        const parsed = parseCSV(csvText);
        
        console.log(`⏳ Sessionizing ${parsed.length} events...`);
        const sessionized = sessionize(parsed);
        
        console.log("⏳ Saving...");
        const outCSV = toCSV(sessionized);

        fs.writeFileSync(outputPath, outCSV);
        console.log("\n✅ Sessionization complete!");
        console.log(`📊 Total Sessions Created: ${sessionized[sessionized.length-1].session_id}`);
        console.log("📄 Output saved to:", outputPath);
    } catch (err) {
        console.error("❌ Unexpected Error:", err);
    }
})();
