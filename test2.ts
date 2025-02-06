import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import * as fs from 'fs';


async function scrapeDetailPage(url: string) {

    const options = new chrome.Options();
    options.addArguments('--headless=new');
    const driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

    await driver.get(url);
    await driver.sleep(2000);

    await driver.wait(until.elementLocated(By.css('body script#__NEXT_DATA__')), 10000);

    const rows = await driver.findElements(
        By.css('script#__NEXT_DATA__')
    );
    console.log(`Found ${rows.length} cells`);
    const scriptContent = await rows[0].getAttribute('textContent');
    
    // Parse the JSON content
    const jsonData = JSON.parse(scriptContent);
    const contractAddress = jsonData.props?.pageProps?.detailRes?.detail?.platforms[0]?.contractAddress;
    console.log(contractAddress);
    
    
    // Add your detail page scraping logic here
    // For example, getting contract address or other details
    const details = {
        // Add whatever details you want to collect from the coin's page
        url: url,
        contractAddress: contractAddress
    };
    
    return details;
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
        }

        // Then get all cells using the simple selector that works
        const rows = await driver.findElements(
            By.css('table tbody tr td:nth-child(3)')
        );
        console.log(`Found ${rows.length} cells`);

        // const coinNames = await Promise.all(
        //     rows.map(async (cell) => {
        //         const text = await cell.getText();
        //         return text.split('\n')[0]; // Get first line which is the coin name
        //     })
        // );
        
        // console.log(`Processed ${coinNames.length} coin names:`, coinNames);
        // return coinNames;

        const results: { name: string; url: string; }[] = [];

        // Process each row
        for (let i = 0; i < rows.length; i++) {
            try {

                // Get the href before clicking
                const linkElement = await rows[i].findElement(By.css('a'));
                const href = await linkElement.getAttribute('href');
                const fullUrl = new URL(href, 'https://coinmarketcap.com').href;

                console.log("fullUrl", fullUrl);
                
                // Get coin name
                const coinName = await rows[i].getText();
                console.log(`Processing ${coinName.split('\n')[0]} (${i + 1}/${rows.length})`);

                // Scrape the detail page
                const details = await scrapeDetailPage(fullUrl);
                
                results.push({
                    name: coinName.split('\n')[0],
                    ...details
                });

            } catch (error) {
                console.error(`Error processing row ${i + 1}:`, error);
            }
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


// const options = new chrome.Options();
// options.addArguments('--headless=new');
// const driver = await new Builder()
//     .forBrowser('chrome')
//     .setChromeOptions(options)
//     .build();

// scrapeDetailPage(driver,'https://coinmarketcap.com/currencies/shiba-inu/')
//     .then(result => {
//         fs.writeFileSync('meme-coins-details.json', JSON.stringify(result, null, 2));
//         console.log('Results saved to meme-coins-details.json');
//     })
//     .catch(console.error);


    