import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Trophy, 
  Activity, 
  Search, 
  Menu, 
  X,
  Users,
  ShieldCheck
} from 'lucide-react';
import { View } from './types';
import { Dashboard } from './components/Dashboard';
import { LeagueView } from './components/LeagueView';
import { MatchCenter } from './components/MatchCenter';
import { ResearchChat } from './components/ResearchChat';
import { PlayerCompare } from './components/PlayerCompare';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'News & Dashboard', icon: LayoutDashboard },
    { id: 'matches', label: 'Match Center', icon: Activity },
    { id: 'leagues', label: 'League Stats', icon: Trophy },
    { id: 'compare', label: 'Compare Players', icon: Users },
    { id: 'research', label: 'AI Analyst', icon: Search },
  ];

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard onNavigate={setCurrentView} />;
      case 'leagues': return <LeagueView />;
      case 'matches': return <MatchCenter />;
      case 'research': return <ResearchChat />;
      case 'compare': return <PlayerCompare />;
      default: return <Dashboard onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 font-sans">
      
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
             <ShieldCheck size={18} className="text-white" />
           </div>
           <span className="font-bold text-lg tracking-tight">PitchSide Assistant</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-gray-400 hover:text-white">
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 border-r border-gray-800 transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-20 flex items-center gap-3 px-6 border-b border-gray-800">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
              <ShieldCheck size={24} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight text-white leading-tight">PitchSide<br/><span className="text-blue-400">Assistant</span></h1>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentView(item.id as View);
                    setMobileMenuOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200
                    ${isActive 
                      ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' 
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }
                  `}
                >
                  <Icon size={20} className={isActive ? "text-blue-400" : "text-gray-500"} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Footer Info */}
          <div className="p-6 border-t border-gray-800">
            <div className="bg-gray-800/50 rounded-lg p-3">
              <p className="text-xs text-gray-500 leading-relaxed">
                Powered by Gemini 2.5 Flash & Google Search Grounding.
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden pt-16 md:pt-0 bg-black/20">
        {renderView()}
      </main>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default App;