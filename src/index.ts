import "reflect-metadata";
import {
  AgentKit,
  CdpWalletProvider,
  walletActionProvider,
  erc20ActionProvider,
  cdpApiActionProvider,
  cdpWalletActionProvider,
} from "@coinbase/agentkit";
import { getLangChainTools } from "@coinbase/agentkit-langchain";
import { HumanMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatGroq } from "@langchain/groq";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as readline from "readline";
import { ceroXProvider } from "./providers/cerox";
import { trendingMemecoinsProvider } from "./providers/trending-memecoins";
import { Command } from 'commander';
import { startServer } from './server';

dotenv.config();

function validateEnvironment(): void {
  const missingVars: string[] = [];

  const requiredVars = ["OPENAI_API_KEY", "CDP_API_KEY_NAME", "CDP_API_KEY_PRIVATE_KEY"];
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });

  if (missingVars.length > 0) {
    console.error("Error: Required environment variables are not set");
    missingVars.forEach(varName => {
      console.error(`${varName}=your_${varName.toLowerCase()}_here`);
    });
    process.exit(1);
  }

  if (!process.env.NETWORK_ID) {
    console.warn("Warning: NETWORK_ID not set, defaulting to base-sepolia testnet");
  }
}

validateEnvironment();

const WALLET_DATA_FILE = "wallet_data.txt";

export async function initializeAgent() {
  try {
    const llm = new ChatGroq({
      model: "deepseek-r1-distill-llama-70b",
    });

    let walletDataStr: string | null = null;

    if (fs.existsSync(WALLET_DATA_FILE)) {
      try {
        walletDataStr = fs.readFileSync(WALLET_DATA_FILE, "utf8");
      } catch (error) {
        console.error("Error reading wallet data:", error);
      }
    }

    const config = {
      apiKeyName: process.env.CDP_API_KEY_NAME,
      apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      cdpWalletData: walletDataStr || undefined,
      networkId: process.env.NETWORK_ID || "base-sepolia",
    };

    const walletProvider = await CdpWalletProvider.configureWithWallet(config);

    const agentkit = await AgentKit.from({
      walletProvider,
      actionProviders: [
        ceroXProvider(),
        trendingMemecoinsProvider(),
        walletActionProvider(),
        erc20ActionProvider(),
        cdpApiActionProvider({
          apiKeyName: process.env.CDP_API_KEY_NAME,
          apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
        cdpWalletActionProvider({
          apiKeyName: process.env.CDP_API_KEY_NAME,
          apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
      ],
    });

    const tools = await getLangChainTools(agentkit);
    const memory = new MemorySaver();
    const agentConfig = { configurable: { thread_id: "CDP AgentKit Chatbot Example!" } };

    const agent = createReactAgent({
      llm,
      tools,
      checkpointSaver: memory,
      messageModifier: `
        You are a helpful agent that can interact onchain using the Coinbase Developer Platform AgentKit. You are 
        empowered with several key capabilities:

        1. Price Discovery (via 0x API):
           - You can check real-time token prices against USDC
           - You can get accurate price quotes before suggesting trades
           - Use this for market information and trade recommendations

        2. Trending Memecoins:
           - You can fetch current trending meme tokens on Base
           - Each token comes with its name, symbol, and contract address
           - Use this to help users discover popular meme tokens

        Important Guidelines:
        - Always check wallet details first to confirm the network
        - Use 0x price API for accurate market data before suggesting trades
        - For 5XX errors, ask the user to retry later
        - If a requested action isn't available, direct users to docs.cdp.coinbase.com

        Be concise and helpful. Provide accurate price data when discussing trades or token values.
        `,
    });

    const exportedWallet = await walletProvider.exportWallet();
    fs.writeFileSync(WALLET_DATA_FILE, JSON.stringify(exportedWallet));

    return { agent, config: agentConfig };
  } catch (error) {
    console.error("Failed to initialize agent:", error);
    throw error;
  }
}

async function runChatMode(agent: any, config: any) {
  console.log("Starting chat mode... Type 'exit' to end.");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt: string): Promise<string> =>
    new Promise(resolve => rl.question(prompt, resolve));

  try {
    while (true) {
      const userInput = await question("\nPrompt: ");

      if (userInput.toLowerCase() === "exit") {
        break;
      }

      const stream = await agent.stream({ messages: [new HumanMessage(userInput)] }, config);

      for await (const chunk of stream) {
        if ("agent" in chunk) {
          console.log(chunk.agent.messages[0].content);
        } else if ("tools" in chunk) {
          console.log(chunk.tools.messages[0].content);
        }
        console.log("-------------------");
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error:", error.message);
    }
    process.exit(1);
  } finally {
    rl.close();
  }
}

async function main() {
  const program = new Command();

  program
    .name('cdp-agent')
    .description('CDP AgentKit CLI and API server')
    .version('1.0.0');

  program
    .command('chat')
    .description('Start interactive chat mode')
    .action(async () => {
      try {
        const { agent, config } = await initializeAgent();
        await runChatMode(agent, config);
      } catch (error) {
        console.error("Error:", error);
        process.exit(1);
      }
    });

  program
    .command('serve')
    .description('Start API server')
    .option('-p, --port <number>', 'Port to run the server on', '3000')
    .action(async (options) => {
      process.env.PORT = options.port;
      await startServer();
    });

  await program.parseAsync(process.argv);
}

if (require.main === module) {
  main().catch(error => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}
