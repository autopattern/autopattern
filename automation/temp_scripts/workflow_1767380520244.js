const { chromium } = require('playwright');

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
    // Navigate to https://www.google.com/search?q=hi&rlz=1C1CHZN_enIN1086IN1086&oq=hi&gs_lcrp=EgZjaHJvbWUqDggAEEUYJxg7GIAEGIoFMg4IABBFGCcYOxiABBiKBTIGCAEQRRhAMgwIAhAjGCcYgAQYigUyCggDEAAYsQMYgAQyBggEEEUYPDIGCAUQRRg8MgYIBhBFGDwyBggHEEUYPNIBCDExODFqMGo3qAIIsAIB8QXP5aYAKu4hmw&sourceid=chrome&ie=UTF-8
    await page.goto('https://www.google.com/search?q=hi&rlz=1C1CHZN_enIN1086IN1086&oq=hi&gs_lcrp=EgZjaHJvbWUqDggAEEUYJxg7GIAEGIoFMg4IABBFGCcYOxiABBiKBTIGCAEQRRhAMgwIAhAjGCcYgAQYigUyCggDEAAYsQMYgAQyBggEEEUYPDIGCAUQRRg8MgYIBhBFGDwyBggHEEUYPNIBCDExODFqMGo3qAIIsAIB8QXP5aYAKu4hmw&sourceid=chrome&ie=UTF-8', { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Step 2: Scroll
    await page.evaluate(() => window.scrollTo(0, 1440));

    // Step 3: Click on h3
    await page.getByText('Hi vs. High: What\'s the Difference?', { exact: false }).first().click();
    await page.waitForTimeout(500);

    // Navigate to https://www.grammarly.com/commonly-confused-words/hi-vs-high
    await page.goto('https://www.grammarly.com/commonly-confused-words/hi-vs-high', { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Step 5: Scroll
    await page.evaluate(() => window.scrollTo(0, 5135));

    // Step 6: Click on a
    await page.click('.link-color_linkDefault__xgSfW.link-color_styles2024__s1yEi');
    await page.waitForTimeout(500);

    // Navigate to https://www.grammarly.com/commonly-confused-words/desert-vs-dessert
    await page.goto('https://www.grammarly.com/commonly-confused-words/desert-vs-dessert', { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Step 8: Scroll
    await page.evaluate(() => window.scrollTo(0, 4731));

    // Step 9: Click on a
    await page.click('.link-color_linkDefault__xgSfW.link-color_styles2024__s1yEi');
    await page.waitForTimeout(500);

    // Navigate to https://www.grammarly.com/commonly-confused-words/especially-vs-specially
    await page.goto('https://www.grammarly.com/commonly-confused-words/especially-vs-specially', { waitUntil: 'domcontentloaded', timeout: 60000 });

    console.log('Workflow completed successfully!');
    
  } catch (error) {
    console.error('Error during automation:', error);
    throw error;
  } finally {
    // Close browser
    await browser.close();
  }
})();
