/**
 * Configurações > Atualizações (Fase 27/29): verificação automática via
 * GitHub Releases; baixar e instalar só acontecem com clique do usuário.
 * Orbi — Criado por Vinicius Braga
 */
import { useAppStore } from '../../../store/useAppStore';
import { Icon } from '../../ui/Icon';
import { TabHeader } from './SettingsPage';

export function UpdatesTab() {
  const appInfo = useAppStore((s) => s.appInfo);
  const updateState = useAppStore((s) => s.updateState);
  const checkForUpdate = useAppStore((s) => s.checkForUpdate);
  const downloadUpdate = useAppStore((s) => s.downloadUpdate);
  const installUpdate = useAppStore((s) => s.installUpdate);

  const btnPrimary =
    'flex items-center gap-space-xs rounded bg-primary px-space-md py-space-sm font-title-md text-body-sm text-on-primary shadow-[0_0_14px_rgba(0,220,130,0.3)] transition-all hover:bg-surface-tint active:scale-95';
  const btnSecondary =
    'flex items-center gap-space-xs rounded bg-surface-container px-space-md py-space-sm font-title-md text-body-sm text-on-surface transition-colors hover:bg-surface-container-high active:scale-95';

  return (
    <>
      <TabHeader icon="system_update_alt" title="Atualizações" description="O Orbi verifica sozinho ao abrir e a cada 4 horas. Baixar e instalar só com o seu clique." />

      <div className="flex items-center justify-between rounded-lg bg-surface-container-low p-space-md shadow-sm">
        <div className="flex items-center gap-space-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-lowest text-primary">
            <Icon name="deployed_code" className="text-[22px]" />
          </div>
          <div className="flex flex-col">
            <span className="font-body-sm text-body-sm text-on-surface-variant">Versão instalada</span>
            <span className="font-title-md text-title-md font-semibold text-on-surface">Orbi</span>
          </div>
        </div>
        <span className="rounded bg-surface-container-high px-space-sm py-1 font-metric-md text-metric-md text-primary">v{appInfo?.version ?? '0.0.0'}</span>
      </div>

      <div className="relative flex flex-col gap-space-md overflow-hidden rounded-lg bg-surface-container-low p-space-lg shadow-sm">
        <div
          className={
            'absolute bottom-0 left-0 top-0 w-1 ' +
            (updateState.phase === 'error'
              ? 'bg-error'
              : updateState.phase === 'available' || updateState.phase === 'downloaded'
                ? 'bg-primary-container shadow-[0_0_8px_rgba(0,220,130,0.8)]'
                : 'bg-secondary-fixed-dim')
          }
        />
        {updateState.phase === 'idle' && (
          <div className="flex items-center gap-space-sm font-body-md text-body-md text-on-surface-variant">
            <Icon name="schedule" className="text-[20px] text-outline" />
            Ainda não verificado nesta sessão.
          </div>
        )}
        {updateState.phase === 'checking' && (
          <div className="flex items-center gap-space-sm font-body-md text-body-md text-on-surface-variant">
            <Icon name="sync" className="animate-spin text-[20px] text-secondary-fixed-dim" />
            Verificando se há uma versão mais nova...
          </div>
        )}
        {updateState.phase === 'not-available' && (
          <div className="flex items-center gap-space-sm font-body-md text-body-md text-on-surface">
            <Icon name="check_circle" className="text-[20px] text-primary" />
            Você já está na versão mais recente.
          </div>
        )}
        {updateState.phase === 'available' && (
          <>
            <div className="flex items-center gap-space-sm font-body-md text-body-md text-on-surface">
              <Icon name="download" className="text-[20px] text-primary" />
              Versão <strong className="font-code-sm text-primary">v{updateState.version}</strong> disponível.
            </div>
            <button type="button" onClick={downloadUpdate} className={btnPrimary + ' self-start'}>
              <Icon name="file_download" className="text-[18px]" />
              Baixar atualização
            </button>
          </>
        )}
        {updateState.phase === 'downloading' && (
          <div className="flex flex-col gap-space-sm">
            <div className="flex items-center gap-space-sm font-body-md text-body-md text-on-surface-variant">
              <Icon name="sync" className="animate-spin text-[20px] text-secondary-fixed-dim" />
              Baixando atualização... <span className="font-code-sm text-primary">{updateState.percent}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-lowest">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${updateState.percent}%` }} />
            </div>
          </div>
        )}
        {updateState.phase === 'downloaded' && (
          <>
            <div className="flex items-center gap-space-sm font-body-md text-body-md text-on-surface">
              <Icon name="check_circle" className="text-[20px] text-primary" />
              Versão <strong className="font-code-sm text-primary">v{updateState.version}</strong> baixada e pronta para instalar.
            </div>
            <button type="button" onClick={installUpdate} className={btnPrimary + ' self-start'}>
              <Icon name="restart_alt" className="text-[18px]" />
              Reiniciar e instalar agora
            </button>
            <p className="font-body-sm text-body-sm text-outline">O app fecha e reabre já atualizado. Suas contas continuam logadas normalmente.</p>
          </>
        )}
        {updateState.phase === 'error' && (
          <>
            <div className="flex items-center gap-space-sm font-body-md text-body-md text-error">
              <Icon name="warning" className="text-[20px]" />
              Não foi possível verificar/baixar a atualização.
            </div>
            <p className="font-body-sm text-body-sm text-outline">{updateState.message}</p>
          </>
        )}
        {(updateState.phase === 'idle' || updateState.phase === 'not-available' || updateState.phase === 'error') && (
          <button type="button" onClick={checkForUpdate} className={btnSecondary + ' self-start'}>
            <Icon name="refresh" className="text-[18px]" />
            Verificar agora
          </button>
        )}
      </div>
    </>
  );
}
