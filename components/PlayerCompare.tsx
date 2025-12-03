import React, { useState, useRef, useEffect } from 'react';
import { streamFootballContent } from '../services/gemini';
import { MarkdownRenderer } from '../utils/markdown';
import { GroundingChunk } from '../types';
import { getRealImageUrl, getFallbackImage } from '../utils/image';
import { Users, Loader2, Sparkles, Globe, Search, BrainCircuit, Check } from 'lucide-react';

const POPULAR_PLAYERS = [
  // Current Superstars
  "Erling Haaland", "Kylian Mbappé", "Lionel Messi", "Cristiano Ronaldo", "Kevin De Bruyne", 
  "Jude Bellingham", "Harry Kane", "Mohamed Salah", "Vinícius Júnior", "Bukayo Saka", 
  "Rodri", "Martin Ødegaard", "Declan Rice", "Bruno Fernandes", "Robert Lewandowski", 
  "Antoine Griezmann", "Lamine Yamal", "Phil Foden", "Cole Palmer", "Virgil van Dijk",
  "William Saliba", "Ruben Dias", "Trent Alexander-Arnold", "Son Heung-min", "Victor Osimhen", 
  "Lautaro Martínez", "Pedri", "Gavi", "Jamal Musiala", "Florian Wirtz", "Leroy Sané", 
  "Joshua Kimmich", "Alisson Becker", "Ederson", "Thibaut Courtois", "Marc-André ter Stegen", 
  "Federico Valverde", "Eduardo Camavinga", "Aurélien Tchouaméni", "Rodrygo", "Julian Alvarez",
  "Bernardo Silva", "Ilkay Gündogan", "Frenkie de Jong", "Ronald Araujo", "Ousmane Dembélé",
  "Rafael Leão", "Theo Hernández", "Mike Maignan", "Nicolo Barella", "Khvicha Kvaratskhelia",
  "Marcus Rashford", "Bruno Guimarães", "Alexander Isak", "Ollie Watkins", "James Maddison",
  "Endrick", "Arda Güler", "Kobbie Mainoo", "Alejandro Garnacho", "Darwin Núñez", "Luis Díaz",
  
  // Legends
  "Pelé", "Diego Maradona", "Johan Cruyff", "Zinedine Zidane", "Ronaldo Nazário",
  "Ronaldinho", "Thierry Henry", "Paolo Maldini", "Franz Beckenbauer", "Gerd Müller",
  "Marco van Basten", "Michel Platini", "Alfredo Di Stéfano", "Ferenc Puskás", "Eusébio",
  "Lev Yashin", "Xavi", "Andrés Iniesta", "Sergio Busquets", "Zlatan Ibrahimović",
  "Wayne Rooney", "Steven Gerrard", "Frank Lampard", "Paul Scholes", "Ryan Giggs",
  "Sergio Ramos", "Gerard Piqué", "Carles Puyol", "Iker Casillas", "Gianluigi Buffon",
  "Andrea Pirlo", "Francesco Totti", "Alessandro Del Piero", "Roberto Baggio", "Gabriel Batistuta",
  "Dennis Bergkamp", "Patrick Vieira", "Roy Keane", "Eric Cantona", "George Best",
  "Bobby Charlton", "Kenny Dalglish", "Ian Rush", "Luis Suárez (URU)", "Neymar Jr",
  "Gareth Bale", "Eden Hazard", "Karim Benzema", "Luka Modrić", "Toni Kroos", "Manuel Neuer",
  "Kaká", "Rivaldo", "Romário", "Cafu", "Roberto Carlos", "Didier Drogba", "Samuel Eto'o",
  "Philipp Lahm", "Bastian Schweinsteiger", "Arjen Robben", "Franck Ribéry", "Petr Čech"
];

