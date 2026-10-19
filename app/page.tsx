'use client';

import Link from 'next/link';

interface GameItem {
  href: string;
  title: string;
  tag: string;
  desc: string;
  players: string;
  themeClass: string;
  accent: string;
  accentLight: string;
  glow: string;
  iconSvg: React.ReactNode;
}

const games: GameItem[] = [
  {
    href: '/games/tictactoe',
    title: 'Tic Tac Toe',
    tag: 'Strategy',
    desc: 'Classic three-in-a-row match with unbeatable Minimax AI or 2-player local mode.',
    players: '1-2 Players',
    themeClass: 'theme-purple',
    accent: '#8b5cf6',
    accentLight: '#c084fc',
    glow: 'rgba(139, 92, 246, 0.18)',
    iconSvg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    ),
  },
  {
    href: '/games/wordle',
    title: 'Wordle',
    tag: 'Word Game',
    desc: 'Guess the secret 5-letter word in 6 attempts with full 14,800+ dictionary support.',
    players: 'Solo',
    themeClass: 'theme-green',
    accent: '#10b981',
    accentLight: '#34d399',
    glow: 'rgba(16, 185, 129, 0.18)',
    iconSvg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    href: '/games/chess',
    title: 'Chess',
    tag: 'Classic',
    desc: 'The timeless game of kings with legal move highlighting, castling, and checkmate.',
    players: '1-2 Players',
    themeClass: 'theme-blue',
    accent: '#06b6d4',
    accentLight: '#38bdf8',
    glow: 'rgba(6, 182, 212, 0.18)',
    iconSvg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3c0 .8.3 1.5.8 2.1C8 8.4 6 11 6 15v1h12v-1c0-4-2-6.6-3.8-7.9.5-.6.8-1.3.8-2.1a3 3 0 0 0-3-3z" />
        <path d="M5 20h14a1 1 0 0 1 1 1v1H4v-1a1 1 0 0 1 1-1z" />
      </svg>
    ),
  },
  {
    href: '/games/naval',
    title: 'Naval Battle',
    tag: 'Action',
    desc: 'Strategically position your fleet and hunt enemy battleships against smart AI radar.',
    players: 'vs Smart AI',
    themeClass: 'theme-pink',
    accent: '#ec4899',
    accentLight: '#f472b6',
    glow: 'rgba(236, 72, 153, 0.18)',
    iconSvg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 17l2.5-9 15 0 2.5 9z" />
        <path d="M6 8V4h4v4" />
        <path d="M14 8V5h3v3" />
        <path d="M2 21c2 0 3-1 5-1s3 1 5 1 3-1 5-1 3 1 5 1" />
      </svg>
    ),
  },
];

export default function HomePage() {
  return (
    <>
      {/* Background Starscape */}
      <div className="stars-bg" aria-hidden="true">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="star"
            style={{
              left: `${(i * 19.3) % 100}%`,
              top: `${(i * 23.7) % 100}%`,
              width: `${(i % 3) + 1.5}px`,
              height: `${(i % 3) + 1.5}px`,
              opacity: ((i % 5) + 3) * 0.1,
              '--dur': `${(i % 4) + 2}s`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      <main className="hub-container" style={{ paddingTop: '7rem' }}>
        {/* Hub Header */}
        <div className="hub-header">
          <div className="header-badge-row">
            <span className="badge-count">🎮 4 Games Available</span>
            <span className="badge-live">
              <span className="live-dot" /> Play in Browser (No Install)
            </span>
          </div>
          <h1 className="hub-title">Classic Mini Games Arcade</h1>
          <p className="hub-subtitle">
            Choose a game below to play immediately. Fully responsive on mobile, tablet, and desktop with smart AI opponents.
          </p>
        </div>

        {/* Responsive Game Cards Grid (1 col mobile, 2 col tablet, 4 col desktop) */}
        <div className="games-grid">
          {games.map((game) => (
            <Link
              key={game.href}
              href={game.href}
              className={`game-card ${game.themeClass}`}
              aria-label={`Play ${game.title}`}
            >
              <div>
                <div className="card-head">
                  <div className="card-icon-square">
                    {game.iconSvg}
                  </div>
                  <span className="card-tag">{game.tag}</span>
                </div>
                <div className="card-content">
                  <h2 className="card-title">{game.title}</h2>
                  <p className="card-description">{game.desc}</p>
                </div>
              </div>

              <div className="card-footer">
                <span className="player-badge">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                  </svg>
                  {game.players}
                </span>
                <span className="play-action">
                  Play <span>→</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <footer className="site-footer">
        <p>© 2026 GameHub • Built with pure HTML, CSS, and TypeScript. Ready for GitHub Pages.</p>
      </footer>
    </>
  );
}
