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
    let current = el;
    
    while (current && current.nodeType === 1) {
        // Optimization: If we find a stable ID, we can stop and make the path relative to it
        if (current.id && !isDynamicId(current.id)) {
            path = `//*[@id="${current.id}"]` + path;
            return path;
        }
        
        let idx = 1;
        let sib = current.previousSibling;
        while (sib) {
            if (sib.nodeType === 1 && sib.nodeName === current.nodeName) idx++;
            sib = sib.previousSibling;
        }
        path = `/${current.nodeName.toLowerCase()}[${idx}]` + path;
        current = current.parentNode;
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
    
    // 5. Class name (if specific enough)
    if (el.className && typeof el.className === 'string' && el.className.trim().length > 0) {
        const classes = el.className.split(/\s+/).filter(c => !c.startsWith('ng-') && !c.startsWith('react-'));
        if (classes.length > 0 && classes.length < 3) {
            return `.${classes.join('.')}`;
        }
    }
    
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
    // If clicking on SVG elements (svg, path, circle, rect, etc.), find the closest clickable parent
    if (el && ['svg', 'path', 'circle', 'rect', 'g', 'polygon', 'polyline', 'line', 'ellipse'].includes(el.tagName?.toLowerCase())) {
        const clickableParent = el.closest('a, button, [role="button"], [onclick]');
        if (clickableParent) {
            el = clickableParent;
        }
    }

    // Find closest link for href if not on the element itself
    const closestLink = el?.closest ? el.closest('a') : null;
    const href = el?.href || closestLink?.href || null;

    const eventData = {
        type: type,
        timestamp: Date.now(),
        url: location.href,
        title: document.title,
        
        // Element details
        tagName: el?.tagName?.toLowerCase() || null,
        id: el?.id || null,
        className: el?.className || null,
        name: el?.name || null,
        value: el?.value || extra.value || null,
        href: href,
        text: el?.innerText?.slice(0, 100) || extra.text || null,
        
        // Selectors
        selector: getSelector(el),
        xpath: getXPath(el),
        
        // Extra data
        ...extra
    };

    return eventData;
}

// ---------- CLICK ----------
document.addEventListener('click', e => {
    if (!isActionableElement(e.target)) return;
    recordEvent(buildEvent('click', e.target));
}, true);

// ---------- INPUT & CHANGE ----------
// Capture input for text fields
document.addEventListener('input', debounce(e => {
    if (e.target.tagName === 'SELECT') return; // Handle selects in 'change'
    recordEvent(buildEvent('input', e.target));
}, 500), true);

// Capture change for select elements and checkboxes/radios
document.addEventListener('change', e => {
    const tag = e.target.tagName;
    if (tag === 'SELECT' || e.target.type === 'checkbox' || e.target.type === 'radio') {
        recordEvent(buildEvent('change', e.target));
    }
}, true);

// ---------- KEYBOARD (Enter key) ----------
document.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
        recordEvent(buildEvent('keydown', e.target, { key: 'Enter' }));
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
