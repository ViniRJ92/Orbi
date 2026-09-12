/**
 * Busca rápida (Ctrl+K ou campo de busca do cabeçalho): procura por nome ou
 * telefone cadastrado da instância e abre direto nela. Só metadados das
 * contas — nada do conteúdo dos serviços é lido.
 * Orbi — Criado por Vinicius Braga
 */
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { useFilteredAccounts } from '../../useFilteredAccounts';
import { accountStatusLabel } from '../../accountStatusLabel';
import { accountTone, TONE_STYLES } from '../../accountTone';
import { AccountAvatar } from '../ui/AccountAvatar';
import { Icon } from '../ui/Icon';

export function CommandPalette() {
  const open = useAppStore((s) => s.paletteOpen);
  const setOpen = useAppStore((s) => s.setPaletteOpen);
  const accounts = useAppStore((s) => s.accounts);
  const statuses = useAppStore((s) => s.statuses);
  const openAccount = useAppStore((s) => s.openAccount);

  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const results = useFilteredAccounts(accounts, statuses, query, 'all');

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  useEffect(() => setActiveIndex(0), [query]);

  const close = () => setOpen(false);
  const select = (id: string) => {
    close();
    openAccount(id);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      // Fase 50: não deixa o Esc chegar à página que está por baixo.
      e.stopPropagation();
      close();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const acc = results[activeIndex];
      if (acc) select(acc.id);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute inset-0 z-50 flex items-start justify-center bg-surface-container-lowest/80 pt-[10vh] backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <motion.div
            className="flex w-[480px] max-w-[92%] flex-col overflow-hidden rounded-xl bg-surface-container-low shadow-[0_20px_50px_rgba(0,0,0,0.7),0_0_24px_rgba(0,220,130,0.08)]"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.14 }}
          >
            <div className="flex items-center gap-space-xs bg-surface-container px-space-md py-space-sm">
              <Icon name="search" className="text-[18px] text-outline" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Ir para uma instância..."
                className="h-8 flex-1 bg-transparent font-body-md text-body-md text-on-surface outline-none placeholder:text-outline"
              />
              <kbd className="rounded bg-surface-container-high px-1.5 py-0.5 font-code-sm text-code-sm text-outline">Esc</kbd>
            </div>
            <div className="max-h-[340px] overflow-y-auto p-1">
              {results.length === 0 ? (
                <div className="px-space-md py-space-lg text-center font-body-sm text-body-sm text-on-surface-variant">
                  {query ? 'Nenhuma instância encontrada.' : 'Digite para buscar por nome ou telefone.'}
                </div>
              ) : (
                results.map((acc, i) => {
                  const status = statuses.get(acc.id);
                  const t = TONE_STYLES[accountTone(status)];
                  const isActive = i === activeIndex;
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onMouseEnter={() => setActiveIndex(i)}
                      onClick={() => select(acc.id)}
                      className={
                        'flex w-full items-center gap-space-sm rounded-lg p-space-sm text-left transition-colors ' +
                        (isActive ? 'bg-surface-container-high' : 'hover:bg-surface-container')
                      }
                    >
                      <AccountAvatar account={acc} size={28} glyph={16} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          {acc.favorite && <Icon name="star" fill className="text-[13px] text-secondary-fixed-dim" />}
                          <span className={'truncate font-title-md text-title-md ' + (isActive ? 'text-primary' : 'text-on-surface')}>
                            {acc.name}
                          </span>
                        </div>
                        <div className="truncate font-code-sm text-code-sm text-outline">{accountStatusLabel(acc, status)}</div>
                      </div>
                      <span className={`font-badge-micro text-badge-micro ${t.text}`}>{t.tag}</span>
                      {isActive && <Icon name="keyboard_return" className="text-[16px] text-outline" />}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
