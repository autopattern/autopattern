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
    // Navigate to https://www.google.com/search?q=hi&rlz=1C1CHZN_enIN1086IN1086&oq=hi&gs_lcrp=EgZjaHJvbWUqDggAEEUYJxg7GIAEGIoFMg4IABBFGCcYOxiABBiKBTIGCAEQRRhAMgwIAhAjGCcYgAQYigUyBggDEEUYPDIGCAQQRRg8MgYIBRBFGDwyBggGEEUYPDIGCAcQRRg80gEIMTE5OGowajmoAgawAgHxBSS8yftCCczE&sourceid=chrome&ie=UTF-8
    await page.goto('https://www.google.com/search?q=hi&rlz=1C1CHZN_enIN1086IN1086&oq=hi&gs_lcrp=EgZjaHJvbWUqDggAEEUYJxg7GIAEGIoFMg4IABBFGCcYOxiABBiKBTIGCAEQRRhAMgwIAhAjGCcYgAQYigUyBggDEEUYPDIGCAQQRRg8MgYIBRBFGDwyBggGEEUYPDIGCAcQRRg80gEIMTE5OGowajmoAgawAgHxBSS8yftCCczE&sourceid=chrome&ie=UTF-8', { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Step 2: Scroll
    await page.evaluate(() => window.scrollTo(0, 1184));

    // Step 3: Click on h3
    await page.getByText('Web3 Neobank | Trade, Save & Spend Crypto & Fiat | hi', { exact: false }).first().click();
    await page.waitForTimeout(500);

    // Navigate to https://hi.com/
    await page.goto('https://hi.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Step 5: Scroll
    await page.evaluate(() => window.scrollTo(0, 2740));

    // Step 6: Click on path
    await page.locator('xpath=/html[1]/body[1]/div[1]/div[1]/section[4]/div[1]/div[1]/div[2]/a[1]/div[1]/div[2]/svg[1]/path[1]').click();
    await page.waitForTimeout(500);

    // Navigate to https://apps.apple.com/us/app/hi-buy-earn-send-crypto/id1583215766
    await page.goto('https://apps.apple.com/us/app/hi-buy-earn-send-crypto/id1583215766', { waitUntil: 'domcontentloaded', timeout: 60000 });

    console.log('Workflow completed successfully!');
    
  } catch (error) {
    console.error('Error during automation:', error);
    throw error;
  } finally {
    // Close browser
    await browser.close();
  }
})();
