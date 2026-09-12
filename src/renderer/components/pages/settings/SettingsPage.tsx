/**
 * Página "Configurações" no layout "Central de Configurações" do Stitch:
 * módulos à esquerda, conteúdo à direita. Cada aba segue a tela do Stitch
 * correspondente (Preferências, Instâncias & Agrupamentos, Desempenho &
 * Notificações, Backup & Diagnóstico).
 *
 * Todas as preferências são gravadas no momento em que mudam (settings.json),
 * como sempre foi no Orbi — por isso não existe botão "Salvar".
 *
 * Orbi — Criado por Vinicius Braga
 */
import { SettingsTabKey, useAppStore } from '../../../store/useAppStore';
import { usePageEscape } from '../../../usePageEscape';
import { formatBytes } from '../../../format';
import { Icon } from '../../ui/Icon';
import { useDiagnostics } from './useDiagnostics';
import { GeneralTab } from './GeneralTab';
import { InstancesTab } from './InstancesTab';
import { PerformanceTab } from './PerformanceTab';
import { BackupTab } from './BackupTab';
import { UpdatesTab } from './UpdatesTab';
import { AboutTab } from './AboutTab';

const TABS: { key: SettingsTabKey; label: string; icon: string; crumb: string }[] = [
  { key: 'general', label: 'Geral & Aparência', icon: 'palette', crumb: 'PREFERÊNCIAS & APARÊNCIA' },
  { key: 'instances', label: 'Instâncias & Grupos', icon: 'hub', crumb: 'INSTÂNCIAS & AGRUPAMENTOS' },
  { key: 'performance', label: 'Desempenho & Avisos', icon: 'notifications_active', crumb: 'DESEMPENHO & NOTIFICAÇÕES' },
  { key: 'backup', label: 'Backup & Diagnóstico', icon: 'database', crumb: 'BACKUP & DIAGNÓSTICO' },
  { key: 'updates', label: 'Atualizações', icon: 'system_update_alt', crumb: 'ATUALIZAÇÕES' },
  { key: 'about', label: 'Sobre o Orbi', icon: 'info', crumb: 'SOBRE O ORBI' },
];

