'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { pickRandomWord, isValidWord } from './words';
import Confetti from '@/app/components/Confetti';
import { recordGameResult } from '@/lib/stats';

const WORD_LENGTH = 5;
const MAX_GUESSES = 6;

type LetterState = 'correct' | 'present' | 'absent' | 'empty' | 'filled';

interface GuessLetter {
  char: string;
  state: LetterState;
}

type KeyState = Record<string, LetterState>;

const KEYBOARD_ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['ENTER','Z','X','C','V','B','N','M','⌫'],
];

function evaluateGuess(guess: string, target: string): GuessLetter[] {
  const result: GuessLetter[] = guess.split('').map(char => ({ char, state: 'absent' as LetterState }));
  const targetArr = target.split('');
  const used = Array(WORD_LENGTH).fill(false);

  // First pass: correct
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guess[i] === target[i]) {
      result[i].state = 'correct';
      used[i] = true;
    }
  }

  // Second pass: present
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (result[i].state === 'correct') continue;
    for (let j = 0; j < WORD_LENGTH; j++) {
      if (!used[j] && guess[i] === targetArr[j]) {
        result[i].state = 'present';
        used[j] = true;
        break;
      }
    }
  }

  return result;
}

export default function WordlePage() {
  const [target, setTarget] = useState<string>('CRANE');
  const [guesses, setGuesses] = useState<GuessLetter[][]>([]);

  useEffect(() => {
    setTarget(pickRandomWord());
  }, []);
  const [current, setCurrent] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [message, setMessage] = useState('');
  const [keyStates, setKeyStates] = useState<KeyState>({});
  const [revealRow, setRevealRow] = useState(-1);

  function showMessage(msg: string, ms = 2000) {
    setMessage(msg);
    setTimeout(() => setMessage(''), ms);
  }

  const submitGuess = useCallback(() => {
    if (current.length !== WORD_LENGTH) {
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      showMessage('Not enough letters');
      return;
    }
    if (!isValidWord(current)) {
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      showMessage('Not in word list');
      return;
    }

    const evaluated = evaluateGuess(current, target);
    const newGuesses = [...guesses, evaluated];
    setGuesses(newGuesses);
    setRevealRow(newGuesses.length - 1);
    setCurrent('');

    // Update key states
    setKeyStates(prev => {
      const next = { ...prev };
      const priority: Record<LetterState, number> = { correct: 3, present: 2, absent: 1, empty: 0, filled: 0 };
      for (const { char, state } of evaluated) {
        if (!next[char] || priority[state] > priority[next[char]]) {
          next[char] = state;
        }
      }
      return next;
    });

    const isWin = evaluated.every(l => l.state === 'correct');
    if (isWin) {
      recordGameResult('wordle', 'win');
      setTimeout(() => {
        setWon(true);
        setGameOver(true);
        showMessage('🎉 Brilliant!', 3000);
      }, WORD_LENGTH * 150 + 300);
    } else if (newGuesses.length === MAX_GUESSES) {
      recordGameResult('wordle', 'loss');
      setTimeout(() => {
        setGameOver(true);
        showMessage(`The word was ${target}`, 4000);
      }, WORD_LENGTH * 150 + 300);
    }
  }, [current, guesses, target]);

  const handleKey = useCallback((key: string) => {
    if (gameOver) return;
    if (key === 'ENTER') {
      submitGuess();
    } else if (key === '⌫' || key === 'BACKSPACE') {
      setCurrent(c => c.slice(0, -1));
    } else if (/^[A-Z]$/.test(key) && current.length < WORD_LENGTH) {
      setCurrent(c => c + key);
    }
  }, [gameOver, current, submitGuess]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      handleKey(e.key.toUpperCase());
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleKey]);

  function reset() {
    setTarget(pickRandomWord());
    setGuesses([]);
    setCurrent('');
    setGameOver(false);
    setWon(false);
    setShaking(false);
    setMessage('');
    setKeyStates({});
    setRevealRow(-1);
  }

  function getCellState(rowIdx: number, colIdx: number): LetterState {
    if (rowIdx < guesses.length) {
      return guesses[rowIdx][colIdx].state;
    }
    if (rowIdx === guesses.length) {
      return colIdx < current.length ? 'filled' : 'empty';
    }
    return 'empty';
  }

  function getCellChar(rowIdx: number, colIdx: number): string {
    if (rowIdx < guesses.length) return guesses[rowIdx][colIdx].char;
    if (rowIdx === guesses.length && colIdx < current.length) return current[colIdx];
    return '';
  }

  function getCellStyle(rowIdx: number, colIdx: number): React.CSSProperties {
    const state = getCellState(rowIdx, colIdx);
    const isRevealed = rowIdx < revealRow || (rowIdx === revealRow);
    const delay = isRevealed && rowIdx === revealRow ? `${colIdx * 150}ms` : '0ms';

    return {
      animationDelay: delay,
    };
  }

  const currentRowShaking = shaking && guesses.length < MAX_GUESSES;

  return (
    <main className="game-page">
      <Confetti active={won} duration={3000} />
      <div className="game-page-header">
        <Link href="/" className="game-page-back">← Back to Games</Link>
        <h1 className="game-page-title" style={{ color: '#34d399' }}>
          🔤 Wordle
        </h1>
        <p className="game-page-subtitle">Guess the 5-letter word in 6 tries</p>
      </div>

      {/* Toast message */}
      {message && (
        <div style={{
          position: 'fixed',
          top: '5rem',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(255,255,255,0.95)',
          color: '#111',
          padding: '0.625rem 1.5rem',
          borderRadius: '0.5rem',
          fontWeight: 700,
          fontSize: '0.9375rem',
          zIndex: 200,
          animation: 'fadeIn 0.2s ease',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}>
          {message}
        </div>
      )}

      <div className="game-container" style={{ maxWidth: 520, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Grid */}
        <div className="wordle-grid" role="grid" aria-label="Wordle guessing grid">
          {Array.from({ length: MAX_GUESSES }).map((_, rowIdx) => {
            const isCurrentRow = rowIdx === guesses.length;
            return (
              <div
                key={rowIdx}
                className="wordle-row"
                role="row"
                style={{
                  animation: isCurrentRow && currentRowShaking ? 'shake 0.4s ease' : undefined,
                }}
              >
                {Array.from({ length: WORD_LENGTH }).map((_, colIdx) => {
                  const state = getCellState(rowIdx, colIdx);
                  const char = getCellChar(rowIdx, colIdx);
                  return (
                    <div
                      key={colIdx}
                      className={`wordle-cell ${state}`}
                      style={getCellStyle(rowIdx, colIdx)}
                      role="gridcell"
                      aria-label={char || 'empty'}
                    >
                      {char}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Status */}
        {gameOver && (
          <div style={{ margin: '0.75rem 0', textAlign: 'center' }}>
            <span
              className="status-badge"
              style={{
                background: won ? 'rgba(16,185,129,0.2)' : 'rgba(236,72,153,0.2)',
                color: won ? '#34d399' : 'var(--pink-light)',
                border: `1px solid ${won ? 'rgba(16,185,129,0.4)' : 'rgba(236,72,153,0.4)'}`,
              }}
            >
              {won ? `🎉 You got it in ${guesses.length}!` : `The word was "${target}"`}
            </span>
          </div>
        )}

        {/* Keyboard */}
        <div className="wordle-keyboard" aria-label="Virtual keyboard">
          {KEYBOARD_ROWS.map((row, ri) => (
            <div key={ri} className="wordle-keyboard-row">
              {row.map(key => (
                <button
                  key={key}
                  className={`wordle-key ${key.length === 1 ? (keyStates[key] ?? '') : 'wide'}`}
                  onClick={() => handleKey(key)}
                  aria-label={key === '⌫' ? 'Backspace' : key}
                  disabled={gameOver && key !== 'ENTER'}
                >
                  {key}
                </button>
              ))}
            </div>
          ))}
        </div>

        <button
          onClick={reset}
          className="game-btn game-btn-primary"
          style={{ marginTop: '1.25rem' }}
        >
          🔄 New Word
        </button>
      </div>
    </main>
  );
}
