/**
 * Estado visual de uma instância no design system do Stitch (ponto de status,
 * etiqueta LIVE/SYNC, faixa lateral dos cards). Tudo derivado dos campos reais
 * de AccountStatus que chegam do processo principal — nenhum estado inventado:
 *
 *  - live:      sessão pronta (WhatsApp: lista de conversas detectada; demais
 *               serviços: página carregada — ver webviewPreload.ts)
 *  - sync:      view carregada, ainda sem login (WhatsApp aguardando QR Code)
 *  - error:     última tentativa de carregar a página falhou
 *  - suspended: suspensa (manual ou automaticamente) — partition intacta
 *  - off:       ainda não aberta nesta execução do app
 *
 * Orbi — Criado por Vinicius Braga
 */
import { AccountRecord, AccountStatus } from './types';

export type AccountTone = 'live' | 'sync' | 'error' | 'suspended' | 'off';

export function accountTone(status: AccountStatus | undefined): AccountTone {
  if (status?.loadError) return 'error';
  if (status?.suspended) return 'suspended';
  if (status?.isOnline) return 'live';
  if (status?.loaded) return 'sync';
  return 'off';
}

export const TONE_STYLES: Record<
  AccountTone,
  { dot: string; text: string; chip: string; bar: string; tag: string; hoverText: string }
> = {
  live: {
    dot: 'bg-primary-container shadow-[0_0_6px_rgba(0,220,130,0.8)]',
    text: 'text-primary',
    chip: 'bg-primary-container/15 text-primary',
    bar: 'bg-primary-container shadow-[0_0_8px_rgba(0,220,130,0.8)]',
    tag: 'LIVE',
    hoverText: 'group-hover:text-primary',
  },
  sync: {
    dot: 'bg-secondary-fixed-dim shadow-[0_0_6px_rgba(0,220,230,0.6)]',
    text: 'text-secondary-fixed-dim',
    chip: 'bg-secondary-fixed-dim/15 text-secondary-fixed-dim',
    bar: 'bg-secondary-fixed-dim shadow-[0_0_8px_rgba(0,220,230,0.8)]',
    tag: 'SYNC',
    hoverText: 'group-hover:text-secondary-fixed-dim',
  },
  error: {
    dot: 'bg-error',
    text: 'text-error',
    chip: 'bg-error/15 text-error',
    bar: 'bg-error shadow-[0_0_8px_rgba(255,180,171,0.8)]',
    tag: 'ERRO',
    hoverText: 'group-hover:text-error',
  },
  suspended: {
    dot: 'bg-outline',
    text: 'text-outline',
    chip: 'bg-outline/15 text-outline',
    bar: 'bg-outline',
    tag: 'SUSP',
    hoverText: 'group-hover:text-on-surface',
  },
  off: {
    dot: 'bg-outline/60',
    text: 'text-outline',
    chip: 'bg-surface-container-high text-on-surface-variant',
    bar: 'bg-outline-variant',
    tag: 'OFF',
    hoverText: 'group-hover:text-on-surface',
  },
};

/** Texto do selo de status ("CONECTADO", "AGUARDANDO QR"...). */
export function toneBadgeLabel(acc: AccountRecord, tone: AccountTone): string {
  if (tone === 'error') return 'FALHA AO CARREGAR';
  if (tone === 'suspended') return 'SUSPENSA';
  // Fase 31.1: "Conectado" só é honesto no WhatsApp, onde o login é detectado.
  if (tone === 'live') return acc.service === 'whatsapp' ? 'CONECTADO' : 'ABERTO';
  if (tone === 'sync') return acc.service === 'whatsapp' ? 'AGUARDANDO QR' : 'CARREGANDO';
  return 'NÃO CARREGADA';
}

/** Descrição curta de onde a sessão está (carregada em memória, suspensa, fechada). */
export function sessionStateLabel(status: AccountStatus | undefined): string {
  if (status?.loaded) return 'EM MEMÓRIA';
  if (status?.suspended) return 'SUSPENSA';
  return 'FECHADA';
}

/** Identificador curto da partition isolada da conta (`persist:account-<id>`). */
export function partitionShort(id: string): string {
  return `account-${id.slice(0, 8)}`;
}
