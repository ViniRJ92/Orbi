/**
 * Ícone Material Symbols Outlined — a mesma família usada em todas as telas
 * do Stitch. O nome do ícone é o mesmo ligature das telas (ex.: "hub",
 * "pause_circle"); o tamanho vem da classe `text-[Npx]`, igual ao HTML de lá.
 * Orbi — Criado por Vinicius Braga
 */
import { CSSProperties } from 'react';

export function Icon({
  name,
  className = '',
  fill = false,
  style,
}: {
  name: string;
  className?: string;
  /** Equivalente a `font-variation-settings: 'FILL' 1` das telas. */
  fill?: boolean;
  style?: CSSProperties;
}) {
  return (
    <span aria-hidden className={`material-symbols-outlined ${fill ? 'icon-fill' : ''} ${className}`} style={style}>
      {name}
    </span>
  );
}
