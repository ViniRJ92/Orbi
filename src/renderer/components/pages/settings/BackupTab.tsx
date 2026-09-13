/**
 * Configurações > Backup & Diagnóstico (tela do Stitch): exportar/restaurar
 * a organização das instâncias, métricas reais do processo, últimas linhas do
 * log de diagnóstico, limpeza de cache (Fase 52) e apagar o histórico do
 * Analytics (Fase 14/33.2).
 * Orbi — Criado por Vinicius Braga
 */
import { useEffect, useState } from 'react';
import { DiagnosticsInfo } from '../../../types';
import { formatBytes } from '../../../format';
import { Icon } from '../../ui/Icon';

interface LogLine {
  time: string;
  level: string;
  message: string;
}

function parseLog(line: string): LogLine {
  const m = /^\[([^\]]+)\]\s*\[(\w+)\]\s*(.*)$/.exec(line);
  if (!m) return { time: '', level: '', message: line };
  const d = new Date(m[1]);
  const time = Number.isNaN(d.getTime())
    ? m[1]
    : `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} ${d.toLocaleTimeString('pt-BR')}`;
  return { time, level: m[2], message: m[3] };
}

const LEVEL_STYLE: Record<string, string> = {
  INFO: 'bg-primary/5 text-primary',
  WARN: 'bg-secondary-container/20 text-secondary',
  ERROR: 'bg-error/15 text-error',
};

function MetricCard({
  label,
  icon,
  iconColor,
  value,
  unit,
  caption,
  bar,
  barColor,
  valueColor = 'text-on-surface',
}: {
  label: string;
  icon: string;
  iconColor: string;
  value: string;
  unit?: string;
  caption: React.ReactNode;
  bar: number;
  barColor: string;
  valueColor?: string;
}) {
  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-lg bg-surface-container-high p-space-md shadow-md transition-all hover:bg-surface-variant">
      <div className="mb-space-xs flex items-center justify-between">
        <span className="truncate font-body-sm text-body-sm font-medium text-on-surface-variant">{label}</span>
        <Icon name={icon} className={`text-[18px] ${iconColor}`} />
      </div>
      <div className="space-y-0.5">
        <div className={`font-metric-xl text-metric-xl font-bold tracking-tight ${valueColor}`}>
          {value}
          {unit && <span className="font-body-sm text-body-sm font-normal text-on-surface-variant"> {unit}</span>}
        </div>
        <div className="flex items-center gap-1 font-body-sm text-body-sm text-outline">{caption}</div>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-container-lowest">
        <div className={`h-full ${barColor}`} style={{ width: `${Math.min(100, Math.max(0, bar))}%` }} />
      </div>
    </div>
  );
}

