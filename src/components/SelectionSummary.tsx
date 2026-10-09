import { getProduct } from '../data';
import { FINISHES, HANDLES, HANDLE_SIDES, hasHandleSideChoice, optionLabel, roomLabel } from '../lib/options';
import { describeDimensions } from '../lib/inquiry';
import { quantityOf } from '../lib/validation';
import type { DoorConfig, ProjectItem } from '../types';

/** Pregled trenutnog izbora: model, želje, količina, mjere, mjesto montaže i prostorije u projektu. */
export function SelectionSummary({ cfg, location, items }: { cfg: DoorConfig; location: string; items?: ProjectItem[] }) {
  const product = getProduct(cfg.productId);
  const dims = describeDimensions(cfg);
  return (
    <dl className="summary">
      <div>
        <dt>Model</dt>
        <dd>{product?.displayName}</dd>
      </div>
      <div>
        <dt>Željena obrada</dt>
        <dd>{optionLabel(FINISHES, cfg.finish)}</dd>
      </div>
      <div>
        <dt>Kvaka</dt>
        <dd>{optionLabel(HANDLES, cfg.handle)}</dd>
      </div>
      {hasHandleSideChoice(product) && (
        <div>
          <dt>Smjer otvaranja</dt>
          <dd>{cfg.handleSide === 'nisam-siguran' ? 'Potrebna potvrda' : optionLabel(HANDLE_SIDES, cfg.handleSide)}</dd>
        </div>
      )}
      <div>
        <dt>Količina</dt>
        <dd>{quantityOf(cfg)} kom.</dd>
      </div>
      <div>
        <dt>Mjere otvora</dt>
        <dd>{dims === 'mjere nisu poznate' ? 'Nisu poznate' : dims.replace('približne mjere otvora ', '')}</dd>
      </div>
      <div>
        <dt>Mjesto montaže</dt>
        <dd>{location.trim() || 'Nije navedeno'}</dd>
      </div>
      {items && (
        <div className="summary__rooms">
          <dt>Prostorije u projektu</dt>
          <dd>
            {items.length === 0
              ? 'Još nema dodanih prostorija'
              : items.map((it, i) => `${roomLabel(it, i)} (${getProduct(it.productId)?.displayName}, ${quantityOf(it)} kom.)`).join(' · ')}
          </dd>
        </div>
      )}
    </dl>
  );
}
