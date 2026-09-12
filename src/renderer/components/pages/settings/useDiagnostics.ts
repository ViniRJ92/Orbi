/**
 * Consumo real do Orbi (memória, CPU, processos, log) medido pelo processo
 * principal (`app.getAppMetrics()`), atualizado enquanto a tela está aberta.
 * Orbi — Criado por Vinicius Braga
 */
import { useEffect, useState } from 'react';
import { DiagnosticsInfo } from '../../../types';

export function useDiagnostics(intervalMs = 5000): DiagnosticsInfo | null {
  const [data, setData] = useState<DiagnosticsInfo | null>(null);
  useEffect(() => {
    let cancelled = false;
    const load = () =>
      window.multiwhats
        .getDiagnostics()
        .then((d) => {
          if (!cancelled) setData(d);
        })
        .catch(() => {});
    load();
    const t = setInterval(load, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [intervalMs]);
  return data;
}
