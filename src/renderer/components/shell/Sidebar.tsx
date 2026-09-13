/**
 * Barra "CONTAS CONECTADAS" no layout do Stitch.
 *
 * Funcionalidade preservada do Orbi (Fases 10, 12, 21, 22, 25, 56, 58, 59):
 *  - busca por nome/telefone e filtro por estado (botão "tune");
 *  - favoritas primeiro, depois a ordem definida pelo usuário;
 *  - agrupamentos como pastas recolhíveis, com cor própria;
 *  - arrastar e soltar: reordenar instâncias, mover entre agrupamentos (soltar
 *    sobre a pasta ou sobre uma instância de outra pasta), tirar do
 *    agrupamento (soltar na área avulsa) e reordenar as próprias pastas;
 *  - instâncias avulsas sempre no topo, com divisória automática;
 *  - largura redimensionável pela alça (Esquerda/Direita) e posições Topo e
 *    Inferior como barra horizontal;
 *  - tamanho dos cards (Pequeno, Médio, Grande);
 *  - favoritar, atalho Ctrl+N visível no hover e "Recarregar" em erro.
 *
 * Orbi — Criado por Vinicius Braga
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { AccountRecord, AccountStatus, IconSize, SidebarPosition } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { FILTERS, FilterKey, useFilterCounts, useFilteredAccounts } from '../../useFilteredAccounts';
import { SIDEBAR_WIDTH_MAX, SIDEBAR_WIDTH_MIN, clampSidebarWidth } from '../../constants';
import { accountTone, TONE_STYLES } from '../../accountTone';
import { accountStatusLabel } from '../../accountStatusLabel';
import { AccountAvatar } from '../ui/AccountAvatar';
import { Icon } from '../ui/Icon';

/** Tamanhos do card por `iconSize`. "medium" é exatamente o card do Stitch. */
const ITEM_SPECS: Record<IconSize, { pad: string; name: string; line: string; avatar: number; glyph: number }> = {
  small: { pad: 'px-space-sm py-1', name: 'font-title-md text-body-sm', line: 'text-[10px] leading-[12px]', avatar: 16, glyph: 10 },
  medium: { pad: 'p-space-sm', name: 'font-title-md text-title-md', line: 'text-code-sm', avatar: 20, glyph: 12 },
  large: { pad: 'p-space-md', name: 'font-headline-sm text-headline-sm', line: 'text-code-sm', avatar: 26, glyph: 15 },
};

/** Altura da barra no modo Topo/Inferior, por tamanho. */
const HORIZONTAL_HEIGHT: Record<IconSize, number> = { small: 52, medium: 60, large: 72 };

const ARROW_SCROLL_AMOUNT = 220;

interface DragHandlers {
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onDragEnd: () => void;
  isOver: boolean;
}

function UnreadBadge({ account, status }: { account: AccountRecord; status: AccountStatus | undefined }) {
  // Não lidas só existem para o WhatsApp (título da página "(N) WhatsApp").
  if (account.service !== 'whatsapp') return null;
  const count = status?.unreadCount ?? 0;
  // Só aparece quando há algo para ler: um "0" em cada conta era ruído.
  if (count <= 0) return null;
  return (
    <span className="rounded-full bg-primary-container px-1.5 font-badge-micro text-badge-micro font-bold text-on-primary-container">
      {count > 99 ? '99+' : count}
    </span>
  );
}

