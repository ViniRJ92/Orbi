/**
 * Seletor da cor de identificação de uma instância (Fase 57): 16 cores
 * prontas, seletor do sistema e campo HEX. O valor guardado é sempre
 * `#RRGGBB` maiúsculo.
 * Orbi — Criado por Vinicius Braga
 */
import { useEffect, useState } from 'react';
import { Icon } from './Icon';

export const COLOR_CHOICES = [
  '#25D366',
  '#128C7E',
  '#34B7F1',
  '#F1A208',
  '#9B59B6',
  '#F15C6D',
  '#00A884',
  '#5865F2',
  '#E1306C',
  '#FF7A45',
  '#FFD166',
  '#7ED9A4',
  '#A0C4FF',
  '#C9A7EB',
  '#64748B',
  '#2C3E50',
];

/** Aceita `#abc`, `abc`, `#AABBCC` ou `AABBCC`; devolve `#AABBCC` ou null. */
export function normalizarHex(entrada: string): string | null {
  const bruto = entrada.trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(bruto)) {
    const [r, g, b] = bruto.split('');
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  if (/^[0-9a-fA-F]{6}$/.test(bruto)) return `#${bruto}`.toUpperCase();
  return null;
}

export function AccountColorPicker({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const [texto, setTexto] = useState(value);

  useEffect(() => {
    setTexto(value);
  }, [value]);

  const textoValido = normalizarHex(texto) !== null;
  const personalizada = !COLOR_CHOICES.includes(value.toUpperCase());

  // Durante a digitação só vale o formato de 6 dígitos; o atalho de 3 só ao sair.
  const aplicarTexto = (novo: string) => {
    setTexto(novo);
    const bruto = novo.trim().replace(/^#/, '');
    if (/^[0-9a-fA-F]{6}$/.test(bruto)) onChange(`#${bruto}`.toUpperCase());
  };

  const confirmarTexto = () => {
    const hex = normalizarHex(texto);
    if (hex) onChange(hex);
    else setTexto(value);
  };

  return (
    <div className="grid grid-cols-8 gap-2">
      {COLOR_CHOICES.map((c) => (
        <button
          key={c}
          type="button"
          className={
            'flex aspect-square w-full items-center justify-center rounded-xl transition-transform hover:scale-110 ' +
            (value.toUpperCase() === c ? 'ring-2 ring-on-surface ring-offset-2 ring-offset-surface-container-low' : '')
          }
          style={{ background: c }}
          onClick={() => onChange(c)}
          aria-label={`Cor ${c}`}
        >
          {value.toUpperCase() === c && <Icon name="check" className="text-[16px] text-white drop-shadow" />}
        </button>
      ))}

      <div
        className={
          'relative flex aspect-square w-full items-center justify-center rounded-xl bg-surface-container transition-transform hover:scale-110 ' +
          (personalizada ? 'ring-2 ring-on-surface ring-offset-2 ring-offset-surface-container-low' : '')
        }
        style={personalizada ? { background: value } : undefined}
        title="Escolher outra cor"
      >
        <Icon
          name="colorize"
          className={'pointer-events-none text-[16px] ' + (personalizada ? 'text-white drop-shadow' : 'text-on-surface-variant')}
        />
        <input
          type="color"
          value={normalizarHex(value) ?? '#000000'}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          aria-label="Escolher outra cor"
        />
      </div>

      <input
        type="text"
        value={texto}
        onChange={(e) => aplicarTexto(e.target.value)}
        onBlur={confirmarTexto}
        onKeyDown={(e) => {
          if (e.key === 'Enter') confirmarTexto();
        }}
        placeholder="#FF5733"
        spellCheck={false}
        maxLength={7}
        aria-label="Código HEX da cor"
        className={
          'col-span-7 h-9 min-w-0 rounded bg-surface-container-lowest px-3 font-code-sm text-code-sm uppercase text-on-surface placeholder:normal-case placeholder:text-on-surface-variant/60 focus:outline-none ' +
          (textoValido ? 'focus:shadow-[0_0_0_1px_#00dc82]' : 'shadow-[0_0_0_1px_rgb(var(--c-error))]')
        }
      />
    </div>
  );
}
