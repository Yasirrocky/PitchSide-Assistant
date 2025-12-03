import React, { useEffect, useState } from 'react';
import { fetchAgencyDashboardData, streamFootballContent } from '../services/gemini';
import { DashboardData, DashboardNews, GroundingChunk } from '../types';
import { getRealImageUrl, getFallbackImage } from '../utils/image';
import { Loader2, TrendingUp, Search, Calendar, ChevronRight, Zap, RefreshCcw, X, Clock, Newspaper } from 'lucide-react';
import { MarkdownRenderer } from '../utils/markdown';

interface DashboardProps {
  onNavigate: (view: any) => void;
}

// News Reader Modal Component
const ArticleModal: React.FC<{ article: DashboardNews | null; onClose: () => void }> = ({ article, onClose }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [sources, setSources] = useState<GroundingChunk[]>([]);

  useEffect(() => {
    if (article) {
      setLoading(true);
      setContent('');
      setSources([]);
      
      const prompt = `Write a comprehensive news article about: "${article.title}". 
      Context: ${article.summary}. 
      Include recent quotes, background context, and implications. 
      Format nicely with Markdown headers. Use Google Search for the latest details.`;

      streamFootballContent(prompt, (text, chunks) => {
        setContent(text);
        if (chunks) setSources(chunks);
      }).finally(() => setLoading(false));
    }
  }, [article]);

  if (!article) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 w-full max-w-4xl h-[90vh] rounded-2xl shadow-2xl border border-gray-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header Image */}
        <div className="relative h-64 flex-shrink-0">
          <img 
            src={getRealImageUrl(article.imageSearchQuery)} 
            className="w-full h-full object-cover"
            onError={(e) => e.currentTarget.src = getFallbackImage('photo')}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-md transition-colors"
          >
            <X size={24} />
          </button>
          <div className="absolute bottom-6 left-6 right-6">
            <span className="inline-block px-3 py-1 bg-blue-600 text-white text-xs font-bold uppercase rounded mb-3 shadow-lg">
              {article.category}
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight shadow-black drop-shadow-lg">
              {article.title}
            </h1>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
          {content ? (
            <div className="prose prose-invert prose-lg max-w-none">
              <MarkdownRenderer content={content} />
              {loading && <span className="inline-block w-2 h-4 ml-1 bg-green-500 animate-pulse"></span>}
              
              {sources.length > 0 && (
                 <div className="mt-12 pt-6 border-t border-gray-800 text-sm text-gray-500">
                   <p className="font-bold mb-2 uppercase tracking-widest text-xs">Sources</p>
                   <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                     {sources.map((s, i) => s.web && (
                       <li key={i}>
                         <a href={s.web.uri} target="_blank" className="hover:text-blue-400 truncate block border-l-2 border-gray-700 pl-2 hover:border-blue-500 transition-colors">
                           {s.web.title}
                         </a>
                       </li>
                     ))}
                   </ul>
                 </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 animate-pulse">
               <div className="h-4 bg-gray-800 rounded w-3/4"></div>
               <div className="h-4 bg-gray-800 rounded w-full"></div>
               <div className="h-4 bg-gray-800 rounded w-full"></div>
               <div className="h-4 bg-gray-800 rounded w-5/6"></div>
               <div className="h-32 bg-gray-800 rounded w-full mt-8"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<DashboardNews | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const agencyData = await fetchAgencyDashboardData();
      setData(agencyData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Auto-refresh every 2 minutes
    const interval = setInterval(loadData, 120000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full flex flex-col bg-gray-950 relative">
      <ArticleModal article={selectedArticle} onClose={() => setSelectedArticle(null)} />

      {/* 1. Header & Match Strip (The "OneFootball" Header) */}
      <div className="bg-gray-900 border-b border-gray-800 flex-shrink-0 relative z-10 shadow-xl">
        <div className="p-4 md:px-6 md:py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="w-2 h-6 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.6)]"></span>
            Matchday Center
          </h1>
          <div className="flex items-center gap-4">
             <button onClick={loadData} disabled={loading} className="text-gray-400 hover:text-white transition-colors">
               <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
             </button>
             <button onClick={() => onNavigate('matches')} className="text-xs font-bold text-blue-400 uppercase tracking-wider hover:text-blue-300">
               All Matches
             </button>
          </div>
        </div>
        
        {/* Horizontal Match Scroll */}
        <div className="overflow-x-auto pb-4 px-4 md:px-6 scrollbar-hide flex gap-4 snap-x">
          {loading && !data ? (
            // Skeletons
            [1,2,3,4].map(i => (
              <div key={i} className="flex-shrink-0 w-72 h-24 bg-gray-800 rounded-xl animate-pulse"></div>
            ))
          ) : data?.matches.length === 0 ? (
             <div className="text-gray-500 text-sm italic p-4 w-full text-center border border-dashed border-gray-800 rounded-lg">No key matches right now. Check "All Matches".</div>
          ) : (
            data?.matches.map((match, i) => (
              <div key={i} className="flex-shrink-0 w-72 bg-gray-800 rounded-xl border border-gray-700/50 p-3 hover:border-gray-600 transition-colors shadow-lg relative overflow-hidden group snap-start cursor-pointer hover:bg-gray-800/80">
                <div className="flex justify-between items-start mb-3">
                   <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-black/20 px-1.5 py-0.5 rounded">{match.league}</span>
                      {match.status === 'LIVE' && match.minute && (
                        <span className="text-[10px] font-mono text-green-400 animate-pulse">{match.minute}</span>
                      )}
                   </div>
                   
                   {match.status === 'LIVE' && (
                     <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.4)]">
                       <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> LIVE
                     </span>
                   )}
                   {match.status === 'FT' && <span className="text-[10px] font-bold text-gray-500 bg-gray-700/50 px-1.5 py-0.5 rounded">FT</span>}
                   {match.status === 'UPCOMING' && <span className="text-[10px] font-bold text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded">{match.score.includes(':') ? match.score : 'Upcoming'}</span>}
                </div>
                
                <div className="flex justify-between items-center px-1">
                   {/* Home */}
                   <div className="flex flex-col items-center gap-2 w-1/3">
                      <img 
                        src={getRealImageUrl(match.homeTeam, 'logo')} 
                        alt={match.homeTeam} 
                        className="w-10 h-10 object-contain drop-shadow-md transition-transform group-hover:scale-110"
                        onError={(e) => (e.currentTarget.src = getFallbackImage('logo'))}
                      />
                      <span className="text-xs font-semibold text-center leading-tight truncate w-full text-gray-300">{match.homeTeam}</span>
                   </div>

                   {/* Score */}
                   <div className="flex flex-col items-center w-1/3 z-10">
                      <span className="text-2xl font-black text-white tracking-tighter bg-black/20 px-3 py-1 rounded-lg tabular-nums">
                         {match.status === 'UPCOMING' ? 'VS' : match.score}
                      </span>
                   </div>

                   {/* Away */}
                   <div className="flex flex-col items-center gap-2 w-1/3">
                      <img 
                        src={getRealImageUrl(match.awayTeam, 'logo')} 
                        alt={match.awayTeam} 
                        className="w-10 h-10 object-contain drop-shadow-md transition-transform group-hover:scale-110"
                        onError={(e) => (e.currentTarget.src = getFallbackImage('logo'))}
                      />
                      <span className="text-xs font-semibold text-center leading-tight truncate w-full text-gray-300">{match.awayTeam}</span>
                   </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 2. Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
        
        {/* Research Banner */}
        <div className="bg-gradient-to-r from-green-900 to-emerald-900 rounded-2xl p-6 mb-8 relative overflow-hidden flex items-center justify-between border border-green-800 shadow-xl group">
           <div className="relative z-10 max-w-lg">
             <h2 className="text-2xl font-bold text-white mb-2">PitchSide Intelligence</h2>
             <p className="text-green-100 text-sm mb-4">Powered by Gemini 3.0 Pro. Ask about tactics, history, or detailed player comparisons.</p>
             <button 
               onClick={() => onNavigate('research')}
               className="bg-white text-green-900 px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-green-50 hover:scale-105 transition-all flex items-center gap-2 shadow-lg"
             >
               <Search size={16} /> Open Analyst Chat
             </button>
           </div>
           <Zap className="text-green-500/20 absolute -right-4 -bottom-4 w-48 h-48 rotate-12 transition-transform duration-1000 group-hover:rotate-45 group-hover:scale-110" />
        </div>

        {/* News Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Feed */}
          <div className="lg:col-span-2">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="text-blue-500" /> 
              Top Stories
            </h3>

            {loading && !data ? (
              <div className="flex flex-col gap-4">
                 {[1,2,3].map(i => (
                   <div key={i} className="h-32 bg-gray-800 rounded-xl animate-pulse"></div>
                 ))}
              </div>
            ) : (
              <div className="space-y-4">
                 {data?.news.map((item, idx) => (
                   <div 
                      key={idx} 
                      onClick={() => setSelectedArticle(item)}
                      className="group bg-gray-900 hover:bg-gray-800/80 rounded-xl border border-gray-800 overflow-hidden transition-all duration-300 flex flex-col sm:flex-row h-auto sm:h-40 cursor-pointer shadow-md hover:shadow-xl hover:-translate-y-1"
                   >
                      {/* Real Image Fetcher */}
                      <div className="sm:w-48 h-48 sm:h-full relative flex-shrink-0 overflow-hidden">
                        <img 
                          src={getRealImageUrl(item.imageSearchQuery)} 
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          onError={(e) => (e.currentTarget.src = getFallbackImage('photo'))}
                        />
                        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-white uppercase border border-white/10">
                          {item.category}
                        </div>
                      </div>
                      
                      <div className="p-4 flex flex-col justify-between flex-1">
                         <div>
                           <h4 className="text-lg font-bold text-white leading-tight mb-2 group-hover:text-blue-400 transition-colors line-clamp-2">
                             {item.title}
                           </h4>
                           <p className="text-gray-400 text-xs sm:text-sm line-clamp-2">
                             {item.summary}
                           </p>
                         </div>
                         <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center gap-1.5">
                               <Clock size={12} />
                               <span>{item.timestamp}</span>
                            </div>
                            <span className="flex items-center gap-1 text-blue-400 font-medium group-hover:underline">
                               Read Article <ChevronRight size={14} />
                            </span>
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
             <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 sticky top-6 shadow-lg">
                <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                  <Calendar size={18} className="text-purple-500" />
                  Explore Stats
                </h4>
                <div className="space-y-2">
                  <button onClick={() => onNavigate('leagues')} className="w-full bg-gray-800 hover:bg-gray-700 p-3 rounded-lg text-left text-sm text-gray-200 transition-colors flex justify-between items-center group">
                    Premier League Table
                    <ChevronRight size={14} className="text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </button>
                  <button onClick={() => onNavigate('leagues')} className="w-full bg-gray-800 hover:bg-gray-700 p-3 rounded-lg text-left text-sm text-gray-200 transition-colors flex justify-between items-center group">
                    La Liga Top Scorers
                    <ChevronRight size={14} className="text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </button>
                  <button onClick={() => onNavigate('matches')} className="w-full bg-gray-800 hover:bg-gray-700 p-3 rounded-lg text-left text-sm text-gray-200 transition-colors flex justify-between items-center group">
                    All Fixtures
                    <ChevronRight size={14} className="text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </button>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-800">
                   <h4 className="font-bold text-white mb-4 text-sm flex items-center gap-2">
                     <Newspaper size={16} className="text-orange-500" />
                     Editor's Pick
                   </h4>
                   <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 p-4 rounded-lg border border-blue-800/30">
                      <p className="text-xs text-gray-300 mb-3">
                         "The Tactical Evolution of Modern Full-backs" - deep dive analysis.
                      </p>
                      <button onClick={() => onNavigate('research')} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg text-xs transition-colors">
                        Ask AI to Summarize
                      </button>
                   </div>
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};