/**
 * Fase 39/46 — aviso de mensagem nova desenhado pelo próprio app (janela em
 * primeiro plano; minimizado, quem avisa é o Windows — ver
 * notificationManager.ts). Visual do toast da tela Backup & Diagnóstico do
 * Stitch. Clicar abre a instância. Nunca mostra conteúdo de mensagem.
 *
 * Posição: a instância é uma camada nativa que cobre a área de conteúdo,
 * então o aviso fica ancorado sobre a barra de contas, que nunca é coberta.
 *
 * Orbi — Criado por Vinicius Braga
 */
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { Icon } from '../ui/Icon';

interface ToastItem {
  id: number;
  accountId: string;
  accountName: string;
  count: number;
}

const VISIBLE_MS = 5000;
const MAX_STACK = 3;

/** Fase 46 — limpa sobras de formatação do nome só para exibir. */
function cleanName(raw: string): string {
  let name = (raw || '')
    .replace(/\s*[-–—]{1,}\s*(?=[-–—])/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/^\s*[-–—]+\s*|\s*[-–—]+\s*$/g, '')
    .trim();
  const partes = name.split(' ');
  const semRepeticao: string[] = [];
  for (const parte of partes) {
    if (semRepeticao.length > 0 && semRepeticao[semRepeticao.length - 1].toLowerCase() === parte.toLowerCase()) continue;
    semRepeticao.push(parte);
  }
  name = semRepeticao.join(' ');
  return name || raw;
}

export function MessageToast() {
  const [items, setItems] = useState<ToastItem[]>([]);
  const openAccount = useAppStore((s) => s.openAccount);
  const sidebarPosition = useAppStore((s) => s.sidebarPosition);
  const sidebarWidth = useAppStore((s) => s.sidebarWidth);

  useEffect(
    () =>
      window.multiwhats.onNewMessages(({ accountId, accountName, count }) => {
        const id = Date.now() + Math.random();
        setItems((prev) => [...prev, { id, accountId, accountName, count }].slice(-MAX_STACK));
        setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== id)), VISIBLE_MS);
      }),
    []
  );

  const dismiss = (id: number) => setItems((prev) => prev.filter((i) => i.id !== id));

  const vertical = sidebarPosition === 'left' || sidebarPosition === 'right';
  const width = vertical ? Math.min(320, sidebarWidth - 24) : 320;
  const style: React.CSSProperties = vertical
    ? { width, bottom: 72, ...(sidebarPosition === 'left' ? { left: 12 } : { right: 12 }) }
    : { width, top: 68, right: 16 };

  return (
    <div className="pointer-events-none fixed z-[60] flex flex-col gap-2" style={style}>
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <motion.button
            key={item.id}
            type="button"
            layout
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              dismiss(item.id);
              openAccount(item.accountId);
            }}
            className="group pointer-events-auto flex items-center gap-space-sm rounded-lg bg-surface-container-high px-space-md py-space-sm text-left shadow-xl transition-colors hover:bg-surface-container-highest"
          >
            <Icon name="chat" className="text-[20px] text-primary" />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-title-md text-body-sm font-semibold text-on-surface">{cleanName(item.accountName)}</span>
              <span className="font-code-sm text-code-sm text-on-surface-variant">
                {item.count === 1 ? 'Nova mensagem' : `${item.count} mensagens novas`}
              </span>
            </span>
            <span
              role="button"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                dismiss(item.id);
              }}
              className="rounded p-0.5 text-outline opacity-0 transition-opacity hover:text-on-surface group-hover:opacity-100"
            >
              <Icon name="close" className="text-[14px]" />
            </span>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
