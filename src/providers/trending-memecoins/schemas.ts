import { z } from "zod";

export const GetTrendingMemecoinsSchema = z.object({
    limit: z.number()
        .optional()
        .default(10)
        .describe("Maximum number of trending memecoins to return. Defaults to 10. Use a lower number for a quick overview or a higher number for a comprehensive list.")
});

/**
 * Represents the essential information about a memecoin token.
 * This simplified format is used for display purposes, containing only
 * the key information needed to identify and interact with the token.
 */
export type TrendingMemecoin = {
    /** The full name of the memecoin (e.g., "Shiba Inu") */
    name: string;
    /** The token's symbol/ticker (e.g., "SHIB") */
    symbol: string;
    /** The token's smart contract address on the Base network */
    contractAddress: string;
}; 