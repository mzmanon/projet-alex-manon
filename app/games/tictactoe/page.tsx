'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { recordGameResult } from '@/lib/stats';

type Player = 'X' | 'O';
type Cell = Player | null;
type Board = Cell[];
type Mode = 'pvp' | 'ai';

const WINNING_LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6],
];

function checkWinner(board: Board): { winner: Player; line: number[] } | null {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a] as Player, line };
    }
  }
  return null;
}

function isDraw(board: Board): boolean {
  return board.every(Boolean) && !checkWinner(board);
}

// Full minimax — AI never loses
function minimax(board: Board, player: Player, depth: number, alpha: number, beta: number): number {
  const win = checkWinner(board);
  if (win) return win.winner === 'O' ? 10 - depth : depth - 10;
  if (board.every(Boolean)) return 0;

  const isMax = player === 'O';
  let best = isMax ? -Infinity : Infinity;

  for (let i = 0; i < 9; i++) {
    if (board[i]) continue;
    const next = [...board] as Board;
    next[i] = player;
    const score = minimax(next, player === 'X' ? 'O' : 'X', depth + 1, alpha, beta);
    if (isMax) {
      best = Math.max(best, score);
      alpha = Math.max(alpha, best);
    } else {
      best = Math.min(best, score);
      beta = Math.min(beta, best);
    }
    if (beta <= alpha) break;
  }
  return best;
}

function getBestMove(board: Board): number {
  let bestScore = -Infinity;
  let bestIdx = -1;
  for (let i = 0; i < 9; i++) {
    if (board[i]) continue;
    const next = [...board] as Board;
    next[i] = 'O';
    const score = minimax(next, 'X', 0, -Infinity, Infinity);
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }
  return bestIdx;
}

