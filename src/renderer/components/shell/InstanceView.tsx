/**
 * Área da instância (tela inicial do Stitch) — é aqui que a WebContentsView
 * do serviço (WhatsApp Web oficial, Instagram...) é desenhada pelo processo
 * principal, exatamente sobre o elemento `viewport` medido por
 * `useViewportBounds`.
 *
 * Estados, todos derivados de AccountStatus real:
 *  - sem instâncias / nenhuma aberta: estados vazios;
 *  - WhatsApp carregado e ainda sem login: tela "Conexão WhatsApp QR Code" do
 *    Stitch — o QR Code é o oficial, desenhado pelo próprio WhatsApp Web na
 *    área da instância; o painel ao lado traz o passo a passo, o status real
 *    e "Reconectar QR" (recarrega a página, que gera um QR novo);
 *  - falha ao carregar: cartão de erro com "Reconectar" (a instância fica
 *    escondida para o cartão ser visível — ver App.tsx);
 *  - demais casos: faixa de telemetria da instância + a instância.
 *
 * Orbi — Criado por Vinicius Braga
 */
import { useEffect, useRef, useState } from 'react';
import { AccountRecord, AccountStatus, ChatActivityAccountDaily, SERVICES } from '../../types';
import { useActiveAccount, useAppStore } from '../../store/useAppStore';
import { useViewportBounds } from '../../useViewportBounds';
import { accountTone, partitionShort, sessionStateLabel, TONE_STYLES, toneBadgeLabel } from '../../accountTone';
import { accountStatusLabel } from '../../accountStatusLabel';
import { AccountAvatar } from '../ui/AccountAvatar';
import { Icon } from '../ui/Icon';

function useLayoutKey(): string {
  const sidebarPosition = useAppStore((s) => s.sidebarPosition);
  const sidebarWidth = useAppStore((s) => s.sidebarWidth);
  const iconSize = useAppStore((s) => s.iconSize);
  return `${sidebarPosition}:${sidebarWidth}:${iconSize}`;
}

function EmptyState() {
  const setAddAccountOpen = useAppStore((s) => s.setAddAccountOpen);
  return (
    <div className="flex h-full items-center justify-center px-space-lg">
      <div className="relative flex w-full max-w-md flex-col items-center gap-space-md overflow-hidden rounded-xl bg-surface-container-low p-space-xl text-center shadow-xl">
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-primary-container/10 blur-3xl" />
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-container-high">
          <Icon name="hub" className="text-[26px] text-primary-container" />
        </div>
        <div className="space-y-space-xs">
          <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">Nenhuma instância ainda</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Conecte o WhatsApp ou outro serviço. Cada conta roda em uma sessão isolada, só neste computador.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddAccountOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-space-lg py-2 font-headline-sm text-headline-sm font-semibold text-on-primary shadow-[0_0_16px_rgba(0,220,130,0.35)] transition-all hover:bg-primary-fixed"
        >
          <Icon name="add_circle" className="text-[20px]" />
          <span>Adicionar primeira conta</span>
        </button>
      </div>
    </div>
  );
}

function SelectState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-space-sm text-center">
      <Icon name="chat" className="text-[32px] text-outline-variant" />
      <p className="font-body-md text-body-md text-on-surface-variant">Selecione uma conta na barra para abrir.</p>
    </div>
  );
}

function ErrorState({ account }: { account: AccountRecord }) {
  const reloadAccount = useAppStore((s) => s.reloadAccount);
  return (
    <div className="flex h-full items-center justify-center px-space-lg">
      <div className="relative flex w-full max-w-md flex-col gap-space-md overflow-hidden rounded-xl bg-surface-container-low p-space-lg shadow-xl">
        <div className="absolute bottom-0 left-0 top-0 w-1 bg-error shadow-[0_0_8px_rgba(255,180,171,0.8)]" />
        <div className="flex items-center gap-space-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-container-high">
            <Icon name="error" className="text-[20px] text-error" />
          </div>
          <div>
            <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">{account.name}</h2>
            <span className="rounded-full bg-error/15 px-2 py-0.5 font-badge-micro text-badge-micro font-bold text-error">
              FALHA AO CARREGAR
            </span>
          </div>
        </div>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Não foi possível abrir {SERVICES[account.service]?.label ?? 'o serviço'}. Verifique a internet e tente de novo. A sessão
          continua salva: recarregar não desconecta a conta.
        </p>
        <button
          type="button"
          onClick={() => reloadAccount(account.id)}
          className="flex items-center justify-center gap-1 self-start rounded bg-error px-space-md py-1.5 font-title-md text-title-md text-on-error transition-all hover:bg-error-container hover:text-on-error-container"
        >
          <Icon name="refresh" className="text-[16px]" />
          <span>Reconectar</span>
        </button>
      </div>
    </div>
  );
}

