import { ActionProvider, EvmWalletProvider, Network } from "@coinbase/agentkit";
import { CreateAction } from "@coinbase/agentkit";
import { GetPriceForTokenInUsdcSchema } from "./schemas";
import { NETWORK_ID_0X, ZERO_X_API_KEY, USDC_ADDRESS } from "./constants";
import { formatUnits, parseUnits } from "viem";

class CeroXActionProvider extends ActionProvider {
    public override supportsNetwork(network: Network): boolean {
        return true;
    }

    constructor() {
        super("0x", []);
    }

    /**
     * Gets the balance of an ERC20 token.
     *
     * @param walletProvider - The wallet provider to get the balance from.
     * @param args - The input arguments for the action.
     * @returns A message containing the balance.
     */
    @CreateAction({
        name: "get_price_for_token_in_usdc",
        description: "Get the price of a token in USDC from the 0x API",
        schema: GetPriceForTokenInUsdcSchema
    })
    public async getPriceForTokenInUsdc(
        walletProvider: EvmWalletProvider,
        args: Record<string, unknown>
    ): Promise<string> {
        try {
            const params = GetPriceForTokenInUsdcSchema.parse(args);

            const priceParams = new URLSearchParams({
                chainId: NETWORK_ID_0X,
                sellToken: params.addressOfTokenToGetPriceInfo,
                buyToken: USDC_ADDRESS,
                sellAmount: parseUnits(params.amountOfTokenYouWantToConvert, 18).toString(),
                taker: walletProvider.getAddress(),
            });

            const headers = {
                '0x-api-key': ZERO_X_API_KEY,
                '0x-version': 'v2',
            };

            const priceResponse = await fetch('https://api.0x.org/swap/permit2/price?' + priceParams.toString(), { headers });

            if (!priceResponse.ok) {
                const errorText = await priceResponse.text();
                throw new Error(`Failed to get price: ${errorText}`);
            }

            const priceResponseJson = await priceResponse.json();
            const parsedPriceResponse = formatUnits(priceResponseJson.buyAmount, 6);

            return `The price of ${params.addressOfTokenToGetPriceInfo} is ${parsedPriceResponse.toString()} USDC`;
        } catch (error) {
            throw error;
        }
    }
}

export const ceroXProvider = () => new CeroXActionProvider();