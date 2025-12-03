import React, { useEffect, useState } from 'react';
import { fetchLeagueData } from '../services/gemini';
import { LEAGUES, League, LeagueTableRow, ScorerRow } from '../types';
import { getRealImageUrl, getFallbackImage } from '../utils/image';
import { Loader2, RefreshCw, Trophy, Goal, Table2, TrendingUp } from 'lucide-react';

type StatType = 'table' | 'scorers';

export const LeagueView: React.FC = () => {
  const [selectedLeague, setSelectedLeague] = useState<League>(LEAGUES[0]);
  const [statType, setStatType] = useState<StatType>('table');
  
  const [tableData, setTableData] = useState<LeagueTableRow[]>([]);
  const [scorerData, setScorerData] = useState<ScorerRow[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setHasError(false);
    try {
      const data = await fetchLeagueData(selectedLeague.name, statType);
      
      if (!Array.isArray(data) || data.length === 0) {
        setHasError(true);
        if (statType === 'table') setTableData([]);
        else setScorerData([]);
      } else {
        if (statType === 'table') {
          setTableData(data as LeagueTableRow[]);
        } else {
          setScorerData(data as ScorerRow[]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch data", error);
      setHasError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedLeague, statType]);

  const renderForm = (form: string[] | undefined) => {
    if (!form || !Array.isArray(form)) return <span className="text-gray-600">-</span>;
    return (
      <div className="flex items-center justify-center gap-1">
        {form.slice(0, 5).map((result, idx) => {
          let colorClass = "bg-gray-600";
          if (result === 'W') colorClass = "bg-green-500";
          if (result === 'L') colorClass = "bg-red-500";
          if (result === 'D') colorClass = "bg-gray-400";
          
          return (
            <div 
              key={idx} 
              className={`w-2 h-2 rounded-full ${colorClass}`} 
              title={result === 'W' ? 'Win' : result === 'L' ? 'Loss' : 'Draw'}
            ></div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-6 overflow-hidden">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <Trophy className="text-yellow-500" />
            League Stats
          </h2>
          <p className="text-gray-400 text-sm mt-1">Live standings & form guides powered by AI.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
          <div className="flex bg-gray-800 p-1 rounded-lg border border-gray-700">
             <button 
               onClick={() => setStatType('table')}
               className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${statType === 'table' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
             >
               <Table2 size={16} /> Table
             </button>
             <button 
               onClick={() => setStatType('scorers')}
               className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${statType === 'scorers' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'}`}
             >
               <Goal size={16} /> Scorers
             </button>
          </div>

          <select 
            className="bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:border-blue-500 h-[42px]"
            value={selectedLeague.id}
            onChange={(e) => {
              const league = LEAGUES.find(l => l.id === e.target.value);
              if (league) setSelectedLeague(league);
            }}
          >
            {LEAGUES.map(l => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>

          <button 
            onClick={loadData}
            className="p-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-white transition-colors"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-900 rounded-xl border border-gray-800 shadow-inner custom-scrollbar relative">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-10 space-y-4">
            <Loader2 size={48} className="animate-spin text-blue-500" />
            <p className="text-gray-400 animate-pulse">Updating Stats...</p>
          </div>
        ) : (
          <div className="min-w-full inline-block align-middle">
             {statType === 'table' && tableData.length > 0 && (
               <table className="min-w-full divide-y divide-gray-800">
                 <thead className="bg-gray-800 sticky top-0 z-10">
                   <tr>
                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">#</th>
                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Team</th>
                     <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">PL</th>
                     <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider hidden sm:table-cell">W</th>
                     <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider hidden sm:table-cell">D</th>
                     <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider hidden sm:table-cell">L</th>
                     <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">GD</th>
                     <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase tracking-wider">PTS</th>
                     <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider hidden md:table-cell">Form</th>
                   </tr>
                 </thead>
                 <tbody className="bg-gray-900 divide-y divide-gray-800">
                   {tableData.map((row) => (
                     <tr key={row.team} className="hover:bg-gray-800/50 transition-colors group">
                       <td className={`px-4 py-3 whitespace-nowrap text-sm font-mono ${row.position <= 4 ? 'text-blue-400 font-bold border-l-2 border-blue-500' : row.position >= 18 ? 'text-red-400 border-l-2 border-red-500' : 'text-gray-500 border-l-2 border-transparent'}`}>
                         {row.position}
                       </td>
                       <td className="px-4 py-3 whitespace-nowrap">
                         <div className="flex items-center">
                           <div className="flex-shrink-0 h-8 w-8 relative">
                              {row.position === 1 && (
                                <div className="absolute -top-2 -right-1 text-yellow-500 drop-shadow-md">
                                  <Trophy size={10} fill="currentColor" />
                                </div>
                              )}
                             <img className="h-8 w-8 object-contain transition-transform group-hover:scale-110" src={getRealImageUrl(row.team, 'logo')} alt="" onError={(e) => e.currentTarget.src = getFallbackImage('logo')} />
                           </div>
                           <div className="ml-4">
                             <div className="text-sm font-bold text-white">{row.team}</div>
                           </div>
                         </div>
                       </td>
                       <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300 text-center">{row.played}</td>
                       <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-400 text-center hidden sm:table-cell">{row.won}</td>
                       <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-400 text-center hidden sm:table-cell">{row.drawn}</td>
                       <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-400 text-center hidden sm:table-cell">{row.lost}</td>
                       <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium text-center ${row.gd > 0 ? 'text-green-500' : row.gd < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                         {row.gd > 0 ? '+' : ''}{row.gd}
                       </td>
                       <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-white text-center">{row.points}</td>
                       <td className="px-4 py-3 whitespace-nowrap text-center hidden md:table-cell">
                         {renderForm(row.form)}
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             )}

             {statType === 'scorers' && scorerData.length > 0 && (
               <table className="min-w-full divide-y divide-gray-800">
                 <thead className="bg-gray-800 sticky top-0 z-10">
                   <tr>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Rank</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Player</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Team</th>
                     <th className="px-6 py-3 text-right text-xs font-bold text-white uppercase tracking-wider">Goals</th>
                   </tr>
                 </thead>
                 <tbody className="bg-gray-900 divide-y divide-gray-800">
                   {scorerData.map((row) => (
                     <tr key={row.player} className="hover:bg-gray-800/50 transition-colors">
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">#{row.rank}</td>
                       <td className="px-6 py-4 whitespace-nowrap">
                         <div className="flex items-center">
                           <div className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden bg-gray-800 border border-gray-700 shadow-md">
                             <img className="h-full w-full object-cover" src={getRealImageUrl(row.player, 'photo')} alt="" onError={(e) => e.currentTarget.src = getFallbackImage('photo')} />
                           </div>
                           <div className="ml-4">
                             <div className="text-sm font-bold text-white">{row.player}</div>
                           </div>
                         </div>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                         <div className="flex items-center gap-2">
                            <img className="h-5 w-5 object-contain opacity-70" src={getRealImageUrl(row.team, 'logo')} alt="" />
                            <span className="text-sm text-gray-300">{row.team}</span>
                         </div>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-right text-lg font-black text-green-400">{row.goals}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             )}
             
             {(!loading && hasError) && (
                <div className="flex flex-col items-center justify-center p-12 text-center text-gray-500">
                  <TrendingUp size={48} className="mb-4 text-gray-700" />
                  <p className="text-lg font-medium text-gray-300 mb-2">Data currently unavailable</p>
                  <p className="text-sm mb-6 max-w-sm">The AI agent couldn't fetch the latest data structure correctly. Please try refreshing.</p>
                  <button 
                    onClick={loadData}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-colors flex items-center gap-2"
                  >
                    <RefreshCw size={16} /> Retry Fetch
                  </button>
                </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};