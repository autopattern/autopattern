// content.js — Simplified, automation-ready recorder

function recordEvent(event) {
    // Check if extension context is valid before sending
    if (!chrome.runtime?.id) {
        console.warn('Extension context invalidated. Please refresh the page.');
        return;
    }
    
    try {
        chrome.runtime.sendMessage({
            action: 'RECORD_EVENT',
            event
        });
    } catch (error) {
        // Silently handle context invalidation - happens during extension reload
        if (error.message?.includes('Extension context invalidated')) {
            console.warn('Extension reloaded. Refresh page to continue recording.');
        } else {
            console.error('Error recording event:', error);
        }
    }
}

// ---------- Helpers ----------
function debounce(fn, delay) {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), delay);
    };
}

function getXPath(el) {
    if (!el) return null;
    let path = '';
    while (el && el.nodeType === 1) {
        let idx = 1;
        let sib = el.previousSibling;
        while (sib) {
            if (sib.nodeType === 1 && sib.nodeName === el.nodeName) idx++;
            sib = sib.previousSibling;
        }
        path = `/${el.nodeName.toLowerCase()}[${idx}]` + path;
        el = el.parentNode;
    }
    return path;
}

function isDynamicId(id) {
    if (!id) return true;
    // Detect dynamic IDs: random strings, underscores with numbers, hashes, etc.
    if (id.length > 20) return true; // Too long, likely dynamic
    if (/^[_:]/.test(id)) return true; // Starts with _ or : (Google-style)
    if (/[A-Z]{2,}[a-z]+[A-Z]/.test(id)) return true; // camelCase gibberish
    if (/\d{3,}/.test(id)) return true; // Contains 3+ consecutive digits
    if (/^[a-f0-9]{8,}$/i.test(id)) return true; // Looks like a hash
    return false;
}

function getSelector(el) {
    if (!el) return null;
    
    // 1. Stable ID (not dynamic)
    if (el.id && !isDynamicId(el.id)) return `#${el.id}`;
    
    // 2. data-testid (best for automation)
    if (el.getAttribute('data-testid')) {
        return `[data-testid="${el.getAttribute('data-testid')}"]`;
    }
    
    // 3. name attribute (common for forms)
    if (el.name) return `[name="${el.name}"]`;
    
    // 4. aria-label
    if (el.getAttribute('aria-label')) {
        return `[aria-label="${el.getAttribute('aria-label')}"]`;
    }
    
    // 5. Text-based selector for links/buttons
    const tag = el.tagName.toLowerCase();
    const text = el.innerText?.trim().slice(0, 50);
    if (text && ['a', 'button', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) {
        // Use XPath text selector as fallback indicator
        return `${tag}:text("${text}")`;
    }
    
    // 6. role attribute
    const role = el.getAttribute('role');
    if (role) return `[role="${role}"]`;
    
    return null;
}

function isActionableElement(el) {
    if (!el || !el.tagName) return false;
    const tag = el.tagName.toLowerCase();
    // Filter out non-actionable containers
    if (['html', 'body', 'div', 'span', 'section', 'article', 'main'].includes(tag)) {
        // Only allow if it has click handlers or special attributes
        if (el.onclick || el.getAttribute('role') === 'button' || el.getAttribute('tabindex')) {
            return true;
        }
        return false;
    }
    return true; // buttons, links, inputs, etc.
}

// ---------- Event Builder ----------
function buildEvent(type, el, extra = {}) {
    return {
        event: type,
        timestamp: Date.now(),
        url: location.href,
        title: document.title,

        automation: {
            selector: getSelector(el),
            xpath: getXPath(el),
            tag: el?.tagName || null,
            inputType: el?.getAttribute?.('type') || null
        },

        raw: extra
    };
}

// ---------- CLICK ----------
document.addEventListener('click', e => {
    if (!isActionableElement(e.target)) return; // Filter noise
    recordEvent(buildEvent('click', e.target, {
        text: e.target.innerText?.slice(0, 80) || null
    }));
}, true);

// ---------- INPUT ----------
// Use longer debounce to capture final value, not every keystroke
document.addEventListener('input', debounce(e => {
    const value = e.target.value || '';
    recordEvent(buildEvent('input', e.target, {
        value: value.slice(0, 200), // Capture actual value (truncated for safety)
        length: value.length
    }));
}, 500), true);

// ---------- KEYBOARD (Enter key for forms) ----------
document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        const value = e.target.value || '';
        recordEvent(buildEvent('keypress_enter', e.target, {
            value: value.slice(0, 200), // Capture what was submitted
            length: value.length
        }));
    }
}, true);

// ---------- SCROLL ----------
let lastScroll = window.scrollY;
window.addEventListener('scroll', debounce(() => {
    const delta = Math.abs(window.scrollY - lastScroll);
    if (delta > 300) { // Higher threshold to reduce noise
        lastScroll = window.scrollY;
        recordEvent(buildEvent('scroll', null, {
            y: Math.round(window.scrollY),
            direction: window.scrollY > lastScroll ? 'down' : 'up'
        }));
    }
}, 400), { passive: true }); // Longer debounce

// ---------- NAVIGATION ----------
if (!window.__pageVisitRecorded) {
    window.__pageVisitRecorded = true;
    // Wait for title to load
    if (document.readyState === 'complete') {
        recordEvent(buildEvent('page_visit', null));
    } else {
        window.addEventListener('load', () => {
            recordEvent(buildEvent('page_visit', null));
        }, { once: true });
    }
}

(function () {
    const push = history.pushState;
    history.pushState = function () {
        push.apply(history, arguments);
        recordEvent(buildEvent('navigation', null));
    };
})();
