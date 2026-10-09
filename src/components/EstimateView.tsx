import { getProduct, pricing } from '../data';
import { roomLabel } from '../lib/options';
import { estimateProject, formatBAM } from '../lib/pricing';
import type { DoorConfig } from '../types';

interface Props {
  items: DoorConfig[];
  location: string;
}

/**
 * Novčani dio procjene. U režimu A (bez odobrenog cjenovnika) ne prikazuje nijedan iznos,
 * već poruku da konačnu cijenu potvrđuje Madera.
 */
export function EstimateView({ items, location }: Props) {
  const est = estimateProject(items, location, pricing);

  if (est.mode === 'quote') {
    return (
      <div className="estimate estimate--quote">
        <p className="estimate__title">Vaš izbor je spreman.</p>
        <p>Zatražite ponudu za odabranu konfiguraciju. Konačnu cijenu potvrđuje Madera.</p>
      </div>
    );
  }

  return (
    <div className="estimate">
      <p className="estimate__title">{est.mode === 'estimate' ? 'Informativna procjena' : 'Djelimična procjena'}</p>
      <ul className="estimate__lines">
        {est.lines.map((line, i) => {
          const cfg = items[i];
          const name = getProduct(cfg.productId)?.displayName ?? cfg.productId;
          return (
            <li key={i} className="estimate__line">
              <p className="estimate__line-title">
                {roomLabel(cfg, i)} — {name}
              </p>
              {line.status === 'priced' ? (
                <dl className="estimate__parts">
                  {line.parts.map((p) => (
                    <div key={p.label}>
                      <dt>{p.label}</dt>
                      <dd>{formatBAM(p.amount)}</dd>
                    </div>
                  ))}
                  {line.baseIncludes.length > 0 && (
                    <div className="estimate__includes">
                      <dt>Osnovna cijena uključuje</dt>
                      <dd>{line.baseIncludes.join(', ')}</dd>
                    </div>
                  )}
                  <div>
                    <dt>
                      {line.quantity} × {formatBAM(line.unitBAM)}
                    </dt>
                    <dd>{formatBAM(line.productSubtotal)}</dd>
                  </div>
                  <div>
                    <dt>Montaža</dt>
                    <dd>{formatBAM(line.installationTotal)}</dd>
                  </div>
                  <div className="estimate__line-total">
                    <dt>Stavka ukupno</dt>
                    <dd>{formatBAM(line.total)}</dd>
                  </div>
                </dl>
              ) : (
                <p className="estimate__unknown">
                  <strong>Potrebna ponuda.</strong> {line.reasons.join(' ')}
                </p>
              )}
            </li>
          );
        })}
        <li className="estimate__line">
          <p className="estimate__line-title">Doprema</p>
          {est.delivery.status === 'priced' ? (
            <dl className="estimate__parts">
              <div>
                <dt>{est.delivery.label}</dt>
                <dd>{formatBAM(est.delivery.amount)}</dd>
              </div>
            </dl>
          ) : (
            <p className="estimate__unknown">
              <strong>Potrebna ponuda.</strong> {est.delivery.reason}
            </p>
          )}
        </li>
      </ul>
      <div className="estimate__total">
        <span>{est.mode === 'estimate' ? 'Ukupan informativni iznos' : 'Poznati međuzbir (nije ukupna cijena)'}</span>
        <strong>{formatBAM(est.knownSubtotal)}</strong>
      </div>
      {est.mode === 'partial' && (
        <p className="estimate__note">
          {stavkeTrebaju(est.unknownCount)} ponudu; konačan iznos potvrđuje Madera.
        </p>
      )}
      <p className="estimate__note">
        {est.taxNote} {pricing.disclaimer}
      </p>
    </div>
  );
}

function stavkeTrebaju(n: number): string {
  if (n === 1) return 'Jedna stavka treba';
  const few = n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14);
  return few ? `${n} stavke trebaju` : `${n} stavki treba`;
}
