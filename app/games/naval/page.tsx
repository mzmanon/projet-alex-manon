'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { recordGameResult } from '@/lib/stats';

const GRID = 10;

type CellState = 'empty' | 'ship' | 'hit' | 'miss' | 'sunk';

interface Ship {
  name: string;
  size: number;
  emoji: string;
}

const SHIPS: Ship[] = [
  { name: 'Carrier', size: 5, emoji: '🛳' },
  { name: 'Battleship', size: 4, emoji: '🚢' },
  { name: 'Cruiser', size: 3, emoji: '⛴' },
  { name: 'Submarine', size: 3, emoji: '🤿' },
  { name: 'Destroyer', size: 2, emoji: '🚤' },
];

type Grid = CellState[][];
type ShipPlacement = { shipIdx: number; cells: [number,number][] };

function createGrid(): Grid {
  return Array.from({ length: GRID }, () => Array(GRID).fill('empty'));
}

function canPlace(grid: Grid, row: number, col: number, size: number, horiz: boolean): boolean {
  for (let i = 0; i < size; i++) {
    const r = horiz ? row : row + i;
    const c = horiz ? col + i : col;
    if (r < 0 || r >= GRID || c < 0 || c >= GRID) return false;
    if (grid[r][c] !== 'empty') return false;
    // Check adjacency
    for (const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]]) {
      const ar = r + dr, ac = c + dc;
      if (ar >= 0 && ar < GRID && ac >= 0 && ac < GRID && grid[ar][ac] === 'ship') return false;
    }
  }
  return true;
}

function placeShipOnGrid(grid: Grid, row: number, col: number, size: number, horiz: boolean): [Grid, [number,number][]] {
  const newGrid = grid.map(r => [...r]) as Grid;
  const cells: [number,number][] = [];
  for (let i = 0; i < size; i++) {
    const r = horiz ? row : row + i;
    const c = horiz ? col + i : col;
    newGrid[r][c] = 'ship';
    cells.push([r, c]);
  }
  return [newGrid, cells];
}

function autoPlace(): { grid: Grid; placements: ShipPlacement[] } {
  let grid = createGrid();
  const placements: ShipPlacement[] = [];

  for (let si = 0; si < SHIPS.length; si++) {
    const size = SHIPS[si].size;
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 200) {
      attempts++;
      const horiz = Math.random() > 0.5;
      const row = Math.floor(Math.random() * GRID);
      const col = Math.floor(Math.random() * GRID);
      if (canPlace(grid, row, col, size, horiz)) {
        const [ng, cells] = placeShipOnGrid(grid, row, col, size, horiz);
        grid = ng;
        placements.push({ shipIdx: si, cells });
        placed = true;
      }
    }
  }
  return { grid, placements };
}

type Phase = 'placing' | 'playing' | 'gameover';

function isShipSunk(grid: Grid, cells: [number,number][]): boolean {
  return cells.every(([r,c]) => grid[r][c] === 'hit' || grid[r][c] === 'sunk');
}

