import { ActionProvider, EvmWalletProvider, Network } from "@coinbase/agentkit";
import { CreateAction } from "@coinbase/agentkit";
import { GetTrendingMemecoinsSchema, TrendingMemecoin } from "./schemas";
import { getContractAddress, type FullMemeTokenInfo } from "./coins-fetch";

/**
 * Provider for fetching and displaying trending memecoin information on the Base network.
 * This provider helps users discover popular meme tokens and access their contract addresses
 * for further interaction.
 */
class TrendingMemecoinsActionProvider extends ActionProvider {
    public override supportsNetwork(network: Network): boolean {
        // This action supports any network since it's just fetching data
        return true;
    }

    constructor() {
        super("trending-memecoins", []);
    }

    /**
     * Retrieves a list of currently trending memecoins on the Base network.
     * The action fetches data from CoinMarketCap and filters for tokens available on Base,
     * returning essential information for each token including name, symbol, and contract address.
     *
     * @param walletProvider - The wallet provider (not used in this action as it's read-only)
     * @param args - Arguments for the action:
     *              - limit: Optional number of tokens to return (default: 10)
     * @returns A formatted message containing the list of trending memecoins with their details
     * 
     * Example response:
     * "Here are the trending memecoins:
     * 
     * 1. Shiba Inu (SHIB)
     *    Contract: 0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce
     * 
     * 2. Bonk (BONK)
     *    Contract: 0xdf1cf211d38e7762c9691be4d779a441a17a6cfc"
     */
    @CreateAction({
        name: "get_trending_memecoins",
        description: "Get a curated list of currently trending meme tokens that are available on the Base network. Each token entry includes the token's name, symbol, and contract address for easy reference and interaction.",
        schema: GetTrendingMemecoinsSchema
    })
    public async getTrendingMemecoins(
        walletProvider: EvmWalletProvider,
        args: Record<string, unknown>
    ): Promise<string> {
        try {
            console.log("[TrendingMemecoins] Starting to fetch trending memecoins");
            const params = GetTrendingMemecoinsSchema.parse(args);

            // Get the full data from CoinMarketCap
            const memecoinsData = await getContractAddress();
            if (!memecoinsData) {
                throw new Error("Failed to fetch memecoin data from CoinMarketCap");
            }

            // Limit the results first to avoid unnecessary transformations
            const limitedMemecoins = memecoinsData.slice(0, params.limit);

            // Transform the full data into the simplified format for display
            const simplifiedMemecoins: TrendingMemecoin[] = limitedMemecoins.map(coin => ({
                name: coin.name,
                symbol: coin.symbol,
                contractAddress: coin.contractAddress
            }));

            console.log(`[TrendingMemecoins] Found ${simplifiedMemecoins.length} trending memecoins on Base`);

            // Format the response
            const formattedMemecoins = simplifiedMemecoins.map((coin: TrendingMemecoin, index: number) => {
                return `${index + 1}. ${coin.name} (${coin.symbol})
   Contract: ${coin.contractAddress}`;
            }).join("\n\n");

            return `Here are the trending memecoins:\n\n${formattedMemecoins}`;
        } catch (error) {
            console.error("[TrendingMemecoins] Error:", error);
            throw error;
        }
    }
}

export const trendingMemecoinsProvider = () => new TrendingMemecoinsActionProvider(); 