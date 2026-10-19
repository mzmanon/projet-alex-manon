'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import Confetti from '@/app/components/Confetti';
import { recordGameResult } from '@/lib/stats';
import {
  GameState, PieceType, PIECE_UNICODE,
  initialState, getLegalMoves, processMove, Color,
} from './engine';

const FILES = ['a','b','c','d','e','f','g','h'];
const RANKS = ['8','7','6','5','4','3','2','1'];
const PROMOTION_PIECES: PieceType[] = ['Q','R','B','N'];

export default function ChessPage() {
  const [state, setState] = useState<GameState>(initialState());
  const [flipped, setFlipped] = useState(false);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const recordedGameOver = useRef(false);

  useEffect(() => {
    if (state.checkmate && !recordedGameOver.current) {
      recordedGameOver.current = true;
      recordGameResult('chess', 'win');
    } else if (state.stalemate && !recordedGameOver.current) {
      recordedGameOver.current = true;
      recordGameResult('chess', 'draw');
    }
  }, [state.checkmate, state.stalemate]);

  const handleCellClick = useCallback((row: number, col: number) => {
    const { board, turn, selected, legalMoves, checkmate, stalemate, promotionPending } = state;
    if (checkmate || stalemate || promotionPending) return;

    // If a move is selected and cell is a legal target
    if (selected && legalMoves.some(([r,c]) => r === row && c === col)) {
      const piece = board[selected[0]][selected[1]]!;
      // Check for pawn promotion
      const isPromotion = piece.type === 'P' && (
        (turn === 'white' && row === 0) || (turn === 'black' && row === 7)
      );

      if (isPromotion) {
        // Auto-promote to Queen for simplicity; show modal if desired
        const newState = processMove(state, selected, [row, col], 'Q');
        setState(newState);
        const notation = `${FILES[col]}${8 - row}=Q`;
        setMoveHistory(h => [...h, notation]);
      } else {
        const newState = processMove(state, selected, [row, col]);
        setState(newState);
        const notation = `${piece.type !== 'P' ? piece.type : ''}${FILES[col]}${8 - row}`;
        setMoveHistory(h => [...h, notation]);
      }
      return;
    }

    // Select a piece
    const piece = board[row][col];
    if (piece && piece.color === turn) {
      const moves = getLegalMoves(board, row, col, state.castlingRights, state.enPassant);
      setState(s => ({ ...s, selected: [row, col], legalMoves: moves }));
    } else {
      setState(s => ({ ...s, selected: null, legalMoves: [] }));
    }
  }, [state]);

  function promote(type: PieceType) {
    if (!state.promotionPending) return;
    const newState = processMove(state, state.selected!, state.promotionPending, type);
    setState(newState);
    setMoveHistory(h => [...h, `=${type}`]);
  }

  function reset() {
    setState(initialState());
    setMoveHistory([]);
    recordedGameOver.current = false;
  }

  const { board, turn, selected, legalMoves, inCheck, checkmate, stalemate, promotionPending,
    capturedWhite, capturedBlack } = state;

  const rows = flipped ? [...Array(8).keys()].reverse() : Array.from({ length: 8 }, (_, i) => i);
  const cols = flipped ? [...Array(8).keys()].reverse() : Array.from({ length: 8 }, (_, i) => i);

  const renderCaptured = (pieces: typeof capturedWhite, color: Color) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, minHeight: '1.5rem' }}>
      {pieces.map((p, i) => (
        <span key={i} style={{ fontSize: '1.125rem', opacity: 0.8 }}>
          {PIECE_UNICODE[color][p.type]}
        </span>
      ))}
    </div>
  );

  const statusColor = checkmate ? 'var(--pink)' : stalemate ? 'var(--orange)'
    : inCheck ? 'var(--orange)' : turn === 'white' ? '#f8fafc' : '#94a3b8';
  const statusText = checkmate
    ? `♛ Checkmate! ${turn === 'white' ? 'Black' : 'White'} wins!`
    : stalemate ? '🤝 Stalemate!'
    : inCheck ? `⚠️ ${turn === 'white' ? 'White' : 'Black'} is in check!`
    : `${turn === 'white' ? '♔ White' : '♚ Black'}'s turn`;

  return (
    <main className="game-page">
      <Confetti active={Boolean(state.checkmate)} duration={3000} />
      <div className="game-page-header">
        <Link href="/" className="game-page-back">← Back to Games</Link>
        <h1 className="game-page-title" style={{ color: 'var(--cyan-light)' }}>
          ♟ Chess
        </h1>
        <p className="game-page-subtitle">The timeless game of kings</p>
      </div>

      {/* Promotion Modal */}
      {promotionPending && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300,
          backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            borderRadius: '1rem', padding: '1.5rem', textAlign: 'center',
            boxShadow: 'var(--shadow-glow-purple)',
          }}>
            <p style={{ marginBottom: '1rem', fontWeight: 700, fontSize: '1.125rem' }}>
              Promote pawn to:
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {PROMOTION_PIECES.map(type => (
                <button key={type} onClick={() => promote(type)} style={{
                  background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border)',
                  borderRadius: '0.5rem', width: '60px', height: '60px', cursor: 'pointer',
                  fontSize: '2rem', transition: 'all 0.2s', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {PIECE_UNICODE[turn][type]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="game-container" style={{ maxWidth: 680 }}>
        {/* Status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span className="status-badge" style={{
            background: `${statusColor}18`, color: statusColor,
            border: `1px solid ${statusColor}40`,
          }}>
            {statusText}
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => setFlipped(f => !f)} className="game-btn game-btn-secondary" style={{ padding: '0.375rem 0.875rem', fontSize: '0.8125rem' }}>
              🔄 Flip
            </button>
            <button onClick={reset} className="game-btn game-btn-primary" style={{ padding: '0.375rem 0.875rem', fontSize: '0.8125rem' }}>
              ♻ New Game
            </button>
          </div>
        </div>

        {/* Captured pieces - Black's captures (White pieces) */}
        <div style={{ marginBottom: '0.375rem' }}>
          {renderCaptured(capturedWhite, 'white')}
        </div>

        {/* Board */}
        <div className="chess-board-wrapper">
          <div className="chess-file-labels">
            {cols.map(c => (
              <div key={c} className="chess-file-label">{FILES[c]}</div>
            ))}
          </div>

          {rows.map(r => (
            <div key={r} className="chess-row">
              <div className="chess-rank-label">{RANKS[r]}</div>
              {cols.map(c => {
                const piece = board[r][c];
                const isLight = (r + c) % 2 === 0;
                const isSelected = selected?.[0] === r && selected?.[1] === c;
                const isLegal = legalMoves.some(([lr,lc]) => lr === r && lc === c);
                const isKingInCheck = inCheck && piece?.type === 'K' && piece?.color === turn;

                let cellClass = `chess-cell ${isLight ? 'light' : 'dark'}`;
                if (isSelected) cellClass += ' selected';
                if (isKingInCheck) cellClass += ' in-check';
                if (isLegal) cellClass += ` movable${piece ? ' has-piece' : ''}`;

                return (
                  <div
                    key={c}
                    className={cellClass}
                    onClick={() => handleCellClick(r, c)}
                    role="gridcell"
                    aria-label={`${FILES[c]}${8-r}: ${piece ? `${piece.color} ${piece.type}` : 'empty'}`}
                    style={{ '--cell-size': '60px' } as React.CSSProperties}
                  >
                    {piece && (
                      <span className="chess-piece">
                        {PIECE_UNICODE[piece.color][piece.type]}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Captured pieces - White's captures (Black pieces) */}
        <div style={{ marginTop: '0.375rem' }}>
          {renderCaptured(capturedBlack, 'black')}
        </div>

        {/* Move history */}
        {moveHistory.length > 0 && (
          <div style={{
            marginTop: '1rem',
            background: 'rgba(0,0,0,0.25)',
            border: '1px solid var(--border)',
            borderRadius: '0.5rem',
            padding: '0.5rem 0.75rem',
            maxHeight: '80px',
            overflowY: 'auto',
          }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {moveHistory.map((m, i) => (
                <span key={i} style={{ marginRight: '0.5rem' }}>
                  {i % 2 === 0 ? `${Math.floor(i/2)+1}.` : ''}{m}
                </span>
              ))}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
