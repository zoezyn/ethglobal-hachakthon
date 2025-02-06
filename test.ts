import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import * as fs from 'fs';

async function scrapePage(url: string) {
    const options = new chrome.Options();
    options.addArguments('--headless=new');
    const driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

    try {
        await driver.get(url);
        await driver.sleep(3000);

        console.log('Waiting for table to load...');
        await driver.wait(
            until.elementLocated(By.css('table')), 
            50000
        );

        // Scroll first to load all content
        console.log('Starting to scroll...');
        for (let i = 0; i < 10; i++) {
            await driver.executeScript("window.scrollBy(0, 1000)");
            await driver.sleep(1000);
            console.log(`Scroll attempt ${i + 1}`);
        }

        // Then get all cells using the simple selector that works
        const cells = await driver.findElements(
            By.css('table tbody tr td:nth-child(3)')
        );
        console.log(`Found ${cells.length} cells`);

        const coinNames = await Promise.all(
            cells.map(async (cell) => {
                const text = await cell.getText();
                return text.split('\n')[0]; // Get first line which is the coin name
            })
        );
        
        console.log(`Processed ${coinNames.length} coin names:`, coinNames);
        return coinNames;
    } finally {
        await driver.quit();
    }
}

// Execute the scraping
scrapePage('https://coinmarketcap.com/view/memes/')
    .then(result => {
        fs.writeFileSync('meme-coins.json', JSON.stringify(result, null, 2));
        console.log('Results saved to meme-coins.json');
    })
    .catch(console.error);