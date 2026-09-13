/**
 * Configurações > Instâncias & Agrupamentos (tela do Stitch). Central
 * administrativa de cada conta (Fase 8/59/60): criar, renomear, colorir e
 * excluir agrupamentos; renomear instância, trocar ícone e cor, mudar o
 * agrupamento, suspender/ativar, abrir e excluir — individualmente ou em
 * lote, com busca e paginação da tabela.
 * Orbi — Criado por Vinicius Braga
 */
import { useEffect, useMemo, useState } from 'react';
import { AccountRecord, DiagnosticsInfo, GroupRecord, SERVICES } from '../../../types';
import { useAppStore } from '../../../store/useAppStore';
import { accountTone, TONE_STYLES, toneBadgeLabel } from '../../../accountTone';
import { formatBytes } from '../../../format';
import { AccountAvatar } from '../../ui/AccountAvatar';
import { ColorSwatchButton } from '../../ui/ColorSwatchButton';
import { Icon } from '../../ui/Icon';

const PAGE_SIZE = 10;

export function InstancesTab({ diagnostics }: { diagnostics: DiagnosticsInfo | null }) {
  const accounts = useAppStore((s) => s.accounts);
  const statuses = useAppStore((s) => s.statuses);
  const groups = useAppStore((s) => s.groups);
  const loadGroups = useAppStore((s) => s.loadGroups);
  const createGroup = useAppStore((s) => s.createGroup);
  const renameGroup = useAppStore((s) => s.renameGroup);
  const setGroupColor = useAppStore((s) => s.setGroupColor);
  const removeGroup = useAppStore((s) => s.removeGroup);
  const setAccountGroup = useAppStore((s) => s.setAccountGroup);
  const suspendAccount = useAppStore((s) => s.suspendAccount);
  const removeAccount = useAppStore((s) => s.removeAccount);

  const [newGroupName, setNewGroupName] = useState('');
  const [groupError, setGroupError] = useState<string | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const visiveis = useMemo(() => {
    const termo = query.trim().toLowerCase();
    if (!termo) return accounts;
    return accounts.filter((a) => a.name.toLowerCase().includes(termo) || a.phone?.toLowerCase().includes(termo));
  }, [accounts, query]);

  const pageCount = Math.max(1, Math.ceil(visiveis.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = visiveis.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  useEffect(() => setPage(0), [query]);

  const loaded = accounts.filter((a) => statuses.get(a.id)?.loaded).length;

  const toggleSelected = (id: string, checked: boolean) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });

  // Fase 60: "selecionar todas" vale para o que a busca está mostrando.
  const allSelected = visiveis.length > 0 && visiveis.every((a) => selectedIds.has(a.id));
  const toggleSelectAll = (checked: boolean) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const a of visiveis) {
        if (checked) next.add(a.id);
        else next.delete(a.id);
      }
      return next;
    });

  const bulkDelete = () => {
    if (selectedIds.size === 0) return;
    const confirmed = window.confirm(
      `Excluir ${selectedIds.size} instância(s) selecionada(s)? Isso apaga permanentemente os dados de sessão delas.`
    );
    if (!confirmed) return;
    for (const id of selectedIds) removeAccount(id);
    setSelectedIds(new Set());
  };

  const handleAddGroup = async () => {
    const result = await createGroup(newGroupName);
    if (result?.error) {
      setGroupError(result.error);
      return;
    }
    setGroupError(null);
    setNewGroupName('');
  };

  const commitRenameGroup = async () => {
    if (!editingGroupId) return;
    const result = await renameGroup(editingGroupId, editingGroupName);
    if (result?.error) {
      setGroupError(result.error);
      return;
    }
    setGroupError(null);
    setEditingGroupId(null);
  };

  const handleRemoveGroup = async (g: GroupRecord) => {
    if (!window.confirm(`Excluir o agrupamento "${g.name}"? As instâncias dele passam para "Sem agrupamento".`)) return;
    await removeGroup(g.id);
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-space-sm px-space-xs pb-space-xs">
        <div className="flex items-center gap-space-sm">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary-container/15 text-primary">
            <Icon name="hub" className="text-[20px]" />
          </div>
          <div>
            <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">Instâncias &amp; Agrupamentos</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Cada instância roda em uma sessão isolada.</p>
          </div>
        </div>
        <span className="font-body-sm text-body-sm text-outline">
          {loaded}/{accounts.length} em memória · {diagnostics ? formatBytes(diagnostics.memoryBytes) : '—'}
        </span>
      </div>

      {/* Agrupamentos */}
      <div className="flex flex-col gap-space-sm rounded-lg bg-surface-container-low p-space-md shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <Icon name="category" className="text-[18px] text-secondary" />
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Agrupamentos</h2>
          </div>
          <span className="font-body-sm text-body-sm text-outline">
            {groups.length} {groups.length === 1 ? 'grupo' : 'grupos'}
          </span>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Pastas para organizar as instâncias na barra de contas e filtrar o Analytics. A bolinha define a cor de cada uma.
        </p>
        <div className="flex flex-wrap items-center gap-space-xs pt-space-xs">
          {groups.map((g) => {
            const count = accounts.filter((a) => a.groupId === g.id).length;
            return editingGroupId === g.id ? (
              <input
                key={g.id}
                autoFocus
                value={editingGroupName}
                onChange={(e) => setEditingGroupName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitRenameGroup();
                  if (e.key === 'Escape') {
                    e.stopPropagation();
                    setEditingGroupId(null);
                  }
                }}
                onBlur={commitRenameGroup}
                className="w-36 rounded-lg bg-surface-container-high px-space-sm py-1 font-title-md text-body-sm text-on-surface shadow-[0_0_0_1px_#00dc82] outline-none"
              />
            ) : (
              <div
                key={g.id}
                className="group flex items-center gap-space-xs rounded-lg border border-outline-variant/30 bg-surface-container px-space-sm py-1 shadow-sm transition-colors hover:bg-surface-container-high"
              >
                <ColorSwatchButton value={g.color} onChange={(hex) => setGroupColor(g.id, hex)} title={`Cor do agrupamento ${g.name}`} size={10} />
                <span className="font-title-md text-body-sm font-medium text-on-surface">{g.name}</span>
                <span className="font-body-sm text-body-sm text-outline">{count}</span>
                <div className="ml-1 flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingGroupId(g.id);
                      setEditingGroupName(g.name);
                      setGroupError(null);
                    }}
                    className="flex h-5 w-5 items-center justify-center rounded text-on-surface-variant transition-colors hover:bg-surface-container-highest hover:text-primary"
                    title="Renomear agrupamento"
                  >
                    <Icon name="edit" className="text-[13px]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveGroup(g)}
                    className="flex h-5 w-5 items-center justify-center rounded text-on-surface-variant transition-colors hover:bg-error-container/30 hover:text-error"
                    title="Excluir agrupamento"
                  >
                    <Icon name="delete" className="text-[13px]" />
                  </button>
                </div>
              </div>
            );
          })}
          {groups.length === 0 && <span className="font-body-sm text-body-sm text-outline">Nenhum agrupamento ainda.</span>}
        </div>
        <div className="mt-space-xs flex items-center gap-space-xs pt-space-xs">
          <div
            className={
              'flex flex-1 items-center rounded bg-surface-container px-space-sm py-1.5 transition-all focus-within:bg-surface-container-high ' +
              (groupError ? 'shadow-[0_0_0_1px_rgb(var(--c-error))]' : '')
            }
          >
            <Icon name="add_box" className="mr-space-xs text-[16px] text-on-surface-variant" />
            <input
              value={newGroupName}
              onChange={(e) => {
                setNewGroupName(e.target.value);
                setGroupError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddGroup();
              }}
              className="w-full bg-transparent font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none"
              placeholder="Novo agrupamento..."
              type="text"
            />
          </div>
          <button
            type="button"
            onClick={handleAddGroup}
            className="flex items-center gap-space-xs rounded bg-surface-container-highest px-space-md py-1.5 font-title-md text-body-sm text-on-surface transition-all hover:bg-primary hover:text-on-primary"
          >
            <Icon name="check" className="text-[16px]" />
            Criar
          </button>
        </div>
        {groupError && <p className="font-body-sm text-body-sm text-error">{groupError}</p>}
      </div>

      {/* Instâncias */}
      <div className="flex flex-1 flex-col gap-space-sm rounded-lg bg-surface-container-low p-space-md shadow-sm">
        <div className="flex flex-col items-start justify-between gap-space-sm sm:flex-row sm:items-center">
          <div className="flex items-center gap-space-sm">
            <Icon name="dns" className="text-[18px] text-primary" />
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Instâncias</h2>
            <span className="font-body-sm text-body-sm text-outline">
              {query.trim() ? `${visiveis.length} de ${accounts.length}` : accounts.length}
            </span>
          </div>
          <div className="flex w-full items-center rounded bg-surface-container px-space-sm py-1.5 transition-all focus-within:bg-surface-container-high sm:w-80">
            <Icon name="search" className="mr-space-xs text-[16px] text-on-surface-variant" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none"
              placeholder="Buscar instância por nome..."
              type="text"
            />
          </div>
        </div>

        {accounts.length === 0 ? (
          <p className="rounded-lg bg-surface-container-lowest px-space-md py-space-lg text-center font-body-sm text-body-sm text-on-surface-variant">
            Nenhuma instância ainda. Adicione uma pelo botão "Adicionar conta" na barra de contas.
          </p>
        ) : (
          <div className="mt-space-xs w-full overflow-x-auto rounded-lg bg-surface-container-lowest shadow-inner">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-surface-container-low font-body-sm text-body-sm text-outline [&>th]:font-medium">
                  <th className="w-10 px-space-sm py-2.5 text-center">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) => toggleSelectAll(e.target.checked)}
                      className="h-3.5 w-3.5 cursor-pointer rounded accent-[#45f99c]"
                      aria-label="Selecionar todas"
                    />
                  </th>
                  <th className="px-space-sm py-2.5">Nome</th>
                  <th className="px-space-sm py-2.5">Agrupamento</th>
                  <th className="hidden px-space-sm py-2.5 2xl:table-cell">Serviço</th>
                  <th className="px-space-sm py-2.5">Status</th>
                  <th className="px-space-sm py-2.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="font-body-sm text-body-sm text-on-surface">
                {pageRows.map((acc, i) => (
                  <InstanceRow
                    key={acc.id}
                    account={acc}
                    groups={groups}
                    striped={i % 2 === 1}
                    selected={selectedIds.has(acc.id)}
                    onToggleSelected={(checked) => toggleSelected(acc.id, checked)}
                  />
                ))}
                {visiveis.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-space-md py-space-lg text-center text-on-surface-variant">
                      Nenhuma instância com esse nome.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col items-center justify-between gap-space-sm pt-space-xs sm:flex-row">
          <div className="flex flex-wrap items-center gap-space-xs">
            <span className="font-body-sm text-body-sm text-outline">
              {selectedIds.size === 0 ? 'Nenhuma selecionada' : `${selectedIds.size} selecionada(s)`}
            </span>
            {selectedIds.size > 0 && (
              <>
                <select
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value === '') return;
                    for (const id of selectedIds) setAccountGroup(id, e.target.value === '__none__' ? null : e.target.value);
                    e.target.value = '';
                  }}
                  className="cursor-pointer rounded bg-surface-container px-space-sm py-1 font-title-md text-body-sm text-on-surface outline-none hover:bg-surface-container-high"
                >
                  <option value="" disabled>
                    Mover para agrupamento...
                  </option>
                  <option value="__none__">Sem agrupamento</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    for (const id of selectedIds) suspendAccount(id);
                  }}
                  className="rounded bg-surface-container px-space-sm py-1 font-title-md text-body-sm text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
                >
                  Suspender selecionadas
                </button>
                <button
                  type="button"
                  onClick={bulkDelete}
                  className="rounded bg-surface-container px-space-sm py-1 font-title-md text-body-sm text-error transition-colors hover:bg-error-container hover:text-on-error-container"
                >
                  Excluir em massa
                </button>
              </>
            )}
          </div>
          {visiveis.length > 0 && (
            <div className="flex items-center gap-space-md font-code-sm text-code-sm text-on-surface-variant">
              <span>
                Mostrando{' '}
                <strong className="font-semibold text-on-surface">
                  {safePage * PAGE_SIZE + 1}-{Math.min(visiveis.length, (safePage + 1) * PAGE_SIZE)}
                </strong>{' '}
                de <strong className="font-semibold text-on-surface">{visiveis.length}</strong>
              </span>
              {pageCount > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={safePage === 0}
                    onClick={() => setPage(safePage - 1)}
                    className="flex h-7 w-7 items-center justify-center rounded bg-surface-container text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface disabled:opacity-40"
                  >
                    <Icon name="chevron_left" className="text-[16px]" />
                  </button>
                  {Array.from({ length: pageCount }, (_, p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      className={
                        'flex h-7 w-7 items-center justify-center rounded font-semibold transition-colors ' +
                        (p === safePage ? 'bg-primary font-bold text-on-primary shadow-sm' : 'bg-surface-container text-on-surface hover:bg-surface-container-high')
                      }
                    >
                      {p + 1}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={safePage >= pageCount - 1}
                    onClick={() => setPage(safePage + 1)}
                    className="flex h-7 w-7 items-center justify-center rounded bg-surface-container text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface disabled:opacity-40"
                  >
                    <Icon name="chevron_right" className="text-[16px]" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function InstanceRow({
  account,
  groups,
  striped,
  selected,
  onToggleSelected,
}: {
  account: AccountRecord;
  groups: GroupRecord[];
  striped: boolean;
  selected: boolean;
  onToggleSelected: (checked: boolean) => void;
}) {
  const renameAccount = useAppStore((s) => s.renameAccount);
  const setAccountColor = useAppStore((s) => s.setAccountColor);
  const setAccountGroup = useAppStore((s) => s.setAccountGroup);
  const pickAccountIcon = useAppStore((s) => s.pickAccountIcon);
  const resetAccountIcon = useAppStore((s) => s.resetAccountIcon);
  const removeAccountWithConfirm = useAppStore((s) => s.removeAccountWithConfirm);
  const suspendAccount = useAppStore((s) => s.suspendAccount);
  const openAccount = useAppStore((s) => s.openAccount);
  const switchAccount = useAppStore((s) => s.switchAccount);
  const status = useAppStore((s) => s.statuses.get(account.id));
  const tone = accountTone(status);
  const t = TONE_STYLES[tone];

  const [name, setName] = useState(account.name);
  useEffect(() => setName(account.name), [account.name]);

  const commitName = () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === account.name) {
      setName(account.name);
      return;
    }
    renameAccount(account.id, trimmed);
  };

  const isSuspended = status?.suspended ?? account.suspended;
  const canSuspend = !!status?.loaded;

  return (
    <tr className={'border-b border-surface-container-high/40 transition-colors hover:bg-surface-container ' + (striped ? 'bg-surface-container-low/50' : 'bg-surface-container-lowest')}>
      <td className="px-space-sm py-2.5 text-center">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onToggleSelected(e.target.checked)}
          className="h-3.5 w-3.5 cursor-pointer rounded accent-[#45f99c]"
          aria-label={`Selecionar ${account.name}`}
        />
      </td>
      <td className="px-space-sm py-2.5">
        <div className="flex items-center gap-space-xs">
          <AccountAvatar account={account} size={22} glyph={14} />
          <input
            value={name}
            maxLength={40}
            onChange={(e) => setName(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            }}
            className="min-w-[110px] flex-1 rounded bg-transparent px-1 py-0.5 font-title-md text-title-md font-semibold text-on-surface outline-none transition-colors hover:bg-surface-container-high focus:bg-surface-container-high focus:shadow-[0_0_0_1px_#00dc82]"
            aria-label="Nome da instância"
            title="Clique para renomear"
          />
        </div>
      </td>
      <td className="px-space-sm py-2.5">
        <div className="relative inline-block w-36">
          <select
            value={account.groupId && groups.some((g) => g.id === account.groupId) ? account.groupId : ''}
            onChange={(e) => setAccountGroup(account.id, e.target.value || null)}
            className="w-full cursor-pointer appearance-none rounded border border-outline-variant/30 bg-surface-container-high/80 py-1 pl-2.5 pr-7 font-body-sm text-body-sm text-on-surface transition-colors hover:bg-surface-container-highest focus:outline-none"
            aria-label="Agrupamento da instância"
          >
            <option value="">Sem agrupamento</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <Icon name="expand_more" className="pointer-events-none absolute right-2 top-1.5 text-[14px] text-on-surface-variant" />
        </div>
      </td>
      <td className="hidden px-space-sm py-2.5 2xl:table-cell">
        <span className="whitespace-nowrap font-code-sm text-code-sm text-on-surface-variant">{SERVICES[account.service]?.label ?? account.service}</span>
      </td>
      <td className="px-space-sm py-2.5">
        <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded px-2 py-0.5 font-body-sm text-body-sm ${t.chip}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${t.dot}`} />
          {(() => {
            const s = toneBadgeLabel(account, tone).toLowerCase();
            return s.charAt(0).toUpperCase() + s.slice(1).replace('qr', 'QR');
          })()}
        </span>
      </td>
      <td className="px-space-sm py-2.5 text-right">
        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            onClick={() => (canSuspend ? suspendAccount(account.id) : switchAccount(account.id))}
            className="flex h-7 w-7 items-center justify-center rounded bg-surface-container text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-secondary"
            title={canSuspend ? 'Suspender instância' : isSuspended ? 'Ativar instância' : 'Carregar instância'}
          >
            <Icon name={canSuspend ? 'pause' : 'play_arrow'} className="text-[15px]" />
          </button>
          <button
            type="button"
            onClick={() => openAccount(account.id)}
            className="flex h-7 w-7 items-center justify-center rounded bg-surface-container text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary"
            title="Abrir instância"
          >
            <Icon name="open_in_new" className="text-[15px]" />
          </button>
          <button
            type="button"
            onClick={async () => {
              const result = await pickAccountIcon(account.id);
              if (result?.error) window.alert(result.error);
            }}
            className="flex h-7 w-7 items-center justify-center rounded bg-surface-container text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary"
            title="Escolher imagem"
          >
            <Icon name="add_photo_alternate" className="text-[15px]" />
          </button>
          <span className="flex h-7 w-7 items-center justify-center rounded bg-surface-container" title="Cor de identificação">
            <ColorSwatchButton value={account.color} onChange={(hex) => setAccountColor(account.id, hex)} title={`Cor de ${account.name}`} size={14} />
          </span>
          {account.iconDataUrl && (
            <button
              type="button"
              onClick={() => resetAccountIcon(account.id)}
              className="flex h-7 w-7 items-center justify-center rounded bg-surface-container text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
              title="Usar ícone padrão do serviço"
            >
              <Icon name="restart_alt" className="text-[15px]" />
            </button>
          )}
          <button
            type="button"
            onClick={() => removeAccountWithConfirm(account.id, account.name)}
            className="flex h-7 w-7 items-center justify-center rounded bg-surface-container text-on-surface-variant transition-colors hover:bg-error-container hover:text-on-error-container"
            title="Excluir instância"
          >
            <Icon name="delete" className="text-[15px]" />
          </button>
        </div>
      </td>
    </tr>
  );
}
