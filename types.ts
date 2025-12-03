export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  sources?: GroundingChunk[];
  timestamp: number;
  isStreaming?: boolean;
}

export type View = 'dashboard' | 'leagues' | 'matches' | 'research' | 'compare';

export interface League {
  id: string;
  name: string;
  prompt: string;
}

export const LEAGUES: League[] = [
  { id: 'pl', name: 'Premier League', prompt: 'Current Premier League' },
  { id: 'laliga', name: 'La Liga', prompt: 'Current La Liga' },
  { id: 'bundesliga', name: 'Bundesliga', prompt: 'Current Bundesliga' },
  { id: 'seriea', name: 'Serie A', prompt: 'Current Serie A' },
  { id: 'ligue1', name: 'Ligue 1', prompt: 'Current Ligue 1' },
  { id: 'ucl', name: 'Champions League', prompt: 'Champions League' },
];

export interface DashboardMatch {
  homeTeam: string;
  awayTeam: string;
  score: string;
  status: 'LIVE' | 'FT' | 'UPCOMING';
  league: string;
  minute?: string;
}

export interface DashboardNews {
  title: string;
  summary: string;
  imageSearchQuery: string;
  category: string;
  timestamp: string;
}

export interface DashboardData {
  matches: DashboardMatch[];
  news: DashboardNews[];
}

export interface LeagueTableRow {
  position: number;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gd: number;
  points: number;
  form?: string[]; // W, L, D
}

export interface ScorerRow {
  rank: number;
  player: string;
  team: string;
  goals: number;
  matches: number;
}
