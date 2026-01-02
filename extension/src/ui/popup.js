// popup.js - Workflow Recording Control

let isRecording = false;

// Initialize UI
document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('start-recording');
    const stopBtn = document.getElementById('stop-recording');
    const dashboardBtn = document.getElementById('open-dashboard');
    const workflowNameInput = document.getElementById('workflow-name');
    const statusText = document.getElementById('recording-status');

    // Check current recording state
    chrome.runtime.sendMessage({ action: 'GET_RECORDING_STATE' }, (response) => {
        if (response && response.isRecording) {
            setRecordingUI(true);
        }
    });

    startBtn.onclick = () => {
        const workflowName = workflowNameInput.value.trim() || `Workflow ${new Date().toLocaleString()}`;
        chrome.runtime.sendMessage({
            action: 'START_RECORDING',
            workflowName: workflowName
        }, (response) => {
            if (response && response.status === 'ok') {
                setRecordingUI(true);
                workflowNameInput.value = '';
            }
        });
    };

    stopBtn.onclick = () => {
        chrome.runtime.sendMessage({
            action: 'STOP_RECORDING'
        }, (response) => {
            if (response && response.status === 'ok') {
                setRecordingUI(false);
                if (response.workflow) {
                    // Show success notification
                    chrome.notifications.create({
                        type: 'basic',
                        iconUrl: 'icon.png',
                        title: 'Workflow Saved',
                        message: response.workflow.name
                    });
                }
            }
        });
    };

    dashboardBtn.onclick = () => {
        chrome.tabs.create({
            url: 'src/ui/dashboard.html'
        });
    };
});

function setRecordingUI(recording) {
    isRecording = recording;
    const startBtn = document.getElementById('start-recording');
    const stopBtn = document.getElementById('stop-recording');
    const workflowNameInput = document.getElementById('workflow-name');
    const statusText = document.getElementById('recording-status');

    if (recording) {
        startBtn.disabled = true;
        stopBtn.disabled = false;
        workflowNameInput.disabled = true;
        statusText.textContent = '🔴 Recording...';
        statusText.style.color = '#ff6b6b';
    } else {
        startBtn.disabled = false;
        stopBtn.disabled = true;
        workflowNameInput.disabled = false;
        statusText.textContent = '⚪ Stopped';
        statusText.style.color = '#aaa';
    }
}
