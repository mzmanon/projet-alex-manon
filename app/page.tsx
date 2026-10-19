import Link from 'next/link';
import PlayerStatsCards from '@/app/components/PlayerStatsCards';

const STARS = Array.from({ length: 80 }, (_, i) => {
  const left = (i * 37 + 13) % 100;
  const top = (i * 73 + 29) % 100;
  const size = (((i * 19) % 20) / 10 + 1).toFixed(1);
  const opacity = (((i * 41) % 55 + 15) / 100).toFixed(2);
  const dur = (((i * 31) % 35 + 20) / 10).toFixed(1);
  return { left: `${left}%`, top: `${top}%`, size: `${size}px`, opacity, dur: `${dur}s` };
});

const games = [
  {
    href: '/games/tictactoe',
    emoji: '✕',
    title: 'Tic Tac Toe',
    tag: 'Strategy',
    desc: 'Classic three-in-a-row game. Challenge a friend or test your skills against an AI opponent.',
    players: '1-2 Players',
    color: 'var(--cyan)',
    colorLight: 'var(--cyan-light)',
    bg: 'rgba(2, 132, 199, 0.1)',
    tagBg: 'rgba(2, 132, 199, 0.14)',
    tagColor: 'var(--cyan)',
    glow: 'radial-gradient(ellipse at 50% 100%, rgba(2, 132, 199, 0.25) 0%, transparent 70%)',
  },
  {
    href: '/games/wordle',
    emoji: '🔤',
    title: 'Wordle',
    tag: 'Word Game',
    desc: 'Guess the hidden 5-letter word in 6 tries. Color hints guide your way to the answer.',
    players: '1 Player',
    color: 'var(--green)',
    colorLight: '#10b981',
    bg: 'rgba(16, 185, 129, 0.1)',
    tagBg: 'rgba(16, 185, 129, 0.14)',
    tagColor: 'var(--green)',
    glow: 'radial-gradient(ellipse at 50% 100%, rgba(16, 185, 129, 0.2) 0%, transparent 70%)',
  },
  {
    href: '/games/chess',
    emoji: '♟',
    title: 'Chess',
    tag: 'Classic',
    desc: 'The timeless game of kings. Battle in a full chess match with all rules enforced.',
    players: '2 Players',
    color: 'var(--cyan)',
    colorLight: 'var(--cyan-light)',
    bg: 'rgba(2, 132, 199, 0.1)',
    tagBg: 'rgba(2, 132, 199, 0.14)',
    tagColor: 'var(--cyan)',
    glow: 'radial-gradient(ellipse at 50% 100%, rgba(2, 132, 199, 0.25) 0%, transparent 70%)',
  },
  {
    href: '/games/naval',
    emoji: '🚢',
    title: 'Naval Battle',
    tag: 'Action',
    desc: 'Sink the enemy fleet before they sink yours! Strategic placement meets sharp intuition.',
    players: '1 Player vs AI',
    color: '#2563eb',
    colorLight: '#60a5fa',
    bg: 'rgba(37, 99, 235, 0.1)',
    tagBg: 'rgba(37, 99, 235, 0.14)',
    tagColor: '#2563eb',
    glow: 'radial-gradient(ellipse at 50% 100%, rgba(37, 99, 235, 0.2) 0%, transparent 70%)',
  },
];

export default function HomePage() {
  return (
    <>
      {/* Stars */}
      <div className="stars-bg" aria-hidden="true">
        {STARS.map((s, i) => (
          <div
            key={i}
            className="star"
            style={{
              left: s.left,
              top: s.top,
              width: s.size,
              height: s.size,
              opacity: s.opacity,
              '--dur': s.dur,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Hero */}
      <section className="hero" id="hero" aria-labelledby="hero-title">
        <div className="hero-badge">
          <span>✨</span>
          <span>4 Games · No Signup · Free Forever</span>
        </div>

        <h1 className="hero-title" id="hero-title">
          Your Arcade,{' '}
          <span className="gradient-text">Reimagined</span>
        </h1>

        <p className="hero-desc">
          Enjoy beautifully crafted mini games right in your browser. From classic strategy to word puzzles — all in one place.
        </p>

        <div className="hero-cta">
          <a href="#games" className="btn btn-primary">
            🎮 Browse Games
          </a>
          <a href="#stats" className="btn btn-secondary">
            📊 View Stats ↓
          </a>
        </div>

        {/* Stats */}
        <div className="stats-grid" style={{ maxWidth: 720, marginTop: '4rem' }}>
          {[
            { value: '4', label: 'Epic Games' },
            { value: '∞', label: 'Replays' },
            { value: '0s', label: 'Setup Time' },
            { value: '100%', label: 'Free' },
          ].map((s) => (
            <div className="stat-card" key={s.label}>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Player Statistics Section */}
      <PlayerStatsCards />

      {/* Games Section */}
      <section id="games" className="section" aria-labelledby="games-title">
        <div className="section-header">
          <span className="section-label">Game Library</span>
          <h2 className="section-title" id="games-title">Pick Your Game</h2>
          <p className="section-subtitle">
            Every game is fully playable, polished, and packed with features.
          </p>
        </div>

        <div className="games-grid">
          {games.map((game) => (
            <Link
              key={game.href}
              href={game.href}
              className="game-card"
              aria-label={`Play ${game.title}`}
            >
              {/* Glow overlay */}
              <div
                className="game-card-glow"
                style={{ background: game.glow }}
              />

              {/* Visual */}
              <div
                className="game-card-visual"
                style={{ background: game.bg }}
              >
                <span
                  className="game-card-icon"
                  style={{ color: game.color }}
                >
                  {game.emoji}
                </span>
              </div>

              {/* Content */}
              <div className="game-card-content">
                <span
                  className="game-card-tag"
                  style={{
                    background: game.tagBg,
                    color: game.tagColor,
                  }}
                >
                  {game.tag}
                </span>
                <h3 className="game-card-title">{game.title}</h3>
                <p className="game-card-desc">{game.desc}</p>
                <div className="game-card-footer">
                  <span className="game-card-players">
                    👥 {game.players}
                  </span>
                  <span
                    className="game-card-play"
                    style={{
                      background: game.tagBg,
                      color: game.tagColor,
                    }}
                  >
                    Play now →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>
          Built with ❤️ by{' '}
          <a href="#">Alex & Manon</a>
          {' · '}
          <a href="https://nextjs.org" target="_blank" rel="noopener noreferrer">
            Powered by Next.js
          </a>
        </p>
      </footer>
    </>
  );
}
