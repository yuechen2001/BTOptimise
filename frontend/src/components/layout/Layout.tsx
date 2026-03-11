import type { ReactNode } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { useAppState } from '../../context/AppContext';

export default function Layout({ children }: { children: ReactNode }) {
  const { state, dispatch } = useAppState();
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  const navItems = [
    { to: '/' as const, label: 'Onboarding' },
    { to: '/dashboard' as const, label: 'Dashboard' },
    { to: '/compare' as const, label: 'Compare' },
    { to: '/oversubscription' as const, label: 'Oversubscription' },
  ];

  return (
    <div className="layout">
      <header className="layout__header">
        <Link to="/" style={{ textDecoration: 'none' }}>
          <div className="layout__logo">
            BT<span>Optimise</span>
          </div>
        </Link>
        <nav className="layout__nav">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={pathname === item.to ? 'active' : ''}
            >
              {item.label}
            </Link>
          ))}
          {state.onboarding.completed && (
            <button
              onClick={() => dispatch({ type: 'RESET' })}
            >
              Reset
            </button>
          )}
        </nav>
      </header>

      <main className="layout__main">
        {children}
      </main>

      <footer className="layout__footer">
        BTOptimise — Prototype for educational purposes. Not financial advice.
        Data sourced from HDB public releases.
      </footer>
    </div>
  );
}
