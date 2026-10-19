'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface GameItem {
  href: string;
  name: string;
  subtitle: string;
  badge: string;
  players: string;
  accent: string;
  accentLight: string;
  bgGlow: string;
  iconSvg: React.ReactNode;
}

const GAMES: GameItem[] = [
  {
    href: '/games/tictactoe',
    name: 'Tic Tac Toe',
    subtitle: 'Classic 3-in-a-row with smart AI',
    badge: 'Strategy',
    players: '1-2 Players',
    accent: '#a855f7',
    accentLight: '#c084fc',
    bgGlow: 'rgba(168, 85, 247, 0.15)',
    iconSvg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    ),
  },
  {
    href: '/games/wordle',
    name: 'Wordle',
    subtitle: 'Guess the hidden 5-letter word',
    badge: 'Word Game',
    players: 'Solo',
    accent: '#10b981',
    accentLight: '#34d399',
    bgGlow: 'rgba(16, 185, 129, 0.15)',
    iconSvg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    href: '/games/chess',
    name: 'Chess',
    subtitle: 'Classic match vs AI or local friend',
    badge: 'Classic',
    players: '1-2 Players',
    accent: '#06b6d4',
    accentLight: '#22d3ee',
    bgGlow: 'rgba(6, 182, 212, 0.15)',
    iconSvg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3c0 .8.3 1.5.8 2.1C8 8.4 6 11 6 15v1h12v-1c0-4-2-6.6-3.8-7.9.5-.6.8-1.3.8-2.1a3 3 0 0 0-3-3z" />
        <path d="M5 20h14a1 1 0 0 1 1 1v1H4v-1a1 1 0 0 1 1-1z" />
      </svg>
    ),
  },
  {
    href: '/games/naval',
    name: 'Naval Battle',
    subtitle: 'Sink the enemy fleet in naval combat',
    badge: 'Action',
    players: 'vs Smart AI',
    accent: '#ec4899',
    accentLight: '#f472b6',
    bgGlow: 'rgba(236, 72, 153, 0.15)',
    iconSvg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 17l2.5-9 15 0 2.5 9z" />
        <path d="M6 8V4h4v4" />
        <path d="M14 8V5h3v3" />
        <path d="M2 21c2 0 3-1 5-1s3 1 5 1 3-1 5-1 3 1 5 1" />
      </svg>
    ),
  },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Close on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const activeGame = GAMES.find((g) => g.href === pathname);

  return (
    <header className="navbar" role="banner">
      <div className="navbar-container">
        {/* Left Section: Logo & Menu Trigger */}
        <div className="navbar-left-group" ref={menuRef}>
          {/* Brand Logo */}
          <Link href="/" className="navbar-brand" aria-label="GameHub Home">
            <span className="navbar-brand-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="6" width="20" height="12" rx="3" />
                <line x1="6" y1="12" x2="10" y2="12" />
                <line x1="8" y1="10" x2="8" y2="14" />
                <circle cx="15" cy="11" r="1" fill="currentColor" />
                <circle cx="17" cy="13" r="1" fill="currentColor" />
              </svg>
            </span>
            <span className="navbar-brand-name">GameHub</span>
          </Link>

          <span className="navbar-separator" aria-hidden="true" />

          {/* Professional Menu Dropdown Button */}
          <button
            type="button"
            className={`navbar-games-trigger ${isOpen ? 'active' : ''}`}
            onClick={() => setIsOpen((prev) => !prev)}
            aria-expanded={isOpen}
            aria-haspopup="true"
            aria-label="Browse mini-games menu"
          >
            <span className="trigger-icon-box">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
              </svg>
            </span>
            <span className="trigger-label">
              {activeGame ? activeGame.name : 'Games'}
            </span>
            <span className="trigger-chevron" aria-hidden="true">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </span>
          </button>

          {/* Professional Mega-Dropdown Menu */}
          {isOpen && (
            <div className="mega-menu-popover" role="menu">
              {/* Header Bar */}
              <div className="mega-menu-header">
                <div>
                  <h3 className="mega-menu-title">Select a Game</h3>
                  <p className="mega-menu-subtitle">Play instantly in your browser</p>
                </div>
                <span className="mega-menu-count-badge">4 Games Available</span>
              </div>

              {/* Games Grid (2 columns on wide, refined cards) */}
              <div className="mega-menu-grid">
                {GAMES.map((game) => {
                  const isActive = pathname === game.href;
                  return (
                    <Link
                      key={game.href}
                      href={game.href}
                      className={`mega-game-card ${isActive ? 'is-active' : ''}`}
                      role="menuitem"
                      onClick={() => setIsOpen(false)}
                      style={{
                        '--accent': game.accent,
                        '--accent-light': game.accentLight,
                        '--glow': game.bgGlow,
                      } as React.CSSProperties}
                    >
                      <div className="card-icon-wrapper" style={{ color: game.accentLight, background: game.bgGlow }}>
                        {game.iconSvg}
                      </div>
                      <div className="card-body">
                        <div className="card-top-row">
                          <span className="card-title">{game.name}</span>
                          <span className="card-badge">{game.badge}</span>
                        </div>
                        <p className="card-desc">{game.subtitle}</p>
                        <div className="card-footer-meta">
                          <span className="card-players">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                              <circle cx="9" cy="7" r="4" />
                            </svg>
                            {game.players}
                          </span>
                          <span className="card-arrow" aria-hidden="true">→</span>
                        </div>
                      </div>
                      {isActive && <div className="card-active-indicator" />}
                    </Link>
                  );
                })}
              </div>

              {/* Bottom Footer */}
              <div className="mega-menu-footer">
                <Link
                  href="/"
                  className="mega-footer-home-btn"
                  role="menuitem"
                  onClick={() => setIsOpen(false)}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  <span>Return to Home & All Games Overview</span>
                </Link>
                <span className="mega-footer-shortcut">
                  <kbd>ESC</kbd> to close
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Section */}
        <div className="navbar-right-group">
          {pathname !== '/' ? (
            <Link href="/" className="nav-home-pill">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>Home</span>
            </Link>
          ) : (
            <div className="nav-live-indicator">
              <span className="live-dot" />
              <span className="live-text">Arcade Ready</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
