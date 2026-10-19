export type GameId = 'tictactoe' | 'wordle' | 'chess' | 'naval';

export interface GameStat {
  played: number;
  won: number;
  lost: number;
  drawn: number;
}

export interface PlayerStats {
  totalPlayed: number;
  totalWon: number;
  totalLost: number;
  totalDrawn: number;
  games: Record<GameId, GameStat>;
  lastUpdated?: number;
}

const STORAGE_KEY = 'malex_player_stats_v1';

export const DEFAULT_STATS: PlayerStats = {
  totalPlayed: 0,
  totalWon: 0,
  totalLost: 0,
  totalDrawn: 0,
  games: {
    tictactoe: { played: 0, won: 0, lost: 0, drawn: 0 },
    wordle: { played: 0, won: 0, lost: 0, drawn: 0 },
    chess: { played: 0, won: 0, lost: 0, drawn: 0 },
    naval: { played: 0, won: 0, lost: 0, drawn: 0 },
  },
};

export function getStoredStats(): PlayerStats {
  if (typeof window === 'undefined') {
    return DEFAULT_STATS;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATS;

    const parsed = JSON.parse(raw) as Partial<PlayerStats>;
    return {
      totalPlayed: Number(parsed.totalPlayed) || 0,
      totalWon: Number(parsed.totalWon) || 0,
      totalLost: Number(parsed.totalLost) || 0,
      totalDrawn: Number(parsed.totalDrawn) || 0,
      lastUpdated: parsed.lastUpdated,
      games: {
        tictactoe: {
          played: Number(parsed.games?.tictactoe?.played) || 0,
          won: Number(parsed.games?.tictactoe?.won) || 0,
          lost: Number(parsed.games?.tictactoe?.lost) || 0,
          drawn: Number(parsed.games?.tictactoe?.drawn) || 0,
        },
        wordle: {
          played: Number(parsed.games?.wordle?.played) || 0,
          won: Number(parsed.games?.wordle?.won) || 0,
          lost: Number(parsed.games?.wordle?.lost) || 0,
          drawn: Number(parsed.games?.wordle?.drawn) || 0,
        },
        chess: {
          played: Number(parsed.games?.chess?.played) || 0,
          won: Number(parsed.games?.chess?.won) || 0,
          lost: Number(parsed.games?.chess?.lost) || 0,
          drawn: Number(parsed.games?.chess?.drawn) || 0,
        },
        naval: {
          played: Number(parsed.games?.naval?.played) || 0,
          won: Number(parsed.games?.naval?.won) || 0,
          lost: Number(parsed.games?.naval?.lost) || 0,
          drawn: Number(parsed.games?.naval?.drawn) || 0,
        },
      },
    };
  } catch (error) {
    console.error('Failed to read player stats from localStorage:', error);
    return DEFAULT_STATS;
  }
}

function notifyUpdate(stats: PlayerStats) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('player-stats-updated', { detail: stats }));
  }
}

export function recordGameResult(
  gameId: GameId,
  result: 'win' | 'loss' | 'draw'
): PlayerStats {
  const current = getStoredStats();

  const game = current.games[gameId] || { played: 0, won: 0, lost: 0, drawn: 0 };
  const updatedGame: GameStat = {
    played: game.played + 1,
    won: game.won + (result === 'win' ? 1 : 0),
    lost: game.lost + (result === 'loss' ? 1 : 0),
    drawn: game.drawn + (result === 'draw' ? 1 : 0),
  };

  const updatedStats: PlayerStats = {
    totalPlayed: current.totalPlayed + 1,
    totalWon: current.totalWon + (result === 'win' ? 1 : 0),
    totalLost: current.totalLost + (result === 'loss' ? 1 : 0),
    totalDrawn: current.totalDrawn + (result === 'draw' ? 1 : 0),
    games: {
      ...current.games,
      [gameId]: updatedGame,
    },
    lastUpdated: Date.now(),
  };

  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedStats));
      notifyUpdate(updatedStats);
    }
  } catch (e) {
    console.error('Failed to save player stats to localStorage:', e);
  }

  return updatedStats;
}

export function resetPlayerStats(): PlayerStats {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_STATS));
      notifyUpdate(DEFAULT_STATS);
    }
  } catch (e) {
    console.error('Failed to reset player stats:', e);
  }
  return DEFAULT_STATS;
}