const PlayerInput: React.FC<{
  label: string;
  value: string;
  onChange: (val: string) => void;
}> = ({ label, value, onChange }) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    
    if (val.length > 1) {
      // Sort matches: starts with > includes
      const filtered = POPULAR_PLAYERS.filter(p => 
        p.toLowerCase().includes(val.toLowerCase())
      ).sort((a, b) => {
        const aStarts = a.toLowerCase().startsWith(val.toLowerCase());
        const bStarts = b.toLowerCase().startsWith(val.toLowerCase());
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return 0;
      }).slice(0, 6); // Limit to top 6 suggestions
      
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSelect = (name: string) => {
    onChange(name);
    setShowSuggestions(false);
  };

  return (
    <div className="flex-1 w-full relative group" ref={wrapperRef}>
      <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">{label}</label>
      
      {/* Player Image Preview if name is entered */}
      {value.length > 3 && (
        <div className="absolute -top-12 left-0 w-12 h-12 rounded-full border-2 border-gray-700 bg-gray-800 overflow-hidden shadow-lg z-10 transition-all opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 animate-in fade-in zoom-in">
          <img 
             src={getRealImageUrl(value, 'photo')} 
             className="w-full h-full object-cover" 
             onError={(e) => e.currentTarget.src = getFallbackImage('photo')}
             alt="preview"
          />
        </div>
      )}

      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleInput}
          onFocus={() => {
            if (value.length > 1) {
              setSuggestions(POPULAR_PLAYERS.filter(p => p.toLowerCase().includes(value.toLowerCase())).slice(0,6));
              setShowSuggestions(true);
            }
          }}
          placeholder={`e.g. ${label === "Player 1" ? "Lionel Messi" : "Cristiano Ronaldo"}`}
          className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 pl-10 text-white focus:border-purple-500 outline-none transition-colors"
          autoComplete="off"
        />
        <Search className="absolute left-3 top-3.5 text-gray-500" size={16} />
      </div>
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-20 w-full bg-gray-900 border border-gray-700 rounded-lg mt-2 max-h-64 overflow-y-auto shadow-2xl animate-in slide-in-from-top-2 duration-200">
           <div className="p-2">
            {suggestions.map((player) => (
                <div 
                key={player}
                onClick={() => handleSelect(player)}
                className="group flex items-center gap-3 p-2 hover:bg-gray-800 rounded-md cursor-pointer transition-colors"
                >
                <div className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 overflow-hidden flex-shrink-0 relative">
                    {/* Placeholder skeleton */}
                    <div className="absolute inset-0 bg-gray-800 animate-pulse"></div>
                    <img 
                        src={getRealImageUrl(player, 'photo')} 
                        className="w-full h-full object-cover relative z-10" 
                        loading="lazy"
                        onError={(e) => e.currentTarget.src = getFallbackImage('photo')}
                        alt={player}
                    />
                </div>
                <span className="text-sm font-medium text-gray-200 group-hover:text-white">{player}</span>
                </div>
            ))}
           </div>
           {suggestions.length === 6 && (
             <div className="px-3 py-2 bg-gray-950/50 text-[10px] text-gray-500 text-center border-t border-gray-800">
                Keep typing for more results...
             </div>
           )}
        </div>
      )}
    </div>
  );
};

