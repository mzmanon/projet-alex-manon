'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const games = [
  { href: '/games/tictactoe', label: 'Tic Tac Toe' },
  { href: '/games/wordle', label: 'Wordle' },
  { href: '/games/chess', label: 'Chess' },
  { href: '/games/naval', label: 'Naval Battle' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <Link href="/" className="navbar-logo" aria-label="GameHub Home">
        <span className="navbar-logo-icon">🎮</span>
        GameHub
      </Link>
      <ul className="navbar-links">
        {games.map((g) => (
          <li key={g.href}>
            <Link
              href={g.href}
              style={{ color: pathname === g.href ? 'var(--purple-light)' : undefined }}
            >
              {g.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
