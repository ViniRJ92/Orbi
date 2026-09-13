/**
 * Configurações > Desempenho & Avisos (tela "Desempenho & Notificações" do
 * Stitch): perfis de quantas instâncias ficam carregadas (Fase 16, com o
 * Personalizado 1–30) e as três chaves de notificação (Fase 48). Os números
 * de consumo são medidos pelo processo principal.
 * Orbi — Criado por Vinicius Braga
 */
import { useEffect, useRef, useState } from 'react';
import { PerformanceMode, PerformanceModeInfo } from '../../../types';
import { useAppStore } from '../../../store/useAppStore';
import { formatBytes } from '../../../format';
import { Icon } from '../../ui/Icon';
import { Toggle } from '../../ui/Toggle';
import { useDiagnostics } from './useDiagnostics';

const PROFILES: { value: PerformanceMode; label: string; icon: string; hover: string }[] = [
  { value: 'economy', label: 'Economia', icon: 'eco', hover: 'group-hover:text-primary' },
  { value: 'balanced', label: 'Equilibrado', icon: 'speed', hover: 'group-hover:text-secondary' },
  { value: 'performance', label: 'Desempenho', icon: 'bolt', hover: 'group-hover:text-primary' },
  { value: 'custom', label: 'Personalizado', icon: 'tune', hover: 'group-hover:text-primary' },
];

