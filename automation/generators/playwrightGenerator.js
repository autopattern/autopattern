// Converts recorded workflow events to Playwright code

/**
 * Generate Playwright test code from recorded events
 * @param {Object} workflow - The workflow object containing events
 * @returns {string} - Generated Playwright code
 */
function generatePlaywrightCode(workflow) {
    const events = workflow.events || [];
    
    let code = `const { chromium } = require('playwright');

(async () => {
  // Launch browser with stealth settings to avoid bot detection
  const browser = await chromium.launch({ 
    headless: false,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-site-isolation-trials'
    ]
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'en-US',
    timezoneId: 'America/New_York',
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9'
    }
  });
  
  // Remove automation indicators
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
    });
    
    // Override the navigator.plugins to make it look real
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5],
    });
    
    // Override chrome property
    window.chrome = {
      runtime: {}
    };
    
    // Override permissions
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => (
      parameters.name === 'notifications' ?
        Promise.resolve({ state: Notification.permission }) :
        originalQuery(parameters)
    );
  });
  
  const page = await context.newPage();

  try {
`;

    // Track current URL to know when to navigate
    let currentUrl = null;

    events.forEach((event, index) => {
        const { type, url } = event;

        // Navigate if URL changes
        if (url && url !== currentUrl) {
            code += `    // Navigate to ${url}\n`;
            code += `    await page.goto('${url}', { waitUntil: 'domcontentloaded', timeout: 60000 });\n\n`;
            currentUrl = url;
        }

        // Generate action based on event type
        switch (type) {
            case 'click':
                code += generateClickAction(event, index);
                break;
            case 'input':
                code += generateInputAction(event, index);
                break;
            case 'select': // Fallback for older recordings
            case 'change':
                code += generateChangeAction(event, index);
                break;
            case 'scroll':
                code += generateScrollAction(event, index);
                break;
            case 'submit':
                code += generateSubmitAction(event, index);
                break;
            case 'keydown':
                code += generateKeydownAction(event, index);
                break;
            case 'page_visit':
            case 'navigation':
                // These are handled by URL changes, skip
                break;
            default:
                // Skip unknown event types silently
                break;
        }
    });

    code += `    console.log('Workflow completed successfully!');
    
  } catch (error) {
    console.error('Error during automation:', error);
    throw error;
  } finally {
    // Close browser
    await browser.close();
  }
})();
`;

    return code;
}

function generateClickAction(event, index) {
    const { selector, xpath, text, href, tagName, id, name, className } = event;
    let code = `    // Step ${index + 1}: Click on ${tagName || 'element'}\n`;
    const isSvgLike = ['svg', 'path', 'circle', 'rect', 'g', 'polygon', 'polyline', 'line', 'ellipse'].includes((tagName || '').toLowerCase());
    
    // Priority: Selector > ID > Name > Text > ClassName (if specific) > XPath/ancestor for SVG > HREF (last resort)
    if (selector) {
        code += `    await page.click('${escapeCssSelector(selector)}');\n`;
    } else if (id && !isDynamicId(id)) {
        code += `    await page.click('#${id}');\n`;
    } else if (name) {
        code += `    await page.click('[name="${escapeString(name)}"]');\n`;
    } else if (text && text.trim().length > 0) {
        const cleanText = text.trim().slice(0, 120);
        code += `    await page.getByText('${escapeString(cleanText)}', { exact: false }).first().click();\n`;
    } else if (className && typeof className === 'string' && className.trim()) {
        const classes = className.split(/\s+/).filter(c => c.length > 0 && !c.startsWith('ng-') && !c.startsWith('react-'));
        if (classes.length > 0 && classes.length <= 3) {
            code += `    await page.locator('.${classes[0]}').first().click();\n`;
        } else if (xpath) {
            // fallback to xpath below
        }
    }

    else if (xpath) {
        if (isSvgLike) {
            // Try clicking the closest ancestor link/button instead of the SVG path itself
            const ancestorAnchor = `${escapeXPath(xpath)}/ancestor::a[1]`;
            code += `    const svgTarget = page.locator('xpath=${ancestorAnchor}');\n`;
            code += `    if (await svgTarget.count()) {\n`;
            code += `      await svgTarget.first().click();\n`;
            code += `    } else {\n`;
            code += `      await page.locator('xpath=${escapeXPath(xpath)}').click();\n`;
            code += `    }\n`;
        } else {
            code += `    await page.locator('xpath=${escapeXPath(xpath)}').click();\n`;
        }
    } else if (href) {
        // HREF is last resort - extract domain for better matching
        const hrefPart = extractHrefIdentifier(href);
        code += `    await page.locator('a[href*="${escapeString(hrefPart)}"]').first().click();\n`;
    } else {
        code += `    // WARNING: No reliable selector found for this click\n`;
    }
    
    code += `    await page.waitForTimeout(500);\n\n`;
    return code;
}

