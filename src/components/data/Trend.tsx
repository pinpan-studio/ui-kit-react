import { MaterialIcon } from '../ui/MaterialIcon';
import './trend.scss';

/** app-trend : badge de tendance (↑ 12,4 %), couleur selon le sens ; `inverse` : une baisse est positive. */
export function Trend({
  value,
  unit = ' %',
  label = '',
  inverse = false,
  soft = true,
}: {
  value: number;
  unit?: string;
  label?: string;
  inverse?: boolean;
  soft?: boolean;
}) {
  const tone = Math.abs(value) < 0.05 ? 'flat' : value > 0 !== inverse ? 'up' : 'down';
  return (
    <span className="app-trend">
      <span className={`tr tr--${tone}${soft ? ' soft' : ''}`}>
        <MaterialIcon name={value > 0 ? 'trending_up' : value < 0 ? 'trending_down' : 'trending_flat'} />{' '}
        {value > 0 ? '+' : ''}
        {value.toLocaleString('fr-FR', { maximumFractionDigits: 1 })}
        {unit}{' '}
      </span>
      {label && <span className="tr-label">{label}</span>}
    </span>
  );
}
