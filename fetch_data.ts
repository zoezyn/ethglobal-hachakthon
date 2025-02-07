import fetch from 'node-fetch';
import { writeFile } from 'fs/promises';


async function fetchNextData(url: string): Promise<any> {
    try {
        const response = await fetch(url);
        const html = await response.text();

        // Use a refined regular expression to extract the __NEXT_DATA__ JSON object
        const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>(.+?)<\/script>/s);

        if (nextDataMatch && nextDataMatch[1]) {
            const nextData = JSON.parse(nextDataMatch[1]);
            return nextData;
        } else {
            throw new Error('__NEXT_DATA__ not found');
        }
    } catch (error) {
        console.error('Error fetching __NEXT_DATA__:', error);
        throw error;
    }
}

async function getCoinDetail(apiUrl: string): Promise<{ name: string; symbol: string; slug: string; tags: string[] }[] | null> {
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        const cryptoCurrencyList = data.data.cryptoCurrencyList;

        const coinDetail: { name: string; symbol: string; slug: string; tags: string[] }[] = [];

        for (const cryptoCurrency of cryptoCurrencyList) {
            coinDetail.push({
                name: cryptoCurrency.name,
                symbol: cryptoCurrency.symbol,
                slug: cryptoCurrency.slug,
                tags: cryptoCurrency.tags
            });
        }
        return coinDetail;
    } catch (error) {
        console.error('Error getting slug:', error);
        return null;
    }
}

async function getContractAddress(baseUrl: string): Promise<any | null> {
    try {
        const apiUrl = "https://api.coinmarketcap.com/data-api/v3/cryptocurrency/listing?start=1&limit=100&sortBy=market_cap&sortType=desc&convert=USD,BTC,ETH&cryptoType=all&tagType=all&audited=false&aux=ath,atl,high24h,low24h,num_market_pairs,cmc_rank,date_added,tags,platform,max_supply,circulating_supply,self_reported_circulating_supply,self_reported_market_cap,total_supply,volume_7d,volume_30d&tagSlugs=memes&platformId=199";
        const coinDetail = await getCoinDetail(apiUrl);
        const contractAddress: { name: string; symbol: string; slug: string; tags: string[]; contractAddress: string; contractExplorerUrl: string }[] = [];
        if (coinDetail) {
            for (const coin of coinDetail) {
                const url = `${baseUrl}${coin.slug}/`;
                console.log("url", url);
                const data = await fetchNextData(url);

                

                const contracts = data.props.pageProps.detailRes.detail.platforms;
                for (const contract of contracts) {
                    // console.log("contractPlatform", contract.contractPlatform);
                    if (contract.contractPlatform === 'Base') {
                        // console.log("baseContract", contract);
                        contractAddress.push({
                            name: coin.name,
                            symbol: coin.symbol,
                            slug: coin.slug,
                            tags: coin.tags,
                            contractAddress: contract.contractAddress,
                            contractExplorerUrl: contract.contractExplorerUrl
                        });
                    }
                    console.log('success')
                }
                
            }
        }
        return contractAddress;
    } catch (error) {
        console.error('Error getting contract address:', error);
        return null;
    }
}

// Example usage
getContractAddress('https://coinmarketcap.com/currencies/')
    .then(async (contract) => {
        if (contract) {
            console.log(`Contract address for base platform: ${contract.address}`);
            await writeFile('baseContract.json', JSON.stringify(contract, null, 2));
            console.log('Base contract saved to baseContract.json');
        }
    })
    .catch(error => console.error(error));