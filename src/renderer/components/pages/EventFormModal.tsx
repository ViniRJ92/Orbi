/**
 * Formulário de compromisso (tela "Novo compromisso" do Stitch) — Fase 54:
 * criar, editar e excluir, com dia inteiro, categoria, instância vinculada,
 * lembretes prontos ou personalizados e anotações.
 * Orbi — Criado por Vinicius Braga
 */
import { useEffect, useState } from 'react';
import { CalendarEvent, CalendarEventInput, EVENT_CATEGORIES, EventCategoryId, EventReminder } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { pad2 } from '../../format';
import { ModalShell } from '../ui/ModalShell';
import { Icon } from '../ui/Icon';

const PRESET_REMINDERS: { label: string; minutes: number }[] = [
  { label: 'No horário exato', minutes: 0 },
  { label: '15 minutos antes', minutes: 15 },
  { label: '1 hora antes', minutes: 60 },
  { label: '1 dia antes', minutes: 1440 },
  { label: '3 dias antes', minutes: 4320 },
  { label: '7 dias antes', minutes: 10080 },
];

export function describeReminder(minutes: number): string {
  if (minutes <= 0) return 'No horário exato';
  const dias = Math.floor(minutes / 1440);
  const horas = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  const partes: string[] = [];
  if (dias) partes.push(`${dias} ${dias === 1 ? 'dia' : 'dias'}`);
  if (horas) partes.push(`${horas}h`);
  if (mins) partes.push(`${mins}min`);
  return `${partes.join(' ')} antes`;
}

