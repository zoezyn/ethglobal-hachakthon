import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import * as fs from 'fs';


async function scrapeDetailPage(driver: WebDriver, url: string) {
    // Store the original window handle
    const mainWindow = await driver.getWindowHandle();
    
    try {
        // Open new window and switch to it
        await driver.executeScript('window.open()');
        const windows = await driver.getAllWindowHandles();
        const detailWindow = windows[windows.length - 1];
        await driver.switchTo().window(detailWindow);
        
        // Scrape details in new window
        await driver.get(url);
        await driver.sleep(2000);

        await driver.wait(until.elementLocated(By.css('body script#__NEXT_DATA__')), 10000);
        const rows = await driver.findElements(By.css('script#__NEXT_DATA__'));
        const scriptContent = await rows[0].getAttribute('textContent');
        
        const jsonData = JSON.parse(scriptContent);
        const contractAddress = jsonData.props?.pageProps?.detailRes?.detail?.platforms[0]?.contractAddress;
        console.log("contractAddress: ", contractAddress);
        return {
            url: url,
            contractAddress: contractAddress
        };
    } catch (error) {
        console.error(`Error scraping detail page ${url}:`, error);
        return {
            url: url,
            contractAddress: null
        };
    } finally {
        // Close detail window and switch back to main window
        const windows = await driver.getAllWindowHandles();
        if (windows.length > 1) {
            await driver.close(); // Close current (detail) window
        }
        await driver.switchTo().window(mainWindow);
    }
}

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
            break;
        }

        // Then get all cells using the simple selector that works
        const rows = await driver.findElements(
            By.css('table tbody tr td:nth-child(3)')
        );
        const totalRows = await driver.findElements(By.css('table tbody tr td:nth-child(3)'));

        console.log(`Found ${rows.length} cells`);


        const results: { name: string; url: string; }[] = [];

        // Process each row
        for (let i = 0; i < totalRows.length; i++) {
            // try {

                const rows = await driver.findElements(By.css('table tbody tr td:nth-child(3)'));
                const currentRow = totalRows[i]

                // Get the href before clicking
                const linkElement = await currentRow.findElement(By.css('a'));
                const href = await linkElement.getAttribute('href');
                const fullUrl = new URL(href, 'https://coinmarketcap.com').href;

                console.log("fullUrl", fullUrl);
                
                // Get coin name
                const coinName = await currentRow.getText();
                console.log(`Processing ${coinName.split('\n')[0]} (${i + 1}/${rows.length})`);

                // Add delay between requests to avoid overwhelming the server
                if (i > 0) {
                    await driver.sleep(2000); // 2 second delay between requests
                }

                // Scrape the detail page
                const details = await scrapeDetailPage(driver, fullUrl);
                
                results.push({
                    name: coinName.split('\n')[0],
                    ...details
                });

            // } catch (error) {
            //     console.error(`Error processing row ${i + 1}:`, error);
            // }
        }

        return results;


        
    } finally {
        await driver.quit();
    }
}

// Execute the scraping
scrapePage('https://coinmarketcap.com/view/memes/')
    .then(result => {
        fs.writeFileSync('meme-coins-details.json', JSON.stringify(result, null, 2));
        console.log('Results saved to meme-coins-details.json');
    })
    .catch(console.error);
