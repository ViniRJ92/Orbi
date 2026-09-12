/**
 * Chave liga/desliga no padrão das telas de Configurações do Stitch.
 * Orbi — Criado por Vinicius Braga
 */
export function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={
        'relative h-6 w-11 flex-shrink-0 rounded-full transition-all disabled:cursor-not-allowed disabled:opacity-50 ' +
        (checked ? 'bg-primary-container shadow-[0_0_12px_rgba(0,220,130,0.4)]' : 'bg-surface-container-highest')
      }
    >
      <span
        className={
          'absolute left-[2px] top-[2px] h-5 w-5 rounded-full transition-all ' +
          (checked ? 'translate-x-5 bg-on-primary-container' : 'translate-x-0 bg-on-surface')
        }
      />
    </button>
  );
}
