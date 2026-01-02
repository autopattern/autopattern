const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const { generatePlaywrightCode } = require('../generators/playwrightGenerator');

const execPromise = promisify(exec);

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Directory for temporary automation scripts
const SCRIPTS_DIR = path.join(__dirname, '..', 'temp_scripts');

// Ensure scripts directory exists
async function ensureScriptsDir() {
    try {
        await fs.mkdir(SCRIPTS_DIR, { recursive: true });
    } catch (error) {
        console.error('Error creating scripts directory:', error);
    }
}

/**
 * POST /api/automate
 * Receives a workflow and executes it using Playwright
 */
app.post('/api/automate', async (req, res) => {
    const { workflow } = req.body;

    if (!workflow || !workflow.events || !Array.isArray(workflow.events)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid workflow format. Expected { workflow: { events: [...] } }'
        });
    }

    console.log(`Received automation request for: ${workflow.name || 'Unnamed Workflow'}`);
    console.log(`Events count: ${workflow.events.length}`);

    try {
        // Generate Playwright code
        const playwrightCode = generatePlaywrightCode(workflow);

        // Create a unique filename for this execution
        const timestamp = Date.now();
        const scriptFilename = `workflow_${timestamp}.js`;
        const scriptPath = path.join(SCRIPTS_DIR, scriptFilename);

        // Write the generated code to a file
        await fs.writeFile(scriptPath, playwrightCode, 'utf8');
        console.log(`Script written to: ${scriptPath}`);

        // Execute the Playwright script
        console.log('Starting Playwright execution...');
        const { stdout, stderr } = await execPromise(`node "${scriptPath}"`, {
            cwd: path.dirname(scriptPath),
            timeout: 120000 // 2 minutes timeout
        });

        console.log('Execution completed successfully');
        
        // Clean up the script file after execution
        await fs.unlink(scriptPath).catch(err => 
            console.warn('Could not delete script file:', err.message)
        );

        res.json({
            success: true,
            message: 'Workflow automated successfully',
            output: stdout,
            errors: stderr || null
        });

    } catch (error) {
        console.error('Automation error:', error);
        
        res.status(500).json({
            success: false,
            error: error.message,
            details: error.stderr || error.stdout || null
        });
    }
});

/**
 * POST /api/generate-code
 * Generates Playwright code without executing it
 */
app.post('/api/generate-code', async (req, res) => {
    const { workflow } = req.body;

    if (!workflow || !workflow.events || !Array.isArray(workflow.events)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid workflow format'
        });
    }

    try {
        const playwrightCode = generatePlaywrightCode(workflow);
        
        res.json({
            success: true,
            code: playwrightCode
        });
    } catch (error) {
        console.error('Code generation error:', error);
        
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        port: PORT
    });
});

/**
 * GET /
 * Root endpoint
 */
app.get('/', (req, res) => {
    res.json({
        name: 'AutoPattern Automation Server',
        version: '1.0.0',
        endpoints: {
            health: 'GET /api/health',
            automate: 'POST /api/automate',
            generateCode: 'POST /api/generate-code'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: err.message
    });
});

// Start server
async function startServer() {
    await ensureScriptsDir();
    
    app.listen(PORT, () => {
        console.log('='.repeat(50));
        console.log('🚀 AutoPattern Automation Server');
        console.log('='.repeat(50));
        console.log(`Server running at: http://localhost:${PORT}`);
        console.log(`Health check: http://localhost:${PORT}/api/health`);
        console.log('='.repeat(50));
    });
}

startServer().catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
});
