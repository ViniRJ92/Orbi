/**
 * Estado global do renderer (Zustand). Concentra os dados vindos do processo
 * principal (contas, status, tema, agrupamentos, atualização) e as ações que
 * chamam a API exposta em window.multiwhats.
 *
 * Novo layout: além do estado de antes, guarda qual PÁGINA do cabeçalho está
 * aberta (Analytics, Agenda, Gerenciar contas, Configurações, Ajuda) e quais
 * sobreposições globais estão na tela — é isso que decide quando a instância
 * nativa precisa ser escondida (ver App.tsx).
 *
 * Orbi — Criado por Vinicius Braga
 */
import { create } from 'zustand';
import {
  AccountRecord,
  AccountService,
  AccountStatus,
  AppInfo,
  GroupRecord,
  IconSize,
  SidebarPosition,
  ThemePreference,
  UpdateState,
  WhatsNewResult,
} from '../types';
import { SIDEBAR_WIDTH_DEFAULT } from '../constants';

export type PageKey = 'home' | 'analytics' | 'agenda' | 'accounts' | 'settings' | 'help';
export type SettingsTabKey = 'general' | 'instances' | 'performance' | 'backup' | 'updates' | 'about';

interface AppState {
  appInfo: AppInfo | null;
  accounts: AccountRecord[];
  statuses: Map<string, AccountStatus>;
  theme: ThemePreference;
  searchQuery: string;
  confirmBeforeRemove: boolean;
  sidebarWidth: number;
  sidebarPosition: SidebarPosition;
  iconSize: IconSize;
  isResizingSidebar: boolean;
  groups: GroupRecord[];
  updateState: UpdateState;
  /** Fase 29: preenchido só quando há notas de versão novas a mostrar. */
  whatsNew: WhatsNewResult | null;
  windowMaximized: boolean;

  // --- Navegação do novo layout ---
  page: PageKey;
  settingsTab: SettingsTabKey;
  addAccountOpen: boolean;
  paletteOpen: boolean;
  reminderOpen: boolean;

  init: () => Promise<void>;
  openPage: (page: PageKey, settingsTab?: SettingsTabKey) => void;
  goHome: () => void;
  setSettingsTab: (tab: SettingsTabKey) => void;
  setAddAccountOpen: (open: boolean) => void;
  setPaletteOpen: (open: boolean) => void;
  setReminderOpen: (open: boolean) => void;
  /** Alguma sobreposição global (assistente, busca, novidades, lembrete) na frente de tudo. */
  isBlockingOverlayOpen: () => boolean;

