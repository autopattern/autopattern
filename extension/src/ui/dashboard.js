let workflows = [];

// ---------- Init ----------
document.addEventListener('DOMContentLoaded', () => {
    loadWorkflows();
});

chrome.runtime.onMessage.addListener(msg => {
    if (msg.action === 'refresh_dashboard') {
        loadWorkflows();
    }
});

// ---------- Load ----------
function loadWorkflows() {
    chrome.runtime.sendMessage({ action: 'GET_WORKFLOWS' }, res => {
        if (res?.status === 'ok') {
            workflows = res.workflows || [];
            renderWorkflows();
        }
    });
}

// ---------- Render ----------
function renderWorkflows() {
    const list = document.getElementById('workflows-list');
    list.innerHTML = '';

    if (!workflows.length) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <span class="empty-state-icon">📭</span>
            <p>No workflows recorded yet. Start by opening the extension popup!</p>
        `;
        list.appendChild(emptyState);
        updateStats({ workflows: 0 });
        return;
    }

    workflows.forEach((w, idx) => {
        const div = document.createElement('div');
        div.className = 'workflow-card';
        
        const title = document.createElement('h3');
        title.textContent = w.name;
        
        const date = document.createElement('small');
        date.textContent = new Date(w.createdAt).toLocaleString();
        
        const viewBtn = document.createElement('button');
        viewBtn.className = 'btn-view';
        viewBtn.textContent = 'View';
        viewBtn.onclick = (e) => {
            e.preventDefault();
            viewWorkflow(idx);
        };
        
        const automateBtn = document.createElement('button');
        automateBtn.className = 'btn-automate';
        automateBtn.textContent = 'Automate';
        automateBtn.onclick = (e) => {
            e.preventDefault();
            automateWorkflow(idx);
        };
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-delete';
        deleteBtn.textContent = 'Delete';
        deleteBtn.onclick = (e) => {
            e.preventDefault();
            deleteWorkflow(idx);
        };
        
        const actions = document.createElement('div');
        actions.className = 'workflow-actions';
        actions.appendChild(viewBtn);
        actions.appendChild(automateBtn);
        actions.appendChild(deleteBtn);
        
        div.appendChild(title);
        div.appendChild(date);
        div.appendChild(actions);
        list.appendChild(div);
    });

    updateStats({ workflows: workflows.length });
}


// ---------- Stats ----------
function updateStats(stats) {
    document.getElementById('stat-workflows').textContent = stats.workflows || 0;
}

// ---------- Actions ----------
function viewWorkflow(idx) {
    const wf = workflows[idx];
    if (!wf) {
        console.error('Workflow not found at index', idx);
        return;
    }

    const events = wf.events || [];

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const content = document.createElement('div');
    content.className = 'modal-content';
    
    const title = document.createElement('h3');
    title.textContent = wf.name;
    
    const eventInfo = document.createElement('p');
    eventInfo.innerHTML = `Events: ${events.length}`;
    
    const pre = document.createElement('pre');
    pre.textContent = JSON.stringify(events, null, 2);
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.onclick = () => overlay.remove();
    
    content.appendChild(title);
    content.appendChild(eventInfo);
    content.appendChild(pre);
    content.appendChild(closeBtn);
    
    overlay.appendChild(content);
    overlay.onclick = (e) => {
        if (e.target === overlay) overlay.remove();
    };
    
    document.body.appendChild(overlay);
}

// ---------- Automate ----------
const SERVER_URL = 'http://localhost:3000';

async function automateWorkflow(idx) {
    const wf = workflows[idx];
    if (!wf) {
        console.error('Workflow not found at index', idx);
        return;
    }

    if (!wf.events || wf.events.length === 0) {
        showNotification('This workflow has no events to automate.', 'warning');
        return;
    }

    const confirmMsg = `Automate "${wf.name}"?\n\nThis will:\n1. Generate Playwright code\n2. Execute it in a new browser window\n\nMake sure the automation server is running (npm run server).`;
    
    if (!confirm(confirmMsg)) return;

    // Show loading state
    const overlay = createLoadingOverlay('Automating workflow...');
    document.body.appendChild(overlay);

    try {
        // Check if server is running
        const healthCheck = await fetch(`${SERVER_URL}/api/health`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        }).catch(() => null);

        if (!healthCheck || !healthCheck.ok) {
            throw new Error('Automation server is not running. Please start it with: npm run server');
        }

        // Send workflow to server for automation
        const response = await fetch(`${SERVER_URL}/api/automate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ workflow: wf })
        });

        const result = await response.json();

        overlay.remove();

        if (result.success) {
            showAutomationResult(wf.name, result);
        } else {
            showErrorModal('Automation Failed', result.error, result.details);
        }

    } catch (error) {
        overlay.remove();
        console.error('Automation error:', error);
        showErrorModal('Automation Error', error.message);
    }
}

