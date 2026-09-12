/**
 * Ícone da instância: glifo do serviço tingido com a cor de identificação da
 * conta (Fase 59) ou a imagem customizada escolhida em Configurações (Fase 6).
 * O contêiner segue o padrão dos cards do Stitch (quadrado arredondado sobre
 * `surface-container-high`).
 * Orbi — Criado por Vinicius Braga
 */
import { AccountRecord } from '../../types';
import { ServiceGlyph } from '../ServiceIcon';

export function AccountAvatar({
  account,
  size = 32,
  glyph = 18,
  className = 'bg-surface-container-high',
}: {
  account: AccountRecord;
  size?: number;
  glyph?: number;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-shrink-0 items-center justify-center overflow-hidden rounded-lg ${className}`}
      style={{ width: size, height: size }}
    >
      {account.iconDataUrl ? (
        <img src={account.iconDataUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <ServiceGlyph service={account.service} size={glyph} color={account.color} />
      )}
    </div>
  );
}
