import { User } from '../types';
import { GoogleGenAI, GenerateContentResponse, Content } from '@google/genai';

/**
 * Runs a conversation with the Gemini AI model.
 * @param history - The conversation history.
 * @param newMessage - The user's new message.
 * @param user - The current user.
 * @param language - The user's language.
 * @param isPremium - The user's premium status.
 * @returns A promise that resolves to an object with the AI's text response.
 */
export async function runAiChat(
    history: Content[], 
    newMessage: string, 
    user: User, 
    language: string, 
    isPremium: boolean
): Promise<{ text: string }> {
    const apiKey = (import.meta as any).env?.VITE_GOOGLE_API_KEY || '';
    if (!apiKey) {
        return { text: "AI is not configured. Please set an API key." };
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // The history from TomChatWidget already includes the latest user message.
    const contents = history;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: isPremium ? 'gemini-2.5-pro' : 'gemini-2.5-flash',
            contents: contents,
            config: {
                systemInstruction: `You are Tom, a friendly and helpful AI financial assistant from Venty. Your goal is to provide concise, actionable financial advice.
The user's language is ${language}.
The user is ${isPremium ? 'a premium user' : 'a free user'}.
The user's name is ${user.name}.
Keep your responses encouraging and easy to understand.
Do not mention that you are an AI. You are Tom.
Use Markdown for formatting, especially for lists and bolding key terms.
Today's date is ${new Date().toDateString()}.`,
                ...(isPremium && {
                    thinkingConfig: { thinkingBudget: 32768 }
                })
            }
        });

        return { text: response.text };

    } catch (error) {
        console.error("AI chat error:", error);
        return { text: "I'm having trouble connecting to my brain right now. Please try again in a moment." };
    }
}
