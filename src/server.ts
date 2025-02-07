import express from 'express';
import cors from 'cors';
import { initializeAgent } from './index';
import { HumanMessage } from '@langchain/core/messages';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Request body type   
interface ChatRequest {
    message: string;
}

async function startServer() {
    try {
        const { agent, config } = await initializeAgent();

        app.post('/chat', async (req, res) => {
            try {
                const { message } = req.body as ChatRequest;

                if (!message || typeof message !== 'string') {
                    return res.status(400).json({
                        error: 'Invalid request body. Expected: { "message": "your message here" }'
                    });
                }

                const responses: any[] = [];
                const stream = await agent.stream({
                    messages: [new HumanMessage(message)]
                }, config);

                for await (const chunk of stream) {
                    if ("agent" in chunk) {
                        responses.push({
                            type: 'agent',
                            content: chunk.agent.messages[0].content
                        });
                    } else if ("tools" in chunk) {
                        responses.push({
                            type: 'tool',
                            content: chunk.tools.messages[0].content
                        });
                    }
                }

                res.json({
                    status: 'success',
                    data: {
                        responses,
                        originalMessage: message
                    }
                });
            } catch (error) {
                console.error('Error processing chat:', error);
                res.status(500).json({
                    status: 'error',
                    error: 'Internal server error',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });

        app.get('/health', (_, res) => {
            res.json({
                status: 'ok',
                timestamp: new Date().toISOString()
            });
        });

        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
            console.log(`Health check: http://localhost:${port}/health`);
            console.log(`Chat endpoint: http://localhost:${port}/chat`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

export { startServer }; 