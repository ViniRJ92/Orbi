/**
 * Página "Agenda" (tela do Stitch) — Fase 54: visões de Mês, Semana e Dia,
 * mini-calendário, próximos compromissos, feriados nacionais calculados
 * localmente (sem rede) e formulário de compromisso com lembretes.
 * Tudo guardado só neste computador (calendarStore.ts).
 * Orbi — Criado por Vinicius Braga
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CalendarEvent, EVENT_CATEGORIES, Holiday } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { formatTime, pad2 } from '../../format';
import { usePageEscape } from '../../usePageEscape';
import { Icon } from '../ui/Icon';
import { EventFormModal } from './EventFormModal';

type ViewMode = 'month' | 'week' | 'day';

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const HORA_PX = 48;

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}
function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function startOfWeek(d: Date): Date {
  return addDays(startOfDay(d), -d.getDay());
}
function corDaCategoria(id: string): string {
  return EVENT_CATEGORIES.find((c) => c.id === id)?.color ?? '#859587';
}

export function AgendaPage() {
  const accounts = useAppStore((s) => s.accounts);

  const [view, setView] = useState<ViewMode>('month');
  const [cursor, setCursor] = useState(() => new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [showHolidays, setShowHolidays] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [formDate, setFormDate] = useState(() => new Date());
  const [agora, setAgora] = useState(() => Date.now());
  const gradeRef = useRef<HTMLDivElement>(null);

  // Esc fecha a Agenda só quando o formulário não está aberto por cima.
  usePageEscape(!formOpen);

  const intervalo = useMemo(() => {
    const inicio = addDays(new Date(cursor.getFullYear(), cursor.getMonth(), 1), -7);
    const fim = addDays(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0), 14);
    return {
      startTs: startOfDay(inicio).getTime(),
      endTs: new Date(fim.getFullYear(), fim.getMonth(), fim.getDate(), 23, 59, 59).getTime(),
    };
  }, [cursor]);

  const carregar = useCallback(async () => {
    const [evs, feriados] = await Promise.all([
      window.multiwhats.listEvents(intervalo),
      window.multiwhats.listHolidays(dayKey(new Date(intervalo.startTs)), dayKey(new Date(intervalo.endTs))),
    ]);
    setEvents(evs);
    setHolidays(feriados);
  }, [intervalo]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (view === 'month') return;
    const el = gradeRef.current;
    if (el) el.scrollTop = Math.max(0, (new Date().getHours() - 2) * HORA_PX);
  }, [view]);

  const feriadosPorDia = useMemo(() => new Map(holidays.map((h) => [h.date, h])), [holidays]);

  const eventosPorDia = useMemo(() => {
    const m = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      let d = startOfDay(new Date(ev.start));
      const fim = startOfDay(new Date(ev.end));
      while (d <= fim) {
        const k = dayKey(d);
        if (!m.has(k)) m.set(k, []);
        m.get(k)!.push(ev);
        d = addDays(d, 1);
      }
    }
    return m;
  }, [events]);

  const proximos = useMemo(() => {
    const limite = Date.now();
    return events.filter((e) => e.end >= limite).sort((a, b) => a.start - b.start).slice(0, 8);
  }, [events]);

  const porCategoria = useMemo(() => {
    const m = new Map<string, number>();
    for (const ev of events) m.set(ev.category, (m.get(ev.category) ?? 0) + 1);
    return m;
  }, [events]);

  function abrirNovo(dia: Date) {
    setEditing(null);
    setFormDate(dia);
    setFormOpen(true);
  }
  function abrirEdicao(ev: CalendarEvent) {
    setEditing(ev);
    setFormDate(new Date(ev.start));
    setFormOpen(true);
  }
  function navegar(passo: number) {
    if (view === 'month') setCursor((c) => new Date(c.getFullYear(), c.getMonth() + passo, 1));
    else if (view === 'week') setCursor((c) => addDays(c, passo * 7));
    else setCursor((c) => addDays(c, passo));
  }

  const tituloPeriodo = useMemo(() => {
    if (view === 'month') return `${MESES[cursor.getMonth()]} de ${cursor.getFullYear()}`;
    if (view === 'week') {
      const ini = startOfWeek(cursor);
      const fim = addDays(ini, 6);
      return `${pad2(ini.getDate())}/${pad2(ini.getMonth() + 1)} a ${pad2(fim.getDate())}/${pad2(fim.getMonth() + 1)}`;
    }
    return `${DIAS_SEMANA[cursor.getDay()]}, ${pad2(cursor.getDate())} de ${MESES[cursor.getMonth()]}`;
  }, [view, cursor]);

  return (
    <div className="relative h-full overflow-y-auto px-gutter">
      <div className="flex flex-col gap-space-md py-space-sm">
        {/* Barra de controles */}
        <div className="flex flex-wrap items-center justify-between gap-space-md rounded bg-surface-container-low p-space-md shadow-md">
          <div className="flex flex-wrap items-center gap-space-md">
            <div className="flex items-center gap-space-xs rounded bg-primary-container/10 px-space-sm py-1">
              <Icon name="calendar_month" className="text-[20px] text-primary" />
              <span className="font-headline-sm text-headline-sm font-semibold tracking-tight text-on-surface">Agenda</span>
            </div>
            <div className="hidden h-5 w-px bg-surface-container-highest sm:block" />
            <div className="flex items-center gap-space-xs">
              <div className="flex items-center rounded bg-surface-container p-0.5 shadow-sm">
                <button
                  type="button"
                  aria-label="Anterior"
                  onClick={() => navegar(-1)}
                  className="flex h-7 w-7 items-center justify-center rounded text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
                >
                  <Icon name="chevron_left" className="text-[18px]" />
                </button>
                <button
                  type="button"
                  onClick={() => setCursor(new Date())}
                  className="h-7 rounded px-space-sm font-label-sm text-label-sm text-on-surface transition-colors hover:bg-surface-container-high"
                >
                  Hoje
                </button>
                <button
                  type="button"
                  aria-label="Próximo"
                  onClick={() => navegar(1)}
                  className="flex h-7 w-7 items-center justify-center rounded text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
                >
                  <Icon name="chevron_right" className="text-[18px]" />
                </button>
              </div>
              <span className="ml-space-xs font-headline-sm text-headline-sm font-bold capitalize tracking-tight text-on-surface">{tituloPeriodo}</span>
            </div>
            <div className="flex items-center rounded bg-surface-container p-0.5 shadow-sm">
              {([
                ['month', 'Mês'],
                ['week', 'Semana'],
                ['day', 'Dia'],
              ] as [ViewMode, string][]).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setView(k)}
                  className={
                    'h-7 rounded px-space-md font-label-sm text-label-sm transition-all ' +
                    (view === k
                      ? 'bg-primary-container font-bold text-on-primary-container shadow-sm'
                      : 'font-medium text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface')
                  }
                >
                  {label}
                </button>
              ))}
            </div>
            <label className="group flex cursor-pointer select-none items-center gap-space-xs">
              <span className="relative flex h-4 w-4 items-center justify-center rounded bg-surface-container-highest transition-colors group-hover:bg-primary-container/20">
                <input
                  type="checkbox"
                  checked={showHolidays}
                  onChange={(e) => setShowHolidays(e.target.checked)}
                  className="peer absolute inset-0 cursor-pointer opacity-0"
                />
                {showHolidays && <Icon name="check" className="text-[15px] text-primary" />}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant transition-colors group-hover:text-on-surface">Exibir feriados</span>
            </label>
          </div>
          <button
            type="button"
            onClick={() => abrirNovo(view === 'month' ? new Date() : cursor)}
            className="flex h-9 items-center gap-space-xs rounded bg-primary-container px-space-md font-headline-sm text-body-md font-bold text-on-primary-container shadow-[0_0_12px_rgba(0,220,130,0.25)] transition-all hover:bg-primary-fixed hover:shadow-[0_0_18px_rgba(0,220,130,0.45)] active:scale-[0.98]"
          >
            <Icon name="add" className="text-[18px]" />
            <span>Novo compromisso</span>
          </button>
        </div>

        <div className="grid grid-cols-1 items-start gap-space-md xl:grid-cols-12">
          {/* Painel lateral */}
          <div className="flex flex-col gap-space-md xl:col-span-3">
            <MiniCalendar
              cursor={cursor}
              onPick={(d) => {
                setCursor(d);
                if (view === 'month') setView('day');
              }}
              onMonth={(passo) => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + passo, 1))}
              feriados={feriadosPorDia}
              mostrarFeriados={showHolidays}
            />

            <div className="flex flex-col gap-space-sm rounded bg-surface-container-low p-space-md shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-title-md text-title-md font-semibold text-on-surface-variant">Próximos compromissos</span>
                <Icon name="notifications" className="text-[16px] text-on-surface-variant" />
              </div>
              {proximos.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-space-xs rounded bg-surface-container/40 p-space-md py-space-lg text-center">
                  <Icon name="event_busy" className="text-[28px] text-on-surface-variant/40" />
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Nada agendado por enquanto.</span>
                  <button
                    type="button"
                    onClick={() => abrirNovo(new Date())}
                    className="mt-space-xs flex items-center gap-1 font-label-sm text-label-sm font-semibold text-primary transition-colors hover:text-primary-fixed"
                  >
                    <Icon name="add" className="text-[14px]" />
                    <span>Agendar compromisso</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {proximos.map((ev) => {
                    const conta = accounts.find((a) => a.id === ev.accountId);
                    const d = new Date(ev.start);
                    return (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={() => abrirEdicao(ev)}
                        className="flex flex-col items-start gap-0.5 rounded bg-surface-container/50 p-1.5 px-space-sm text-left transition-colors hover:bg-surface-container-high"
                      >
                        <div className="flex w-full min-w-0 items-center gap-space-xs">
                          <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: corDaCategoria(ev.category) }} />
                          <span className="truncate font-body-sm text-body-sm font-medium text-on-surface">{ev.title}</span>
                        </div>
                        <span className="font-code-sm text-code-sm text-on-surface-variant">
                          {pad2(d.getDate())}/{pad2(d.getMonth() + 1)} · {ev.allDay ? 'dia inteiro' : formatTime(ev.start)}
                        </span>
                        {conta && <span className="truncate font-label-sm text-label-sm text-outline">{conta.name}</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-space-xs rounded bg-surface-container-low p-space-md shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-title-md text-title-md font-semibold text-on-surface-variant">Categorias</span>
                <span className="font-body-sm text-body-sm text-outline">{events.length} no período</span>
              </div>
              <div className="mt-space-xs flex flex-col gap-1">
                {EVENT_CATEGORIES.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded bg-surface-container/50 p-1.5">
                    <div className="flex items-center gap-space-xs">
                      <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
                      <span className="font-body-sm text-body-sm text-on-surface">{c.label}</span>
                    </div>
                    <span className="font-code-sm text-code-sm" style={{ color: c.color }}>
                      {porCategoria.get(c.id) ?? 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Calendário */}
          <div className="flex flex-col overflow-hidden rounded bg-surface-container-low shadow-md xl:col-span-9">
            {view === 'month' ? (
              <MonthGrid
                cursor={cursor}
                eventosPorDia={eventosPorDia}
                feriados={feriadosPorDia}
                mostrarFeriados={showHolidays}
                onDayClick={abrirNovo}
                onEventClick={abrirEdicao}
              />
            ) : (
              <TimeGrid
                gradeRef={gradeRef}
                dias={view === 'week' ? Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(cursor), i)) : [startOfDay(cursor)]}
                eventosPorDia={eventosPorDia}
                feriados={feriadosPorDia}
                mostrarFeriados={showHolidays}
                agora={agora}
                onSlotClick={abrirNovo}
                onEventClick={abrirEdicao}
              />
            )}
          </div>
        </div>
      </div>

      <EventFormModal open={formOpen} onClose={() => setFormOpen(false)} onSaved={carregar} editing={editing} defaultDate={formDate} />
    </div>
  );
}

function MiniCalendar({
  cursor,
  onPick,
  onMonth,
  feriados,
  mostrarFeriados,
}: {
  cursor: Date;
  onPick: (d: Date) => void;
  onMonth: (passo: number) => void;
  feriados: Map<string, Holiday>;
  mostrarFeriados: boolean;
}) {
  const inicio = startOfWeek(new Date(cursor.getFullYear(), cursor.getMonth(), 1));
  const dias = Array.from({ length: 42 }, (_, i) => addDays(inicio, i));
  const hoje = new Date();
  return (
    <div className="flex flex-col gap-space-md rounded bg-surface-container-low p-space-md shadow-sm">
      <div className="flex items-center justify-between">
        <span className="font-label-sm text-label-sm font-semibold uppercase tracking-widest text-on-surface-variant">
          {MESES[cursor.getMonth()]} {cursor.getFullYear()}
        </span>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            aria-label="Mês anterior"
            onClick={() => onMonth(-1)}
            className="flex h-6 w-6 items-center justify-center rounded text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
          >
            <Icon name="chevron_left" className="text-[15px]" />
          </button>
          <button
            type="button"
            aria-label="Próximo mês"
            onClick={() => onMonth(1)}
            className="flex h-6 w-6 items-center justify-center rounded text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
          >
            <Icon name="chevron_right" className="text-[15px]" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center font-label-sm text-label-sm">
        {DIAS_SEMANA.map((d, i) => (
          <span key={i} className="py-1 font-semibold text-on-surface-variant/60">
            {d[0]}
          </span>
        ))}
        {dias.map((d) => {
          const doMes = d.getMonth() === cursor.getMonth();
          const eHoje = sameDay(d, hoje);
          const selecionado = sameDay(d, cursor) && !eHoje;
          const feriado = mostrarFeriados ? feriados.get(dayKey(d)) : undefined;
          return (
            <button
              key={d.getTime()}
              type="button"
              onClick={() => onPick(d)}
              title={feriado?.name}
              className="relative flex items-center justify-center"
            >
              <span
                className={
                  'flex h-6 w-6 items-center justify-center font-code-sm text-code-sm ' +
                  (eHoje
                    ? 'rounded-full bg-primary font-bold text-on-primary shadow-[0_0_8px_rgba(0,220,130,0.4)]'
                    : selecionado
                      ? 'rounded bg-surface-container-high font-semibold text-primary'
                      : doMes
                        ? 'rounded text-on-surface-variant hover:bg-surface-container'
                        : 'text-on-surface-variant/30')
                }
              >
                {d.getDate()}
              </span>
              {feriado && !eHoje && <span className="absolute bottom-0 h-1 w-1 rounded-full bg-primary" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MonthGrid({
  cursor,
  eventosPorDia,
  feriados,
  mostrarFeriados,
  onDayClick,
  onEventClick,
}: {
  cursor: Date;
  eventosPorDia: Map<string, CalendarEvent[]>;
  feriados: Map<string, Holiday>;
  mostrarFeriados: boolean;
  onDayClick: (d: Date) => void;
  onEventClick: (e: CalendarEvent) => void;
}) {
  const inicio = startOfWeek(new Date(cursor.getFullYear(), cursor.getMonth(), 1));
  const dias = Array.from({ length: 42 }, (_, i) => addDays(inicio, i));
  const hoje = new Date();
  return (
    <>
      <div className="grid grid-cols-7 bg-surface-container py-2.5 text-center">
        {DIAS_SEMANA.map((d) => (
          <span key={d} className="font-label-sm text-label-sm font-bold uppercase tracking-wider text-on-surface-variant">
            {d}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-surface-container-highest/30">
        {dias.map((d) => {
          const k = dayKey(d);
          const doMes = d.getMonth() === cursor.getMonth();
          const eHoje = sameDay(d, hoje);
          const feriado = mostrarFeriados ? feriados.get(k) : undefined;
          const doDia = eventosPorDia.get(k) ?? [];
          if (!doMes) {
            return (
              <div
                key={k}
                onDoubleClick={() => onDayClick(d)}
                className="flex min-h-[105px] flex-col justify-between bg-surface-container-lowest/70 p-2 text-on-surface-variant/30"
              >
                <span className="font-code-sm text-code-sm font-semibold">{d.getDate()}</span>
              </div>
            );
          }
          const destacado = eHoje || feriado || doDia.length > 0;
          return (
            <div
              key={k}
              onDoubleClick={() => onDayClick(d)}
              title="Clique duas vezes para criar um compromisso neste dia"
              className={
                'group flex min-h-[105px] cursor-pointer flex-col justify-between p-2 transition-colors hover:bg-surface-container ' +
                (eHoje ? 'bg-surface-container/60' : destacado ? 'bg-surface-container/70' : 'bg-surface-container-low')
              }
            >
              <div className="flex w-full flex-col gap-1">
                <div className="flex items-center justify-between">
                  {eHoje ? (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary font-code-sm text-code-sm font-bold text-on-primary shadow-[0_0_10px_rgba(0,220,130,0.5)]">
                      {d.getDate()}
                    </span>
                  ) : (
                    <span
                      className={
                        'font-code-sm text-code-sm ' +
                        (feriado ? 'font-bold text-primary' : 'font-semibold text-on-surface-variant group-hover:text-on-surface')
                      }
                    >
                      {d.getDate()}
                    </span>
                  )}
                  {eHoje ? (
                    <span className="font-badge-micro text-badge-micro font-bold uppercase tracking-wider text-primary">HOJE</span>
                  ) : (
                    feriado && (
                      <span className="rounded bg-surface-container-high px-1 font-badge-micro text-badge-micro text-on-surface-variant">BR</span>
                    )
                  )}
                </div>
                {feriado && (
                  <div
                    title={feriado.name}
                    className="truncate rounded bg-surface-container-highest/80 px-1.5 py-0.5 font-body-sm text-[11px] text-on-surface-variant"
                  >
                    {feriado.name}
                  </div>
                )}
                {doDia.slice(0, 3).map((ev) => {
                  const cor = corDaCategoria(ev.category);
                  return (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(ev);
                      }}
                      title={ev.title}
                      className="flex items-center gap-1 truncate rounded px-1.5 py-1 text-left font-label-sm text-label-sm transition-opacity hover:opacity-80"
                      style={{ background: `${cor}26`, color: cor }}
                    >
                      <span className="inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: cor }} />
                      <span className="truncate font-semibold">
                        {!ev.allDay && `${formatTime(ev.start)} `}
                        {ev.title}
                      </span>
                    </button>
                  );
                })}
                {doDia.length > 3 && (
                  <span className="px-1 font-badge-micro text-badge-micro text-on-surface-variant">+{doDia.length - 3} mais</span>
                )}
              </div>
              {eHoje && doDia.length === 0 && (
                <div className="mt-auto flex w-full flex-col gap-1 pt-2">
                  <span className="truncate font-badge-micro text-badge-micro italic text-on-surface-variant/70">Sem compromissos</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function TimeGrid({
  gradeRef,
  dias,
  eventosPorDia,
  feriados,
  mostrarFeriados,
  agora,
  onSlotClick,
  onEventClick,
}: {
  gradeRef: React.RefObject<HTMLDivElement | null>;
  dias: Date[];
  eventosPorDia: Map<string, CalendarEvent[]>;
  feriados: Map<string, Holiday>;
  mostrarFeriados: boolean;
  agora: number;
  onSlotClick: (d: Date) => void;
  onEventClick: (e: CalendarEvent) => void;
}) {
  const hoje = new Date();
  const agoraDate = new Date(agora);
  const minutosAgora = agoraDate.getHours() * 60 + agoraDate.getMinutes();
  return (
    <div className="flex h-[680px] flex-col">
      <div className="flex flex-shrink-0 bg-surface-container">
        <div className="w-14 flex-shrink-0" />
        {dias.map((d) => {
          const k = dayKey(d);
          const feriado = mostrarFeriados ? feriados.get(k) : undefined;
          const diaInteiro = (eventosPorDia.get(k) ?? []).filter((e) => e.allDay);
          return (
            <div key={k} className="min-w-0 flex-1 px-2 py-2">
              <div className="flex items-center justify-center gap-1.5">
                <span className="font-label-sm text-label-sm font-bold uppercase tracking-wider text-on-surface-variant">
                  {DIAS_SEMANA[d.getDay()]}
                </span>
                <span
                  className={
                    'flex h-6 min-w-6 items-center justify-center px-1 font-code-sm text-code-sm ' +
                    (sameDay(d, hoje) ? 'rounded-full bg-primary font-bold text-on-primary' : 'text-on-surface')
                  }
                >
                  {d.getDate()}
                </span>
              </div>
              {feriado && (
                <div title={feriado.name} className="mt-1 truncate rounded bg-surface-container-highest/80 px-1.5 py-0.5 text-center text-[11px] text-on-surface-variant">
                  {feriado.name}
                </div>
              )}
              {diaInteiro.map((ev) => {
                const cor = corDaCategoria(ev.category);
                return (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => onEventClick(ev)}
                    className="mt-1 flex w-full items-center gap-1 truncate rounded px-1.5 py-0.5 text-left font-label-sm text-label-sm"
                    style={{ background: `${cor}26`, color: cor }}
                  >
                    <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: cor }} />
                    <span className="truncate">{ev.title}</span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
      <div ref={gradeRef} className="relative min-h-0 flex-1 overflow-y-auto">
        <div className="flex" style={{ height: HORA_PX * 24 }}>
          <div className="w-14 flex-shrink-0 bg-surface-container-lowest/40">
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} style={{ height: HORA_PX }} className="relative">
                <span className="absolute -top-1.5 right-1.5 font-code-sm text-[10.5px] text-outline">{pad2(h)}h</span>
              </div>
            ))}
          </div>
          {dias.map((d) => {
            const k = dayKey(d);
            const comHora = (eventosPorDia.get(k) ?? []).filter((e) => !e.allDay);
            const eHoje = sameDay(d, hoje);
            return (
              <div key={k} className="relative min-w-0 flex-1 border-l border-surface-container-highest/30">
                {Array.from({ length: 24 }, (_, h) => (
                  <div
                    key={h}
                    style={{ height: HORA_PX }}
                    onDoubleClick={() => onSlotClick(new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, 0))}
                    className="border-b border-surface-container-highest/30 transition-colors hover:bg-surface-container/60"
                  />
                ))}
                {eHoje && (
                  <div className="pointer-events-none absolute inset-x-0 z-10 flex items-center" style={{ top: (minutosAgora / 60) * HORA_PX }}>
                    <span className="-ml-1 h-2 w-2 rounded-full bg-error" />
                    <span className="h-px flex-1 bg-error" />
                  </div>
                )}
                {comHora.map((ev) => {
                  const ini = new Date(Math.max(ev.start, startOfDay(d).getTime()));
                  const fim = new Date(Math.min(ev.end, addDays(startOfDay(d), 1).getTime() - 1));
                  const topo = ((ini.getHours() * 60 + ini.getMinutes()) / 60) * HORA_PX;
                  const altura = Math.max(20, ((fim.getTime() - ini.getTime()) / 60000 / 60) * HORA_PX);
                  const cor = corDaCategoria(ev.category);
                  return (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => onEventClick(ev)}
                      style={{ top: topo, height: altura, background: `${cor}2e`, borderLeft: `3px solid ${cor}` }}
                      className="absolute inset-x-1 z-[5] overflow-hidden rounded px-1.5 py-0.5 text-left transition-opacity hover:opacity-85"
                    >
                      <span className="block truncate font-title-md text-[11px] text-on-surface">{ev.title}</span>
                      <span className="block truncate font-code-sm text-[10.5px] text-on-surface-variant">
                        {formatTime(ev.start)} – {formatTime(ev.end)}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