/** Faixa de telemetria da tela inicial do Stitch, com os dados reais da instância aberta. */
function InstanceTicker({ account, status }: { account: AccountRecord; status: AccountStatus | undefined }) {
  const reloadAccount = useAppStore((s) => s.reloadAccount);
  const tone = accountTone(status);
  const t = TONE_STYLES[tone];
  return (
    <div className="flex flex-none items-center justify-between gap-space-md bg-surface-container-lowest px-space-md py-space-xs font-code-sm text-code-sm text-on-surface-variant shadow-sm">
      <div className="flex min-w-0 flex-1 items-center gap-space-md overflow-hidden">
        <div className={`flex min-w-0 items-center gap-space-xs ${t.text}`}>
          <span className="relative flex h-2 w-2 flex-shrink-0">
            {tone === 'live' && <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${t.dot}`} />}
            <span className={`relative inline-flex h-2 w-2 rounded-full ${t.dot}`} />
          </span>
          <span className="max-w-[260px] truncate font-bold uppercase tracking-wider">INSTÂNCIA: {account.name}</span>
        </div>
        <span className="hidden text-outline lg:inline">/</span>
        <span className="hidden flex-shrink-0 whitespace-nowrap uppercase text-on-surface lg:inline">
          SERVIÇO: {SERVICES[account.service]?.label ?? account.service}
        </span>
        <span className="hidden text-outline xl:inline">/</span>
        <span className="hidden flex-shrink-0 whitespace-nowrap font-label-sm text-label-sm uppercase text-secondary xl:inline">
          STATUS: {toneBadgeLabel(account, tone)}
        </span>
      </div>
      <div className="flex flex-shrink-0 items-center gap-space-lg">
        {account.service === 'whatsapp' && (
          <span className="flex items-center gap-1 whitespace-nowrap text-on-surface">
            <span className="font-bold text-primary">{status?.unreadCount ?? 0}</span> NÃO LIDAS
          </span>
        )}
        <span className="hidden whitespace-nowrap rounded bg-surface-container-high px-2 py-0.5 font-badge-micro text-badge-micro uppercase text-secondary-fixed xl:inline">
          SESSÃO ISOLADA
        </span>
        <span className="hidden whitespace-nowrap 2xl:inline">
          PARTITION: <span className="text-primary">#{partitionShort(account.id)}</span>
        </span>
        <button
          type="button"
          onClick={() => reloadAccount(account.id)}
          className="flex items-center gap-1 rounded px-1 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary"
          title="Recarregar esta instância (F5). Não desconecta a conta."
        >
          <Icon name="refresh" className="text-[14px]" />
          <span>RECARREGAR</span>
        </button>
      </div>
    </div>
  );
}

function LiveLayout({ account, status }: { account: AccountRecord; status: AccountStatus | undefined }) {
  const ref = useRef<HTMLElement | null>(null);
  useViewportBounds(ref, true, useLayoutKey());
  return (
    <div className="flex h-full flex-col px-gutter">
      <InstanceTicker account={account} status={status} />
      <div className="flex min-h-0 w-full flex-1 gap-gutter p-space-xs">
        <section
          ref={ref}
          className="relative flex flex-1 items-center justify-center overflow-hidden rounded-lg bg-surface-container-lowest shadow-xl"
        >
          {/* Visível só enquanto a página do serviço ainda não desenhou por cima. */}
          <div className="flex flex-col items-center gap-space-xs text-on-surface-variant">
            <Icon name="sync" className="animate-spin text-[22px] text-secondary-fixed-dim" />
            <span className="font-code-sm text-code-sm">Abrindo {SERVICES[account.service]?.label}...</span>
          </div>
        </section>
      </div>
    </div>
  );
}

const QR_STEPS: { title: string; text: string }[] = [
  { title: 'Abra o WhatsApp no celular', text: 'Use o aparelho da conta que vai ficar nesta instância.' },
  {
    title: 'Toque em Dispositivos conectados',
    text: 'No Android, menu de 3 pontos. No iPhone, Configurações. Depois "Conectar dispositivo".',
  },
  { title: 'Aponte a câmera para o QR Code', text: 'O código oficial está na área ao lado. A instância conecta sozinha ao ler.' },
];

function QrConnectLayout({ account, status }: { account: AccountRecord; status: AccountStatus | undefined }) {
  const ref = useRef<HTMLElement | null>(null);
  const accounts = useAppStore((s) => s.accounts);
  const statuses = useAppStore((s) => s.statuses);
  const reloadAccount = useAppStore((s) => s.reloadAccount);
  const openAccount = useAppStore((s) => s.openAccount);
  const [today, setToday] = useState<ChatActivityAccountDaily | null>(null);
  const [tableOpen, setTableOpen] = useState(() => window.innerHeight >= 960);
  useViewportBounds(ref, true, `${useLayoutKey()}:${tableOpen}`);

  // Atividade de hoje desta instância (mesma fonte do Analytics).
  useEffect(() => {
    let cancelled = false;
    const load = () =>
      window.multiwhats
        .getChatActivityDaily(null)
        .then((r) => {
          if (!cancelled) setToday(r.today.byAccount.find((a) => a.accountId === account.id) ?? null);
        })
        .catch(() => {});
    load();
    const t = setInterval(load, 20_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [account.id]);

  const whatsappAccounts = accounts.filter((a) => a.service === 'whatsapp');
  const whatsappOnline = whatsappAccounts.filter((a) => statuses.get(a.id)?.isOnline).length;

  return (
    <div className="flex h-full flex-col gap-space-md overflow-hidden px-space-lg pb-space-md">
      <div className="flex flex-none flex-wrap items-center justify-between gap-space-md rounded-xl bg-surface-container-low p-space-md shadow-md">
        <div className="flex min-w-0 items-center gap-space-md">
          <div className="flex items-center gap-space-xs">
            <span className="h-3 w-3 animate-pulse rounded-full bg-secondary-fixed-dim shadow-[0_0_10px_rgba(0,220,230,0.8)]" />
            <span className="whitespace-nowrap font-headline-sm text-headline-sm font-bold tracking-tight text-on-surface">
              Conexão WhatsApp
            </span>
          </div>
          <span className="h-4 w-px bg-surface-variant" />
          <div className="flex min-w-0 items-center gap-space-xs">
            <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">Sessão:</span>
            <span className="truncate font-code-sm text-code-sm font-bold text-primary">{account.name}</span>
          </div>
          <span className="hidden rounded bg-surface-container-high px-2 py-0.5 font-badge-micro text-badge-micro uppercase text-secondary-fixed-dim lg:inline-flex">
            WhatsApp Web oficial • partition #{partitionShort(account.id)}
          </span>
        </div>
        <div className="flex items-center gap-space-sm">
          <div className="flex items-center gap-space-xs rounded bg-surface-container-lowest px-2.5 py-1">
            <Icon name="qr_code_2" className="text-[16px] text-secondary-fixed-dim" />
            <span className="font-code-sm text-code-sm text-on-surface">
              Status: <span className="font-bold text-secondary-fixed-dim">aguardando leitura</span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => reloadAccount(account.id)}
            className="flex items-center gap-space-xs rounded bg-primary px-3 py-1.5 font-title-md text-title-md text-on-primary shadow-[0_0_12px_rgba(0,220,130,0.3)] transition-all hover:bg-primary-container"
            title="Recarrega o WhatsApp Web desta instância, que gera um QR Code novo"
          >
            <Icon name="qr_code_scanner" className="text-[18px]" />
            <span>Reconectar QR</span>
          </button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(260px,1fr)_2fr] gap-space-md">
        <section className="flex min-h-0 flex-col gap-space-md overflow-y-auto">
          <div className="relative overflow-hidden rounded-xl bg-surface-container p-space-lg shadow-xl">
            <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-primary-container/10 blur-3xl" />
            <div className="mb-space-md flex items-center justify-between gap-space-xs">
              <div className="flex items-center gap-space-xs">
                <Icon name="qr_code_2" className="text-[20px] text-primary" />
                <h2 className="font-title-md text-title-md uppercase tracking-wider text-on-surface">Escaneie para entrar</h2>
              </div>
              <span className="rounded-full bg-primary-container/15 px-2 py-0.5 font-badge-micro text-badge-micro text-primary">
                MULTI-DEVICE
              </span>
            </div>
            <p className="mb-space-md font-body-sm text-body-sm text-on-surface-variant">
              Leia o QR Code oficial do WhatsApp com o celular desta conta. A leitura só é necessária uma vez: depois a instância
              reabre já conectada, mesmo depois de fechar o Orbi.
            </p>
            <div className="relative mb-space-md flex flex-col items-center justify-center rounded-xl bg-surface-container-lowest p-space-md">
              <div className="flex items-center gap-space-sm">
                <AccountAvatar account={account} size={40} glyph={22} />
                <Icon name="arrow_forward" className="text-[22px] text-primary" />
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-inverse-surface shadow-[0_0_24px_rgba(0,220,130,0.15)]">
                  <Icon name="qr_code_2" className="text-[26px] text-surface-container-lowest" />
                </div>
              </div>
              <div className="mt-space-md flex w-full items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <Icon name="refresh" className="animate-spin text-[16px] text-secondary-fixed-dim" />
                  <span className="font-code-sm text-code-sm text-secondary-fixed-dim">Detectando login</span>
                </div>
                <button
                  type="button"
                  onClick={() => reloadAccount(account.id)}
                  className="font-label-sm text-label-sm uppercase text-primary hover:underline"
                >
                  Gerar novo QR
                </button>
              </div>
            </div>
            <div className="mb-space-md space-y-space-xs">
              {QR_STEPS.map((step, i) => (
                <div
                  key={step.title}
                  className="flex items-start gap-space-sm rounded-lg bg-surface-container-low p-space-sm transition-colors hover:bg-surface-container-high"
                >
                  <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-surface-container-highest font-code-sm text-code-sm font-bold text-primary">
                    {i + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="font-title-md text-title-md text-on-surface">{step.title}</div>
                    <div className="font-body-sm text-body-sm text-on-surface-variant">{step.text}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between rounded-lg bg-surface-container-lowest p-space-sm">
              <div className="flex items-center gap-space-xs">
                <Icon name="dns" className="text-[18px] text-outline" />
                <span className="font-code-sm text-code-sm text-on-surface">Sessão isolada</span>
              </div>
              <span className="font-code-sm text-code-sm font-bold text-secondary-fixed-dim">{sessionStateLabel(status)}</span>
            </div>
          </div>

          <div className="space-y-space-sm rounded-xl bg-surface-container p-space-md shadow-md">
            <div className="flex items-center justify-between">
              <span className="font-title-md text-title-md font-semibold text-on-surface">Atividade de hoje nesta instância</span>
              <span className="rounded bg-surface-container-high px-1.5 py-0.5 font-badge-micro text-badge-micro text-primary">
                ANALYTICS
              </span>
            </div>
            <div className="grid grid-cols-3 gap-space-xs">
              <div className="rounded bg-surface-container-lowest p-space-xs">
                <div className="font-label-sm text-label-sm uppercase text-outline">Enviadas</div>
                <div className="mt-1 font-metric-md text-metric-md text-primary">{today?.sent ?? 0}</div>
              </div>
              <div className="rounded bg-surface-container-lowest p-space-xs">
                <div className="font-label-sm text-label-sm uppercase text-outline">Recebidas</div>
                <div className="mt-1 font-metric-md text-metric-md text-secondary-fixed-dim">{today?.received ?? 0}</div>
              </div>
              <div className="rounded bg-surface-container-lowest p-space-xs">
                <div className="font-label-sm text-label-sm uppercase text-outline">Interações</div>
                <div className="mt-1 font-metric-md text-metric-md text-on-surface">{today?.newConversations ?? 0}</div>
              </div>
            </div>
          </div>
        </section>

        <section
          ref={ref}
          className="relative flex min-h-0 items-center justify-center overflow-hidden rounded-xl bg-surface-container shadow-xl"
        >
          <div className="flex flex-col items-center gap-space-xs text-on-surface-variant">
            <Icon name="sync" className="animate-spin text-[22px] text-secondary-fixed-dim" />
            <span className="font-code-sm text-code-sm">Carregando o WhatsApp Web...</span>
          </div>
        </section>
      </div>

      <section className="flex-none space-y-space-sm rounded-xl bg-surface-container p-space-md shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-xs">
            <Icon name="router" className="text-[20px] text-primary" />
            <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Status das instâncias WhatsApp</h3>
          </div>
          <div className="flex items-center gap-space-xs">
            <span className="rounded bg-surface-container-lowest px-2 py-0.5 font-badge-micro text-badge-micro uppercase text-primary">
              CONECTADAS: {whatsappOnline}/{whatsappAccounts.length}
            </span>
            <button
              type="button"
              onClick={() => setTableOpen((v) => !v)}
              className="rounded bg-surface-container-high px-2.5 py-1 font-label-sm text-label-sm text-on-surface transition-colors hover:bg-surface-variant"
            >
              {tableOpen ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
        </div>
        {tableOpen && (
          <div className="max-h-[180px] overflow-auto rounded-lg bg-surface-container-lowest">
            <table className="w-full text-left font-body-sm text-body-sm">
              <thead className="sticky top-0 bg-surface-container-high font-label-sm text-label-sm uppercase tracking-wider text-outline">
                <tr>
                  <th className="px-space-md py-2.5">Instância</th>
                  <th className="px-space-md py-2.5">Identificação</th>
                  <th className="px-space-md py-2.5">Status</th>
                  <th className="px-space-md py-2.5">Não lidas</th>
                  <th className="px-space-md py-2.5">Sessão</th>
                  <th className="px-space-md py-2.5 text-right">Ação rápida</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-high/40 font-code-sm text-code-sm">
                {whatsappAccounts.map((acc) => {
                  const st = statuses.get(acc.id);
                  const tone = accountTone(st);
                  const ts = TONE_STYLES[tone];
                  return (
                    <tr key={acc.id} className="transition-colors hover:bg-surface-container-low">
                      <td className="px-space-md py-2">
                        <div className="flex items-center gap-space-xs">
                          <span className={`h-2 w-2 rounded-full ${ts.dot}`} />
                          <span className="font-title-md text-title-md font-medium text-on-surface">{acc.name}</span>
                        </div>
                      </td>
                      <td className="px-space-md py-2 text-on-surface">{accountStatusLabel(acc, st)}</td>
                      <td className="px-space-md py-2">
                        <span className={`rounded px-2 py-0.5 font-badge-micro text-badge-micro ${ts.chip}`}>
                          {toneBadgeLabel(acc, tone)}
                        </span>
                      </td>
                      <td className="px-space-md py-2 text-on-surface">{st?.unreadCount ?? 0} mensagens</td>
                      <td className="px-space-md py-2 text-secondary-fixed-dim">{sessionStateLabel(st)}</td>
                      <td className="px-space-md py-2 text-right">
                        {st?.isActive ? (
                          <button
                            type="button"
                            onClick={() => reloadAccount(acc.id)}
                            className="rounded px-2 py-0.5 font-label-sm text-label-sm uppercase text-secondary-fixed-dim hover:bg-surface-container hover:underline"
                          >
                            Recarregar
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openAccount(acc.id)}
                            className="rounded px-2 py-0.5 font-label-sm text-label-sm uppercase text-on-surface-variant hover:bg-surface-container hover:text-primary"
                          >
                            Abrir
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export function InstanceView() {
  const accounts = useAppStore((s) => s.accounts);
  const { account, status } = useActiveAccount();

  if (accounts.length === 0) return <EmptyState />;
  if (!account) return <SelectState />;
  if (status?.loadError) return <ErrorState account={account} />;

  const waitingQr = account.service === 'whatsapp' && !!status?.loaded && !status.isOnline;
  return waitingQr ? (
    <QrConnectLayout key={`qr-${account.id}`} account={account} status={status} />
  ) : (
    <LiveLayout key={`live-${account.id}`} account={account} status={status} />
  );
}
