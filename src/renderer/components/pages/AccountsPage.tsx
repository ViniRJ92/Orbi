/**
 * Página "Gerenciar contas" (tela do Stitch): grade de todas as instâncias
 * com busca, filtro por estado, filtro por agrupamento, ordenação, seleção
 * múltipla e ações em lote.
 *
 * Tudo aqui é funcionalidade do Orbi: abrir, favoritar, cor de identificação,
 * suspender, recarregar, remover (com confirmação), reordenar arrastando (na
 * ordem padrão), suspender/remover em lote. Os números do card e do rodapé
 * vêm do status real de cada instância.
 *
 * Orbi — Criado por Vinicius Braga
 */
import { useEffect, useMemo, useState } from 'react';
import { AccountRecord, SERVICES } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { FILTERS, FilterKey, useFilterCounts, useFilteredAccounts } from '../../useFilteredAccounts';
import { accountStatusLabel } from '../../accountStatusLabel';
import { accountTone, partitionShort, sessionStateLabel, TONE_STYLES, toneBadgeLabel } from '../../accountTone';
import { formatAgo } from '../../format';
import { usePageEscape } from '../../usePageEscape';
import { AccountAvatar } from '../ui/AccountAvatar';
import { ColorSwatchButton } from '../ui/ColorSwatchButton';
import { Icon } from '../ui/Icon';

type SortKey = 'order' | 'name' | 'created' | 'status';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'order', label: 'Ordem da barra' },
  { key: 'name', label: 'Nome alfabético' },
  { key: 'created', label: 'Mais recentes' },
  { key: 'status', label: 'Status da conexão' },
];

const FILTER_DOT: Record<FilterKey, string | null> = {
  all: null,
  online: 'bg-primary-container shadow-[0_0_6px_rgba(0,220,130,0.8)]',
  suspended: 'bg-outline',
  error: 'bg-error',
};