function createLoadingOverlay(message) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';

    const content = document.createElement('div');
    content.className = 'modal-content';
    content.style.textAlign = 'center';
    
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    spinner.innerHTML = '⚙️';
    spinner.style.fontSize = '48px';
    spinner.style.animation = 'spin 2s linear infinite';
    
    const text = document.createElement('p');
    text.textContent = message;
    text.style.marginTop = '20px';
    
    content.appendChild(spinner);
    content.appendChild(text);
    overlay.appendChild(content);
    
    return overlay;
}

function showAutomationResult(workflowName, result) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const content = document.createElement('div');
    content.className = 'modal-content';
    
    const title = document.createElement('h3');
    title.textContent = `✅ Automation Complete: ${workflowName}`;
    title.style.color = '#4CAF50';
    
    const message = document.createElement('p');
    message.textContent = result.message || 'Workflow executed successfully!';
    
    const details = document.createElement('details');
    details.style.marginTop = '20px';
    
    const summary = document.createElement('summary');
    summary.textContent = 'View execution output';
    summary.style.cursor = 'pointer';
    
    const pre = document.createElement('pre');
    pre.style.maxHeight = '300px';
    pre.style.overflow = 'auto';
    pre.textContent = result.output || 'No output';
    
    details.appendChild(summary);
    details.appendChild(pre);
    
    const buttonContainer = document.createElement('div');
    buttonContainer.style.marginTop = '20px';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'flex-end';
    buttonContainer.style.gap = '10px';

    const copyBtn = document.createElement('button');
    copyBtn.textContent = 'Copy Logs';
    copyBtn.className = 'btn-view'; // Reuse existing style
    copyBtn.onclick = () => {
        const textToCopy = result.output || 'No output';
        navigator.clipboard.writeText(textToCopy).then(() => {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            setTimeout(() => copyBtn.textContent = originalText, 2000);
        }).catch(err => {
            console.error('Failed to copy: ', err);
        });
    };

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.onclick = () => overlay.remove();
    
    buttonContainer.appendChild(copyBtn);
    buttonContainer.appendChild(closeBtn);
    
    content.appendChild(title);
    content.appendChild(message);
    content.appendChild(details);
    content.appendChild(buttonContainer);
    
    overlay.appendChild(content);
    overlay.onclick = (e) => {
        if (e.target === overlay) overlay.remove();
    };
    
    document.body.appendChild(overlay);
}

function deleteWorkflow(idx) {
    const wf = workflows[idx];
    if (!wf) {
        console.error('Workflow not found at index', idx);
        return;
    }

    if (!confirm(`Delete "${wf.name}"? This cannot be undone.`)) return;

    chrome.runtime.sendMessage(
        { action: 'DELETE_WORKFLOW', id: wf.id },
        (res) => {
            if (res?.status === 'ok') {
                loadWorkflows();
                showNotification('Workflow deleted successfully', 'success');
            } else {
                showNotification('Failed to delete workflow', 'error');
            }
        }
    );
}


// ---------- Utils ----------
function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        max-width: 400px;
        font-family: system-ui, -apple-system, sans-serif;
    `;
    
    const colors = {
        success: { bg: '#4CAF50', text: '#fff' },
        error: { bg: '#f44336', text: '#fff' },
        warning: { bg: '#ff9800', text: '#fff' },
        info: { bg: '#2196F3', text: '#fff' }
    };
    
    const color = colors[type] || colors.info;
    notification.style.backgroundColor = color.bg;
    notification.style.color = color.text;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function showErrorModal(title, message, details = null) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const content = document.createElement('div');
    content.className = 'modal-content';
    
    const titleEl = document.createElement('h3');
    titleEl.textContent = `❌ ${title}`;
    titleEl.style.color = '#f44336';
    
    const messageEl = document.createElement('p');
    messageEl.textContent = message;
    messageEl.style.marginTop = '15px';
    
    content.appendChild(titleEl);
    content.appendChild(messageEl);
    
    if (details) {
        const detailsEl = document.createElement('details');
        detailsEl.style.marginTop = '15px';
        
        const summary = document.createElement('summary');
        summary.textContent = 'Technical details';
        summary.style.cursor = 'pointer';
        
        const pre = document.createElement('pre');
        pre.style.maxHeight = '200px';
        pre.style.overflow = 'auto';
        pre.style.fontSize = '12px';
        pre.textContent = details;
        
        detailsEl.appendChild(summary);
        detailsEl.appendChild(pre);
        content.appendChild(detailsEl);
    }
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.style.marginTop = '20px';
    closeBtn.onclick = () => overlay.remove();
    
    content.appendChild(closeBtn);
    overlay.appendChild(content);
    overlay.onclick = (e) => {
        if (e.target === overlay) overlay.remove();
    };
    
    document.body.appendChild(overlay);
}
