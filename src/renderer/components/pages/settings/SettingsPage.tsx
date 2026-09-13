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
import { Icon } from '../../ui/Icon';
import { useDiagnostics } from './useDiagnostics';
import { GeneralTab } from './GeneralTab';
import { InstancesTab } from './InstancesTab';
import { PerformanceTab } from './PerformanceTab';
import { BackupTab } from './BackupTab';
import { UpdatesTab } from './UpdatesTab';
import { AboutTab } from './AboutTab';

const TABS: { key: SettingsTabKey; label: string; icon: string }[] = [
  { key: 'general', label: 'Geral & Aparência', icon: 'palette' },
  { key: 'instances', label: 'Instâncias & Grupos', icon: 'hub' },
  { key: 'performance', label: 'Desempenho & Avisos', icon: 'notifications_active' },
  { key: 'backup', label: 'Backup & Diagnóstico', icon: 'database' },
  { key: 'updates', label: 'Atualizações', icon: 'system_update_alt' },
  { key: 'about', label: 'Sobre o Orbi', icon: 'info' },
];

export function SettingsPage() {
  const tab = useAppStore((s) => s.settingsTab);
  const setTab = useAppStore((s) => s.setSettingsTab);
  const appInfo = useAppStore((s) => s.appInfo);
  const updateState = useAppStore((s) => s.updateState);
  const diagnostics = useDiagnostics(5000);

  usePageEscape();

  const hasUpdate = updateState.phase === 'available' || updateState.phase === 'downloading' || updateState.phase === 'downloaded';
  const updateBadge = hasUpdate
    ? { text: 'Nova versão', cls: 'bg-error/15 text-error' }
    : updateState.phase === 'error'
      ? { text: 'Erro', cls: 'bg-error/15 text-error' }
      : null;

  return (
    <div className="h-full overflow-y-auto px-space-lg pb-space-xl pt-space-md">
      <div className="flex w-full flex-col">
        <div className="mb-space-lg flex items-baseline gap-space-sm">
          <h1 className="font-headline-lg text-headline-lg font-semibold tracking-tight text-on-surface">Configurações</h1>
          <span className="font-body-sm text-body-sm text-outline">Orbi v{appInfo?.version ?? ''}</span>
        </div>

        <div className="grid grid-cols-1 gap-space-md rounded-xl bg-surface-container-low p-space-sm shadow-xl lg:grid-cols-12">
          <nav aria-label="Abas de Configuração" className="flex flex-col gap-1 rounded-lg bg-surface-container-lowest p-space-xs lg:col-span-3">
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
                  {/* Só o que pede atenção: nova versão ou erro ao verificar. */}
                  {t.key === 'updates' && updateBadge && (
                    <span className={`flex-shrink-0 rounded px-1.5 py-0.5 font-body-sm text-body-sm ${updateBadge.cls}`}>{updateBadge.text}</span>
                  )}
                </button>
              );
            })}
            <p className="mt-auto flex items-center gap-1 px-space-md pb-space-xs pt-space-md font-body-sm text-body-sm text-outline">
              <Icon name="check" className="text-[14px]" />
              Alterações salvas automaticamente
            </p>
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
export function TabHeader({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="flex items-center gap-space-sm px-space-xs pb-space-xs">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary-container/15 text-primary">
        <Icon name={icon} className="text-[20px]" />
      </div>
      <div>
        <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">{title}</h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant">{description}</p>
      </div>
    </div>
  );
}