export function PerformanceTab() {
  const accounts = useAppStore((s) => s.accounts);
  const statuses = useAppStore((s) => s.statuses);
  const diagnostics = useDiagnostics(2000);

  const [info, setInfo] = useState<PerformanceModeInfo | null>(null);
  const [notifications, setNotifications] = useState(true);
  const [windowsNotifications, setWindowsNotifications] = useState(true);
  const [toastNotifications, setToastNotifications] = useState(true);
  const [cpuSamples, setCpuSamples] = useState<number[]>([]);
  const lastDiag = useRef<number | null>(null);

  useEffect(() => {
    window.multiwhats.getPerformanceMode().then(setInfo);
    window.multiwhats.getNotificationsEnabled().then(setNotifications);
    window.multiwhats.getWindowsNotificationsEnabled().then(setWindowsNotifications);
    window.multiwhats.getToastNotificationsEnabled().then(setToastNotifications);
  }, []);

  useEffect(() => {
    if (!diagnostics || lastDiag.current === diagnostics.cpuPercent + diagnostics.memoryBytes) return;
    lastDiag.current = diagnostics.cpuPercent + diagnostics.memoryBytes;
    setCpuSamples((prev) => [...prev, diagnostics.cpuPercent].slice(-12));
  }, [diagnostics]);

  const mode = info?.mode ?? 'balanced';
  const loaded = accounts.filter((a) => statuses.get(a.id)?.loaded).length;
  const suspended = accounts.filter((a) => statuses.get(a.id)?.suspended).length;

  const presetOf = (m: PerformanceMode) =>
    m === 'custom' ? { maxLoadedAccounts: info?.customMaxLoadedAccounts ?? 6, idleSuspendMinutes: null } : info?.presets[m];

  const effectiveMax = presetOf(mode)?.maxLoadedAccounts ?? 0;

  const applyMode = async (m: PerformanceMode) => {
    await window.multiwhats.setPerformanceMode(m);
    setInfo((prev) => (prev ? { ...prev, mode: m } : prev));
  };

  const applyCustom = async (value: number) => {
    const applied = await window.multiwhats.setCustomMaxLoadedAccounts(value);
    setInfo((prev) => (prev ? { ...prev, customMaxLoadedAccounts: applied } : prev));
  };

  const range = info?.customMaxLoadedRange ?? { min: 1, max: 30 };
  const custom = info?.customMaxLoadedAccounts ?? 6;
  const ringPct = effectiveMax > 0 ? Math.min(100, (loaded / effectiveMax) * 100) : 0;

  const sparkMax = Math.max(1, ...cpuSamples);
  const spark = cpuSamples
    .map((v, i) => `${cpuSamples.length > 1 ? (i / (cpuSamples.length - 1)) * 64 : 32} ${22 - (v / sparkMax) * 18}`)
    .join(' L ');

  const describe = (m: PerformanceMode): string => {
    const p = presetOf(m);
    if (!p) return '';
    if (m === 'custom') return `Você escolhe o limite (${range.min}–${range.max}). Sem suspensão por ociosidade.`;
    const n = p.maxLoadedAccounts;
    return `Até ${n} ${n === 1 ? 'instância carregada' : 'instâncias carregadas'}. Suspende ociosas após ${p.idleSuspendMinutes} min.`;
  };

  return (
    <>
      <section className="flex flex-col gap-space-md rounded-lg bg-surface-container-low p-space-lg shadow-sm">
        <div className="flex flex-col justify-between gap-space-sm sm:flex-row sm:items-center">
          <div className="flex items-start gap-space-sm">
            <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded bg-surface-container-high text-primary">
              <Icon name="memory" className="text-[18px]" />
            </div>
            <div className="flex flex-col">
              <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">Desempenho das instâncias</h3>
              <p className="mt-0.5 max-w-2xl font-body-md text-body-md text-on-surface-variant">
                Controla quantas instâncias ficam prontas ao mesmo tempo. As demais são suspensas automaticamente em segundo plano
                para economizar memória e CPU, sem perder a sessão.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-space-sm self-start rounded bg-surface-container px-space-md py-1.5 sm:self-auto">
            <div className="flex flex-col text-right">
              <span className="font-body-sm text-body-sm text-on-surface-variant">CPU do Orbi</span>
              <span className="font-metric-md text-code-sm text-primary">{diagnostics ? `${diagnostics.cpuPercent}%` : '—'}</span>
            </div>
            <svg className="h-6 w-16 text-primary" fill="none" viewBox="0 0 64 24">
              {cpuSamples.length > 1 && (
                <path d={`M ${spark}`} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              )}
            </svg>
          </div>
        </div>

        <div>
          <span className="mb-space-xs block font-title-md text-title-md font-medium text-on-surface-variant">Perfil</span>
          <div className="grid grid-cols-1 gap-space-sm sm:grid-cols-2 lg:grid-cols-4">
            {PROFILES.map((p) => {
              const active = p.value === mode;
              const preset = presetOf(p.value);
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => applyMode(p.value)}
                  className={
                    'group relative flex h-36 flex-col justify-between overflow-hidden rounded-lg p-space-md text-left transition-all ' +
                    (active
                      ? 'cursor-default bg-surface-container-high shadow-[0_0_14px_rgba(0,220,130,0.3)]'
                      : 'bg-surface-container shadow-sm hover:bg-surface-container-high hover:shadow-primary/10')
                  }
                >
                  <div className="flex w-full items-center justify-between">
                    <div
                      className={
                        'flex h-9 w-9 items-center justify-center rounded-lg transition-colors ' +
                        (active ? 'bg-primary-container text-on-primary-container shadow-sm' : `bg-surface-container-highest text-on-surface-variant ${p.hover}`)
                      }
                    >
                      <Icon name={p.icon} fill={active} className="text-[20px]" />
                    </div>
                    <span className="font-body-sm text-body-sm text-outline">
                      {p.value === 'custom' ? `${range.min}–${range.max}` : `Máx. ${preset?.maxLoadedAccounts ?? '—'}`}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-space-xs">
                      <span className={'font-title-md text-title-md ' + (active ? 'font-bold text-primary' : `font-semibold text-on-surface ${p.hover}`)}>
                        {p.label}
                      </span>
                      {active && <Icon name="check_circle" className="text-[14px] text-primary" />}
                    </div>
                    <span className={'mt-0.5 line-clamp-2 font-body-sm text-body-sm ' + (active ? 'text-on-surface' : 'text-on-surface-variant')}>
                      {describe(p.value)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col items-start justify-between gap-space-md rounded-lg bg-surface-container p-space-md shadow-inner lg:flex-row lg:items-center">
          <div className="flex flex-1 items-center gap-space-md">
            <div className="flex h-10 w-10 items-center justify-center rounded bg-surface-container-lowest text-primary">
              <Icon name="developer_board" className="text-[22px]" />
            </div>
            <div className="flex flex-col">
              <label className="font-title-md text-body-lg font-semibold text-on-surface" htmlFor="concurrentInstances">
                Instâncias simultâneas
              </label>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                {mode === 'custom'
                  ? 'Quantas instâncias ficam carregadas ao mesmo tempo no perfil Personalizado.'
                  : 'Disponível no perfil Personalizado. Selecione-o acima para ajustar.'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-space-sm self-end lg:self-center">
            <button
              type="button"
              disabled={mode !== 'custom' || custom <= range.min}
              onClick={() => applyCustom(custom - 1)}
              className="flex h-9 w-9 items-center justify-center rounded bg-surface-container-highest text-on-surface transition-all hover:bg-surface-container-high active:scale-95 disabled:opacity-40"
            >
              <Icon name="remove" className="text-[18px]" />
            </button>
            <div className="relative flex items-center">
              <input
                id="concurrentInstances"
                type="number"
                min={range.min}
                max={range.max}
                value={custom}
                disabled={mode !== 'custom'}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (!Number.isNaN(v)) applyCustom(v);
                }}
                className="h-10 w-24 rounded bg-surface-container-lowest px-space-sm text-center font-metric-xl text-metric-md text-primary shadow-sm focus:outline-none disabled:opacity-50"
              />
            </div>
            <button
              type="button"
              disabled={mode !== 'custom' || custom >= range.max}
              onClick={() => applyCustom(custom + 1)}
              className="flex h-9 w-9 items-center justify-center rounded bg-surface-container-highest text-on-surface transition-all hover:bg-surface-container-high active:scale-95 disabled:opacity-40"
            >
              <Icon name="add" className="text-[18px]" />
            </button>
            <div className="ml-space-sm flex items-center gap-space-xs rounded bg-surface-container-lowest px-3 py-1.5 pl-space-md">
              <svg className="h-7 w-7 -rotate-90 text-primary" viewBox="0 0 36 36">
                <path className="text-surface-container-highest" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.5" />
                <path className="text-primary" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${ringPct}, 100`} strokeLinecap="round" strokeWidth="3.5" />
              </svg>
              <div className="flex flex-col">
                <span className="font-body-sm text-body-sm text-outline">Carregadas</span>
                <span className="font-code-sm text-code-sm font-semibold text-on-surface">
                  {loaded} / {effectiveMax}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-space-md rounded-lg bg-surface-container-low p-space-lg shadow-sm">
        <div className="flex items-start gap-space-sm">
          <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded bg-surface-container-high text-primary">
            <Icon name="notifications_active" className="text-[18px]" />
          </div>
          <div className="flex flex-col">
            <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">Notificações de mensagens</h3>
            <p className="mt-0.5 max-w-2xl font-body-md text-body-md text-on-surface-variant">
              Desligar os avisos não afeta a detecção de mensagens nem o contador de não lidas na barra de contas.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-space-xs">
          <NotificationRow
            icon="chat"
            iconColor="text-primary"
            title="Notificações de novas mensagens"
            description="Chave geral. Desligada, nenhum dos dois avisos abaixo aparece."
            checked={notifications}
            onToggle={async () => setNotifications(await window.multiwhats.setNotificationsEnabled(!notifications))}
          />
          <NotificationRow
            icon="desktop_windows"
            iconColor="text-secondary"
            title="Notificações do Windows"
            description="Caixa do sistema, aparece com o Orbi minimizado ou em segundo plano."
            checked={windowsNotifications}
            disabled={!notifications}
            onToggle={async () => setWindowsNotifications(await window.multiwhats.setWindowsNotificationsEnabled(!windowsNotifications))}
          />
          <NotificationRow
            icon="layers"
            iconColor="text-tertiary-fixed"
            title="Notificações internas"
            description="Aviso flutuante sobre a barra de contas, aparece com a janela aberta."
            checked={toastNotifications}
            disabled={!notifications}
            onToggle={async () => setToastNotifications(await window.multiwhats.setToastNotificationsEnabled(!toastNotifications))}
          />
        </div>
      </section>

      <div className="flex flex-col items-start justify-between gap-space-md rounded-lg bg-surface-container-lowest p-space-md shadow-sm md:flex-row md:items-center">
        <div className="flex items-center gap-space-sm">
          <Icon name="analytics" className="text-[20px] text-primary" />
          <div className="flex flex-col">
            <span className="font-title-md text-title-md font-semibold text-on-surface">Consumo atual do Orbi</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              {diagnostics
                ? `${formatBytes(diagnostics.memoryBytes)} de memória em ${diagnostics.processCount} processos, somando a janela e as instâncias carregadas.`
                : 'Medindo...'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-space-md">
          <div className="flex flex-col items-end">
            <span className="font-body-sm text-body-sm text-outline">Carregadas</span>
            <span className="font-metric-md text-code-sm text-secondary">{loaded}</span>
          </div>
          <div className="h-6 w-px bg-surface-container-highest" />
          <div className="flex flex-col items-end">
            <span className="font-body-sm text-body-sm text-outline">Suspensas</span>
            <span className="font-metric-md text-code-sm text-primary">{suspended}</span>
          </div>
        </div>
      </div>
    </>
  );
}

function NotificationRow({
  icon,
  iconColor,
  title,
  description,
  checked,
  disabled,
  onToggle,
}: {
  icon: string;
  iconColor: string;
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={
        'group flex items-center justify-between rounded-lg bg-surface-container p-space-md shadow-sm transition-all hover:bg-surface-container-high ' +
        (disabled ? 'opacity-50' : '')
      }
    >
      <div className="flex items-center gap-space-md">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-lowest shadow-inner transition-transform group-hover:scale-105 ${iconColor}`}>
          <Icon name={icon} className="text-[22px]" />
        </div>
        <div className="flex flex-col">
          <span className="font-title-md text-body-lg font-semibold text-on-surface">{title}</span>
          <span className="font-body-sm text-body-sm text-on-surface-variant">{description}</span>
        </div>
      </div>
      <Toggle checked={checked} onChange={onToggle} disabled={disabled} label={title} />
    </div>
  );
}