export function BackupTab({ diagnostics }: { diagnostics: DiagnosticsInfo | null }) {
  const [logLines, setLogLines] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [cacheResult, setCacheResult] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      window.multiwhats.readRecentLogs(expanded ? 80 : 6).then((lines) => {
        if (!cancelled) setLogLines(lines);
      });
    load();
    const t = setInterval(load, 5000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [expanded]);

  const exportBackup = async () => {
    const result = await window.multiwhats.exportBackup();
    if (result.canceled) return;
    if (result.error) return window.alert(result.error);
    window.alert(`Backup salvo em: ${result.savedTo}`);
  };

  const importBackup = async () => {
    const confirmed = window.confirm(
      'Restaurar um backup atualiza nomes/cores das instâncias que já existem e recria as que faltarem (sem apagar as atuais). Continuar?'
    );
    if (!confirmed) return;
    const result = await window.multiwhats.importBackup();
    if (result.canceled) return;
    if (result.error) return window.alert(result.error);
    window.alert(`Backup restaurado: ${result.restored} instância(s) recriada(s), ${result.updated} atualizada(s).`);
  };

  const clearCache = async () => {
    setClearingCache(true);
    setCacheResult(null);
    try {
      const { freedBytes, accounts } = await window.multiwhats.clearCache();
      setCacheResult(
        freedBytes > 0
          ? `${formatBytes(freedBytes)} liberados em ${accounts} ${accounts === 1 ? 'instância' : 'instâncias'}.`
          : 'Nada para limpar: o cache já estava vazio.'
      );
    } catch {
      setCacheResult('Não foi possível limpar o cache.');
    } finally {
      setClearingCache(false);
    }
  };

  const clearAnalytics = async () => {
    const confirmed = window.confirm(
      'Apagar todo o histórico do Analytics? Isso remove todas as métricas de mensagens já registradas e não pode ser desfeito.'
    );
    if (!confirmed) return;
    await window.multiwhats.clearAnalytics();
    window.alert('Histórico do Analytics apagado.');
  };

  const d = diagnostics;
  const loadedPct = d && d.totalAccounts > 0 ? (d.loadedAccounts / d.totalAccounts) * 100 : 0;
  const memPct = d && d.systemMemoryBytes > 0 ? (d.memoryBytes / d.systemMemoryBytes) * 100 : 0;
  const logPct = d ? (d.logSizeBytes / (5 * 1024 * 1024)) * 100 : 0;

  return (
    <div className="space-y-space-xl">
      <section className="relative overflow-hidden rounded-lg bg-surface-container-low p-space-lg shadow-md">
        <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-primary/5 blur-2xl" />
        <div className="flex flex-col justify-between gap-space-md lg:flex-row lg:items-center">
          <div className="max-w-2xl space-y-space-xs">
            <div className="flex items-center gap-space-xs">
              <Icon name="inventory_2" className="text-[20px] text-primary" />
              <h2 className="whitespace-nowrap font-headline-sm text-headline-sm font-semibold text-on-surface">Backup das instâncias</h2>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Salva só os nomes, cores, ícones, ordem e agrupamentos das instâncias, nunca o login ou os dados da sessão. Útil para
              não perder a organização da lista; não substitui autenticar de novo se os dados da sessão forem apagados.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-space-sm pt-space-sm lg:pt-0">
            <button
              type="button"
              onClick={exportBackup}
              className="flex items-center gap-space-xs whitespace-nowrap rounded bg-primary px-space-md py-space-sm font-title-md text-body-sm text-on-primary shadow-[0_0_14px_rgba(0,220,130,0.3)] transition-all hover:bg-surface-tint active:scale-95"
            >
              <Icon name="file_download" className="text-[18px]" />
              Exportar backup
            </button>
            <button
              type="button"
              onClick={importBackup}
              className="flex items-center gap-space-xs whitespace-nowrap rounded bg-surface-container px-space-md py-space-sm font-title-md text-body-sm text-on-surface transition-colors hover:bg-surface-container-high active:scale-95"
            >
              <Icon name="file_upload" className="text-[18px]" />
              Restaurar backup
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-space-md">
        <div className="flex flex-wrap items-center justify-between gap-space-xs">
          <div className="flex flex-wrap items-center gap-space-xs">
            <Icon name="monitor_heart" className="text-[20px] text-secondary" />
            <h2 className="whitespace-nowrap font-headline-sm text-headline-sm font-semibold text-on-surface">Diagnóstico do sistema</h2>
          </div>
          <div className="flex items-center gap-space-sm">
            <button
              type="button"
              onClick={() => window.multiwhats.openLogsFolder()}
              className="flex items-center gap-space-xs whitespace-nowrap rounded bg-surface-container px-space-md py-1.5 font-title-md text-body-sm text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
            >
              <Icon name="folder_open" className="text-[16px]" />
              Abrir pasta de logs
            </button>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-space-xs whitespace-nowrap rounded bg-surface-container px-space-md py-1.5 font-title-md text-body-sm text-secondary transition-colors hover:bg-surface-container-high"
            >
              <Icon name="terminal" className="text-[16px]" />
              {expanded ? 'Mostrar menos linhas' : 'Ver últimas linhas'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-gutter md:grid-cols-3 2xl:grid-cols-6">
          <MetricCard label="Instâncias" icon="dns" iconColor="text-primary" value={String(d?.totalAccounts ?? '—')} valueColor="text-primary" caption="configuradas" bar={d && d.totalAccounts > 0 ? 100 : 0} barColor="bg-primary shadow-[0_0_10px_rgba(0,220,130,0.4)]" />
          <MetricCard
            label="Carregadas"
            icon="sync_saved_locally"
            iconColor="text-secondary"
            value={String(d?.loadedAccounts ?? '—')}
            valueColor="text-secondary"
            caption={
              <>
                <span className="font-bold text-primary">{loadedPct.toFixed(0)}%</span> em memória
              </>
            }
            bar={loadedPct}
            barColor="bg-secondary"
          />
          <MetricCard label="Volume log" icon="description" iconColor="text-on-surface-variant" value={d ? formatBytes(d.logSizeBytes).split(' ')[0] : '—'} unit={d ? formatBytes(d.logSizeBytes).split(' ')[1] : undefined} caption="tamanho do arquivo" bar={logPct} barColor="bg-primary-fixed-dim" />
          <MetricCard
            label="Memória RAM"
            icon="memory"
            iconColor="text-tertiary"
            value={d ? (d.memoryBytes / (1024 * 1024)).toFixed(1) : '—'}
            unit="MB"
            valueColor="text-tertiary"
            caption={`${memPct.toFixed(1)}% da memória do PC`}
            bar={memPct}
            barColor="bg-tertiary shadow-[0_0_10px_rgba(0,220,130,0.4)]"
          />
          <MetricCard
            label="CPU"
            icon="speed"
            iconColor="text-primary"
            value={d ? String(d.cpuPercent) : '—'}
            unit="%"
            valueColor="text-primary"
            caption="soma dos processos"
            bar={d?.cpuPercent ?? 0}
            barColor="bg-primary"
          />
          <MetricCard label="Processos" icon="view_timeline" iconColor="text-secondary" value={String(d?.processCount ?? '—')} caption="janela + instâncias" bar={d ? Math.min(100, d.processCount * 3) : 0} barColor="bg-secondary-container" />
        </div>

        <div className="space-y-space-xs rounded-lg bg-surface-container-lowest p-space-md">
          <div className="flex items-center justify-between pb-space-xs">
            <div className="flex items-center gap-space-xs">
              <span className="font-title-md text-title-md font-semibold text-on-surface">Log de diagnóstico</span>
            </div>
            <span className="font-body-sm text-body-sm text-outline">últimas {expanded ? 80 : 6} linhas</span>
          </div>
          <div className={'select-text space-y-1 overflow-x-auto rounded bg-surface-container-low/50 p-space-sm font-code-sm text-code-sm text-on-surface-variant ' + (expanded ? 'max-h-72 overflow-y-auto' : '')}>
            {logLines.length === 0 ? (
              <div className="px-1 py-0.5 text-outline">Sem entradas no log ainda.</div>
            ) : (
              logLines.map((raw, i) => {
                const l = parseLog(raw);
                return (
                  <div key={i} className="flex items-center gap-2 rounded px-1 py-0.5 transition-colors hover:bg-surface-container-high">
                    {l.time && <span className="flex-shrink-0 select-none text-outline">{l.time}</span>}
                    {l.level && (
                      <span className={`flex-shrink-0 rounded px-1.5 py-0.5 font-badge-micro text-badge-micro font-bold tracking-wide ${LEVEL_STYLE[l.level] ?? 'bg-surface-container text-outline'}`}>
                        [{l.level}]
                      </span>
                    )}
                    <span title={l.message} className={'min-w-0 truncate ' + (l.level === 'ERROR' ? 'text-error' : 'text-on-surface')}>{l.message}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      <section className="rounded-lg bg-surface-container-low p-space-lg shadow-md">
        <div className="flex flex-col justify-between gap-space-md md:flex-row md:items-center">
          <div className="max-w-2xl space-y-space-xs">
            <div className="flex items-center gap-space-xs">
              <Icon name="hard_drive" className="text-[20px] text-secondary" />
              <h2 className="whitespace-nowrap font-headline-sm text-headline-sm font-semibold text-on-surface">Espaço em disco</h2>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Apaga o cache de imagens e arquivos temporários de todas as instâncias. Não desconecta nenhuma conta, não pede QR Code
              e não apaga conversas, configurações ou o histórico do Analytics. Depois de limpar, cada instância demora um pouco mais
              para abrir na primeira vez.
            </p>
            {cacheResult && (
              <span className="flex items-center gap-1 pt-space-xs font-code-sm text-code-sm text-primary">
                <Icon name="verified" className="text-[14px]" /> {cacheResult}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={clearCache}
            disabled={clearingCache}
            className="flex items-center gap-space-xs whitespace-nowrap rounded bg-surface-container-high px-space-md py-space-sm font-title-md text-body-sm text-on-surface transition-colors hover:bg-error-container hover:text-on-error-container active:scale-95 disabled:opacity-60"
          >
            <Icon name={clearingCache ? 'sync' : 'delete_sweep'} className={'text-[18px] ' + (clearingCache ? 'animate-spin' : '')} />
            {clearingCache ? 'Limpando…' : 'Limpar cache'}
          </button>
        </div>
      </section>

      <section className="rounded-lg bg-surface-container-low p-space-lg shadow-md">
        <div className="flex flex-col justify-between gap-space-md md:flex-row md:items-center">
          <div className="max-w-2xl space-y-space-xs">
            <div className="flex items-center gap-space-xs">
              <Icon name="monitoring" className="text-[20px] text-error" />
              <h2 className="whitespace-nowrap font-headline-sm text-headline-sm font-semibold text-on-surface">Histórico do Analytics</h2>
              <span className="font-body-sm text-body-sm text-error">(não dá para desfazer)</span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Apaga todo o histórico de mensagens contabilizado no Analytics. Não afeta as instâncias, conversas ou dados de login.
            </p>
          </div>
          <button
            type="button"
            onClick={clearAnalytics}
            className="flex items-center gap-space-xs whitespace-nowrap rounded bg-surface-container-high px-space-md py-space-sm font-title-md text-body-sm text-error transition-colors hover:bg-error-container hover:text-on-error-container active:scale-95"
          >
            <Icon name="delete_forever" className="text-[18px]" />
            Apagar histórico do Analytics
          </button>
        </div>
      </section>

      <p className="flex items-center gap-space-xs px-space-xs font-body-sm text-body-sm text-outline">
        <Icon name="info" className="text-[16px]" />
        Configurações e dados ficam só neste computador.
      </p>
    </div>
  );
}
