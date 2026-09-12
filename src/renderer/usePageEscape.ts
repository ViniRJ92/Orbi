/**
 * Esc fecha a página aberta e volta para a instância (comportamento das telas
 * do Orbi desde a Fase 34.1/50) — mas nunca quando há algo por cima dela
 * (assistente, busca, lembrete, novidades ou um formulário da própria página).
 * Orbi — Criado por Vinicius Braga
 */
import { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';

export function usePageEscape(enabled = true): void {
  const goHome = useAppStore((s) => s.goHome);
  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (useAppStore.getState().isBlockingOverlayOpen()) return;
      goHome();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled, goHome]);
}