export default function TicTacToePage() {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [current, setCurrent] = useState<Player>('X');
  const [mode, setMode] = useState<Mode>('ai');
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 });
  const [aiThinking, setAiThinking] = useState(false);

  const winResult = checkWinner(board);
  const draw = isDraw(board);
  const gameOver = !!winResult || draw;

  // Core move logic — separated from UI so AI can call it cleanly
  const applyMove = useCallback((b: Board, idx: number, player: Player) => {
    if (b[idx]) return;
    const next = [...b] as Board;
    next[idx] = player;
    setBoard(next);

    const res = checkWinner(next);
    if (res) {
      setScores(s => ({ ...s, [res.winner]: s[res.winner] + 1 }));
      if (mode === 'ai') {
        recordGameResult('tictactoe', res.winner === 'X' ? 'win' : 'loss');
      } else {
        recordGameResult('tictactoe', 'win');
      }
    } else if (next.every(Boolean)) {
      setScores(s => ({ ...s, draws: s.draws + 1 }));
      recordGameResult('tictactoe', 'draw');
    } else {
      setCurrent(p => p === 'X' ? 'O' : 'X');
    }
  }, [mode]);

  // Human click
  function handleClick(idx: number) {
    if (gameOver || aiThinking) return;
    if (mode === 'ai' && current === 'O') return; // AI's turn
    applyMove(board, idx, current);
  }

  // AI move with minimax
  useEffect(() => {
    if (mode !== 'ai' || current !== 'O' || gameOver) return;

    setAiThinking(true);
    const boardSnapshot = [...board] as Board;

    const timer = setTimeout(() => {
      const idx = getBestMove(boardSnapshot);
      if (idx >= 0) applyMove(boardSnapshot, idx, 'O');
      setAiThinking(false);
    }, 450);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, mode, gameOver]); // board excluded on purpose — we snapshot it

  function reset() {
    setBoard(Array(9).fill(null));
    setCurrent('X');
    setAiThinking(false);
  }

  function getCellClass(idx: number): string {
    let cls = 'ttt-cell';
    const val = board[idx];
    if (val === 'X') cls += ' x-cell filled';
    else if (val === 'O') cls += ' o-cell filled';
    if (winResult?.line.includes(idx)) cls += ' winning';
    if (!val && (gameOver || (aiThinking && mode === 'ai'))) cls += ' disabled';
    return cls;
  }

  const statusColor = winResult
    ? (winResult.winner === 'X' ? 'var(--purple-light)' : 'var(--cyan)')
    : draw ? 'var(--orange)' : (current === 'X' ? 'var(--purple-light)' : 'var(--cyan)');

  const statusText = winResult
    ? `${winResult.winner === 'O' && mode === 'ai' ? '🤖 AI' : `Player ${winResult.winner}`} wins! 🎉`
    : draw ? "It's a draw! 🤝"
    : aiThinking ? '🤖 AI is thinking...'
    : `Player ${current}'s turn`;

  return (
    <main className="game-page">
      <div className="game-page-header">
        <Link href="/" className="game-page-back">← Back to Games</Link>
        <h1 className="game-page-title" style={{ color: 'var(--purple-light)' }}>
          ✕ Tic Tac Toe
        </h1>
        <p className="game-page-subtitle">Three in a row wins the game</p>
      </div>

      <div className="game-container" style={{ maxWidth: 480 }}>
        {/* Mode selector */}
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1.25rem' }}>
          {(['pvp', 'ai'] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); reset(); setScores({ X: 0, O: 0, draws: 0 }); }}
              className="game-btn"
              style={{
                background: mode === m ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.05)',
                color: mode === m ? 'var(--purple-light)' : 'var(--text-secondary)',
                border: `1px solid ${mode === m ? 'rgba(139,92,246,0.5)' : 'var(--border)'}`,
                padding: '0.5rem 1.25rem',
                borderRadius: '0.625rem',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              {m === 'pvp' ? '👥 2 Players' : '🤖 vs AI (Minimax)'}
            </button>
          ))}
        </div>

        {/* Scores */}
        <div className="ttt-score">
          <div className="ttt-score-item">
            <div className="ttt-score-label" style={{ color: 'var(--purple-light)' }}>
              {mode === 'ai' ? 'You (X)' : 'Player X'}
            </div>
            <div className="ttt-score-val" style={{ color: 'var(--purple-light)' }}>{scores.X}</div>
          </div>
          <div className="ttt-score-item">
            <div className="ttt-score-label" style={{ color: 'var(--text-muted)' }}>Draws</div>
            <div className="ttt-score-val" style={{ color: 'var(--text-muted)' }}>{scores.draws}</div>
          </div>
          <div className="ttt-score-item">
            <div className="ttt-score-label" style={{ color: 'var(--cyan)' }}>
              {mode === 'ai' ? '🤖 AI (O)' : 'Player O'}
            </div>
            <div className="ttt-score-val" style={{ color: 'var(--cyan)' }}>{scores.O}</div>
          </div>
        </div>

        {/* Status */}
        <div className="ttt-status">
          <span
            className="status-badge"
            style={{ background: `${statusColor}18`, color: statusColor, border: `1px solid ${statusColor}40` }}
          >
            {statusText}
          </span>
        </div>

        {/* Board */}
        <div className="ttt-board" role="grid" aria-label="Tic Tac Toe board">
          {board.map((val, idx) => (
            <button
              key={idx}
              className={getCellClass(idx)}
              onClick={() => handleClick(idx)}
              disabled={!!val || gameOver || aiThinking}
              aria-label={`Cell ${idx + 1}: ${val ?? 'empty'}`}
              role="gridcell"
            >
              {val}
            </button>
          ))}
        </div>

        {mode === 'ai' && !gameOver && (
          <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
            The AI uses minimax — it always plays perfectly.
          </p>
        )}

        {/* Controls */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.25rem' }}>
          <button onClick={reset} className="game-btn game-btn-primary">
            🔄 New Game
          </button>
        </div>
      </div>
    </main>
  );
}
