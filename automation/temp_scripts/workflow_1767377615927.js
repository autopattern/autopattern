const { chromium } = require('playwright');

(async () => {
  // Launch browser
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to https://www.google.com/search?q=hi&rlz=1C1CHZN_enIN1086IN1086&oq=hi&gs_lcrp=EgZjaHJvbWUqDggAEEUYJxg7GIAEGIoFMg4IABBFGCcYOxiABBiKBTIGCAEQRRhAMgwIAhAjGCcYgAQYigUyCggDEAAYsQMYgAQyBggEEEUYPDIGCAUQRRg8MgYIBhBFGDwyBggHEEUYPNIBBzUxNmowajeoAgiwAgHxBTyy9SGVhTis&sourceid=chrome&ie=UTF-8
    await page.goto('https://www.google.com/search?q=hi&rlz=1C1CHZN_enIN1086IN1086&oq=hi&gs_lcrp=EgZjaHJvbWUqDggAEEUYJxg7GIAEGIoFMg4IABBFGCcYOxiABBiKBTIGCAEQRRhAMgwIAhAjGCcYgAQYigUyCggDEAAYsQMYgAQyBggEEEUYPDIGCAUQRRg8MgYIBhBFGDwyBggHEEUYPNIBBzUxNmowajeoAgiwAgHxBTyy9SGVhTis&sourceid=chrome&ie=UTF-8');
    await page.waitForLoadState('networkidle');

    // Unhandled event type: undefined

    // Unhandled event type: undefined

    // Unhandled event type: undefined

    // Navigate to https://www.grammarly.com/commonly-confused-words/hi-vs-high
    await page.goto('https://www.grammarly.com/commonly-confused-words/hi-vs-high');
    await page.waitForLoadState('networkidle');

    // Unhandled event type: undefined

    console.log('Workflow completed successfully!');
    
  } catch (error) {
    console.error('Error during automation:', error);
    throw error;
  } finally {
    // Close browser
    await browser.close();
  }
})();
