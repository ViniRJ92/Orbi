/**
 * Componente raiz do renderer: casca do layout do Stitch (cabeçalho + barra
 * de contas + área de conteúdo) e as sobreposições globais.
 *
 * A instância (WebContentsView) é uma camada nativa desenhada NA FRENTE desta
 * página. Por isso, sempre que a área de conteúdo mostra outra coisa — uma
 * página do cabeçalho, um modal, o cartão de erro — o processo principal é
 * avisado para escondê-la (`setOverlayActive`), como sempre foi feito no Orbi.
 * Arrastar a borda da barra de contas tem o mesmo tratamento, porque a view
 * roubaria os eventos do mouse durante o arrasto.
 *
 * Orbi — Criado por Vinicius Braga
 */
import { useEffect } from 'react';
import { useActiveAccount, useAppStore } from './store/useAppStore';
import { useTheme } from './useTheme';
import { Header } from './components/shell/Header';
import { Sidebar } from './components/shell/Sidebar';
import { InstanceView } from './components/shell/InstanceView';
import { AccountsPage } from './components/pages/AccountsPage';
import { AnalyticsPage } from './components/pages/AnalyticsPage';
import { AgendaPage } from './components/pages/AgendaPage';
import { HelpPage } from './components/pages/HelpPage';
import { SettingsPage } from './components/pages/settings/SettingsPage';
import { AddAccountWizard } from './components/overlays/AddAccountWizard';
import { CommandPalette } from './components/overlays/CommandPalette';
import { MessageToast } from './components/overlays/MessageToast';
import { ReminderAlert } from './components/overlays/ReminderAlert';
import { WhatsNewModal } from './components/overlays/WhatsNewModal';

export function App() {
  const init = useAppStore((s) => s.init);
  const appInfo = useAppStore((s) => s.appInfo);
  const theme = useAppStore((s) => s.theme);
  const page = useAppStore((s) => s.page);
  const openPage = useAppStore((s) => s.openPage);
  const sidebarPosition = useAppStore((s) => s.sidebarPosition);
  const isResizingSidebar = useAppStore((s) => s.isResizingSidebar);
  const addAccountOpen = useAppStore((s) => s.addAccountOpen);
  const paletteOpen = useAppStore((s) => s.paletteOpen);
  const setPaletteOpen = useAppStore((s) => s.setPaletteOpen);
  const reminderOpen = useAppStore((s) => s.reminderOpen);
  const whatsNew = useAppStore((s) => s.whatsNew);
  const { account: active, status: activeStatus } = useActiveAccount();

  useTheme(theme);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => window.multiwhats.onOpenCommandPalette(() => setPaletteOpen(true)), [setPaletteOpen]);

  // Fase 29: clique na notificação nativa de atualização abre Configurações > Atualizações.
  useEffect(() => window.multiwhats.onOpenSettingsUpdates(() => openPage('settings', 'updates')), [openPage]);

  useEffect(() => {
    if (appInfo) document.title = appInfo.appName;
  }, [appInfo]);

  const overlayActive =
    page !== 'home' ||
    addAccountOpen ||
    paletteOpen ||
    reminderOpen ||
    whatsNew !== null ||
    isResizingSidebar ||
    !!activeStatus?.loadError ||
    !active;

  useEffect(() => {
    window.multiwhats.setOverlayActive(overlayActive);
  }, [overlayActive]);

  const content = (
    <main className="relative min-h-0 min-w-0 flex-1 overflow-hidden bg-background">
      {page === 'home' && <InstanceView />}
      {page === 'analytics' && <AnalyticsPage />}
      {page === 'agenda' && <AgendaPage />}
      {page === 'accounts' && <AccountsPage />}
      {page === 'settings' && <SettingsPage />}
      {page === 'help' && <HelpPage />}

      <AddAccountWizard />
      <CommandPalette />
      <WhatsNewModal />
      <ReminderAlert />
      <MessageToast />
    </main>
  );

  const sidebar = <Sidebar position={sidebarPosition} />;
  const isHorizontal = sidebarPosition === 'top' || sidebarPosition === 'bottom';

  return (
    <div className="flex h-screen flex-col bg-background text-on-surface">
      <Header />
      <div className={'flex min-h-0 flex-1 ' + (isHorizontal ? 'flex-col' : 'flex-row')}>
        {(sidebarPosition === 'left' || sidebarPosition === 'top') && sidebar}
        {content}
        {(sidebarPosition === 'right' || sidebarPosition === 'bottom') && sidebar}
      </div>
    </div>
  );
}
