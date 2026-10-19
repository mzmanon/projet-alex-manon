'use client';

import { useState, useEffect, useTransition } from 'react';
import { getStoredStats, recordGameResult, resetPlayerStats, PlayerStats, DEFAULT_STATS } from '@/lib/stats';
import Link from 'next/link';

const GAME_META = [
  {
    id: 'tictactoe' as const,
    title: 'Tic Tac Toe',
    emoji: '✕',
    href: '/games/tictactoe',
    color: '#a78bfa',
    bg: 'rgba(139, 92, 246, 0.12)',
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  {
    id: 'wordle' as const,
    title: 'Wordle',
    emoji: '🔤',
    href: '/games/wordle',
    color: '#34d399',
    bg: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  {
    id: 'chess' as const,
    title: 'Chess',
    emoji: '♟',
    href: '/games/chess',
    color: '#67e8f9',
    bg: 'rgba(6, 182, 212, 0.12)',
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  {
    id: 'naval' as const,
    title: 'Naval Battle',
    emoji: '🚢',
    href: '/games/naval',
    color: '#f9a8d4',
    bg: 'rgba(236, 72, 153, 0.12)',
    borderColor: 'rgba(236, 72, 153, 0.3)',
  },
];

export default function PlayerStatsCards() {
  const [stats, setStats] = useState<PlayerStats>(DEFAULT_STATS);
  const [mounted, setMounted] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setMounted(true);
    setStats(getStoredStats());

    const handleUpdate = () => {
      setStats(getStoredStats());
    };

    window.addEventListener('player-stats-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('player-stats-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const handleReset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 4000);
      return;
    }
    startTransition(() => {
      const reset = resetPlayerStats();
      setStats(reset);
      setConfirmReset(false);
    });
  };

  const handleSimulateWin = (gameId: 'tictactoe' | 'wordle' | 'chess' | 'naval' = 'tictactoe') => {
    startTransition(() => {
      const updated = recordGameResult(gameId, 'win');
      setStats(updated);
    });
  };

  const winRate =
    stats.totalPlayed > 0
      ? Math.round((stats.totalWon / stats.totalPlayed) * 100)
      : 0;

  return (
    <section className="player-stats-section" id="stats" aria-labelledby="player-stats-title">
      <div className="player-stats-container">
        {/* Header with Title and Quick Actions */}
        <div className="player-stats-header">
          <div>
            <div className="player-stats-badge">
              <span className="badge-pulse"></span>
              <span>STATISTIQUES DU JOUEUR</span>
            </div>
            <h2 id="player-stats-title" className="player-stats-title">
              Vos Performances <span className="gradient-text">en Direct</span>
            </h2>
            <p className="player-stats-subtitle">
              Retrouvez l&apos;historique de vos parties jouées et de vos victoires sur chaque mini-jeu.
            </p>
          </div>

          <div className="player-stats-actions">
            <button
              onClick={() => handleSimulateWin('tictactoe')}
              className="btn btn-secondary stats-action-btn"
              title="Ajouter une victoire test pour voir les compteurs s'animer"
              type="button"
            >
              <span>+ Victoire test</span>
            </button>
            <button
              onClick={handleReset}
              className={`btn stats-action-btn ${confirmReset ? 'btn-danger' : 'btn-secondary'}`}
              type="button"
              title="Remettre à zéro les statistiques"
            >
              <span>{confirmReset ? 'Confirmer ?' : '🔄 Réinitialiser'}</span>
            </button>
          </div>
        </div>

        {/* 4 Main Square Cards */}
        <div className="player-cards-grid">
          {/* Card 1: Parties Jouées */}
          <div className="player-card card-played">
            <div className="player-card-glow" />
            <div className="player-card-top">
              <span className="player-card-icon">🎮</span>
              <span className="player-card-tag tag-blue">Total</span>
            </div>
            <div className="player-card-body">
              <div className="player-card-value">
                {mounted ? stats.totalPlayed : '0'}
              </div>
              <div className="player-card-label">Parties Jouées</div>
              <div className="player-card-meta">
                {stats.totalPlayed === 0
                  ? 'Aucune partie jouée pour le moment'
                  : `${stats.totalPlayed} partie${stats.totalPlayed > 1 ? 's' : ''} terminée${stats.totalPlayed > 1 ? 's' : ''}`}
              </div>
            </div>
          </div>

          {/* Card 2: Parties Gagnées */}
          <div className="player-card card-won">
            <div className="player-card-glow" />
            <div className="player-card-top">
              <span className="player-card-icon">🏆</span>
              <span className="player-card-tag tag-green">Victoires</span>
            </div>
            <div className="player-card-body">
              <div className="player-card-value text-green">
                {mounted ? stats.totalWon : '0'}
              </div>
              <div className="player-card-label">Parties Gagnées</div>
              <div className="player-card-meta">
                {stats.totalWon === 0
                  ? 'Prêt pour votre premier trophée !'
                  : `${stats.totalWon} victoire${stats.totalWon > 1 ? 's' : ''} enregistrée${stats.totalWon > 1 ? 's' : ''}`}
              </div>
            </div>
          </div>

          {/* Card 3: Défaites & Égalités */}
          <div className="player-card card-lost">
            <div className="player-card-glow" />
            <div className="player-card-top">
              <span className="player-card-icon">🎯</span>
              <span className="player-card-tag tag-pink">Revers</span>
            </div>
            <div className="player-card-body">
              <div className="player-card-value text-pink">
                {mounted ? stats.totalLost : '0'}
              </div>
              <div className="player-card-label">Défaites subies</div>
              <div className="player-card-meta">
                {stats.totalDrawn > 0
                  ? `+ ${stats.totalDrawn} égalité${stats.totalDrawn > 1 ? 's' : ''}`
                  : 'Chaque défaite forge l’expérience'}
              </div>
            </div>
          </div>

          {/* Card 4: Taux de Victoire */}
          <div className="player-card card-rate">
            <div className="player-card-glow" />
            <div className="player-card-top">
              <span className="player-card-icon">⚡</span>
              <span className="player-card-tag tag-gold">Précision</span>
            </div>
            <div className="player-card-body">
              <div className="player-card-value text-gold">
                {mounted ? `${winRate}%` : '0%'}
              </div>
              <div className="player-card-label">Taux de Victoire</div>
              <div className="rate-bar-container">
                <div
                  className="rate-bar-fill"
                  style={{ width: `${mounted ? winRate : 0}%` }}
                />
              </div>
              <div className="player-card-meta">
                {stats.totalPlayed === 0
                  ? 'En attente d’une première partie'
                  : `${stats.totalWon} sur ${stats.totalPlayed} partie${stats.totalPlayed > 1 ? 's' : ''}`}
              </div>
            </div>
          </div>
        </div>

        {/* Per-Game Breakdown */}
        <div className="games-breakdown">
          <div className="breakdown-title-row">
            <h3 className="breakdown-title">Détail par jeu</h3>
            <span className="breakdown-badge">Mise à jour automatique</span>
          </div>

          <div className="games-breakdown-grid">
            {GAME_META.map((g) => {
              const gameStat = stats.games[g.id] || { played: 0, won: 0, lost: 0, drawn: 0 };
              const gameRate =
                gameStat.played > 0
                  ? Math.round((gameStat.won / gameStat.played) * 100)
                  : 0;

              return (
                <Link
                  key={g.id}
                  href={g.href}
                  className="breakdown-card"
                  style={{ '--game-accent': g.color } as React.CSSProperties}
                >
                  <div className="breakdown-card-header">
                    <span className="breakdown-emoji" style={{ background: g.bg, color: g.color }}>
                      {g.emoji}
                    </span>
                    <div>
                      <div className="breakdown-game-name">{g.title}</div>
                      <div className="breakdown-game-rate">
                        {gameStat.played > 0 ? `${gameRate}% victoires` : 'Pas encore joué'}
                      </div>
                    </div>
                  </div>

                  <div className="breakdown-metrics">
                    <div className="metric-box">
                      <span className="metric-num">{mounted ? gameStat.played : 0}</span>
                      <span className="metric-lbl">Jouées</span>
                    </div>
                    <div className="metric-box">
                      <span className="metric-num text-green">{mounted ? gameStat.won : 0}</span>
                      <span className="metric-lbl">Gagnées</span>
                    </div>
                    <div className="metric-box">
                      <span className="metric-num text-pink">{mounted ? gameStat.lost : 0}</span>
                      <span className="metric-lbl">Perdues</span>
                    </div>
                  </div>

                  <div className="breakdown-progress-track">
                    <div
                      className="breakdown-progress-fill"
                      style={{
                        width: `${mounted ? gameRate : 0}%`,
                        backgroundColor: g.color,
                      }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Informative helper note */}
        {mounted && stats.totalPlayed === 0 && (
          <div className="stats-empty-hint">
            <span>💡</span>
            <p>
              Vos statistiques s’actualisent automatiquement dès que vous terminez une partie dans l&apos;un des 4 jeux. Vous pouvez aussi cliquer sur <strong>&quot;+ Victoire test&quot;</strong> ci-dessus pour observer le fonctionnement en direct !
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
