const { chromium } = require('playwright');

(async () => {
  // Launch browser
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to https://www.google.com/search?q=hi&rlz=1C1CHZN_enIN1086IN1086&oq=hi&gs_lcrp=EgZjaHJvbWUqDggAEEUYJxg7GIAEGIoFMg4IABBFGCcYOxiABBiKBTIGCAEQRRhAMgwIAhAjGCcYgAQYigUyBggDEEUYPDIGCAQQRRg8MgYIBRBFGDwyBggGEEUYPDIGCAcQRRg80gEHOTM1ajBqN6gCCLACAfEFAxstPRr8XbY&sourceid=chrome&ie=UTF-8
    await page.goto('https://www.google.com/search?q=hi&rlz=1C1CHZN_enIN1086IN1086&oq=hi&gs_lcrp=EgZjaHJvbWUqDggAEEUYJxg7GIAEGIoFMg4IABBFGCcYOxiABBiKBTIGCAEQRRhAMgwIAhAjGCcYgAQYigUyBggDEEUYPDIGCAQQRRg8MgYIBRBFGDwyBggGEEUYPDIGCAcQRRg80gEHOTM1ajBqN6gCCLACAfEFAxstPRr8XbY&sourceid=chrome&ie=UTF-8');
    await page.waitForLoadState('networkidle');

    // Unhandled event type: undefined

    // Unhandled event type: undefined

    // Unhandled event type: undefined

    // Unhandled event type: undefined

    // Unhandled event type: undefined

    // Unhandled event type: undefined

    // Unhandled event type: undefined

    // Unhandled event type: undefined

    // Unhandled event type: undefined

    // Unhandled event type: undefined

    // Unhandled event type: undefined

    // Unhandled event type: undefined

    // Unhandled event type: undefined

    // Unhandled event type: undefined

    // Unhandled event type: undefined

    // Unhandled event type: undefined

    // Unhandled event type: undefined

    // Unhandled event type: undefined

    // Navigate to https://www.google.com/search?q=no+nothis&sca_esv=47301926bc5cebf6&rlz=1C1CHZN_enIN1086IN1086&sxsrf=AE3TifNDwgvlnwlZTJ1bklPC9Lq-rf8qYQ%3A1767370918055&ei=pvBXaaCOA9CLosUPiZmE0AY&ved=0ahUKEwig-Ybeoe2RAxXQhagCHYkMAWoQ4dUDCBE&uact=5&oq=no+nothis&gs_lp=Egxnd3Mtd2l6LXNlcnAiCW5vIG5vdGhpczIHEAAYgAQYDTIHEAAYgAQYDTIHEAAYgAQYDTIHEAAYgAQYDTIGEAAYDRgeMgYQABgNGB4yBhAAGA0YHjIGEAAYDRgeMggQABgKGA0YHjIGEAAYDRgeSNktUP8EWKUscAV4AJABAJgBsAGgAakQqgEEMC4xM7gBA8gBAPgBAZgCEqACrhGoAg_CAg0QIxiABBiwAxgnGIoFwgIJEAAYsAMYBxgewgINEAAYgAQYsAMYQxiKBcICCxAAGIAEGLADGLEDwgIOEAAYgAQYsAMYsQMYgwHCAg4QABiwAxjkAhjWBNgBAcICExAuGIAEGLADGEMYyAMYigXYAQHCAh8QLhiABBiwAxixAxjRAxhDGIMBGMcBGMgDGIoF2AEBwgIOEC4YgAQYsAMYyAPYAQHCAhEQLhiABBiwAxixAxjIA9gBAcICChAjGIAEGCcYigXCAg0QLhiABBixAxhDGIoFwgIKEAAYgAQYQxiKBcICDhAAGIAEGLEDGIMBGIoFwgIREC4YgAQYsQMY0QMYgwEYxwHCAggQABiABBixA8ICBxAjGCcY6gLCAhkQLhiABBhDGLQCGOcGGMgDGIoFGOoC2AEBwgIfEC4YgAQY0QMYQxi0AhjnBhjHARjIAxiKBRjqAtgBAcICCxAAGIAEGJECGIoFwgIREAAYgAQYkQIYsQMYgwEYigXCAgsQABiABBixAxiDAcICChAuGIAEGEMYigXCAhMQLhiABBixAxjRAxhDGMcBGIoFwgINEAAYgAQYsQMYQxiKBcICBxAAGIAEGArCAggQLhiABBixA8ICBRAAGIAEwgIFEC4YgATCAhkQLhiABBhDGIoFGJcFGNwEGN4EGOAE2AEBwgIOEAAYgAQYkQIYsQMYigXCAgsQLhiABBiRAhiKBcICCBAuGIAEGOUEwgIaEC4YgAQYkQIYigUYlwUY3AQY3gQY4ATYAQHCAgcQLhiABBgNwgIKEC4YgAQY5QQYDcICFhAuGIAEGA0YlwUY3AQY3gQY4ATYAQHCAggQABgFGA0YHpgDCvEFmmNE6uiQJymIBgGQBhO6BgYIARABGAmSBwQ1LjEzoAfxiwGyBwQwLjEzuAeHEcIHBjItMTQuNMgHbIAIAA&sclient=gws-wiz-serp
    await page.goto('https://www.google.com/search?q=no+nothis&sca_esv=47301926bc5cebf6&rlz=1C1CHZN_enIN1086IN1086&sxsrf=AE3TifNDwgvlnwlZTJ1bklPC9Lq-rf8qYQ%3A1767370918055&ei=pvBXaaCOA9CLosUPiZmE0AY&ved=0ahUKEwig-Ybeoe2RAxXQhagCHYkMAWoQ4dUDCBE&uact=5&oq=no+nothis&gs_lp=Egxnd3Mtd2l6LXNlcnAiCW5vIG5vdGhpczIHEAAYgAQYDTIHEAAYgAQYDTIHEAAYgAQYDTIHEAAYgAQYDTIGEAAYDRgeMgYQABgNGB4yBhAAGA0YHjIGEAAYDRgeMggQABgKGA0YHjIGEAAYDRgeSNktUP8EWKUscAV4AJABAJgBsAGgAakQqgEEMC4xM7gBA8gBAPgBAZgCEqACrhGoAg_CAg0QIxiABBiwAxgnGIoFwgIJEAAYsAMYBxgewgINEAAYgAQYsAMYQxiKBcICCxAAGIAEGLADGLEDwgIOEAAYgAQYsAMYsQMYgwHCAg4QABiwAxjkAhjWBNgBAcICExAuGIAEGLADGEMYyAMYigXYAQHCAh8QLhiABBiwAxixAxjRAxhDGIMBGMcBGMgDGIoF2AEBwgIOEC4YgAQYsAMYyAPYAQHCAhEQLhiABBiwAxixAxjIA9gBAcICChAjGIAEGCcYigXCAg0QLhiABBixAxhDGIoFwgIKEAAYgAQYQxiKBcICDhAAGIAEGLEDGIMBGIoFwgIREC4YgAQYsQMY0QMYgwEYxwHCAggQABiABBixA8ICBxAjGCcY6gLCAhkQLhiABBhDGLQCGOcGGMgDGIoFGOoC2AEBwgIfEC4YgAQY0QMYQxi0AhjnBhjHARjIAxiKBRjqAtgBAcICCxAAGIAEGJECGIoFwgIREAAYgAQYkQIYsQMYgwEYigXCAgsQABiABBixAxiDAcICChAuGIAEGEMYigXCAhMQLhiABBixAxjRAxhDGMcBGIoFwgINEAAYgAQYsQMYQxiKBcICBxAAGIAEGArCAggQLhiABBixA8ICBRAAGIAEwgIFEC4YgATCAhkQLhiABBhDGIoFGJcFGNwEGN4EGOAE2AEBwgIOEAAYgAQYkQIYsQMYigXCAgsQLhiABBiRAhiKBcICCBAuGIAEGOUEwgIaEC4YgAQYkQIYigUYlwUY3AQY3gQY4ATYAQHCAgcQLhiABBgNwgIKEC4YgAQY5QQYDcICFhAuGIAEGA0YlwUY3AQY3gQY4ATYAQHCAggQABgFGA0YHpgDCvEFmmNE6uiQJymIBgGQBhO6BgYIARABGAmSBwQ1LjEzoAfxiwGyBwQwLjEzuAeHEcIHBjItMTQuNMgHbIAIAA&sclient=gws-wiz-serp');
    await page.waitForLoadState('networkidle');

    // Unhandled event type: undefined

    // Unhandled event type: undefined

    // Navigate to https://genius.com/Randy-kaplan-no-nothing-lyrics
    await page.goto('https://genius.com/Randy-kaplan-no-nothing-lyrics');
    await page.waitForLoadState('networkidle');

    // Unhandled event type: undefined

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