  checkForUpdate: () => Promise<void>;
  downloadUpdate: () => Promise<void>;
  installUpdate: () => Promise<void>;
  dismissWhatsNew: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  switchAccount: (id: string) => Promise<void>;
  /** Troca de conta e volta para a tela da instância. */
  openAccount: (id: string) => Promise<void>;
  suspendAccount: (id: string) => Promise<void>;
  addAccount: (
    name: string,
    color?: string,
    service?: AccountService,
    customUrl?: string
  ) => Promise<{ error: string } | AccountRecord>;
  renameAccount: (id: string, name: string) => Promise<void>;
  setAccountColor: (id: string, color: string) => Promise<void>;
  setGroupColor: (id: string, color: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  reorderAccounts: (orderedIds: string[]) => Promise<void>;
  removeAccount: (id: string) => Promise<void>;
  removeAccountWithConfirm: (id: string, name: string) => Promise<void>;
  reloadAccount: (id: string) => Promise<void>;
  refreshAccounts: () => Promise<void>;
  setTheme: (theme: ThemePreference) => Promise<void>;
  setConfirmBeforeRemove: (enabled: boolean) => void;
  setSidebarWidth: (width: number) => void;
  setIsResizingSidebar: (resizing: boolean) => void;
  commitSidebarWidth: (width: number) => Promise<void>;
  setSidebarPosition: (position: SidebarPosition) => Promise<void>;
  setIconSize: (size: IconSize) => Promise<void>;
  loadGroups: () => Promise<void>;
  createGroup: (name: string) => Promise<{ error: string } | null>;
  renameGroup: (id: string, name: string) => Promise<{ error: string } | null>;
  reorderGroups: (orderedIds: string[]) => Promise<void>;
  removeGroup: (id: string) => Promise<void>;
  setAccountGroup: (id: string, groupId: string | null) => Promise<void>;
  pickAccountIcon: (id: string) => Promise<{ dataUrl?: string; error?: string; canceled?: boolean }>;
  resetAccountIcon: (id: string) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  appInfo: null,
  accounts: [],
  statuses: new Map(),
  theme: 'dark',
  searchQuery: '',
  confirmBeforeRemove: true,
  sidebarWidth: SIDEBAR_WIDTH_DEFAULT,
  sidebarPosition: 'left',
  iconSize: 'medium',
  isResizingSidebar: false,
  groups: [],
  updateState: { phase: 'idle' },
  whatsNew: null,
  windowMaximized: false,

  page: 'home',
  settingsTab: 'general',
  addAccountOpen: false,
  paletteOpen: false,
  reminderOpen: false,

  init: async () => {
    const [
      appInfo,
      theme,
      payload,
      confirmBeforeRemove,
      sidebarWidth,
      sidebarPosition,
      iconSize,
      groups,
      updateState,
      whatsNew,
      windowMaximized,
    ] = await Promise.all([
      window.multiwhats.getAppInfo(),
      window.multiwhats.getTheme(),
      window.multiwhats.listAccounts(),
      window.multiwhats.getConfirmBeforeRemove(),
      window.multiwhats.getSidebarWidth(),
      window.multiwhats.getSidebarPosition(),
      window.multiwhats.getIconSize(),
      window.multiwhats.listGroups(),
      window.multiwhats.getUpdateState(),
      window.multiwhats.getWhatsNew(),
      window.multiwhats.windowIsMaximized(),
    ]);
    set({
      appInfo,
      theme,
      accounts: payload.accounts,
      statuses: new Map(payload.statuses.map((s) => [s.id, s])),
      confirmBeforeRemove,
      sidebarWidth,
      sidebarPosition,
      iconSize,
      groups,
      updateState,
      whatsNew: whatsNew.shouldShow ? whatsNew : null,
      windowMaximized,
    });
    window.multiwhats.onAccountsChanged((next) => {
      set({
        accounts: next.accounts,
        statuses: new Map(next.statuses.map((s) => [s.id, s])),
      });
    });
    window.multiwhats.onUpdateStatusChanged((state) => set({ updateState: state }));
    window.multiwhats.onWindowMaximizedChanged((maximized) => set({ windowMaximized: maximized }));
  },

  openPage: (page, settingsTab) =>
    set((s) => ({ page, settingsTab: page === 'settings' ? settingsTab ?? s.settingsTab : s.settingsTab })),
  goHome: () => set({ page: 'home' }),
  setSettingsTab: (tab) => set({ settingsTab: tab }),
  setAddAccountOpen: (open) => set({ addAccountOpen: open }),
  setPaletteOpen: (open) => set({ paletteOpen: open }),
  setReminderOpen: (open) => set({ reminderOpen: open }),
  isBlockingOverlayOpen: () => {
    const s = get();
    return s.addAccountOpen || s.paletteOpen || s.reminderOpen || s.whatsNew !== null;
  },

  dismissWhatsNew: async () => {
    await window.multiwhats.ackWhatsNew();
    set({ whatsNew: null });
  },

  checkForUpdate: async () => {
    await window.multiwhats.checkForUpdate();
  },
  downloadUpdate: async () => {
    await window.multiwhats.downloadUpdate();
  },
  installUpdate: async () => {
    await window.multiwhats.installUpdate();
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  switchAccount: async (id) => {
    await window.multiwhats.switchAccount(id);
  },
  openAccount: async (id) => {
    set({ page: 'home' });
    await window.multiwhats.switchAccount(id);
  },
  suspendAccount: async (id) => {
    await window.multiwhats.suspendAccount(id);
  },
  addAccount: async (name, color, service, customUrl) => window.multiwhats.addAccount(name, color, service, customUrl),
  renameAccount: async (id, name) => {
    await window.multiwhats.renameAccount(id, name);
  },
  setAccountColor: async (id, color) => {
    await window.multiwhats.setAccountColor(id, color);
  },
  setGroupColor: async (id, color) => {
    await window.multiwhats.setGroupColor(id, color);
    await get().loadGroups();
  },
  toggleFavorite: async (id) => {
    await window.multiwhats.toggleFavorite(id);
  },
  reorderAccounts: async (orderedIds) => {
    await window.multiwhats.reorderAccounts(orderedIds);
  },
  removeAccount: async (id) => {
    await window.multiwhats.removeAccount(id);
  },
  /** Remove pedindo confirmação antes, a menos que o usuário tenha desativado isso em Configurações. */
  removeAccountWithConfirm: async (id, name) => {
    if (get().confirmBeforeRemove) {
      const isWhatsapp = get().accounts.find((a) => a.id === id)?.service === 'whatsapp';
      const reconnectHint = isWhatsapp
        ? ' (será necessário escanear o QR Code novamente se ela for adicionada de volta)'
        : ' (será necessário fazer login novamente se ela for adicionada de volta)';
      const confirmed = window.confirm(
        `Remover "${name}"?\n\nIsso apaga permanentemente os dados de sessão desta conta${reconnectHint}. As demais contas não são afetadas.`
      );
      if (!confirmed) return;
    }
    await window.multiwhats.removeAccount(id);
  },
  reloadAccount: async (id) => {
    await window.multiwhats.reloadAccount(id);
  },
  refreshAccounts: async () => {
    const payload = await window.multiwhats.listAccounts();
    set({ accounts: payload.accounts, statuses: new Map(payload.statuses.map((s) => [s.id, s])) });
  },
  setTheme: async (theme) => {
    await window.multiwhats.setTheme(theme);
    set({ theme });
  },
  setConfirmBeforeRemove: (enabled) => set({ confirmBeforeRemove: enabled }),

  setSidebarWidth: (width) => set({ sidebarWidth: width }),
  setIsResizingSidebar: (resizing) => set({ isResizingSidebar: resizing }),
  commitSidebarWidth: async (width) => {
    const applied = await window.multiwhats.setSidebarWidth(width);
    set({ sidebarWidth: applied });
  },
  setSidebarPosition: async (position) => {
    const applied = await window.multiwhats.setSidebarPosition(position);
    set({ sidebarPosition: applied });
  },
  setIconSize: async (size) => {
    const applied = await window.multiwhats.setIconSize(size);
    set({ iconSize: applied });
  },

  loadGroups: async () => {
    const groups = await window.multiwhats.listGroups();
    set({ groups });
  },
  createGroup: async (name) => {
    const result = await window.multiwhats.createGroup(name);
    if ('error' in result) return { error: result.error };
    await get().loadGroups();
    return null;
  },
  renameGroup: async (id, name) => {
    const result = await window.multiwhats.renameGroup(id, name);
    if ('error' in result) return { error: result.error };
    await get().loadGroups();
    return null;
  },
  reorderGroups: async (orderedIds) => {
    await window.multiwhats.reorderGroups(orderedIds);
    await get().loadGroups();
  },
  removeGroup: async (id) => {
    await window.multiwhats.removeGroup(id);
    await get().loadGroups();
  },
  setAccountGroup: async (id, groupId) => {
    await window.multiwhats.setAccountGroup(id, groupId);
  },
  pickAccountIcon: async (id) => window.multiwhats.pickAccountIcon(id),
  resetAccountIcon: async (id) => {
    await window.multiwhats.resetAccountIcon(id);
  },
}));

/** Instância em exibição (a que o processo principal marcou como ativa). */
export function useActiveAccount(): { account: AccountRecord | null; status: AccountStatus | undefined } {
  const accounts = useAppStore((s) => s.accounts);
  const statuses = useAppStore((s) => s.statuses);
  const account = accounts.find((a) => statuses.get(a.id)?.isActive) ?? null;
  return { account, status: account ? statuses.get(account.id) : undefined };
}