function toDateInput(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function toTimeInput(ts: number): string {
  const d = new Date(ts);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
function fromInputs(dateStr: string, timeStr: string): number {
  const [a, m, d] = dateStr.split('-').map(Number);
  const [h, min] = (timeStr || '00:00').split(':').map(Number);
  return new Date(a, (m || 1) - 1, d || 1, h || 0, min || 0, 0, 0).getTime();
}
function novoId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

const LABEL = 'font-label-sm text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant';
const PICKER =
  'native-picker relative h-9 w-full rounded bg-surface-container font-code-sm text-code-sm text-on-surface transition-colors focus:bg-surface-container-high focus:outline-none';

export function EventFormModal({
  open,
  onClose,
  onSaved,
  editing,
  defaultDate,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editing: CalendarEvent | null;
  defaultDate: Date;
}) {
  const accounts = useAppStore((s) => s.accounts);

  const [title, setTitle] = useState('');
  const [allDay, setAllDay] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('10:00');
  const [category, setCategory] = useState<EventCategoryId>('trabalho');
  const [accountId, setAccountId] = useState('');
  const [description, setDescription] = useState('');
  const [reminders, setReminders] = useState<EventReminder[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [customDias, setCustomDias] = useState(0);
  const [customHoras, setCustomHoras] = useState(1);
  const [customMin, setCustomMin] = useState(0);

  useEffect(() => {
    if (!open) return;
    setErro(null);
    setCustomOpen(false);
    if (editing) {
      setTitle(editing.title);
      setAllDay(editing.allDay);
      setStartDate(toDateInput(editing.start));
      setStartTime(toTimeInput(editing.start));
      setEndDate(toDateInput(editing.end));
      setEndTime(toTimeInput(editing.end));
      setCategory(editing.category);
      setAccountId(editing.accountId ?? '');
      setDescription(editing.description ?? '');
      setReminders(editing.reminders);
    } else {
      const base = toDateInput(defaultDate.getTime());
      setTitle('');
      setAllDay(false);
      setStartDate(base);
      setStartTime(defaultDate.getHours() > 0 ? `${pad2(defaultDate.getHours())}:00` : '09:00');
      setEndDate(base);
      setEndTime(defaultDate.getHours() > 0 ? `${pad2(Math.min(23, defaultDate.getHours() + 1))}:00` : '10:00');
      setCategory('trabalho');
      setAccountId('');
      setDescription('');
      setReminders([{ id: novoId(), minutesBefore: 60 }]);
    }
  }, [open, editing, defaultDate]);

  function addReminder(minutes: number) {
    if (reminders.some((r) => r.minutesBefore === minutes)) return;
    setReminders((prev) => [...prev, { id: novoId(), minutesBefore: minutes }].sort((a, b) => b.minutesBefore - a.minutesBefore));
  }

  async function salvar() {
    const tituloLimpo = title.trim();
    if (!tituloLimpo) {
      setErro('Dê um título para o compromisso.');
      return;
    }
    const inicio = allDay ? fromInputs(startDate, '00:00') : fromInputs(startDate, startTime);
    const fim = allDay ? fromInputs(endDate || startDate, '23:59') : fromInputs(endDate || startDate, endTime);
    if (fim < inicio) {
      setErro('O término não pode ser antes do início.');
      return;
    }
    const payload: CalendarEventInput = {
      title: tituloLimpo,
      start: inicio,
      end: fim,
      allDay,
      category,
      accountId: accountId || null,
      description: description.trim() || undefined,
      reminders,
    };
    setSalvando(true);
    try {
      if (editing) await window.multiwhats.updateEvent(editing.id, payload);
      else await window.multiwhats.createEvent(payload);
      onSaved();
      onClose();
    } catch {
      setErro('Não foi possível salvar o compromisso.');
    } finally {
      setSalvando(false);
    }
  }

  async function excluir() {
    if (!editing) return;
    if (!window.confirm(`Excluir "${editing.title}"?`)) return;
    await window.multiwhats.removeEvent(editing.id);
    onSaved();
    onClose();
  }

  return (
    <ModalShell open={open} onClose={onClose} maxWidth="max-w-[580px]" zIndex="z-[45]">
      <div className="flex items-center justify-between bg-surface-container px-space-lg py-space-md">
        <div className="flex items-center gap-space-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-container/20 text-primary">
            <Icon name={editing ? 'edit_calendar' : 'calendar_add_on'} fill className="text-[20px]" />
          </div>
          <div className="flex flex-col">
            <h2 className="font-headline-sm text-headline-sm font-semibold leading-tight text-on-surface">
              {editing ? 'Editar compromisso' : 'Novo compromisso'}
            </h2>
            <span className="font-label-sm text-label-sm text-on-surface-variant">Preencha os dados do compromisso na sua agenda</span>
          </div>
        </div>
        <button
          type="button"
          aria-label="Fechar formulário"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container-high/60 text-on-surface-variant transition-colors hover:bg-surface-container-highest hover:text-on-surface"
        >
          <Icon name="close" className="text-[18px]" />
        </button>
      </div>

      <form className="flex min-h-0 flex-col gap-space-md overflow-y-auto p-space-lg" onSubmit={(e) => e.preventDefault()}>
        <div className="flex flex-col gap-1.5">
          <label className={LABEL} htmlFor="event-title">
            Título
          </label>
          <input
            id="event-title"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex.: Reunião de alinhamento"
            className="h-10 w-full rounded bg-surface-container-lowest px-3 font-body-md text-body-md text-on-surface transition-all placeholder:text-on-surface-variant/60 focus:shadow-[0_0_0_1px_#00dc82,0_0_10px_rgba(0,220,130,0.25)] focus:outline-none"
          />
        </div>

        <label className="flex cursor-pointer select-none items-center gap-space-xs py-0.5">
          <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} className="h-4 w-4 cursor-pointer rounded accent-[#45f99c]" />
          <span className="font-body-md text-body-md font-medium text-on-surface">Dia inteiro</span>
        </label>

        <div className="grid grid-cols-1 gap-space-md rounded-lg bg-surface-container-lowest/60 p-space-md sm:grid-cols-2">
          {([
            ['Início', startDate, setStartDate, startTime, setStartTime, undefined],
            ['Término', endDate, setEndDate, endTime, setEndTime, startDate],
          ] as const).map(([rotulo, data, setData, hora, setHora, min]) => (
            <div key={rotulo} className="flex flex-col gap-1.5">
              <span className={LABEL}>{rotulo}</span>
              <div className="grid grid-cols-7 gap-space-xs">
                <div className={'relative flex items-center ' + (allDay ? 'col-span-7' : 'col-span-4')}>
                  <input type="date" value={data} min={min} onChange={(e) => setData(e.target.value)} className={PICKER + ' pl-8 pr-2'} />
                  <Icon name="calendar_today" className="pointer-events-none absolute left-2 text-[16px] text-on-surface-variant" />
                </div>
                {!allDay && (
                  <div className="relative col-span-3 flex items-center">
                    <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} className={PICKER + ' pl-7 pr-1 text-center'} />
                    <Icon name="schedule" className="pointer-events-none absolute left-2 text-[16px] text-on-surface-variant" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <span className={LABEL}>Categoria</span>
          <div className="flex flex-wrap items-center gap-space-xs">
            {EVENT_CATEGORIES.map((c) => {
              const ativo = category === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={
                    'flex items-center gap-1.5 rounded-full px-space-sm py-1 transition-all ' +
                    (ativo ? '' : 'bg-surface-container text-on-surface hover:bg-surface-container-high')
                  }
                  style={ativo ? { background: `${c.color}33`, color: c.color, boxShadow: `0 0 8px ${c.color}4d` } : undefined}
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
                  <span className="font-label-sm text-label-sm font-semibold">{c.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={LABEL} htmlFor="instance-link">
            Instância vinculada (opcional)
          </label>
          <div className="relative flex items-center">
            <Icon name="hub" className="pointer-events-none absolute left-3 text-[18px] text-on-surface-variant" />
            <select
              id="instance-link"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="h-10 w-full cursor-pointer appearance-none rounded bg-surface-container-lowest pl-9 pr-8 font-body-md text-body-md text-on-surface transition-colors focus:bg-surface-container focus:outline-none"
            >
              <option value="">Nenhuma</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <Icon name="expand_more" className="pointer-events-none absolute right-3 text-[18px] text-on-surface-variant" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className={LABEL}>Lembretes</span>
            <span className="rounded bg-surface-container px-space-xs py-0.5 font-badge-micro text-badge-micro font-bold uppercase tracking-wider text-primary">
              {reminders.length} configurado(s)
            </span>
          </div>
          {reminders.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded bg-surface-container-lowest p-space-sm">
              <div className="flex items-center gap-space-sm">
                <Icon name="notifications_active" className="text-[18px] text-primary" />
                <span className="font-code-sm text-code-sm text-on-surface">{describeReminder(r.minutesBefore)}</span>
              </div>
              <button
                type="button"
                aria-label="Remover lembrete"
                onClick={() => setReminders((prev) => prev.filter((x) => x.id !== r.id))}
                className="flex h-7 w-7 items-center justify-center rounded text-on-surface-variant transition-colors hover:bg-error-container/30 hover:text-error"
              >
                <Icon name="delete" className="text-[16px]" />
              </button>
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {PRESET_REMINDERS.filter((p) => !reminders.some((r) => r.minutesBefore === p.minutes)).map((p) => (
              <button
                key={p.minutes}
                type="button"
                onClick={() => addReminder(p.minutes)}
                className="flex items-center gap-1 rounded bg-surface-container px-2.5 py-1 font-label-sm text-label-sm text-on-surface-variant transition-all hover:bg-surface-container-high hover:text-primary"
              >
                <Icon name="add" className="text-[14px]" />
                <span>{p.label}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCustomOpen((v) => !v)}
              className="flex items-center gap-1 rounded bg-surface-container px-2.5 py-1 font-label-sm text-label-sm text-on-surface-variant transition-all hover:bg-surface-container-high hover:text-secondary-fixed"
            >
              <Icon name="tune" className="text-[14px]" />
              <span>Personalizado</span>
            </button>
          </div>
          {customOpen && (
            <div className="flex flex-wrap items-end gap-space-sm rounded bg-surface-container-lowest p-space-sm">
              {([
                ['dias', customDias, setCustomDias, 365],
                ['horas', customHoras, setCustomHoras, 23],
                ['minutos', customMin, setCustomMin, 59],
              ] as const).map(([rotulo, valor, setValor, max]) => (
                <div key={rotulo} className="flex flex-col gap-1">
                  <span className="font-label-sm text-label-sm text-outline">{rotulo}</span>
                  <input
                    type="number"
                    min={0}
                    max={max}
                    value={valor}
                    onChange={(e) => setValor(Math.max(0, Math.min(max, Number(e.target.value) || 0)))}
                    className="h-8 w-[70px] rounded bg-surface-container px-2 font-code-sm text-code-sm text-on-surface focus:outline-none focus:shadow-[0_0_0_1px_#00dc82]"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  addReminder(Math.max(0, customDias * 1440 + customHoras * 60 + customMin));
                  setCustomOpen(false);
                }}
                className="h-8 rounded bg-primary px-space-md font-title-md text-body-sm font-semibold text-on-primary hover:bg-primary-fixed"
              >
                Adicionar
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={LABEL} htmlFor="event-notes">
            Descrição e anotações
          </label>
          <textarea
            id="event-notes"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Detalhes, links, o que precisa ser levado..."
            className="w-full resize-none rounded bg-surface-container-lowest p-space-sm font-body-md text-body-md text-on-surface transition-colors placeholder:text-on-surface-variant/50 focus:bg-surface-container focus:outline-none"
          />
        </div>

        {erro && <p className="font-body-sm text-body-sm text-error">{erro}</p>}
      </form>

      <div className="flex items-center justify-between gap-space-sm bg-surface-container-lowest px-space-lg py-space-md">
        {editing ? (
          <button
            type="button"
            onClick={excluir}
            className="flex h-9 items-center gap-1.5 rounded px-space-md font-title-md text-title-md text-error transition-colors hover:bg-error-container/30"
          >
            <Icon name="delete" className="text-[18px]" />
            Excluir
          </button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-space-sm">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded bg-surface-container px-space-md font-title-md text-title-md text-on-surface transition-colors hover:bg-surface-container-high"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={salvar}
            disabled={salvando}
            className="flex h-9 items-center gap-1.5 rounded bg-primary px-space-lg font-title-md text-title-md font-semibold text-on-primary shadow-[0_0_14px_rgba(0,220,130,0.4)] transition-all hover:bg-primary-fixed active:scale-[0.98] disabled:opacity-60"
          >
            <Icon name="check" className="text-[18px]" />
            <span>{salvando ? 'Salvando…' : 'Salvar'}</span>
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
