import React, { useState } from 'react';
import { Sparkles, Loader } from 'lucide-react';
import { getCustomers, getTransactions } from '../services/db';
import { generateBusinessInsight } from '../services/geminiService';

const Analysis: React.FC = () => {
  const [insight, setInsight] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const customers = getCustomers();
    const transactions = getTransactions();
    
    // Safety check for API key presence in environment (simulated here since we can't control user's .env)
    if (!process.env.API_KEY) {
       setInsight("API Key configuration required. In a production environment, you would set process.env.API_KEY.");
       // We'll proceed to call the service which handles the error gracefully or mocks it if we were mocking.
    }

    const result = await generateBusinessInsight(customers, transactions);
    setInsight(result);
    setLoading(false);
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Sparkles className="text-purple-600" /> Business AI Insights
          </h1>
          <p className="text-gray-600">Use Gemini AI to analyze your sales trends, customer performance, and growth opportunities.</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6 border border-purple-100">
          {!insight && !loading && (
            <div className="text-center py-12">
              <button 
                onClick={handleGenerate}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2 mx-auto"
              >
                <Sparkles size={20} /> Generate Report
              </button>
              <p className="mt-4 text-sm text-gray-500">Analyzes customer ledger and transaction history.</p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-12 text-purple-600">
              <Loader className="animate-spin mb-4" size={32} />
              <p>Consulting Gemini...</p>
            </div>
          )}

          {insight && (
            <div className="prose max-w-none">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Analysis Report</h3>
              <div className="bg-gray-50 p-6 rounded-lg border text-gray-800 whitespace-pre-wrap leading-relaxed">
                {insight}
              </div>
              <button onClick={() => setInsight('')} className="mt-4 text-sm text-gray-500 underline">Clear</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analysis;