export function SettingsPage() {
  const tab = useAppStore((s) => s.settingsTab);
  const setTab = useAppStore((s) => s.setSettingsTab);
  const appInfo = useAppStore((s) => s.appInfo);
  const accounts = useAppStore((s) => s.accounts);
  const statuses = useAppStore((s) => s.statuses);
  const updateState = useAppStore((s) => s.updateState);
  const diagnostics = useDiagnostics(5000);

  usePageEscape();

  const online = accounts.filter((a) => statuses.get(a.id)?.isOnline).length;
  const hasUpdate = updateState.phase === 'available' || updateState.phase === 'downloading' || updateState.phase === 'downloaded';
  const updateBadge =
    updateState.phase === 'not-available'
      ? { text: 'UP-TO-DATE', cls: 'bg-surface-container-high text-primary' }
      : hasUpdate
        ? { text: 'NOVA VERSÃO', cls: 'bg-error/15 text-error' }
        : updateState.phase === 'error'
          ? { text: 'ERRO', cls: 'bg-error/15 text-error' }
          : null;
  const current = TABS.find((t) => t.key === tab) ?? TABS[0];
  const ramPct = diagnostics && diagnostics.systemMemoryBytes > 0 ? (diagnostics.memoryBytes / diagnostics.systemMemoryBytes) * 100 : 0;

  return (
    <div className="h-full overflow-y-auto px-space-lg pb-space-xl pt-space-md">
      <div className="flex w-full flex-col">
        <div className="mb-space-lg flex flex-col justify-between gap-space-sm md:flex-row md:items-center">
          <div>
            <div className="mb-1 flex items-center gap-space-xs font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
              <span>SISTEMA</span>
              <span>/</span>
              <span className="font-bold text-primary">{current.crumb}</span>
            </div>
            <h1 className="flex items-center gap-space-xs font-headline-lg text-headline-lg font-semibold tracking-tight text-on-surface">
              Central de Configurações
              <span className="rounded-full bg-primary/10 px-2 py-0.5 font-badge-micro text-badge-micro font-bold uppercase tracking-normal text-primary">
                ORBI v{appInfo?.version ?? ''}
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-surface-container-high px-space-md py-1.5 font-title-md text-title-md font-medium text-on-surface-variant shadow-sm">
            <Icon name="bolt" className="text-[16px] text-primary" />
            <span>Alterações salvas automaticamente</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-space-md rounded-xl bg-surface-container-low p-space-sm shadow-xl lg:grid-cols-12">
          <nav aria-label="Abas de Configuração" className="flex flex-col gap-1 rounded-lg bg-surface-container-lowest p-space-xs lg:col-span-3">
            <div className="mb-1 flex items-center justify-between px-space-md py-space-sm">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Módulos do Sistema</span>
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary shadow-[0_0_6px_rgba(0,220,130,0.8)]" />
            </div>
            {TABS.map((t) => {
              const active = t.key === tab;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={
                    'flex w-full items-center justify-between rounded-lg px-space-md py-2.5 text-left transition-all duration-150 ' +
                    (active
                      ? 'bg-surface-container-high font-semibold text-primary shadow-[0_0_12px_rgba(0,220,130,0.12)]'
                      : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface')
                  }
                >
                  <div className="flex min-w-0 items-center gap-space-sm">
                    <Icon name={t.icon} className="text-[18px]" />
                    <span className="truncate font-title-md text-title-md">{t.label}</span>
                  </div>
                  {active ? (
                    <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                  ) : t.key === 'instances' ? (
                    <span className="flex-shrink-0 rounded bg-surface-container-low px-1.5 py-0.5 font-badge-micro text-badge-micro text-outline">
                      {online} LIVE
                    </span>
                  ) : t.key === 'performance' && diagnostics ? (
                    <span className="flex-shrink-0 rounded bg-surface-container-low px-1.5 py-0.5 font-badge-micro text-badge-micro text-secondary-fixed-dim">
                      {diagnostics.cpuPercent}% CPU
                    </span>
                  ) : t.key === 'updates' && updateBadge ? (
                    <span className={`flex-shrink-0 rounded px-1.5 py-0.5 font-badge-micro text-badge-micro font-bold ${updateBadge.cls}`}>
                      {updateBadge.text}
                    </span>
                  ) : null}
                </button>
              );
            })}
            <div className="mt-auto pt-space-md">
              <div className="rounded-lg bg-surface-container-low p-space-sm shadow-inner">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-label-sm text-label-sm uppercase text-outline">CONSUMO DO ORBI</span>
                  <span className="font-code-sm text-code-sm text-primary">{diagnostics ? `${diagnostics.processCount} PROC` : '—'}</span>
                </div>
                <div className="space-y-1.5 font-code-sm text-code-sm text-on-surface-variant">
                  <div className="flex items-center justify-between">
                    <span className="text-outline">RAM:</span>
                    <span className="font-semibold text-on-surface">
                      {diagnostics ? `${formatBytes(diagnostics.memoryBytes)} / ${formatBytes(diagnostics.systemMemoryBytes)}` : '—'}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-lowest">
                    <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${Math.min(100, ramPct)}%` }} />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-outline">CPU:</span>
                    <span className="font-semibold text-secondary-fixed-dim">{diagnostics ? `${diagnostics.cpuPercent}%` : '—'}</span>
                  </div>
                </div>
              </div>
            </div>
          </nav>

          <section className="flex min-w-0 flex-col gap-space-md rounded-lg bg-surface-container p-space-md lg:col-span-9">
            {tab === 'general' && <GeneralTab />}
            {tab === 'instances' && <InstancesTab diagnostics={diagnostics} />}
            {tab === 'performance' && <PerformanceTab />}
            {tab === 'backup' && <BackupTab diagnostics={diagnostics} />}
            {tab === 'updates' && <UpdatesTab />}
            {tab === 'about' && <AboutTab />}
          </section>
        </div>
      </div>
    </div>
  );
}

/** Cabeçalho de seção usado no topo de cada aba (padrão da tela Preferências). */
export function TabHeader({ icon, title, description, badge }: { icon: string; title: string; description: string; badge?: string }) {
  return (
    <div className="flex items-center justify-between gap-space-md rounded-lg bg-surface-container-high/40 p-space-sm">
      <div className="flex items-center gap-space-sm">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary-container/20 text-primary shadow-[0_0_8px_rgba(0,220,130,0.3)]">
          <Icon name={icon} className="text-[20px]" />
        </div>
        <div>
          <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">{title}</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">{description}</p>
        </div>
      </div>
      {badge && (
        <div className="hidden flex-shrink-0 items-center gap-space-xs rounded bg-surface-container-lowest px-space-sm py-1 font-label-sm text-label-sm text-outline sm:flex">
          <Icon name="bolt" className="text-[14px]" />
          <span>{badge}</span>
        </div>
      )}
    </div>
  );
}
