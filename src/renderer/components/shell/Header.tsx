/**
 * Cabeçalho do Orbi no layout do Stitch: marca, resumo real das instâncias,
 * navegação entre as páginas, busca rápida (Ctrl+K), recarregar a instância
 * aberta (F5), atalho para "Sobre o Orbi" e os controles da janela (a janela
 * não tem moldura do sistema). Toda a faixa serve para arrastar a janela.
 *
 * Orbi — Criado por Vinicius Braga
 */
import { PageKey, useActiveAccount, useAppStore } from '../../store/useAppStore';
import { OrbiLogo } from '../OrbiLogo';
import { Icon } from '../ui/Icon';

const NAV: { key: Exclude<PageKey, 'home'>; label: string }[] = [
  { key: 'analytics', label: 'Analytics' },
  { key: 'agenda', label: 'Agenda' },
  { key: 'accounts', label: 'Gerenciar contas' },
  { key: 'settings', label: 'Configurações' },
  { key: 'help', label: 'Ajuda' },
];

export function Header() {
  const page = useAppStore((s) => s.page);
  const openPage = useAppStore((s) => s.openPage);
  const goHome = useAppStore((s) => s.goHome);
  const setPaletteOpen = useAppStore((s) => s.setPaletteOpen);
  const accounts = useAppStore((s) => s.accounts);
  const statuses = useAppStore((s) => s.statuses);
  const updateState = useAppStore((s) => s.updateState);
  const reloadAccount = useAppStore((s) => s.reloadAccount);
  const { account: active } = useActiveAccount();

  const online = accounts.filter((a) => statuses.get(a.id)?.isOnline).length;
  const hasUpdate =
    updateState.phase === 'available' || updateState.phase === 'downloading' || updateState.phase === 'downloaded';

  return (
    <header className="app-drag relative z-50 flex-none bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.4)]">
      <div className="flex h-14 w-full items-center justify-between gap-space-md px-space-md">
        <div className="flex flex-shrink-0 items-center gap-space-lg">
          <button
            type="button"
            className="app-no-drag flex items-center gap-space-xs"
            onClick={goHome}
            title="Voltar para a instância aberta"
          >
            <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-lg bg-surface-container">
              <OrbiLogo size={22} />
            </div>
            <span className="select-none bg-gradient-to-r from-primary via-tertiary to-on-surface bg-clip-text font-headline-sm text-headline-sm font-bold tracking-tight text-transparent">
              ORBI
            </span>
          </button>
          {accounts.length > 0 && (
            <div
              className="hidden flex-shrink-0 items-center gap-1.5 whitespace-nowrap font-body-sm text-body-sm text-on-surface-variant xl:flex"
              title="Instâncias conectadas agora / total de instâncias"
            >
              <span className={'h-1.5 w-1.5 rounded-full ' + (online > 0 ? 'bg-primary' : 'bg-outline')} />
              <span>
                {online}/{accounts.length} online
              </span>
            </div>
          )}
        </div>

        <nav className="app-no-drag hidden items-center gap-space-xs md:flex">
          {NAV.map((item) => {
            const isActive = page === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => (isActive ? goHome() : openPage(item.key))}
                aria-current={isActive ? 'page' : undefined}
                className={
                  'relative whitespace-nowrap ' +
                  (isActive
                    ? 'rounded-lg bg-surface-container-high px-space-md py-1.5 font-bold text-primary shadow-[0_0_12px_rgba(0,220,130,0.15)] transition-all duration-150'
                    : 'rounded-lg px-space-md py-1.5 font-body-md text-body-md text-on-surface-variant transition-all duration-150 hover:bg-surface-container-high hover:text-on-surface')
                }
                title={item.key === 'settings' && hasUpdate ? 'Há uma atualização disponível' : undefined}
              >
                {item.label}
                {item.key === 'settings' && hasUpdate && (
                  <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-error" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-space-md">
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="app-no-drag hidden w-48 items-center gap-space-xs rounded-lg bg-surface-container-low px-space-sm py-1.5 text-left sm:flex lg:w-64"
            title="Buscar e trocar de instância (Ctrl+K)"
          >
            <Icon name="search" className="text-[18px] text-outline" />
            <span className="flex-1 truncate font-body-sm text-body-sm text-outline">Buscar instância ou número...</span>
            <span className="font-badge-micro text-badge-micro text-outline-variant">Ctrl+K</span>
          </button>
          <div className="app-no-drag flex items-center gap-space-xs">
            <button
              type="button"
              onClick={() => active && reloadAccount(active.id)}
              disabled={!active}
              className="flex h-7 w-7 items-center justify-center rounded text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent"
              title={active ? `Recarregar ${active.name} (F5)` : 'Nenhuma instância aberta para recarregar'}
            >
              <Icon name="refresh" className="text-[18px]" />
            </button>
            <button
              type="button"
              onClick={() => openPage('settings', 'about')}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary shadow-[0_0_8px_rgba(0,220,130,0.3)]"
              title="Sobre o Orbi"
            >
              <Icon name="person" className="text-[18px] text-on-primary" />
            </button>
            <div className="flex items-center pl-space-xs">
              <button
                type="button"
                aria-label="Minimizar"
                onClick={() => window.multiwhats.windowMinimize()}
                className="flex h-7 w-7 items-center justify-center rounded text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
              >
                <Icon name="minimize" className="text-[16px]" />
              </button>
              <button
                type="button"
                aria-label="Maximizar"
                onClick={() => window.multiwhats.windowToggleMaximize()}
                className="flex h-7 w-7 items-center justify-center rounded text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
              >
                <Icon name="crop_square" className="text-[16px]" />
              </button>
              <button
                type="button"
                aria-label="Fechar"
                onClick={() => window.multiwhats.windowClose()}
                className="flex h-7 w-7 items-center justify-center rounded text-on-surface-variant transition-colors hover:bg-error-container hover:text-on-error-container"
              >
                <Icon name="close" className="text-[16px]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
