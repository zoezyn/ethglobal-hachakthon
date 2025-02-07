import fetch from 'node-fetch';
import { writeFile } from 'fs/promises';
import { TrendingMemecoin } from "./schemas";

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

export type FullMemeTokenInfo = {
    name: string;
    symbol: string;
    slug: string;
    tags: string[];
    contractAddress: string;
    contractExplorerUrl: string;
}

export async function getContractAddress(): Promise<FullMemeTokenInfo[] | null> {
    try {
        const baseUrl = 'https://coinmarketcap.com/currencies/';
        const apiUrl = "https://api.coinmarketcap.com/data-api/v3/cryptocurrency/listing?start=1&limit=100&sortBy=market_cap&sortType=desc&convert=USD,BTC,ETH&cryptoType=all&tagType=all&audited=false&aux=ath,atl,high24h,low24h,num_market_pairs,cmc_rank,date_added,tags,platform,max_supply,circulating_supply,self_reported_circulating_supply,self_reported_market_cap,total_supply,volume_7d,volume_30d&tagSlugs=memes&platformId=199";
        const coinDetail = await getCoinDetail(apiUrl);
        const contractAddresses: FullMemeTokenInfo[] = [];

        if (coinDetail) {
            for (const coin of coinDetail) {
                const url = `${baseUrl}${coin.slug}/`;
                console.log("url", url);
                const data = await fetchNextData(url);

                const contracts = data.props.pageProps.detailRes.detail.platforms;
                for (const contract of contracts) {
                    if (contract.contractPlatform === 'Base') {
                        contractAddresses.push({
                            name: coin.name,
                            symbol: coin.symbol,
                            slug: coin.slug,
                            tags: coin.tags,
                            contractAddress: contract.contractAddress,
                            contractExplorerUrl: contract.contractExplorerUrl
                        });
                    }
                }
            }
        }
        return contractAddresses;
    } catch (error) {
        console.error('Error getting contract address:', error);
        return null;
    }
}

export async function fetchTrendingMemecoins(): Promise<TrendingMemecoin[]> {
    try {
        const memecoins = await getContractAddress();
        if (!memecoins) {
            throw new Error("Failed to fetch memecoin data");
        }
        return memecoins;
    } catch (error) {
        console.error("[TrendingMemecoins] Error fetching data:", error);
        throw error;
    }
}