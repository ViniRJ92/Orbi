/**
 * Fase 54/62 — alerta de lembrete da Agenda. Não some sozinho, não fecha com
 * Esc nem clicando fora: exige adiar ou concluir. Marcar como visto só
 * acontece quando o usuário age; enquanto aberto, a instância fica escondida
 * (store.reminderOpen), senão ela cobriria o alerta.
 * Orbi — Criado por Vinicius Braga
 */
import { useEffect, useState } from 'react';
import { ReminderDuePayload } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { formatTime, pad2 } from '../../format';
import { ModalShell } from '../ui/ModalShell';
import { Icon } from '../ui/Icon';

const ADIAMENTOS: { label: string; minutes: number }[] = [
  { label: '5 min', minutes: 5 },
  { label: '1 hora', minutes: 60 },
  { label: '1 dia', minutes: 1440 },
];

function quandoTexto(start: number): string {
  const d = new Date(start);
  const hoje = new Date();
  const amanha = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1);
  const mesmoDia = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (mesmoDia(d, hoje)) return `hoje às ${formatTime(start)}`;
  if (mesmoDia(d, amanha)) return `amanhã às ${formatTime(start)}`;
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)} às ${formatTime(start)}`;
}

export function ReminderAlert() {
  const [fila, setFila] = useState<ReminderDuePayload[]>([]);
  const setReminderOpen = useAppStore((s) => s.setReminderOpen);

  useEffect(
    () =>
      window.multiwhats.onReminderDue((payload) => {
        setFila((prev) => (prev.some((p) => p.key === payload.key) ? prev : [...prev, payload]));
      }),
    []
  );

  const atual = fila[0];
  const chaveAtual = atual?.key ?? null;
  useEffect(() => {
    setReminderOpen(chaveAtual !== null);
  }, [chaveAtual, setReminderOpen]);

  const removerAtual = () => setFila((prev) => prev.slice(1));

  async function adiar(minutes: number) {
    if (!atual) return;
    await window.multiwhats.snoozeReminder(atual.key, minutes);
    removerAtual();
  }

  async function concluir() {
    if (!atual) return;
    await window.multiwhats.dismissReminder(atual.key);
    removerAtual();
  }

  return (
    <ModalShell open={!!atual} onClose={() => {}} maxWidth="max-w-[440px]" closeOnEscape={false} closeOnBackdrop={false} zIndex="z-[55]">
      {atual && (
        <>
          <div className="flex items-start gap-space-sm bg-surface-container px-space-lg py-space-md">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary-container text-on-primary-container shadow-[0_0_12px_rgba(0,220,130,0.35)]">
              <Icon name="alarm" className="text-[22px]" fill />
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Lembrete</span>
              <h2 className="break-words font-headline-sm text-headline-sm font-semibold text-on-surface">{atual.title}</h2>
              <p className="mt-0.5 flex items-center gap-1 font-code-sm text-code-sm text-secondary-fixed-dim">
                <Icon name="schedule" className="text-[14px]" />
                {quandoTexto(atual.start)}
              </p>
            </div>
          </div>
          {fila.length > 1 && (
            <p className="px-space-lg pt-space-sm font-body-sm text-body-sm text-on-surface-variant">
              +{fila.length - 1} {fila.length - 1 === 1 ? 'outro lembrete' : 'outros lembretes'} na fila
            </p>
          )}
          <div className="flex flex-col gap-space-sm px-space-lg py-space-md">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Adiar por</span>
            <div className="flex flex-wrap items-center gap-space-xs">
              {ADIAMENTOS.map((a) => (
                <button
                  key={a.minutes}
                  type="button"
                  onClick={() => adiar(a.minutes)}
                  className="rounded bg-surface-container px-space-md py-1.5 font-title-md text-body-sm text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
                >
                  {a.label}
                </button>
              ))}
              <button
                type="button"
                onClick={concluir}
                className="ml-auto flex items-center gap-1.5 rounded bg-primary px-space-md py-1.5 font-title-md text-title-md font-semibold text-on-primary shadow-[0_0_14px_rgba(0,220,130,0.4)] transition-all hover:bg-primary-fixed"
              >
                <Icon name="check" className="text-[18px]" />
                Concluir
              </button>
            </div>
          </div>
        </>
      )}
    </ModalShell>
  );
}
