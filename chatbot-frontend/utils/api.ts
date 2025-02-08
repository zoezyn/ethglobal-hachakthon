import axios from 'axios';
import { Message } from '@/types';

const API_URL = 'http://localhost:3000';

export const sendMessage = async (message: string) => {
  try {
    const response = await axios.post(`${API_URL}/chat`, {
      message
    });

    const botResponses = response.data.data.responses.map((resp: any) => ({
      role: resp.type === 'user' ? 'user' : 'assistant',
      content: resp.content
    }));

    return botResponses;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}; 