export function AccountsPage() {
  const accounts = useAppStore((s) => s.accounts);
  const statuses = useAppStore((s) => s.statuses);
  const appInfo = useAppStore((s) => s.appInfo);
  const groups = useAppStore((s) => s.groups);
  const openAccount = useAppStore((s) => s.openAccount);
  const suspendAccount = useAppStore((s) => s.suspendAccount);
  const reloadAccount = useAppStore((s) => s.reloadAccount);
  const removeAccountWithConfirm = useAppStore((s) => s.removeAccountWithConfirm);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const setAccountColor = useAppStore((s) => s.setAccountColor);
  const reorderAccounts = useAppStore((s) => s.reorderAccounts);
  const setAddAccountOpen = useAppStore((s) => s.setAddAccountOpen);
  const openPage = useAppStore((s) => s.openPage);
  const refreshAccounts = useAppStore((s) => s.refreshAccounts);

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('order');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());

  usePageEscape();

  useEffect(() => setUpdatedAt(Date.now()), [statuses]);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const counts = useFilterCounts(accounts, statuses);
  const filteredByQuery = useFilteredAccounts(accounts, statuses, query, filter);
  const knownGroupIds = new Set(groups.map((g) => g.id));
  const filtered = filteredByQuery.filter((a) => {
    if (groupFilter === 'all') return true;
    if (groupFilter === '__none__') return !a.groupId || !knownGroupIds.has(a.groupId);
    return a.groupId === groupFilter;
  });

  const sorted = useMemo(() => {
    const list = [...filtered];
    if (sortKey === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortKey === 'created') list.sort((a, b) => b.createdAt - a.createdAt);
    else if (sortKey === 'status') {
      const rank = (id: string) => {
        const st = statuses.get(id);
        if (st?.loadError) return 0;
        if (st?.isOnline) return 1;
        if (st?.suspended) return 3;
        return 2;
      };
      list.sort((a, b) => rank(a.id) - rank(b.id));
    }
    return list;
  }, [filtered, sortKey, statuses]);

  const canDrag = sortKey === 'order';

  // Reordena sobre a lista COMPLETA (como a barra de contas), para que as
  // instâncias escondidas pelo filtro mantenham suas posições.
  const handleDrop = (targetId: string) => {
    const fromId = draggedId;
    setDraggedId(null);
    setOverId(null);
    if (!fromId || fromId === targetId) return;
    const ids = accounts.map((a) => a.id);
    const from = ids.indexOf(fromId);
    const to = ids.indexOf(targetId);
    if (from !== -1 && to !== -1) {
      ids.splice(to, 0, ids.splice(from, 1)[0]);
      reorderAccounts(ids);
    }
  };

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allVisibleSelected = sorted.length > 0 && sorted.every((a) => selected.has(a.id));
  const toggleSelectAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      for (const a of sorted) {
        if (allVisibleSelected) next.delete(a.id);
        else next.add(a.id);
      }
      return next;
    });

  const clearSelection = () => setSelected(new Set());

  const bulkSuspend = async () => {
    for (const id of selected) {
      if (statuses.get(id)?.loaded) await suspendAccount(id);
    }
    clearSelection();
  };

  const bulkRemove = async () => {
    if (selected.size === 0) return;
    const confirmed = window.confirm(
      `Remover ${selected.size} conta(s) selecionada(s)?\n\nIsso apaga permanentemente os dados de sessão dessas contas.`
    );
    if (!confirmed) return;
    for (const id of selected) {
      await removeAccountWithConfirm(id, accounts.find((a) => a.id === id)?.name ?? '');
    }
    clearSelection();
  };

  const loadedCount = accounts.filter((a) => statuses.get(a.id)?.loaded).length;
  const unreadTotal = accounts.reduce((sum, a) => sum + (statuses.get(a.id)?.unreadCount ?? 0), 0);

  return (
    <div className="h-full overflow-y-auto px-space-lg pb-space-xl pt-space-md">
      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-space-lg">
        {/* Barra superior: contagem e filtros de estado */}
        <div className="relative flex flex-col justify-between gap-space-md overflow-hidden rounded-xl bg-surface-container-low p-space-md shadow-lg lg:flex-row lg:items-center">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary-container/5 blur-3xl" />
          <div className="flex flex-wrap items-center gap-space-md">
            <div className="flex items-center gap-space-xs rounded-lg bg-surface-container-highest px-space-md py-2">
              <Icon name="hub" className="text-[20px] text-primary-container" />
              <span className="font-headline-sm text-headline-sm font-bold text-on-surface">Instâncias</span>
              <div className="ml-2 flex items-center rounded bg-surface-container-lowest px-2 py-0.5" title="Instâncias criadas / limite">
                <span className="font-metric-md text-metric-md font-bold text-primary">{accounts.length}</span>
                <span className="mx-0.5 font-label-sm text-label-sm text-outline">/</span>
                <span className="font-metric-md text-metric-md text-on-surface-variant">{appInfo?.maxAccounts ?? 30}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-surface-container-lowest p-1">
              {FILTERS.map((f) => {
                const isActive = filter === f.key;
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setFilter(f.key)}
                    className={
                      'rounded-lg px-3 py-1.5 font-title-md text-title-md transition-all ' +
                      (isActive
                        ? 'bg-surface-container-high font-semibold text-primary shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface')
                    }
                  >
                    {FILTER_DOT[f.key] && <span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${FILTER_DOT[f.key]}`} />}
                    {f.key === 'all' ? 'Todas' : f.key === 'error' ? 'Com erro' : f.label}
                    <span
                      className={
                        'ml-1 font-label-sm text-label-sm ' +
                        (isActive && f.key === 'all' ? 'rounded-full bg-surface-container px-1.5 text-on-surface' : 'text-outline')
                      }
                    >
                      {counts[f.key]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="relative flex items-center gap-space-xs">
            <button
              type="button"
              onClick={toggleSelectAll}
              disabled={sorted.length === 0}
              className="flex items-center gap-1.5 rounded-lg bg-surface-container px-space-md py-2 font-title-md text-title-md text-on-surface-variant transition-all hover:bg-surface-container-high hover:text-on-surface disabled:opacity-50"
            >
              <Icon name={allVisibleSelected ? 'check_box' : 'check_box_outline_blank'} className="text-[18px]" />
              <span>{allVisibleSelected ? 'Desmarcar todas' : 'Selecionar todas'}</span>
            </button>
            <button
              type="button"
              onClick={() => openPage('settings', 'instances')}
              className="flex items-center gap-1.5 rounded-lg bg-surface-container px-space-md py-2 font-title-md text-title-md text-on-surface-variant transition-all hover:bg-surface-container-high hover:text-on-surface"
              title="Renomear, trocar ícone e organizar agrupamentos"
            >
              <Icon name="tune" className="text-[18px]" />
              <span>Agrupamentos</span>
            </button>
            <button
              type="button"
              onClick={() => setAddAccountOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-space-lg py-2 font-headline-sm text-headline-sm font-semibold text-on-primary shadow-[0_0_16px_rgba(0,220,130,0.35)] transition-all hover:bg-primary-fixed"
            >
              <Icon name="add_circle" className="text-[20px]" />
              <span>Nova Instância</span>
            </button>
          </div>
        </div>

        {/* Busca, agrupamento e ordenação */}
        <div className="flex flex-col items-stretch justify-between gap-space-sm rounded-xl bg-surface-container-lowest p-space-sm md:flex-row md:items-center">
          <div className="relative flex max-w-md flex-1 items-center rounded-lg bg-surface-container px-space-md py-2">
            <Icon name="search" className="mr-2 text-[18px] text-outline" />
            <input
              className="w-full border-none bg-transparent font-body-sm text-body-sm text-on-surface outline-none placeholder:text-outline"
              placeholder="Buscar por nome ou número..."
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} className="text-outline hover:text-on-surface" title="Limpar busca">
                <Icon name="close" className="text-[16px]" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-space-xs overflow-x-auto">
            {groups.length > 0 && (
              <>
                <div className="flex items-center gap-1 px-2 font-label-sm text-label-sm uppercase text-on-surface-variant">
                  <Icon name="filter_alt" className="text-[16px]" />
                  <span>Grupo:</span>
                </div>
                <div className="flex flex-wrap items-center gap-1 rounded-lg bg-surface-container p-1">
                  {[{ id: 'all', name: 'Todos', color: undefined as string | undefined }, ...groups, { id: '__none__', name: 'Sem grupo', color: undefined }].map(
                    (g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setGroupFilter(g.id)}
                        className={
                          'flex items-center gap-1.5 rounded px-2.5 py-1 font-title-md text-title-md ' +
                          (groupFilter === g.id
                            ? 'bg-surface-container-high font-medium text-primary'
                            : 'text-on-surface-variant hover:text-on-surface')
                        }
                      >
                        {g.color && <span className="h-2 w-2 rounded-full" style={{ background: g.color }} />}
                        {g.name}
                      </button>
                    )
                  )}
                </div>
                <div className="mx-1 hidden h-5 w-px bg-surface-container-high xl:block" />
              </>
            )}
            <div className="flex items-center gap-1 rounded-lg bg-surface-container px-2 py-1">
              <span className="font-label-sm text-label-sm uppercase text-outline">Ordem:</span>
              <select
                className="cursor-pointer bg-transparent font-body-sm text-body-sm text-on-surface outline-none"
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.key} value={o.key} className="bg-surface-container text-on-surface">
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Ações em lote */}
        {selected.size > 0 && (
          <div className="flex items-center justify-between rounded-xl bg-primary-container/10 px-space-md py-2.5 transition-all">
            <div className="flex items-center gap-space-sm">
              <Icon name="checklist" className="text-[20px] text-primary" />
              <span className="font-title-md text-title-md font-bold text-primary">{selected.size} instância(s) selecionada(s)</span>
            </div>
            <div className="flex items-center gap-space-xs">
              <button
                type="button"
                onClick={bulkSuspend}
                className="flex items-center gap-1 rounded bg-surface-container px-3 py-1 font-body-sm text-body-sm text-on-surface hover:bg-surface-container-high"
              >
                <Icon name="pause_circle" className="text-[16px]" /> Suspender selecionadas
              </button>
              <button
                type="button"
                onClick={clearSelection}
                className="flex items-center gap-1 rounded bg-surface-container px-3 py-1 font-body-sm text-body-sm text-on-surface hover:bg-surface-container-high"
              >
                <Icon name="deselect" className="text-[16px]" /> Limpar seleção
              </button>
              <button
                type="button"
                onClick={bulkRemove}
                className="flex items-center gap-1 rounded bg-error-container px-3 py-1 font-body-sm text-body-sm text-on-error-container transition-colors hover:bg-error hover:text-on-error"
              >
                <Icon name="delete" className="text-[16px]" /> Excluir em lote
              </button>
            </div>
          </div>
        )}

        {/* Grade de instâncias */}
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-space-sm rounded-xl bg-surface-container-low py-space-xl text-center">
            <Icon name="hub" className="text-[32px] text-outline-variant" />
            <p className="font-body-md text-body-md text-on-surface-variant">
              {accounts.length === 0 ? 'Nenhuma instância ainda.' : 'Nenhuma instância encontrada com esses filtros.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {sorted.map((acc) => (
              <InstanceCard
                key={acc.id}
                account={acc}
                groupName={acc.groupId && knownGroupIds.has(acc.groupId) ? groups.find((g) => g.id === acc.groupId)?.name : undefined}
                selected={selected.has(acc.id)}
                onToggleSelect={() => toggleSelect(acc.id)}
                draggable={canDrag}
                isOver={overId === acc.id}
                onDragStart={() => setDraggedId(acc.id)}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (draggedId && draggedId !== acc.id) setOverId(acc.id);
                }}
                onDrop={() => handleDrop(acc.id)}
                onDragEnd={() => {
                  setDraggedId(null);
                  setOverId(null);
                }}
                actions={{
                  open: () => openAccount(acc.id),
                  favorite: () => toggleFavorite(acc.id),
                  color: (hex) => setAccountColor(acc.id, hex),
                  suspend: () => suspendAccount(acc.id),
                  reload: () => reloadAccount(acc.id),
                  configure: () => openPage('settings', 'instances'),
                  remove: () => removeAccountWithConfirm(acc.id, acc.name),
                }}
              />
            ))}
          </div>
        )}

        {/* Rodapé de estado geral */}
        <div className="mt-4 flex flex-col items-center justify-between gap-space-md rounded-xl bg-surface-container-low p-space-md shadow-md md:flex-row">
          <div className="flex flex-wrap items-center gap-space-md">
            <div className="flex items-center gap-2">
              <span
                className={
                  'h-3 w-3 rounded-full ' +
                  (counts.online > 0 ? 'animate-pulse bg-primary shadow-[0_0_8px_rgba(0,220,130,0.8)]' : 'bg-outline')
                }
              />
              <span className="font-title-md text-title-md font-semibold text-on-surface">
                {counts.online} de {accounts.length} instância(s) conectada(s)
              </span>
            </div>
            <div className="hidden h-4 w-px bg-surface-container-high sm:block" />
            <div className="flex flex-wrap items-center gap-4 font-code-sm text-code-sm text-on-surface-variant">
              <span>
                Em memória: <strong className="text-primary">{loadedCount}</strong>
              </span>
              <span>
                Suspensas: <strong className="text-secondary-fixed-dim">{counts.suspended}</strong>
              </span>
              <span>
                Não lidas: <strong className="text-on-surface">{unreadTotal}</strong>
              </span>
              <span>
                Com erro: <strong className={counts.error > 0 ? 'text-error' : 'text-outline'}>{counts.error}</strong>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-space-xs">
            <span className="font-label-sm text-label-sm uppercase text-outline">Atualizado {formatAgo(updatedAt, now)}</span>
            <button
              type="button"
              onClick={() => {
                refreshAccounts();
                setUpdatedAt(Date.now());
              }}
              className="rounded-lg bg-surface-container p-1.5 text-primary transition-all hover:bg-surface-container-high hover:text-on-surface"
              title="Atualizar dados"
            >
              <Icon name="refresh" className="text-[16px]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InstanceCard({
  account,
  groupName,
  selected,
  onToggleSelect,
  draggable,
  isOver,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  actions,
}: {
  account: AccountRecord;
  groupName: string | undefined;
  selected: boolean;
  onToggleSelect: () => void;
  draggable: boolean;
  isOver: boolean;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onDragEnd: () => void;
  actions: {
    open: () => void;
    favorite: () => void;
    color: (hex: string) => void;
    suspend: () => void;
    reload: () => void;
    configure: () => void;
    remove: () => void;
  };
}) {
  const status = useAppStore((s) => s.statuses.get(account.id));
  const tone = accountTone(status);
  const t = TONE_STYLES[tone];
  const isWhatsapp = account.service === 'whatsapp';

  return (
    <div
      draggable={draggable}
      onDragStart={draggable ? onDragStart : undefined}
      onDragOver={draggable ? onDragOver : undefined}
      onDrop={draggable ? onDrop : undefined}
      onDragEnd={draggable ? onDragEnd : undefined}
      className={
        'group relative flex flex-col justify-between overflow-hidden rounded-xl bg-surface-container-low p-space-md shadow-md transition-all duration-200 hover:bg-surface-container ' +
        (selected ? 'ring-1 ring-primary/60 ' : '') +
        (isOver ? 'ring-1 ring-primary ' : '') +
        (draggable ? 'cursor-grab active:cursor-grabbing' : '')
      }
    >
      <div className={`absolute bottom-0 left-0 top-0 w-1 ${t.bar}`} />
      <div>
        <div className="mb-3 flex items-start justify-between gap-space-xs">
          <div className="flex min-w-0 items-center gap-space-xs">
            <input
              type="checkbox"
              checked={selected}
              onChange={onToggleSelect}
              className="h-4 w-4 flex-shrink-0 cursor-pointer rounded accent-[#00dc82]"
              aria-label={`Selecionar ${account.name}`}
            />
            <AccountAvatar account={account} size={32} glyph={20} />
            <div className="min-w-0">
              <h2 className={`truncate font-headline-sm text-headline-sm font-bold text-on-surface transition-colors ${t.hoverText}`}>
                {account.name}
              </h2>
              <span className="block truncate font-code-sm text-code-sm text-outline">{accountStatusLabel(account, status)}</span>
            </div>
          </div>
          <div className="flex flex-shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={actions.favorite}
              className={
                'p-1 transition-colors ' +
                (account.favorite ? 'text-secondary-fixed-dim' : 'text-on-surface-variant hover:text-secondary-fixed-dim')
              }
              title={account.favorite ? 'Remover dos favoritos' : 'Favoritar'}
            >
              <Icon name="star" fill={account.favorite} className="text-[18px]" />
            </button>
            <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 font-badge-micro text-badge-micro font-bold ${t.chip}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${tone === 'live' ? 'bg-primary' : t.dot} ${tone === 'sync' ? 'animate-pulse' : ''}`} />
              {toneBadgeLabel(account, tone)}
            </span>
          </div>
        </div>

        <div className="mb-space-md grid grid-cols-3 gap-2 rounded-lg bg-surface-container-lowest p-space-xs text-center">
          <div className="flex flex-col">
            <span className="font-badge-micro text-badge-micro uppercase text-outline">Não lidas</span>
            <span
              className={
                'font-metric-md text-metric-md font-semibold ' +
                ((status?.unreadCount ?? 0) > 0 ? 'text-primary-container' : 'text-on-surface')
              }
            >
              {isWhatsapp ? status?.unreadCount ?? 0 : '—'}
            </span>
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="font-badge-micro text-badge-micro uppercase text-outline">Serviço</span>
            <span className={`truncate font-code-sm text-code-sm font-bold ${t.text}`}>{SERVICES[account.service]?.label}</span>
          </div>
          <div className="flex flex-col">
            <span className="font-badge-micro text-badge-micro uppercase text-outline">Sessão</span>
            <span className="font-code-sm text-code-sm font-medium text-on-surface-variant">{sessionStateLabel(status)}</span>
          </div>
        </div>

        <div className="mb-3 flex items-center justify-between gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
          <span className="truncate rounded bg-surface-container-high px-2 py-0.5 font-label-sm text-label-sm uppercase text-on-surface-variant">
            {groupName ?? 'Sem agrupamento'}
          </span>
          {tone === 'error' ? (
            <span className="font-code-sm text-code-sm text-error">Falha ao carregar</span>
          ) : (
            <span className="truncate font-code-sm text-code-sm text-outline" title="Sessão isolada desta instância">
              Sessão: {partitionShort(account.id)}
            </span>
          )}
        </div>
      </div>

      <div className="-mx-space-md -mb-space-md flex items-center justify-between gap-1 rounded-b-xl bg-surface-container-lowest/50 px-space-md py-2 pt-2">
        <div className="flex items-center gap-1">
          {tone === 'error' ? (
            <button
              type="button"
              onClick={actions.reload}
              className="flex items-center gap-1 rounded bg-error px-2.5 py-1 font-title-md text-title-md text-on-error transition-all hover:bg-error-container hover:text-on-error-container"
            >
              <Icon name="refresh" className="text-[16px]" />
              <span>Reconectar</span>
            </button>
          ) : tone === 'sync' && isWhatsapp ? (
            <button
              type="button"
              onClick={actions.open}
              className="flex items-center gap-1 rounded bg-surface-container-high px-2.5 py-1 font-title-md text-title-md text-on-surface transition-all hover:bg-secondary-fixed-dim hover:text-on-secondary"
              title="Abrir a instância para ler o QR Code"
            >
              <Icon name="qr_code_2" className="text-[16px]" />
              <span>Ler QR Code</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={actions.open}
              className="flex items-center gap-1 rounded bg-surface-container-high px-2.5 py-1 font-title-md text-title-md text-on-surface transition-all hover:bg-primary hover:text-on-primary"
            >
              <Icon name="open_in_new" className="text-[16px]" />
              <span>Abrir</span>
            </button>
          )}
          <span className="flex items-center rounded p-1.5 hover:bg-surface-container" title="Cor de identificação">
            <ColorSwatchButton value={account.color} onChange={actions.color} title={`Cor de ${account.name}`} size={14} />
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          {status?.loaded && tone !== 'error' && (
            <button
              type="button"
              onClick={actions.reload}
              className="rounded p-1 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-secondary-fixed-dim"
              title="Recarregar (não desconecta)"
            >
              <Icon name="refresh" className="text-[18px]" />
            </button>
          )}
          {status?.loaded && (
            <button
              type="button"
              onClick={actions.suspend}
              className="rounded p-1 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
              title="Suspender (libera memória, mantém a sessão)"
            >
              <Icon name="pause_circle" className="text-[18px]" />
            </button>
          )}
          <button
            type="button"
            onClick={actions.configure}
            className="rounded p-1 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
            title="Renomear, ícone e agrupamento"
          >
            <Icon name="tune" className="text-[18px]" />
          </button>
          <button
            type="button"
            onClick={actions.remove}
            className="rounded p-1 text-on-surface-variant transition-colors hover:bg-error-container hover:text-error"
            title="Remover instância"
          >
            <Icon name="delete" className="text-[18px]" />
          </button>
        </div>
      </div>
    </div>
  );
}