function extractHrefIdentifier(href) {
    if (!href) return '';
    
    // If it's a full URL, try to extract meaningful part
    if (href.startsWith('http://') || href.startsWith('https://')) {
        try {
            const url = new URL(href);
            // Use domain for simple matches
            return url.hostname.replace('www.', '');
        } catch (e) {
            return href;
        }
    }
    
    return href;
}

function isDynamicId(id) {
    if (!id) return true;
    if (id.length > 20) return true;
    if (/^[_:]/.test(id)) return true;
    if (/[A-Z]{2,}[a-z]+[A-Z]/.test(id)) return true;
    if (/\d{3,}/.test(id)) return true;
    if (/^[a-f0-9]{8,}$/i.test(id)) return true;
    return false;
}

function generateInputAction(event, index) {
    const { selector, xpath, value, tagName } = event;
    let code = `    // Step ${index + 1}: Type into ${tagName || 'input field'}\n`;
    
    if (selector) {
        code += `    await page.fill('${escapeCssSelector(selector)}', '${escapeString(value || '')}');\n`;
    } else if (xpath) {
        code += `    await page.locator('xpath=${escapeXPath(xpath)}').fill('${escapeString(value || '')}');\n`;
    } else {
        code += `    // WARNING: No reliable selector found for this input\n`;
    }
    
    code += `\n`;
    return code;
}

function generateChangeAction(event, index) {
    const { selector, xpath, value, tagName, type } = event;
    
    // Handle Select
    if (tagName === 'select') {
        let code = `    // Step ${index + 1}: Select option\n`;
        if (selector) {
            code += `    await page.selectOption('${escapeCssSelector(selector)}', '${escapeString(value || '')}');\n`;
        } else if (xpath) {
            code += `    await page.locator('xpath=${escapeXPath(xpath)}').selectOption('${escapeString(value || '')}');\n`;
        }
        return code + `\n`;
    }
    
    // Handle Checkbox/Radio
    if (type === 'checkbox' || type === 'radio') {
        let code = `    // Step ${index + 1}: Check/Uncheck ${type}\n`;
        // For simplicity, assume we want to check it if it was changed
        if (selector) {
            code += `    await page.check('${escapeCssSelector(selector)}');\n`;
        } else if (xpath) {
            code += `    await page.locator('xpath=${escapeXPath(xpath)}').check();\n`;
        }
        return code + `\n`;
    }

    // Fallback to input for other types
    return generateInputAction(event, index);
}

function generateScrollAction(event, index) {
    // content.js sends 'y' for scrollY
    const scrollY = event.scrollY !== undefined ? event.scrollY : event.y;
    const scrollX = event.scrollX !== undefined ? event.scrollX : 0;
    
    let code = `    // Step ${index + 1}: Scroll\n`;
    
    if (scrollY !== undefined) {
        code += `    await page.evaluate(() => window.scrollTo(${scrollX}, ${scrollY}));\n`;
    } else {
        code += `    await page.evaluate(() => window.scrollBy(0, 500));\n`;
    }
    
    code += `\n`;
    return code;
}

function generateSubmitAction(event, index) {
    const { selector, xpath } = event;
    let code = `    // Step ${index + 1}: Submit form\n`;
    
    if (selector) {
        code += `    await page.locator('${escapeCssSelector(selector)}').press('Enter');\n`;
    } else if (xpath) {
        code += `    await page.locator('xpath=${escapeXPath(xpath)}').press('Enter');\n`;
    } else {
        code += `    // WARNING: No reliable selector found for this submit\n`;
    }
    
    code += `    await page.waitForLoadState('networkidle');\n\n`;
    return code;
}

function generateKeydownAction(event, index) {
    const { selector, xpath, key } = event;
    
    if (!key) return '';
    
    let code = `    // Step ${index + 1}: Press ${key}\n`;
    
    if (selector) {
        code += `    await page.locator('${escapeCssSelector(selector)}').press('${key}');\n`;
    } else if (xpath) {
        code += `    await page.locator('xpath=${escapeXPath(xpath)}').press('${key}');\n`;
    } else {
        code += `    await page.keyboard.press('${key}');\n`;
    }
    
    code += `\n`;
    return code;
}

// Helper functions to escape special characters
function escapeCssSelector(selector) {
    if (!selector) return '';
    return selector.replace(/'/g, "\\'");
}

function escapeXPath(xpath) {
    if (!xpath) return '';
    return xpath.replace(/'/g, "\\'");
}

function escapeString(str) {
    if (!str) return '';
    return str.replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r');
}

module.exports = { generatePlaywrightCode };
