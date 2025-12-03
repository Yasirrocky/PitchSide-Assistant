import React, { useEffect, useState } from 'react';
import { streamFootballContent } from '../services/gemini';
import { MarkdownRenderer } from '../utils/markdown';
import { GroundingChunk } from '../types';
import { Loader2, Activity, BrainCircuit, Users2 } from 'lucide-react';

export const MatchCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'live' | 'results' | 'fixtures' | 'predict' | 'lineups'>('live');
  const [data, setData] = useState<string>('');
  const [sources, setSources] = useState<GroundingChunk[] | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  // For prediction/lineup tab
  const [matchInput, setMatchInput] = useState('');

  const fetchData = async (type: 'live' | 'results' | 'fixtures') => {
    setLoading(true);
    setData('');
    setSources(undefined);
    
    let prompt = "";
    if (type === 'live') {
      prompt = "List all major football matches being played RIGHT NOW (Live Scores). If no big games are live, list the most recent finished games from today. Format as a list or table. Include minutes played if live.";
    } else if (type === 'results') {
      prompt = "List the key football match results from the top 5 European leagues from the last 24 hours. Format as a clean markdown table with Home, Score, Away, League.";
    } else {
      prompt = "List the most exciting upcoming football matches for the next 48 hours in major leagues. Format as a table with Date, Time (UTC), Match, League.";
    }

    try {
      await streamFootballContent(prompt, (text, chunks) => {
        setData(text);
        if (chunks) setSources(chunks);
      }, false);
    } catch (e) {
      setData("Error loading data.");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomQuery = async () => {
    if (!matchInput) return;
    setLoading(true);
    setData('');
    setSources(undefined);

    let prompt = "";
    // Only use Thinking Mode for predictions
    const useThinking = activeTab === 'predict';
    
    if (activeTab === 'predict') {
       prompt = `Analyze the upcoming match between ${matchInput}. 
       Consider recent form (last 5 games), injuries, head-to-head history, and home/away advantage.
       Provide a predicted scoreline and a % chance of winning for each team.
       Format as a structured analysis.`;
    } else if (activeTab === 'lineups') {
       prompt = `Get the confirmed (or predicted if confirmed not available) starting lineups for the match ${matchInput}. 
       List the Home Team XI and Away Team XI clearly. 
       Also list key substitutes and any major injuries/suspensions. 
       Format nicely using Markdown lists.`;
    }

    try {
      await streamFootballContent(prompt, (text, chunks) => {
        setData(text);
        if (chunks) setSources(chunks);
      }, useThinking);
    } catch (e) {
      setData(`Error generating ${activeTab === 'predict' ? 'prediction' : 'lineups'}.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'predict' && activeTab !== 'lineups') {
      fetchData(activeTab);
    } else {
      setData(''); 
      setMatchInput('');
    }
  }, [activeTab]);

  return (
    <div className="h-full flex flex-col p-4 md:p-6">
       <div className="mb-6">
        <h2 className="text-3xl font-bold text-white flex items-center gap-2">
          {activeTab === 'predict' ? <BrainCircuit className="text-pink-500" /> : 
           activeTab === 'lineups' ? <Users2 className="text-orange-500" /> : 
           <Activity className="text-red-500" />}
          
          {activeTab === 'predict' ? 'AI Match Predictor' : 
           activeTab === 'lineups' ? 'Team Lineups' : 
           'Match Center'}
        </h2>
        <div className="flex gap-2 mt-4 bg-gray-800 p-1 rounded-lg w-fit flex-wrap">
          {(['live', 'results', 'fixtures', 'predict', 'lineups'] as const).map((tab) => (
             <button
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                 activeTab === tab 
                 ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg' 
                 : 'text-gray-400 hover:text-white hover:bg-gray-700'
               }`}
             >
               {tab.charAt(0).toUpperCase() + tab.slice(1)}
             </button>
          ))}
        </div>
      </div>

      {(activeTab === 'predict' || activeTab === 'lineups') && (
        <div className="mb-4 flex gap-2">
          <input 
            type="text" 
            value={matchInput}
            onChange={(e) => setMatchInput(e.target.value)}
            placeholder="Enter match (e.g. Liverpool vs Man City)"
            className={`flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white outline-none ${activeTab === 'predict' ? 'focus:border-pink-500' : 'focus:border-orange-500'}`}
          />
          <button 
            onClick={handleCustomQuery}
            disabled={!matchInput || loading}
            className={`${activeTab === 'predict' ? 'bg-pink-600 hover:bg-pink-500' : 'bg-orange-600 hover:bg-orange-500'} text-white px-6 py-2 rounded-lg font-bold transition-colors disabled:opacity-50`}
          >
            {activeTab === 'predict' ? 'Predict' : 'Get Lineups'}
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto bg-gray-900 rounded-xl border border-gray-800 p-6 shadow-inner custom-scrollbar relative">
        {!data && !loading && (activeTab === 'predict' || activeTab === 'lineups') && (
           <div className="text-center text-gray-500 mt-10">
             {activeTab === 'predict' ? (
               <BrainCircuit size={48} className="mx-auto mb-4 opacity-20" />
             ) : (
               <Users2 size={48} className="mx-auto mb-4 opacity-20" />
             )}
             <p>Enter a match above to get {activeTab === 'predict' ? 'an AI prediction' : 'starting XIs'}.</p>
           </div>
        )}

        {data ? (
           <div className="prose prose-invert max-w-none">
              {loading && activeTab === 'predict' && !data && (
                <div className="flex items-center gap-2 text-pink-400 mb-4 animate-pulse">
                  <BrainCircuit size={18} />
                  <span className="text-sm font-medium">Analyzing tactics & form...</span>
                </div>
              )}
              <MarkdownRenderer content={data} />
              {loading && <span className="inline-block w-2 h-4 ml-1 bg-green-500 animate-pulse"></span>}
              {sources && (
                <div className="mt-8 text-xs text-gray-600 pt-4 border-t border-gray-800">
                  Data sourced from Google Search via Gemini
                </div>
              )}
           </div>
        ) : (
          loading && (
             <div className="flex flex-col items-center justify-center h-full space-y-3">
               <Loader2 size={40} className="animate-spin text-green-500" />
               <p className="text-gray-500 animate-pulse">Fetching information...</p>
             </div>
          )
        )}
      </div>
    </div>
  );
};