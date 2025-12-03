import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Globe, Sparkles } from 'lucide-react';
import { ChatMessage, GroundingChunk } from '../types';
import { streamFootballContent } from '../services/gemini';
import { MarkdownRenderer } from '../utils/markdown';

const SUGGESTED_PROMPTS = [
  "Latest transfer rumors for Manchester United",
  "Top 5 scorers in Europe this season",
  "Explain the new offside rule changes",
  "Who has the most assists in La Liga?",
  "History of the World Cup trophy"
];

export const ResearchChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Hello! I'm your Football Research Analyst. Ask me about live scores, player stats, transfer news, or historical data. I use Google Search to get you the latest info.",
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Create a placeholder bot message for streaming
    const botMsgId = (Date.now() + 1).toString();
    const initialBotMsg: ChatMessage = {
      id: botMsgId,
      role: 'model',
      text: "",
      timestamp: Date.now(),
      isStreaming: true
    };
    setMessages(prev => [...prev, initialBotMsg]);

    try {
      await streamFootballContent(textToSend, (text, groundingChunks) => {
        setMessages(prev => prev.map(msg => 
          msg.id === botMsgId 
            ? { ...msg, text: text, sources: groundingChunks } 
            : msg
        ));
      });
    } catch (error) {
      setMessages(prev => prev.map(msg => 
        msg.id === botMsgId 
          ? { ...msg, text: "I'm sorry, I encountered an error while fetching the data. Please try again." } 
          : msg
      ));
    } finally {
      setIsLoading(false);
      setMessages(prev => prev.map(msg => 
        msg.id === botMsgId 
          ? { ...msg, isStreaming: false } 
          : msg
      ));
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === 'user' ? 'bg-green-600' : 'bg-blue-600'
            }`}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            
            <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`p-4 rounded-2xl shadow-md ${
                msg.role === 'user' 
                  ? 'bg-green-700 text-white rounded-tr-none' 
                  : 'bg-gray-800 text-gray-100 rounded-tl-none border border-gray-700'
              }`}>
                <div className="prose prose-invert max-w-none text-sm sm:text-base min-h-[20px]">
                  <MarkdownRenderer content={msg.text} />
                  {msg.isStreaming && (
                    <span className="inline-block w-2 h-4 ml-1 bg-green-400 animate-pulse"></span>
                  )}
                </div>
              </div>

              {/* Sources / Grounding */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2 text-xs bg-gray-800/50 p-2 rounded-lg border border-gray-700/50 w-full animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-1 text-gray-400 mb-1">
                    <Globe size={12} />
                    <span className="uppercase font-semibold tracking-wider">Sources</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {msg.sources.map((source, idx) => source.web?.uri && (
                      <a 
                        key={idx}
                        href={source.web.uri}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-blue-300 hover:text-blue-200 transition-colors truncate max-w-[200px]"
                      >
                        <span className="truncate">{source.web.title || new URL(source.web.uri).hostname}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-gray-800 border-t border-gray-700">
        
        {/* Quick Prompts */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
          {SUGGESTED_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSend(prompt)}
              disabled={isLoading}
              className="flex items-center gap-1 whitespace-nowrap bg-gray-700 hover:bg-gray-600 text-xs text-gray-300 px-3 py-1.5 rounded-full transition-colors border border-gray-600"
            >
              <Sparkles size={12} className="text-yellow-400" />
              {prompt}
            </button>
          ))}
        </div>

        <div className="max-w-4xl mx-auto relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask anything..."
            className="w-full bg-gray-900 text-white placeholder-gray-500 rounded-xl pl-4 pr-12 py-4 border border-gray-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all shadow-inner"
          />
          <button 
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:hover:bg-green-600 rounded-lg transition-colors text-white"
          >
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};