function VerticalItem({
  account,
  status,
  index,
  iconSize,
  drag,
}: {
  account: AccountRecord;
  status: AccountStatus | undefined;
  index: number;
  iconSize: IconSize;
  drag: DragHandlers;
}) {
  const openAccount = useAppStore((s) => s.openAccount);
  const reloadAccount = useAppStore((s) => s.reloadAccount);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const tone = accountTone(status);
  const t = TONE_STYLES[tone];
  const spec = ITEM_SPECS[iconSize];
  const isActive = !!status?.isActive;
  const statusLine = accountStatusLabel(account, status);
  // A bolinha já indica o estado; a segunda linha só aparece quando traz algo
  // além disso (telefone, QR pendente numa instância aberta, suspensa, erro).
  const showStatusLine = tone === 'sync' || tone === 'error' || tone === 'suspended' || !!account.phone;

  return (
    <li
      className="list-none"
      draggable
      onDragStart={drag.onDragStart}
      onDragOver={drag.onDragOver}
      onDrop={(e) => {
        // Sem isto o drop borbulharia até a zona do agrupamento e desfaria a mudança.
        e.stopPropagation();
        drag.onDrop();
      }}
      onDragEnd={drag.onDragEnd}
    >
      <div
        onClick={() => openAccount(account.id)}
        title={`${account.name} — ${accountStatusLabel(account, status)}`}
        className={
          `group relative cursor-pointer rounded-lg transition-colors ${spec.pad} ` +
          (isActive
            ? 'bg-surface-container-low hover:bg-surface-container-high'
            : 'bg-surface-container-lowest hover:bg-surface-container-low') +
          (drag.isOver ? ' ring-1 ring-primary/60' : '')
        }
      >
        <div className={'flex items-center justify-between gap-space-xs ' + (iconSize !== 'small' && showStatusLine ? 'mb-0.5' : '')}>
          <div className="flex min-w-0 items-center gap-space-xs">
            <span className={`h-2 w-2 flex-shrink-0 rounded-full ${t.dot}`} />
            <AccountAvatar account={account} size={spec.avatar} glyph={spec.glyph} className="bg-surface-container-high" />
            <span className={`truncate text-on-surface transition-colors ${spec.name} ${t.hoverText}`}>{account.name}</span>
            {account.favorite && <Icon name="star" fill className="flex-shrink-0 text-[14px] text-secondary-fixed-dim" />}
          </div>
          <div className="flex flex-shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(account.id);
              }}
              className={
                'hidden rounded p-0.5 transition-colors hover:bg-surface-container-high group-hover:inline-flex ' +
                (account.favorite ? 'text-secondary-fixed-dim' : 'text-on-surface-variant hover:text-secondary-fixed-dim')
              }
              title={account.favorite ? 'Remover dos favoritos' : 'Marcar como favorita'}
            >
              <Icon name="star" fill={account.favorite} className="text-[14px]" />
            </button>
            <UnreadBadge account={account} status={status} />
          </div>
        </div>
        {iconSize !== 'small' && showStatusLine && (
          <div className="flex items-center justify-between gap-space-xs pl-3">
            <span className={`truncate font-body-sm text-outline ${spec.line} ${tone === 'error' ? '!text-error' : ''}`}>
              {statusLine}
            </span>
            <div className="flex flex-shrink-0 items-center gap-1.5">
              {index < 9 && tone !== 'error' && (
                <span className="hidden font-badge-micro text-badge-micro text-outline-variant group-hover:inline">
                  Ctrl+{index + 1}
                </span>
              )}
              {tone === 'error' && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    reloadAccount(account.id);
                  }}
                  className="flex items-center gap-0.5 rounded px-1 font-badge-micro text-badge-micro text-error hover:bg-error/15"
                  title="Tentar de novo"
                >
                  <Icon name="refresh" className="text-[12px]" />
                  Recarregar
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </li>
  );
}

function HorizontalItem({
  account,
  status,
  iconSize,
  drag,
}: {
  account: AccountRecord;
  status: AccountStatus | undefined;
  iconSize: IconSize;
  drag: DragHandlers;
}) {
  const openAccount = useAppStore((s) => s.openAccount);
  const t = TONE_STYLES[accountTone(status)];
  const spec = ITEM_SPECS[iconSize];
  const isActive = !!status?.isActive;
  return (
    <li
      className="list-none flex-shrink-0"
      draggable
      onDragStart={drag.onDragStart}
      onDragOver={drag.onDragOver}
      onDrop={(e) => {
        e.stopPropagation();
        drag.onDrop();
      }}
      onDragEnd={drag.onDragEnd}
    >
      <div
        onClick={() => openAccount(account.id)}
        title={`${account.name} — ${accountStatusLabel(account, status)}`}
        className={
          'group flex cursor-pointer items-center gap-space-xs whitespace-nowrap rounded-lg px-space-sm py-1.5 transition-colors ' +
          (isActive ? 'bg-surface-container-low hover:bg-surface-container-high' : 'hover:bg-surface-container-low') +
          (drag.isOver ? ' ring-1 ring-primary/60' : '')
        }
      >
        <span className={`h-2 w-2 flex-shrink-0 rounded-full ${t.dot}`} />
        <AccountAvatar account={account} size={spec.avatar} glyph={spec.glyph} />
        <span className={`text-on-surface transition-colors ${spec.name} ${t.hoverText}`}>{account.name}</span>
        {account.favorite && <Icon name="star" fill className="text-[13px] text-secondary-fixed-dim" />}
        <UnreadBadge account={account} status={status} />
      </div>
    </li>
  );
}