export const PlayerCompare: React.FC = () => {
  const [player1, setPlayer1] = useState('');
  const [player2, setPlayer2] = useState('');
  const [result, setResult] = useState('');
  const [sources, setSources] = useState<GroundingChunk[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  const handleCompare = async () => {
    if (!player1 || !player2 || isLoading) return;

    setIsLoading(true);
    setResult('');
    setSources(undefined);

    const prompt = `Create a detailed and comprehensive statistical comparison between ${player1} and ${player2} for the current season (or most recent completed season).
    
    Format the output as follows:
    1. **Player Profiles**: A brief introduction of both players.
    2. **Detailed Stat Table**: A Markdown Table comparing comprehensive stats. You MUST include:
       - General: Matches Played, Minutes
       - Attack: Goals, Assists, Shots per Game, Big Chances Created
       - Passing/Technical: Passing Accuracy (%), Key Passes, Dribbling Success Rate (%), Successful Dribbles
       - Defense: Tackles per Game, Interceptions, Clearances, Duels Won (%)
    3. **Key Insights**: Analysis of their strengths based on the data.
    4. **Verdict**: Who is performing better overall?
    
    Use Google Search to ensure the stats are up to date and accurate.`;

    try {
      await streamFootballContent(prompt, (text, groundingChunks) => {
        setResult(text);
        if (groundingChunks) setSources(groundingChunks);
      }, true);
    } catch (e) {
      setResult("Failed to generate comparison. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-6 overflow-hidden">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-white flex items-center gap-2">
          <Users className="text-purple-500" />
          Compare Players
        </h2>
        <p className="text-gray-400 text-sm mt-1">Deep statistical H2H analysis powered by Gemini 3 Pro.</p>
      </div>

      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg mb-6 flex flex-col md:flex-row gap-4 items-start md:items-end z-20 relative">
        
        <PlayerInput 
          label="Player 1" 
          value={player1} 
          onChange={setPlayer1} 
        />
        
        <div className="flex items-center justify-center pb-3 text-gray-500 font-bold self-center md:self-end">VS</div>

        <PlayerInput 
          label="Player 2" 
          value={player2} 
          onChange={setPlayer2} 
        />

        <button
          onClick={handleCompare}
          disabled={!player1 || !player2 || isLoading}
          className="w-full md:w-auto bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 h-[46px]"
        >
          {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
          Compare
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-900 rounded-xl border border-gray-800 p-6 shadow-inner custom-scrollbar relative z-10">
        {result && (
            <div className="flex justify-center items-center gap-12 mb-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="text-center">
                    <div className="w-24 h-24 rounded-full border-4 border-blue-600 overflow-hidden mx-auto mb-2 shadow-2xl">
                        <img src={getRealImageUrl(player1, 'photo')} className="w-full h-full object-cover" onError={(e) => e.currentTarget.src = getFallbackImage('photo')} />
                    </div>
                    <p className="font-bold text-lg">{player1}</p>
                </div>
                <div className="text-2xl font-black text-gray-700">VS</div>
                <div className="text-center">
                    <div className="w-24 h-24 rounded-full border-4 border-purple-600 overflow-hidden mx-auto mb-2 shadow-2xl">
                        <img src={getRealImageUrl(player2, 'photo')} className="w-full h-full object-cover" onError={(e) => e.currentTarget.src = getFallbackImage('photo')} />
                    </div>
                    <p className="font-bold text-lg">{player2}</p>
                </div>
            </div>
        )}

        {!result && !isLoading ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-600">
            <Users size={64} className="mb-4 opacity-20" />
            <p className="text-lg font-medium mt-4">Select two players to begin analysis</p>
            <p className="text-sm">We'll use advanced reasoning to compare stats and playing styles.</p>
          </div>
        ) : (
          <div className="prose prose-invert max-w-none">
            {isLoading && !result && (
               <div className="flex items-center gap-2 text-purple-400 mb-4 animate-pulse">
                 <BrainCircuit size={18} />
                 <span className="text-sm font-medium">Analyzing data & reasoning...</span>
               </div>
            )}
            <MarkdownRenderer content={result} />
            
            {sources && sources.length > 0 && (
              <div className="mt-8 border-t border-gray-800 pt-4">
                 <p className="text-xs text-gray-500 uppercase font-bold mb-2">Data Sources</p>
                 <div className="flex flex-wrap gap-2">
                    {sources.map((c, i) => c.web && (
                      <a key={i} href={c.web.uri} target="_blank" className="text-xs text-blue-400 hover:underline flex items-center gap-1">
                        <Globe size={10} />
                        {c.web.title}
                      </a>
                    ))}
                 </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};