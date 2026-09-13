/**
 * Página "Analytics" (tela do Stitch) com os dados reais do Orbi:
 *  - mesma fonte única de antes (chatActivityStore.buildAnalyticsSummary e
 *    buildDailyReport, Fases 28/32/40) — nunca o texto das mensagens;
 *  - períodos Hoje / 7 dias / 30 dias / Personalizado, filtro por
 *    agrupamento, comparação com o período anterior, exportação CSV;
 *  - atualização automática a cada 20s;
 *  - alertas em tempo real de queda de sessão/falha de carregamento, com
 *    "Reconectar";
 *  - saúde das conexões (online, offline, reconectando).
 *
 * Os gráficos são desenhados aqui mesmo (barras empilhadas e curva SVG), no
 * visual exato da tela do Stitch, a partir do mesmo resumo agregado.
 *
 * Orbi — Criado por Vinicius Braga
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccountStatus,
  AnalyticsPeriod,
  AnalyticsRange,
  AnalyticsSummary,
  ChatActivityDailySummary,
  ChatActivityDayReport,
} from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { dateInputValue, endOfDateInput, previousRange, quickRange, startOfDateInput } from '../../analyticsRange';
import { formatAgo, formatDateBR, pad2 } from '../../format';
import { usePageEscape } from '../../usePageEscape';
import { Icon } from '../ui/Icon';

const PERIODS: { key: AnalyticsPeriod; label: string }[] = [
  { key: 'today', label: 'Hoje' },
  { key: '7d', label: 'Últimos 7 dias' },
  { key: '30d', label: 'Últimos 30 dias' },
  { key: 'custom', label: 'Personalizado' },
];

const REFRESH_MS = 20_000;
const MAX_ALERTS = 8;

interface SystemAlert {
  id: string;
  accountId: string;
  message: string;
}

function connectionCategory(status: AccountStatus | undefined): 'online' | 'offline' | 'reconnecting' {
  if (!status) return 'reconnecting';
  if (status.loadError || status.suspended) return 'offline';
  if (!status.loaded) return 'reconnecting';
  return status.isOnline ? 'online' : 'reconnecting';
}

function deltaText(current: number, previous: number): { text: string; positive: boolean } {
  const diff = current - previous;
  if (diff === 0) return { text: 'igual ao anterior', positive: true };
  const pct = previous > 0 ? Math.round((diff / previous) * 1000) / 10 : null;
  const sign = diff > 0 ? '+' : '';
  return { text: pct !== null ? `${sign}${pct}% vs anterior` : `${sign}${diff} vs anterior`, positive: diff >= 0 };
}

/** Curva suave (Catmull-Rom → Bézier) pelos pontos. */
function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export function AnalyticsPage() {
  const accounts = useAppStore((s) => s.accounts);
  const statuses = useAppStore((s) => s.statuses);
  const groups = useAppStore((s) => s.groups);
  const appInfo = useAppStore((s) => s.appInfo);
  const reloadAccount = useAppStore((s) => s.reloadAccount);
  const openAccount = useAppStore((s) => s.openAccount);

  const [quick, setQuick] = useState<AnalyticsPeriod>('today');
  const [customStart, setCustomStart] = useState(() => dateInputValue(7));
  const [customEnd, setCustomEnd] = useState(() => dateInputValue(0));
  const [compare, setCompare] = useState(false);
  const [groupFilter, setGroupFilter] = useState<string | null>(null);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [prevSummary, setPrevSummary] = useState<AnalyticsSummary | null>(null);
  const [daily, setDaily] = useState<ChatActivityDailySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [updatedAt, setUpdatedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [hoverHour, setHoverHour] = useState<number | null>(null);
  const prevStatusesRef = useRef<Map<string, AccountStatus>>(new Map(statuses));

  usePageEscape();

  // Recalculado a cada chamada: "Hoje/7/30 dias" precisam avançar com o tempo.
  function currentRange(): AnalyticsRange {
    if (quick === 'custom' && customStart && customEnd) {
      const startTs = startOfDateInput(customStart);
      const endTs = endOfDateInput(customEnd);
      if (endTs > startTs) return { startTs, endTs };
    }
    return quickRange(quick === 'custom' ? 'today' : quick);
  }

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const range = currentRange();
        const result = await window.multiwhats.getAnalyticsSummary(range, groupFilter);
        if (cancelled) return;
        setSummary(result);
        if (compare) {
          const prev = await window.multiwhats.getAnalyticsSummary(previousRange(range), groupFilter);
          if (!cancelled) setPrevSummary(prev);
        } else {
          setPrevSummary(null);
        }
        const d = await window.multiwhats.getChatActivityDaily(groupFilter);
        if (!cancelled) {
          setDaily(d);
          setUpdatedAt(Date.now());
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quick, customStart, customEnd, compare, groupFilter]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Alertas em tempo real a partir das transições de status (sem leitura nova).
  useEffect(() => {
    const prevMap = prevStatusesRef.current;
    const fresh: SystemAlert[] = [];
    for (const acc of accounts) {
      const curr = statuses.get(acc.id);
      const prev = prevMap.get(acc.id);
      if (!curr || !prev) continue;
      if (prev.isOnline && !curr.isOnline && curr.loaded && !curr.suspended) {
        fresh.push({ id: `${acc.id}-drop-${Date.now()}`, accountId: acc.id, message: `${acc.name}: a sessão caiu ou o QR Code expirou` });
      }
      if (!prev.loadError && curr.loadError) {
        fresh.push({ id: `${acc.id}-error-${Date.now()}`, accountId: acc.id, message: `${acc.name}: falha ao carregar a sessão` });
      }
    }
    if (fresh.length > 0) setAlerts((list) => [...fresh, ...list].slice(0, MAX_ALERTS));
    prevStatusesRef.current = new Map(statuses);
  }, [accounts, statuses]);

  async function exportCsv() {
    setExporting(true);
    try {
      const result = await window.multiwhats.exportAnalyticsCsv(currentRange(), groupFilter);
      if (result.error) window.alert(result.error);
    } finally {
      setExporting(false);
    }
  }

  const health = useMemo(() => {
    let online = 0;
    let offline = 0;
    let reconnecting = 0;
    for (const acc of accounts) {
      const c = connectionCategory(statuses.get(acc.id));
      if (c === 'online') online++;
      else if (c === 'offline') offline++;
      else reconnecting++;
    }
    return { online, offline, reconnecting };
  }, [accounts, statuses]);

  const byAccount = summary?.byAccount ?? [];
  const maxTotal = Math.max(1, ...byAccount.map((a) => a.total));
  const volumeDelta = compare && summary && prevSummary ? deltaText(summary.totalVolume, prevSummary.totalVolume) : null;
  const leaderShare =
    summary?.leader && summary.totalVolume > 0 ? Math.round((summary.leader.total / summary.totalVolume) * 1000) / 10 : 0;
  const range = currentRange();

  // --- Curva de horários ---
  const timeline = summary?.timeline ?? Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }));
  const prevTimeline = prevSummary?.timeline ?? [];
  const chartMax = Math.max(4, ...timeline.map((t) => t.count), ...(compare ? prevTimeline.map((t) => t.count) : [])) * 1.2;
  const toPoint = (i: number, v: number) => ({ x: (i / 23) * 500, y: 145 - (v / chartMax) * 130 });
  const todayPoints = timeline.map((t, i) => toPoint(i, t.count));
  const prevPoints = prevTimeline.map((t, i) => toPoint(i, t.count));
  const todayPath = smoothPath(todayPoints);
  const peakHour = timeline.reduce((best, t) => (t.count > timeline[best].count ? t.hour : best), 0);
  const hasTimeline = timeline.some((t) => t.count > 0);
  const markerHour = hoverHour ?? peakHour;
  const markerPoint = todayPoints[markerHour];

  return (
    <div className="h-full overflow-y-auto px-space-lg pb-space-xl pt-space-md">
      <div className="flex w-full flex-col gap-space-md">
        {/* Barra de filtros */}
        <div className="flex flex-col justify-between gap-space-md rounded-xl bg-surface-container-low p-space-md shadow-md lg:flex-row lg:items-center">
          <div className="flex flex-wrap items-center gap-space-sm">
            <div className="flex items-center rounded-lg bg-surface-container-lowest p-0.5">
              {PERIODS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setQuick(p.key)}
                  className={
                    'rounded-lg px-space-md py-1.5 font-title-md text-title-md transition-all ' +
                    (quick === p.key ? 'bg-surface-container-high font-semibold text-primary' : 'text-on-surface-variant hover:text-on-surface')
                  }
                >
                  {p.label}
                </button>
              ))}
            </div>
            {quick === 'custom' && (
              <div className="flex items-center gap-space-xs font-code-sm text-code-sm text-on-surface-variant">
                <input
                  type="date"
                  value={customStart}
                  max={customEnd}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="rounded-lg bg-surface-container-lowest px-2 py-1.5 font-code-sm text-code-sm text-on-surface outline-none focus:shadow-[0_0_0_1px_#00dc82]"
                />
                <span>até</span>
                <input
                  type="date"
                  value={customEnd}
                  min={customStart}
                  max={dateInputValue(0)}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="rounded-lg bg-surface-container-lowest px-2 py-1.5 font-code-sm text-code-sm text-on-surface outline-none focus:shadow-[0_0_0_1px_#00dc82]"
                />
              </div>
            )}
            <label className="relative flex cursor-pointer items-center gap-space-xs rounded-lg bg-surface-container-lowest px-space-md py-1.5 transition-colors hover:bg-surface-container">
              <span className="font-body-sm text-body-sm text-outline">Agrupamento</span>
              <select
                value={groupFilter ?? ''}
                onChange={(e) => setGroupFilter(e.target.value || null)}
                className="cursor-pointer appearance-none bg-transparent pr-5 font-title-md text-title-md font-medium text-on-surface outline-none"
              >
                <option value="" className="bg-surface-container">
                  Todas as instâncias
                </option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id} className="bg-surface-container">
                    {g.name}
                  </option>
                ))}
              </select>
              <Icon name="expand_more" className="pointer-events-none absolute right-2 text-[18px] text-outline" />
            </label>
            <label className="flex cursor-pointer select-none items-center gap-space-xs pl-space-xs">
              <input
                type="checkbox"
                checked={compare}
                onChange={(e) => setCompare(e.target.checked)}
                className="h-4 w-4 cursor-pointer rounded accent-[#00dc82]"
              />
              <span className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface">Comparar com período anterior</span>
            </label>
          </div>
          <div className="flex items-center gap-space-sm self-end lg:self-auto">
            <button
              type="button"
              onClick={exportCsv}
              disabled={exporting}
              className="flex items-center gap-space-xs whitespace-nowrap rounded-lg bg-surface-container-high px-space-md py-1.5 font-title-md text-title-md text-on-surface shadow-sm transition-colors hover:bg-surface-bright disabled:opacity-50"
              title="Salvar o período selecionado em CSV"
            >
              <Icon name="download" className="text-[16px] text-primary" />
              <span>{exporting ? 'Salvando…' : 'Exportar CSV'}</span>
            </button>
          </div>
        </div>

        {/* Alertas em tempo real */}
        {alerts.length > 0 && (
          <div className="flex flex-col gap-space-xs">
            {alerts.map((alert) => (
              <div key={alert.id} className="relative flex items-center gap-space-sm overflow-hidden rounded-xl bg-surface-container-low px-space-md py-space-sm shadow-sm">
                <div className="absolute bottom-0 left-0 top-0 w-1 bg-error" />
                <Icon name="warning" className="text-[18px] text-error" />
                <span className="flex-1 truncate font-body-md text-body-md text-on-surface">{alert.message}</span>
                <button
                  type="button"
                  onClick={() => {
                    reloadAccount(alert.accountId);
                    openAccount(alert.accountId);
                    setAlerts((l) => l.filter((a) => a.id !== alert.id));
                  }}
                  className="flex items-center gap-1 rounded bg-error px-2.5 py-1 font-title-md text-body-sm text-on-error hover:bg-error-container hover:text-on-error-container"
                >
                  <Icon name="refresh" className="text-[14px]" /> Reconectar
                </button>
                <button
                  type="button"
                  aria-label="Dispensar alerta"
                  onClick={() => setAlerts((l) => l.filter((a) => a.id !== alert.id))}
                  className="rounded p-1 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                >
                  <Icon name="close" className="text-[16px]" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Métricas principais */}
        <div className="grid grid-cols-1 gap-gutter sm:grid-cols-2 xl:grid-cols-4">
          <div className="group relative flex flex-col justify-between overflow-hidden rounded-xl bg-surface-container-low p-space-md shadow-sm transition-all hover:bg-surface-container">
            <div className="flex items-center justify-between">
              <span className="font-body-sm text-body-sm font-medium text-on-surface-variant">Sessões ativas</span>
              <Icon name="sensors" className="text-[20px] text-primary" />
            </div>
            <div className="my-space-sm flex items-baseline gap-space-xs">
              <span className="font-metric-xl text-metric-xl font-bold text-primary">{health.online}</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">online</span>
            </div>
            <div className="flex items-center gap-space-md pt-space-xs font-label-sm text-label-sm">
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-outline" />
                <span className="text-on-surface-variant">{health.offline} Offline</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-secondary-fixed-dim" />
                <span className="text-secondary-fixed-dim">{health.reconnecting} Reconectando</span>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary/40" />
          </div>

          <div className="group relative flex flex-col justify-between overflow-hidden rounded-xl bg-surface-container-low p-space-md shadow-sm transition-all hover:bg-surface-container">
            <div className="flex items-center justify-between">
              <span className="font-body-sm text-body-sm font-medium text-on-surface-variant">Volume total</span>
              <Icon name="swap_vert" className="text-[20px] text-secondary-container" />
            </div>
            <div className="my-space-sm flex items-baseline gap-space-xs">
              <span className="font-metric-xl text-metric-xl font-bold text-on-surface">{summary?.totalVolume ?? 0}</span>
              {volumeDelta ? (
                <span className={'font-label-sm text-label-sm ' + (volumeDelta.positive ? 'text-primary' : 'text-error')}>
                  {volumeDelta.text}
                </span>
              ) : (
                <span className="font-label-sm text-label-sm text-outline">mensagens</span>
              )}
            </div>
            <div className="flex items-center gap-space-md pt-space-xs font-label-sm text-label-sm">
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary-container" />
                <span className="text-on-surface-variant">{summary?.totalReceived ?? 0} recebidas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-secondary-fixed" />
                <span className="text-on-surface-variant">{summary?.totalSent ?? 0} enviadas</span>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary-container/40" />
          </div>

          <div className="group relative flex flex-col justify-between overflow-hidden rounded-xl bg-surface-container-low p-space-md shadow-sm transition-all hover:bg-surface-container">
            <div className="flex items-center justify-between">
              <span className="font-body-sm text-body-sm font-medium text-on-surface-variant">Instância líder</span>
              <Icon name="military_tech" className="text-[20px] text-tertiary" />
            </div>
            <div className="my-space-sm flex flex-col">
              <div className="flex min-w-0 items-center gap-space-xs">
                <span
                  className="h-2 w-2 flex-shrink-0 rounded-full bg-primary"
                  style={summary?.leader ? { background: byAccount[0]?.color } : undefined}
                />
                <span className="truncate font-title-md text-title-md font-bold text-on-surface">{summary?.leader?.name ?? '—'}</span>
              </div>
              <span className="mt-1 font-metric-md text-metric-md font-bold text-tertiary">
                {summary?.leader?.total ?? 0}{' '}
                <span className="font-label-sm text-label-sm font-normal text-on-surface-variant">mensagens</span>
              </span>
            </div>
            <div className="flex items-center justify-between pt-space-xs font-body-sm text-body-sm text-on-surface-variant">
              <span>{leaderShare}% do volume</span>
              <span>{byAccount.length} com atividade</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-tertiary/40" />
          </div>

          <div className="group relative flex flex-col justify-between overflow-hidden rounded-xl bg-surface-container-low p-space-md shadow-sm transition-all hover:bg-surface-container">
            <div className="flex items-center justify-between">
              <span className="font-body-sm text-body-sm font-medium text-on-surface-variant">Média por conta</span>
              <Icon name="speed" className="text-[20px] text-secondary" />
            </div>
            <div className="my-space-sm flex items-baseline gap-space-xs">
              <span className="font-metric-xl text-metric-xl font-bold text-on-surface">{summary ? summary.averagePerAccount.toFixed(1) : '0'}</span>
              <span className="font-label-sm text-label-sm text-outline">msg / conta</span>
            </div>
            <div className="flex items-center justify-between pt-space-xs font-body-sm text-body-sm text-on-surface-variant">
              <span>Entre as contas com atividade</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary/40" />
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 gap-gutter lg:grid-cols-2">
          <div className="flex flex-col justify-between rounded-xl bg-surface-container-low p-space-md shadow-sm">
            <div className="mb-space-sm flex items-center justify-between gap-space-md">
              <div>
                <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">Movimento por instância</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Comparativo de mensagens recebidas e enviadas</p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-space-md">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded bg-primary-container" />
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Recebidas</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded bg-secondary-fixed" />
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Enviadas</span>
                </div>
              </div>
            </div>
            <div className="my-space-xs flex max-h-[228px] min-h-[180px] flex-col gap-2.5 overflow-y-auto">
              {byAccount.length === 0 ? (
                <div className="flex flex-1 items-center justify-center font-body-sm text-body-sm text-on-surface-variant">
                  {loading ? 'Carregando…' : 'Sem movimento neste período ainda.'}
                </div>
              ) : (
                byAccount.map((a, i) => (
                  <div key={a.accountId} className="flex items-center gap-space-sm" title={`${a.name}: ${a.received} recebidas, ${a.sent} enviadas`}>
                    <span className="w-28 truncate font-body-sm text-body-sm text-on-surface">{a.name}</span>
                    <div className="flex h-3 flex-1 overflow-hidden rounded-full bg-surface-container-lowest">
                      <div className="flex h-full" style={{ width: `${(a.total / maxTotal) * 100}%` }}>
                        <div className="h-full bg-primary-container" style={{ width: `${(a.received / Math.max(1, a.total)) * 100}%` }} />
                        <div className="h-full bg-secondary-fixed" style={{ width: `${(a.sent / Math.max(1, a.total)) * 100}%` }} />
                      </div>
                    </div>
                    <span className={'w-12 text-right font-code-sm text-code-sm font-bold ' + (i === 0 ? 'text-primary' : 'text-on-surface')}>
                      {a.total}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="flex items-center justify-end border-t border-surface-container-high/50 pt-space-xs font-body-sm text-body-sm text-outline">
              <span title="O painel se atualiza sozinho a cada 20 segundos">Atualizado {formatAgo(updatedAt, now)}</span>
            </div>
          </div>

          <div className="relative flex flex-col justify-between rounded-xl bg-surface-container-low p-space-md shadow-sm">
            <div className="mb-space-sm flex items-center justify-between gap-space-md">
              <div>
                <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">Horários de pico</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Distribuição horária do tráfego{compare ? ' (período atual vs anterior)' : ''}
                </p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-space-md">
                <div className="flex items-center gap-1.5">
                  <span className="h-0.5 w-3 bg-primary" />
                  <span className="font-label-sm text-label-sm text-primary">Atual</span>
                </div>
                {compare && (
                  <div className="flex items-center gap-1.5">
                    <span className="h-0.5 w-3 border-b border-dashed border-outline bg-outline" />
                    <span className="font-label-sm text-label-sm text-outline">Anterior</span>
                  </div>
                )}
              </div>
            </div>
            <div
              className="relative my-space-xs h-48 w-full"
              onMouseMove={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                const idx = Math.round(((e.clientX - r.left) / r.width) * 23);
                setHoverHour(Math.min(23, Math.max(0, idx)));
              }}
              onMouseLeave={() => setHoverHour(null)}
            >
              {hasTimeline && (
                <div
                  className="pointer-events-none absolute top-2 z-10 flex -translate-x-1/2 items-center gap-space-sm rounded bg-surface-container-highest px-space-sm py-1 shadow-xl"
                  style={{ left: `${Math.min(80, Math.max(20, (markerHour / 23) * 100))}%` }}
                >
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="font-code-sm text-code-sm font-bold text-on-surface">{pad2(markerHour)}:00</span>
                  <span className="font-code-sm text-code-sm text-primary">atual: {timeline[markerHour]?.count ?? 0}</span>
                  {compare && <span className="font-code-sm text-code-sm text-outline">anterior: {prevTimeline[markerHour]?.count ?? 0}</span>}
                </div>
              )}
              <svg className="h-full w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 500 150">
                <defs>
                  <linearGradient id="neonGlowToday" x1="0%" x2="0%" y1="0%" y2="100%">
                    <stop offset="0%" stopColor="rgb(var(--c-primary))" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="rgb(var(--c-primary))" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <line className="text-surface-container-high" stroke="currentColor" strokeWidth="1" x1="0" x2="500" y1="30" y2="30" />
                <line className="text-surface-container-high" stroke="currentColor" strokeWidth="1" x1="0" x2="500" y1="75" y2="75" />
                <line className="text-surface-container-high" stroke="currentColor" strokeWidth="1" x1="0" x2="500" y1="120" y2="120" />
                {compare && prevPoints.length > 0 && (
                  <path className="text-outline/40" d={smoothPath(prevPoints)} fill="none" stroke="currentColor" strokeDasharray="4,4" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                )}
                <path d={`${todayPath} L 500 150 L 0 150 Z`} fill="url(#neonGlowToday)" />
                <path className="text-primary" d={todayPath} fill="none" stroke="currentColor" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
                {hasTimeline && markerPoint && (
                  <line className="text-primary/30" stroke="currentColor" strokeDasharray="2,2" strokeWidth="1" x1={markerPoint.x} x2={markerPoint.x} y1="0" y2="150" vectorEffect="non-scaling-stroke" />
                )}
              </svg>
              {hasTimeline && markerPoint && (
                <span
                  className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_10px_rgba(0,220,130,0.8)]"
                  style={{ left: `${(markerPoint.x / 500) * 100}%`, top: `${(markerPoint.y / 150) * 100}%` }}
                />
              )}
              {!hasTimeline && (
                <div className="absolute inset-0 flex items-center justify-center font-body-sm text-body-sm text-on-surface-variant">
                  {loading ? 'Carregando…' : 'Sem movimento suficiente neste período ainda.'}
                </div>
              )}
            </div>
            <div className="relative h-4 px-1 font-code-sm text-code-sm text-outline">
              {[0, 4, 8, 12, 16, 20, 23].map((h) => (
                <span
                  key={h}
                  className={'absolute -translate-x-1/2 ' + (h === markerHour && hasTimeline ? 'font-bold text-primary' : '')}
                  style={{ left: `${(h / 23) * 100}%` }}
                >
                  {pad2(h)}h
                </span>
              ))}
              {hasTimeline && ![0, 4, 8, 12, 16, 20, 23].includes(markerHour) && (
                <span className="absolute -translate-x-1/2 bg-surface-container-low px-0.5 font-bold text-primary" style={{ left: `${(markerHour / 23) * 100}%` }}>
                  {pad2(markerHour)}h
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Hoje x Ontem */}
        <div className="grid grid-cols-1 gap-gutter lg:grid-cols-2">
          <DayTable title="Atividade de hoje" report={daily?.today} highlight />
          <DayTable title="Atividade de ontem" report={daily?.yesterday} />
        </div>

        {/* Rodapé */}
        <div className="flex flex-col items-center justify-between gap-space-xs rounded-xl bg-surface-container-low px-space-md py-space-sm font-body-sm text-body-sm text-on-surface-variant sm:flex-row">
          <div className="flex items-center gap-space-md">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_6px_rgba(0,220,130,0.8)]" />
              <span className="text-on-surface">
                Instâncias Online:{' '}
                <strong className="text-primary">
                  {health.online} / {accounts.length}
                </strong>
              </span>
            </div>
            <span className="hidden text-outline sm:inline">|</span>
            <span>
              Período: <strong className="text-primary">{formatDateBR(range.startTs)}</strong> a{' '}
              <strong className="text-primary">{formatDateBR(range.endTs)}</strong>
            </span>
          </div>
          <div className="flex items-center gap-space-md">
            <span>Só conversas individuais, sem conteúdo de mensagens</span>
            <span className="hidden text-outline sm:inline">|</span>
            <span>Orbi v{appInfo?.version ?? ''}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DayTable({ title, report, highlight = false }: { title: string; report: ChatActivityDayReport | undefined; highlight?: boolean }) {
  const rows = report?.byAccount ?? [];
  return (
    <div className="flex flex-col overflow-hidden rounded-xl bg-surface-container-low shadow-sm">
      <div className="flex items-center justify-between border-b border-surface-container-high/40 bg-surface-container px-space-md py-space-sm">
        <div className="flex items-center gap-space-xs">
          <span className={'h-2 w-2 rounded-full ' + (highlight ? 'bg-primary shadow-[0_0_8px_rgba(0,220,130,0.8)]' : 'bg-outline')} />
          <span className="font-title-md text-title-md font-bold text-on-surface">{title}</span>
        </div>
        <div className="flex items-center gap-space-sm font-label-sm text-label-sm">
          <span className={'font-bold ' + (highlight ? 'text-primary' : 'text-on-surface')}>{report?.totalConversations ?? 0} interações</span>
          <span className="text-outline">•</span>
          <span className={'font-bold ' + (highlight ? 'text-on-surface' : 'text-on-surface-variant')}>{report?.totalMessages ?? 0} mensagens</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="h-8 bg-surface-container-lowest font-body-sm text-body-sm text-outline">
              <th className="px-space-md font-semibold">INSTÂNCIA</th>
              <th className="px-space-sm text-right font-semibold">INTERAÇÕES</th>
              <th className="px-space-sm text-right font-semibold">RECEBIDAS</th>
              <th className="px-space-sm text-right font-semibold">ENVIADAS</th>
              <th className="px-space-md text-right font-semibold">TOTAL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-high/30 font-code-sm text-code-sm">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-space-md py-space-lg text-center font-body-sm text-body-sm text-on-surface-variant">
                  Sem novas interações.
                </td>
              </tr>
            ) : (
              rows.map((a, i) => {
                const leader = highlight && i === 0;
                return (
                  <tr
                    key={a.accountId}
                    className={'h-9 transition-colors hover:bg-surface-container-high/50 ' + (i % 2 === 0 ? 'bg-surface-container-low' : 'bg-surface-container-lowest/60')}
                  >
                    <td className="px-space-md py-2 font-title-md text-title-md text-on-surface">
                      <div className="flex min-w-0 items-center gap-space-xs">
                        <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: highlight ? a.color : undefined }} />
                        <span className={'truncate ' + (leader ? 'font-semibold text-primary' : '')}>{a.name}</span>
                      </div>
                    </td>
                    <td className={'px-space-sm text-right ' + (leader ? 'font-bold text-primary' : 'text-on-surface-variant')}>{a.newConversations}</td>
                    <td className={'px-space-sm text-right ' + (highlight ? 'text-primary' : 'text-on-surface-variant')}>{a.received}</td>
                    <td className={'px-space-sm text-right ' + (highlight ? 'text-secondary-fixed' : 'text-on-surface-variant')}>{a.sent}</td>
                    <td className={'px-space-md text-right font-bold ' + (leader ? 'text-primary' : 'text-on-surface')}>{a.messages}</td>
                  </tr>
                );
              })
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="h-9 border-t-2 border-surface-container-high bg-surface-container-lowest font-code-sm text-code-sm">
                <td className="px-space-md font-body-sm text-body-sm font-semibold text-on-surface-variant">Total</td>
                <td className="px-space-sm text-right font-bold text-on-surface">{report?.totalConversations ?? 0}</td>
                <td className="px-space-sm text-right font-bold text-on-surface">{report?.totalReceived ?? 0}</td>
                <td className="px-space-sm text-right font-bold text-on-surface">{report?.totalSent ?? 0}</td>
                <td className="px-space-md text-right font-bold text-on-surface">{report?.totalMessages ?? 0}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
