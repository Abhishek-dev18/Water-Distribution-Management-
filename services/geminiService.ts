
import { GoogleGenAI } from "@google/genai";
import { Customer, Transaction, calculateDailyCost } from "../types";

// Helper to format data for the AI
const formatDataForAI = (customers: Customer[], transactions: Transaction[]) => {
  const summary = customers.map(c => {
    const customerTx = transactions.filter(t => t.customerId === c.id);
    const totalRevenue = customerTx.reduce((acc, t) => acc + calculateDailyCost(t, c), 0);
    const totalJars = customerTx.reduce((acc, t) => acc + t.jarsDelivered, 0);
    return {
      name: c.name,
      area: c.area,
      totalRevenue,
      totalJars,
      transactionsCount: customerTx.length
    };
  });
  return JSON.stringify(summary);
};

export const generateBusinessInsight = async (customers: Customer[], transactions: Transaction[]): Promise<string> => {
  // Use process.env.API_KEY as the exclusive source for the API key
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return "API Key not found. Please ensure process.env.API_KEY is set.";
  }

  try {
    // Initialize GoogleGenAI with a named parameter object
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const dataContext = formatDataForAI(customers, transactions);
    
    const prompt = `
      You are a business analyst for a water jar supply company.
      Here is the summary data of customers and their transaction history in JSON format:
      ${dataContext}

      Please provide a concise analysis (max 200 words) focusing on:
      1. Who are the top performing customers by revenue?
      2. Which area has the highest demand?
      3. Any anomalies or suggestions for business growth.
      
      Keep the tone professional and helpful.
    `;

    // Use gemini-3-flash-preview for basic text tasks like this analysis
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    // Directly access the .text property of the GenerateContentResponse object
    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Failed to generate insights. Please check your network or API key.";
  }
};
