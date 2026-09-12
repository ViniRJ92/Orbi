/**
 * Bolinha com a cor atual de algo (instância ou agrupamento). Clicar nela
 * abre direto o seletor de cores do sistema (Fase 59).
 *
 * O <input type="color"> fica invisível POR CIMA da bolinha: é o clique nele
 * que abre o seletor nativo. O valor é gravado depois de uma pausa curta, para
 * não escrever em disco a cada pixel arrastado no seletor.
 *
 * Orbi — Criado por Vinicius Braga
 */
import { useEffect, useRef, useState } from 'react';

const COR_PADRAO = '#25D366';

export function ColorSwatchButton({
  value,
  onChange,
  title,
  size = 14,
}: {
  value: string | undefined;
  onChange: (hex: string) => void;
  title: string;
  size?: number;
}) {
  const [local, setLocal] = useState(value || COR_PADRAO);
  const timerRef = useRef<number | undefined>(undefined);
  const pendenteRef = useRef<string | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => setLocal(value || COR_PADRAO), [value]);

  const gravarAgora = () => {
    window.clearTimeout(timerRef.current);
    const hex = pendenteRef.current;
    pendenteRef.current = null;
    if (hex) onChangeRef.current(hex);
  };

  // Saiu da tela antes da pausa terminar: grava o pendente em vez de perder.
  useEffect(() => () => gravarAgora(), []);

  const aoEscolher = (hex: string) => {
    const normalizado = hex.toUpperCase();
    setLocal(normalizado);
    pendenteRef.current = normalizado;
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(gravarAgora, 200);
  };

  return (
    <span
      className="relative inline-block flex-shrink-0 rounded-full border border-outline-variant align-middle transition-transform hover:scale-110"
      style={{ width: size, height: size, background: local }}
      title={title}
    >
      <input
        type="color"
        value={local}
        onChange={(e) => aoEscolher(e.target.value)}
        onBlur={gravarAgora}
        aria-label={title}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </span>
  );
}
