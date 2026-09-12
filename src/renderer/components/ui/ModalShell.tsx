/**
 * Janela modal "tactical glass" das telas do Stitch (Adicionar conta, Novo
 * compromisso): o fundo desfocado cobre só a área de conteúdo — cabeçalho e
 * barra de contas continuam visíveis, exatamente como nas telas.
 *
 * A instância (WebContentsView) é escondida enquanto o modal está aberto: ela
 * é uma camada nativa desenhada na frente da página (ver App.tsx).
 *
 * Orbi — Criado por Vinicius Braga
 */
import { ReactNode, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export function ModalShell({
  open,
  onClose,
  maxWidth,
  closeOnEscape = true,
  closeOnBackdrop = true,
  zIndex = 'z-40',
  children,
}: {
  open: boolean;
  onClose: () => void;
  /** Largura máxima do cartão, ex.: 'max-w-[660px]'. */
  maxWidth: string;
  closeOnEscape?: boolean;
  closeOnBackdrop?: boolean;
  zIndex?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open || !closeOnEscape) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [open, closeOnEscape, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={`absolute inset-0 ${zIndex} flex items-center justify-center bg-surface-container-lowest/80 p-space-sm backdrop-blur-md sm:p-space-md`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onMouseDown={(e) => {
            if (closeOnBackdrop && e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            className={`flex max-h-[92%] w-full ${maxWidth} flex-col overflow-hidden rounded-xl bg-surface-container-low shadow-[0_24px_64px_rgba(0,0,0,0.85),0_0_24px_rgba(0,220,130,0.12)]`}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