export function Sidebar({ position }: { position: SidebarPosition }) {
  const isHorizontal = position === 'top' || position === 'bottom';
  const isRight = position === 'right';
  const accounts = useAppStore((s) => s.accounts);
  const statuses = useAppStore((s) => s.statuses);
  const searchQuery = useAppStore((s) => s.searchQuery);
  const setSearchQuery = useAppStore((s) => s.setSearchQuery);
  const reorderAccounts = useAppStore((s) => s.reorderAccounts);
  const setAccountGroup = useAppStore((s) => s.setAccountGroup);
  const sidebarWidth = useAppStore((s) => s.sidebarWidth);
  const setSidebarWidth = useAppStore((s) => s.setSidebarWidth);
  const commitSidebarWidth = useAppStore((s) => s.commitSidebarWidth);
  const isResizingSidebar = useAppStore((s) => s.isResizingSidebar);
  const setIsResizingSidebar = useAppStore((s) => s.setIsResizingSidebar);
  const groups = useAppStore((s) => s.groups);
  const reorderGroups = useAppStore((s) => s.reorderGroups);
  const iconSize = useAppStore((s) => s.iconSize);
  const setAddAccountOpen = useAppStore((s) => s.setAddAccountOpen);

  const [filter, setFilter] = useState<FilterKey>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [draggedGroupId, setDraggedGroupId] = useState<string | null>(null);
  const [overGroupId, setOverGroupId] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const widthRef = useRef(sidebarWidth);
  widthRef.current = sidebarWidth;

  const filterCounts = useFilterCounts(accounts, statuses);
  const visibleAccounts = useFilteredAccounts(accounts, statuses, searchQuery, filter);
  const filterActive = filter !== 'all' || searchQuery.trim().length > 0;

  // --- Rolagem horizontal (Topo/Inferior) com setas nas pontas ---
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);
  useEffect(() => {
    if (!isHorizontal) return;
    const el = scrollRef.current;
    if (!el) return;
    updateScrollButtons();
    const onScroll = () => updateScrollButtons();
    // Fase 22: a roda do mouse não vira rolagem horizontal nesta barra.
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) e.preventDefault();
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    el.addEventListener('wheel', onWheel, { passive: false });
    const observer = new ResizeObserver(() => updateScrollButtons());
    observer.observe(el);
    return () => {
      el.removeEventListener('scroll', onScroll);
      el.removeEventListener('wheel', onWheel);
      observer.disconnect();
    };
  }, [isHorizontal, updateScrollButtons, accounts.length, iconSize]);

  // --- Redimensionar (Esquerda/Direita) ---
  useEffect(() => {
    if (!isResizingSidebar) return;
    const onMove = (e: MouseEvent) => {
      setSidebarWidth(clampSidebarWidth(isRight ? window.innerWidth - e.clientX : e.clientX));
    };
    const onUp = () => {
      setIsResizingSidebar(false);
      commitSidebarWidth(widthRef.current);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isResizingSidebar, isRight, setSidebarWidth, setIsResizingSidebar, commitSidebarWidth]);

  // --- Arrastar e soltar (mesma lógica de antes) ---
  const handleDropOnAccount = (targetId: string) => {
    const fromId = draggedId;
    setDraggedId(null);
    setOverId(null);
    if (!fromId || fromId === targetId) return;
    const dragged = accounts.find((a) => a.id === fromId);
    const target = accounts.find((a) => a.id === targetId);
    if (!dragged || !target) return;
    if ((dragged.groupId ?? null) !== (target.groupId ?? null)) {
      setAccountGroup(fromId, target.groupId ?? null);
    }
    const ids = accounts.map((a) => a.id);
    const from = ids.indexOf(fromId);
    const to = ids.indexOf(targetId);
    if (from !== -1 && to !== -1) {
      ids.splice(to, 0, ids.splice(from, 1)[0]);
      reorderAccounts(ids);
    }
  };

  const handleDropOnGroupZone = (groupId: string | null) => {
    const fromId = draggedId;
    setDraggedId(null);
    setOverId(null);
    if (!fromId) return;
    const dragged = accounts.find((a) => a.id === fromId);
    if (!dragged) return;
    if ((dragged.groupId ?? null) !== groupId) setAccountGroup(fromId, groupId);
  };

  const handleDropOnGroupHeader = (targetGroupId: string) => {
    if (draggedGroupId) {
      const fromId = draggedGroupId;
      setDraggedGroupId(null);
      setOverGroupId(null);
      if (fromId === targetGroupId) return;
      const ids = groups.map((g) => g.id);
      const from = ids.indexOf(fromId);
      const to = ids.indexOf(targetGroupId);
      if (from !== -1 && to !== -1) {
        ids.splice(to, 0, ids.splice(from, 1)[0]);
        reorderGroups(ids);
      }
      return;
    }
    setOverGroupId(null);
    handleDropOnGroupZone(targetGroupId);
  };

  const toggleGroup = (id: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const dragFor = (acc: AccountRecord): DragHandlers => ({
    onDragStart: () => setDraggedId(acc.id),
    onDragOver: (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (draggedId && draggedId !== acc.id) setOverId(acc.id);
    },
    onDrop: () => handleDropOnAccount(acc.id),
    onDragEnd: () => {
      setDraggedId(null);
      setOverId(null);
    },
    isOver: overId === acc.id,
  });

  const knownGroupIds = new Set(groups.map((g) => g.id));
  const ungrouped = visibleAccounts.filter((a) => !a.groupId || !knownGroupIds.has(a.groupId));
  const indexOf = (id: string) => accounts.findIndex((a) => a.id === id);

  const filterChips = (
    <div className={isHorizontal ? 'flex flex-shrink-0 items-center gap-1' : 'grid grid-cols-2 gap-1'}>
      {FILTERS.map((f) => (
        <button
          key={f.key}
          type="button"
          onClick={() => setFilter(f.key)}
          className={
            'flex items-center justify-between gap-1 whitespace-nowrap rounded px-2 py-1 font-label-sm text-label-sm transition-colors ' +
            (filter === f.key
              ? 'bg-surface-container-high text-primary'
              : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface')
          }
        >
          <span>{f.label}</span>
          <span className="font-badge-micro text-badge-micro text-outline">{filterCounts[f.key]}</span>
        </button>
      ))}
    </div>
  );

  const searchInput = (
    <div
      className={
        'flex items-center gap-space-xs rounded-lg bg-surface-container-low px-space-sm py-1.5 ' + (isHorizontal ? 'w-40' : 'w-full')
      }
    >
      <Icon name="search" className="text-[16px] text-outline" />
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Buscar conta..."
        className="w-full bg-transparent font-body-sm text-body-sm text-on-surface outline-none placeholder:text-outline"
      />
      {searchQuery && (
        <button type="button" onClick={() => setSearchQuery('')} className="text-outline hover:text-on-surface" title="Limpar busca">
          <Icon name="close" className="text-[14px]" />
        </button>
      )}
    </div>
  );

  if (isHorizontal) {
    const height = HORIZONTAL_HEIGHT[iconSize];
    return (
      <aside
        style={{ height, minHeight: height }}
        className={
          'relative z-30 flex flex-none items-center gap-space-sm bg-surface-container-lowest px-space-md ' +
          (position === 'top' ? 'shadow-[0_2px_12px_rgba(0,0,0,0.3)]' : 'shadow-[0_-2px_12px_rgba(0,0,0,0.3)]')
        }
      >
        <div className="flex flex-shrink-0 items-center gap-space-xs">
          <span className="font-title-md text-title-md font-semibold text-on-surface-variant">Contas</span>
          <button
            type="button"
            onClick={() => setFilterOpen((v) => !v)}
            className={
              'rounded p-1 transition-colors hover:bg-surface-container-high ' +
              (filterOpen || filterActive ? 'bg-surface-container-high text-primary' : 'text-on-surface-variant hover:text-on-surface')
            }
            title={filterOpen ? 'Ocultar busca e filtros' : 'Buscar e filtrar contas'}
          >
            <Icon name="tune" className="text-[16px]" />
          </button>
          {filterOpen && (
            <>
              {searchInput}
              {filterChips}
            </>
          )}
        </div>
        <div className="h-6 w-px flex-shrink-0 bg-surface-container-high" aria-hidden />
        {canScrollLeft && (
          <button
            type="button"
            className="flex-shrink-0 rounded p-1 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
            onClick={() => scrollRef.current?.scrollBy({ left: -ARROW_SCROLL_AMOUNT, behavior: 'smooth' })}
            title="Rolar para a esquerda"
          >
            <Icon name="chevron_left" className="text-[18px]" />
          </button>
        )}
        <div ref={scrollRef} className="flex h-full min-w-0 flex-1 items-center overflow-x-auto">
          {accounts.length === 0 ? (
            <span className="whitespace-nowrap px-space-sm font-body-sm text-body-sm text-on-surface-variant">
              Nenhuma instância ainda. Adicione a primeira conta para começar.
            </span>
          ) : (
            <ul
              className="flex flex-shrink-0 items-center gap-1"
              onDragOver={(e) => draggedId && e.preventDefault()}
              onDrop={() => handleDropOnGroupZone(null)}
            >
              {/* Fase 25: no modo horizontal todas as instâncias aparecem em sequência. */}
              {visibleAccounts.map((acc) => (
                <HorizontalItem key={acc.id} account={acc} status={statuses.get(acc.id)} iconSize={iconSize} drag={dragFor(acc)} />
              ))}
            </ul>
          )}
          {accounts.length > 0 && visibleAccounts.length === 0 && (
            <span className="whitespace-nowrap px-space-sm font-body-sm text-body-sm text-on-surface-variant">
              Nenhuma conta encontrada.
            </span>
          )}
        </div>
        {canScrollRight && (
          <button
            type="button"
            className="flex-shrink-0 rounded p-1 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
            onClick={() => scrollRef.current?.scrollBy({ left: ARROW_SCROLL_AMOUNT, behavior: 'smooth' })}
            title="Rolar para a direita"
          >
            <Icon name="chevron_right" className="text-[18px]" />
          </button>
        )}
        <button
          type="button"
          onClick={() => setAddAccountOpen(true)}
          className="flex flex-shrink-0 items-center gap-space-xs rounded bg-surface-container-low px-space-md py-1.5 font-title-md text-title-md font-semibold text-primary shadow-[0_0_10px_rgba(0,220,130,0.1)] transition-all duration-150 hover:bg-surface-container-high hover:text-on-surface"
          title="Adicionar conta"
        >
          <Icon name="add" className="text-[18px]" />
          <span>Adicionar</span>
        </button>
      </aside>
    );
  }

  const groupDivider = <div className="mx-space-sm my-1 h-px bg-surface-container-high" aria-hidden />;

  return (
    <aside
      style={{ width: sidebarWidth, minWidth: SIDEBAR_WIDTH_MIN, maxWidth: SIDEBAR_WIDTH_MAX }}
      className={
        'relative z-30 flex flex-none flex-col justify-between bg-surface-container-lowest ' +
        (isRight ? 'shadow-[-2px_0_12px_rgba(0,0,0,0.3)]' : 'shadow-[2px_0_12px_rgba(0,0,0,0.3)]')
      }
    >
      <div
        onMouseDown={(e) => {
          e.preventDefault();
          setIsResizingSidebar(true);
        }}
        className={
          'absolute top-0 z-10 h-full w-1.5 cursor-col-resize select-none hover:bg-primary/30 ' +
          (isRight ? 'left-0 -translate-x-1/2 ' : 'right-0 translate-x-1/2 ') +
          (isResizingSidebar ? 'bg-primary/50' : '')
        }
        title="Redimensionar barra de contas"
      />
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between px-space-md py-space-sm">
          <span className="truncate font-title-md text-title-md font-semibold text-on-surface-variant">Contas</span>
          <button
            type="button"
            aria-label="Filtrar contas"
            onClick={() => setFilterOpen((v) => !v)}
            className={
              'rounded p-1 transition-colors hover:bg-surface-container-high ' +
              (filterOpen || filterActive ? 'bg-surface-container-high text-primary' : 'text-on-surface-variant hover:text-on-surface')
            }
            title={filterOpen ? 'Ocultar busca e filtros' : 'Buscar e filtrar contas'}
          >
            <Icon name="tune" className="text-[16px]" />
          </button>
        </div>

        {filterOpen && (
          <div className="space-y-space-xs px-space-md pb-space-sm">
            {searchInput}
            {filterChips}
          </div>
        )}

        <div className="flex-1 space-y-1 overflow-y-auto px-space-xs">
          {accounts.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-space-sm px-space-md text-center">
              <Icon name="hub" className="text-[28px] text-outline-variant" />
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Nenhuma instância ainda. Adicione a primeira conta para começar.
              </p>
            </div>
          ) : groups.length === 0 ? (
            <ul className="space-y-1" onDragOver={(e) => draggedId && e.preventDefault()} onDrop={() => handleDropOnGroupZone(null)}>
              {visibleAccounts.map((acc) => (
                <VerticalItem
                  key={acc.id}
                  account={acc}
                  status={statuses.get(acc.id)}
                  index={indexOf(acc.id)}
                  iconSize={iconSize}
                  drag={dragFor(acc)}
                />
              ))}
            </ul>
          ) : (
            <>
              {ungrouped.length > 0 && (
                <ul className="space-y-1" onDragOver={(e) => draggedId && e.preventDefault()} onDrop={() => handleDropOnGroupZone(null)}>
                  {ungrouped.map((acc) => (
                    <VerticalItem
                      key={acc.id}
                      account={acc}
                      status={statuses.get(acc.id)}
                      index={indexOf(acc.id)}
                      iconSize={iconSize}
                      drag={dragFor(acc)}
                    />
                  ))}
                </ul>
              )}
              {ungrouped.length > 0 && groupDivider}
              {groups.map((g) => {
                const list = visibleAccounts.filter((a) => a.groupId === g.id);
                if (list.length === 0 && !accounts.some((a) => a.groupId === g.id)) return null;
                const collapsed = collapsedGroups.has(g.id);
                return (
                  <div key={g.id}>
                    <button
                      type="button"
                      draggable
                      onDragStart={() => setDraggedGroupId(g.id)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if ((draggedGroupId && draggedGroupId !== g.id) || draggedId) setOverGroupId(g.id);
                      }}
                      onDragLeave={() => setOverGroupId((cur) => (cur === g.id ? null : cur))}
                      onDrop={() => handleDropOnGroupHeader(g.id)}
                      onDragEnd={() => {
                        setDraggedGroupId(null);
                        setOverGroupId(null);
                      }}
                      onClick={() => toggleGroup(g.id)}
                      className={
                        'flex w-full cursor-grab items-center gap-space-xs rounded-lg px-space-sm pb-1 pt-space-sm text-left transition-colors active:cursor-grabbing hover:bg-surface-container-low ' +
                        (overGroupId === g.id ? 'ring-1 ring-primary/60' : '')
                      }
                      title="Clique para recolher; arraste para reordenar ou solte uma instância aqui"
                    >
                      <Icon name={collapsed ? 'chevron_right' : 'expand_more'} className="text-[16px] text-on-surface-variant" />
                      <Icon
                        name="folder"
                        fill
                        className={'text-[16px] ' + (g.color ? '' : 'text-on-surface-variant')}
                        style={g.color ? { color: g.color } : undefined}
                      />
                      <span className="flex-1 truncate font-body-sm text-body-sm font-medium text-on-surface-variant">{g.name}</span>
                      {collapsed && <span className="font-body-sm text-body-sm text-outline">{list.length}</span>}
                    </button>
                    {!collapsed && (
                      <ul className="mt-1 space-y-1">
                        {list.map((acc) => (
                          <VerticalItem
                            key={acc.id}
                            account={acc}
                            status={statuses.get(acc.id)}
                            index={indexOf(acc.id)}
                            iconSize={iconSize}
                            drag={dragFor(acc)}
                          />
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </>
          )}
          {accounts.length > 0 && visibleAccounts.length === 0 && (
            <p className="px-space-sm py-space-lg text-center font-body-sm text-body-sm text-on-surface-variant">
              Nenhuma conta encontrada.
            </p>
          )}
        </div>
      </div>
      <div className="bg-surface-container-lowest p-space-md">
        <button
          type="button"
          onClick={() => setAddAccountOpen(true)}
          className="flex w-full items-center justify-center gap-space-xs rounded bg-surface-container-low px-space-md py-2 font-title-md text-title-md font-semibold text-primary shadow-[0_0_10px_rgba(0,220,130,0.1)] transition-all duration-150 hover:bg-surface-container-high hover:text-on-surface"
        >
          <Icon name="add" className="text-[18px]" />
          <span>Adicionar conta</span>
        </button>
      </div>
    </aside>
  );
}
