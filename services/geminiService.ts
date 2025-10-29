
import { GoogleGenAI, Chat } from "@google/genai";
import type { DataRecord } from '../types';

// This function must be defined in a file that is not a .tsx module
// to avoid potential build issues, but for this self-contained app it's fine.
function getApiKey(): string {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable not set.");
  }
  return apiKey;
}

const ai = new GoogleGenAI({ apiKey: getApiKey() });

function prepareDataForPrompt(data: DataRecord[]): string {
    if (data.length === 0) {
        return "The CSV file is empty.";
    }

    const headers = Object.keys(data[0]).join(', ');
    const numRows = data.length;
    const numCols = Object.keys(data[0]).length;
    
    let sampleRows = data.slice(0, 5).map(row => 
        Object.values(row).map(val => (val === null || val === undefined) ? '' : `"${String(val).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    let summary = `The user has uploaded a CSV file with ${numRows} rows and ${numCols} columns.\n`;
    summary += `The column headers are: ${headers}\n\n`;
    summary += `Here are the first 5 rows of the data:\n${sampleRows}\n\n`;
    
    return summary;
}

const createChat = (): Chat => {
    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: `You are an expert data analyst. Your task is to answer questions about a CSV dataset provided by the user.
- First, I will provide a summary of the dataset, including headers and a few sample rows.
- Then, the user will ask a question.
- Your answer must be based *only* on the data provided.
- If the question cannot be answered from the data, say so clearly.
- Be concise and clear in your explanations.
- When you mention a column name, wrap it in backticks, like \`column_name\`.
- Provide answers in Markdown format.
- Do not invent data or make assumptions beyond what is given.`,
        },
    });
};

const chat = createChat();

export async function askQuestionAboutData(question: string, data: DataRecord[]) {
    const dataContext = prepareDataForPrompt(data);
    const fullPrompt = `${dataContext}User's Question: "${question}"`;

    // For a stateless approach or to ensure fresh context for each question, you could do this:
    // const chat = createChat();
    // await chat.sendMessage({ message: dataContext });
    // const stream = await chat.sendMessageStream({ message: `User's Question: "${question}"`});
    
    // For a conversational approach (the current implementation):
    const stream = await chat.sendMessageStream({ message: fullPrompt });
    return stream;
}