export default function NavalPage() {
  const [phase, setPhase] = useState<Phase>('placing');
  const [playerGrid, setPlayerGrid] = useState<Grid>(createGrid());
  const [aiGrid, setAiGrid] = useState<Grid>(createGrid());
  const [playerPlacements, setPlayerPlacements] = useState<ShipPlacement[]>([]);
  const [aiPlacements, setAiPlacements] = useState<ShipPlacement[]>([]);
  const [placingShipIdx, setPlacingShipIdx] = useState(0);
  const [placingHoriz, setPlacingHoriz] = useState(true);
  const [hoverCell, setHoverCell] = useState<[number,number] | null>(null);
  const [log, setLog] = useState<{ text: string; type: string }[]>([]);
  const [winner, setWinner] = useState<'player' | 'ai' | null>(null);
  const [aiTurn, setAiTurn] = useState(false);
  // AI hunt/target mode
  const aiHitQueue = useRef<[number,number][]>([]);
  const aiShotHistory = useRef<Set<string>>(new Set());
  const logRef = useRef<HTMLDivElement>(null);

  function addLog(text: string, type = '') {
    setLog(l => [...l.slice(-20), { text, type }]);
  }

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [log]);

  // AI turn logic
  useEffect(() => {
    if (!aiTurn || phase !== 'playing') return;
    const timer = setTimeout(() => {
      doAiTurn();
    }, 700);
    return () => clearTimeout(timer);
  }, [aiTurn, phase]);

  function doAiTurn() {
    // Smart AI: hunt mode if hits queued
    let row: number, col: number;
    if (aiHitQueue.current.length > 0) {
      // Try adjacent to last hit
      const [hr, hc] = aiHitQueue.current[aiHitQueue.current.length - 1];
      const candidates: [number,number][] = [];
      for (const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        const nr = hr + dr, nc = hc + dc;
        const key = `${nr},${nc}`;
        if (nr >= 0 && nr < GRID && nc >= 0 && nc < GRID && !aiShotHistory.current.has(key)) {
          candidates.push([nr, nc]);
        }
      }
      if (candidates.length > 0) {
        [row, col] = candidates[Math.floor(Math.random() * candidates.length)];
      } else {
        aiHitQueue.current.pop();
        if (aiHitQueue.current.length === 0) {
          [row, col] = getRandomShot();
        } else {
          [row, col] = getRandomShot();
        }
      }
    } else {
      [row, col] = getRandomShot();
    }

    const key = `${row},${col}`;
    aiShotHistory.current.add(key);

    setPlayerGrid(grid => {
      const newGrid = grid.map(r => [...r]) as Grid;
      const cell = newGrid[row][col];
      if (cell === 'ship') {
        newGrid[row][col] = 'hit';
        aiHitQueue.current.push([row, col]);

        // Check if ship sunk
        const hitPlacement = playerPlacements.find(p => p.cells.some(([r,c]) => r === row && c === col));
        if (hitPlacement && isShipSunk(newGrid, hitPlacement.cells)) {
          hitPlacement.cells.forEach(([r,c]) => newGrid[r][c] = 'sunk');
          aiHitQueue.current = aiHitQueue.current.filter(([r,c]) =>
            !hitPlacement.cells.some(([hr,hc]) => hr === r && hc === c));
          const shipName = SHIPS[hitPlacement.shipIdx].name;
          addLog(`🤖 AI sunk your ${shipName}! 💥`, 'sunk');
          // Check win
          const allSunk = playerPlacements.every(pl =>
            pl.cells.every(([r,c]) => newGrid[r][c] === 'hit' || newGrid[r][c] === 'sunk'));
          if (allSunk) {
            setPhase('gameover');
            setWinner('ai');
            recordGameResult('naval', 'loss');
            addLog('💀 AI wins! Better luck next time.', 'sunk');
          }
        } else {
          addLog(`🤖 AI hit your ship at ${String.fromCharCode(65+col)}${GRID-row}!`, 'hit');
        }
      } else {
        newGrid[row][col] = 'miss';
        addLog(`🤖 AI missed at ${String.fromCharCode(65+col)}${GRID-row}`, 'ai-action');
      }
      return newGrid;
    });

    setAiTurn(false);
  }

  function getRandomShot(): [number,number] {
    const available: [number,number][] = [];
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        if (!aiShotHistory.current.has(`${r},${c}`)) available.push([r,c]);
      }
    }
    if (available.length === 0) return [0,0];
    return available[Math.floor(Math.random() * available.length)];
  }

  function handleAutoPlace() {
    const { grid, placements } = autoPlace();
    setPlayerGrid(grid);
    setPlayerPlacements(placements);
    setPlacingShipIdx(SHIPS.length);
  }

  function handlePlayerCellClick(row: number, col: number) {
    if (phase !== 'placing') return;
    if (placingShipIdx >= SHIPS.length) return;
    const size = SHIPS[placingShipIdx].size;
    if (!canPlace(playerGrid, row, col, size, placingHoriz)) return;
    const [newGrid, cells] = placeShipOnGrid(playerGrid, row, col, size, placingHoriz);
    setPlayerGrid(newGrid);
    setPlayerPlacements(p => [...p, { shipIdx: placingShipIdx, cells }]);
    setPlacingShipIdx(pi => pi + 1);
  }

  function startGame() {
    const { grid: ag, placements: ap } = autoPlace();
    setAiGrid(ag);
    setAiPlacements(ap);
    aiShotHistory.current = new Set();
    aiHitQueue.current = [];
    setPhase('playing');
    addLog('⚓ Battle begins! Fire at the enemy grid.', 'player-action');
  }

  function handleAiCellClick(row: number, col: number) {
    if (phase !== 'playing' || aiTurn) return;
    const cell = aiGrid[row][col];
    if (cell === 'hit' || cell === 'miss' || cell === 'sunk') return;

    setAiGrid(grid => {
      const newGrid = grid.map(r => [...r]) as Grid;
      if (cell === 'ship') {
        newGrid[row][col] = 'hit';
        // Check sunk
        const hitPlacement = aiPlacements.find(p => p.cells.some(([r,c]) => r === row && c === col));
        if (hitPlacement && isShipSunk(newGrid, hitPlacement.cells)) {
          hitPlacement.cells.forEach(([r,c]) => newGrid[r][c] = 'sunk');
          const shipName = SHIPS[hitPlacement.shipIdx].name;
          addLog(`🎯 You sunk their ${shipName}! 🔥`, 'sunk');
          // Check win
          const allSunk = aiPlacements.every(pl =>
            pl.cells.every(([r,c]) => newGrid[r][c] === 'hit' || newGrid[r][c] === 'sunk'));
          if (allSunk) {
            setPhase('gameover');
            setWinner('player');
            recordGameResult('naval', 'win');
            addLog('🏆 You win! Fleet destroyed!', 'sunk');
          }
        } else {
          addLog(`💥 Hit at ${String.fromCharCode(65+col)}${GRID-row}!`, 'hit');
        }
      } else {
        newGrid[row][col] = 'miss';
        addLog(`💨 Miss at ${String.fromCharCode(65+col)}${GRID-row}`, 'player-action');
      }
      return newGrid;
    });

    setAiTurn(true);
  }

  function resetGame() {
    setPhase('placing');
    setPlayerGrid(createGrid());
    setAiGrid(createGrid());
    setPlayerPlacements([]);
    setAiPlacements([]);
    setPlacingShipIdx(0);
    setPlacingHoriz(true);
    setHoverCell(null);
    setLog([]);
    setWinner(null);
    setAiTurn(false);
    aiHitQueue.current = [];
    aiShotHistory.current = new Set();
  }

  function renderCell(
    grid: Grid,
    row: number,
    col: number,
    isEnemy: boolean,
  ) {
    const cell = grid[row][col];
    let extraClass = '';
    let content = '';

    if (cell === 'hit') { extraClass = ' hit'; content = '💥'; }
    else if (cell === 'sunk') { extraClass = ' sunk'; content = '🔥'; }
    else if (cell === 'miss') { extraClass = ' miss'; content = '○'; }
    else if (!isEnemy && cell === 'ship') { extraClass = ' player-ship'; }

    if (isEnemy && phase === 'playing' && !aiTurn && cell === 'empty') {
      extraClass += ' enemy-target';
    }

    if (phase === 'placing' && !isEnemy && placingShipIdx < SHIPS.length) {
      if (cell === 'empty') {
        const isHovered = hoverCell?.[0] === row && hoverCell?.[1] === col;
        if (isHovered) {
          const valid = canPlace(grid, row, col, SHIPS[placingShipIdx].size, placingHoriz);
          extraClass += valid ? ' player-placing-valid' : ' player-placing-invalid';
        } else {
          extraClass += ' player-placing';
        }
      }
    }

    return (
      <div
        key={`${row}-${col}`}
        className={`naval-cell${extraClass}`}
        onClick={() => isEnemy ? handleAiCellClick(row, col) : handlePlayerCellClick(row, col)}
        onMouseEnter={() => !isEnemy && setHoverCell([row, col])}
        onMouseLeave={() => setHoverCell(null)}
        aria-label={`${String.fromCharCode(65+col)}${GRID-row}`}
      >
        {content}
      </div>
    );
  }

  return (
    <main className="game-page">
      <div className="game-page-header">
        <Link href="/" className="game-page-back">← Back to Games</Link>
        <h1 className="game-page-title" style={{ color: 'var(--pink-light)' }}>
          🚢 Naval Battle
        </h1>
        <p className="game-page-subtitle">
          {phase === 'placing'
            ? `Place your ships — ${placingShipIdx < SHIPS.length ? SHIPS[placingShipIdx].name : 'All placed!'}`
            : phase === 'playing' ? 'Sink the enemy fleet!'
            : `Game Over — ${winner === 'player' ? '🏆 Victory!' : '💀 Defeat'}`
          }
        </p>
      </div>

      <div className="game-container" style={{ maxWidth: 860 }}>
        {/* Controls */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {phase === 'placing' && (
            <>
              <button
                className={`game-btn ${placingHoriz ? 'game-btn-primary' : 'game-btn-secondary'}`}
                onClick={() => setPlacingHoriz(h => !h)}
              >
                {placingHoriz ? '↔ Horizontal' : '↕ Vertical'}
              </button>
              <button className="game-btn game-btn-secondary" onClick={handleAutoPlace}>
                🎲 Auto-Place
              </button>
              <button
                className="game-btn game-btn-primary"
                onClick={startGame}
                disabled={placingShipIdx < SHIPS.length}
              >
                ⚓ Start Battle
              </button>
            </>
          )}
          {phase === 'playing' && (
            <span
              className="status-badge"
              style={{
                background: aiTurn ? 'rgba(236,72,153,0.15)' : 'rgba(6,182,212,0.15)',
                color: aiTurn ? 'var(--pink-light)' : 'var(--cyan-light)',
                border: `1px solid ${aiTurn ? 'rgba(236,72,153,0.3)' : 'rgba(6,182,212,0.3)'}`,
              }}
            >
              {aiTurn ? '🤖 AI is firing...' : '🎯 Your turn — click enemy grid'}
            </span>
          )}
          {phase === 'gameover' && (
            <>
              <span className="status-badge" style={{
                background: winner === 'player' ? 'rgba(16,185,129,0.2)' : 'rgba(236,72,153,0.2)',
                color: winner === 'player' ? '#34d399' : 'var(--pink-light)',
                border: `1px solid ${winner === 'player' ? 'rgba(16,185,129,0.4)' : 'rgba(236,72,153,0.4)'}`,
              }}>
                {winner === 'player' ? '🏆 You win!' : '💀 AI wins!'}
              </span>
              <button className="game-btn game-btn-primary" onClick={resetGame}>
                🔄 Play Again
              </button>
            </>
          )}
          {phase !== 'gameover' && (
            <button className="game-btn game-btn-secondary" onClick={resetGame} style={{ fontSize: '0.8125rem', padding: '0.375rem 0.875rem' }}>
              ↩ Reset
            </button>
          )}
        </div>

        {/* Ship selector (placing phase) */}
        {phase === 'placing' && (
          <div className="naval-ships-selector">
            {SHIPS.map((ship, idx) => (
              <button
                key={ship.name}
                onClick={() => setPlacingShipIdx(idx < placingShipIdx ? placingShipIdx : idx)}
                className={`naval-ship-btn ${idx === placingShipIdx ? 'selected' : ''} ${idx < placingShipIdx ? 'placed' : ''}`}
                disabled={idx < placingShipIdx}
              >
                {ship.emoji} {ship.name} ({ship.size})
              </button>
            ))}
          </div>
        )}

        {/* Boards */}
        <div className="naval-boards">
          {/* Player board */}
          <div className="naval-board-container">
            <div className="naval-board-title" style={{ color: 'var(--purple-light)' }}>
              ⚓ Your Fleet
            </div>
            <div className="naval-board" style={{ gridTemplateColumns: `repeat(${GRID}, 38px)` }}>
              {Array.from({ length: GRID }, (_, r) =>
                Array.from({ length: GRID }, (_, c) =>
                  renderCell(playerGrid, r, c, false)
                )
              )}
            </div>
          </div>

          {/* AI board */}
          <div className="naval-board-container">
            <div className="naval-board-title" style={{ color: 'var(--pink-light)' }}>
              🎯 Enemy Waters
            </div>
            <div className="naval-board" style={{ gridTemplateColumns: `repeat(${GRID}, 38px)` }}>
              {Array.from({ length: GRID }, (_, r) =>
                Array.from({ length: GRID }, (_, c) =>
                  renderCell(aiGrid, r, c, true)
                )
              )}
            </div>
          </div>
        </div>

        {/* Battle log */}
        {log.length > 0 && (
          <div ref={logRef} className="naval-log" style={{ marginTop: '1rem' }}>
            {log.map((entry, i) => (
              <p key={i} className={entry.type}>{entry.text}</p>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
