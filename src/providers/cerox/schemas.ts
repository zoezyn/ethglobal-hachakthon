import { z } from "zod";



const GetPriceForTokenInUsdcSchema = z.object({
    addressOfTokenToGetPriceInfo: z.string().describe("The address of the token you want to know the price of"),
    amountOfTokenYouWantToConvert: z.string().describe("The amount of the token you want to convert to USDC"),
}).strip()
    .describe("Get the price of a token in USDC from the 0x API");

export { GetPriceForTokenInUsdcSchema };