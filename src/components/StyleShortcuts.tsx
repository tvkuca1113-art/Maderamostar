import { getProduct } from '../data';
import { useStore } from '../state/store';
import { useUi } from '../state/ui';

/** Prečice „Pronađite svoj stil” vode do stvarnih zapisa u konfiguratoru. */
export const STYLE_SHORTCUTS = [
  { label: 'Hrast', productId: 'hrast-furnir-h', swatch: 'radial-gradient(circle at 35% 30%, #d9a873, #a8723f 70%)' },
  { label: 'Bijela', productId: 'bijela-zlatni-detalji', swatch: 'radial-gradient(circle at 35% 30%, #ffffff, #e9e6df 75%)' },
  { label: 'Tamna sa staklom', productId: 'antracit-staklo-mreza', swatch: 'radial-gradient(circle at 35% 30%, #55585e, #26282b 70%)' },
  { label: 'Skrivena', productId: 'skrivena-siva', swatch: 'radial-gradient(circle at 35% 30%, #dcdedd, #b3b7b6 75%)' },
];

export function StyleShortcuts() {
  const { state, dispatch } = useStore();
  const { goTo } = useUi();
  const active = STYLE_SHORTCUTS.find((s) => s.productId === state.draft.productId);
  const activeName = active ? getProduct(active.productId)?.displayName : null;
  return (
    <div className="style-picker">
      <p className="style-picker__title" id="stil-naslov">
        Pronađite svoj stil
      </p>
      <ul className="style-picker__list" aria-labelledby="stil-naslov">
        {STYLE_SHORTCUTS.map((s) => {
          const isActive = s.productId === state.draft.productId;
          return (
            <li key={s.productId}>
              <button
                type="button"
                className={`style-swatch${isActive ? ' is-active' : ''}`}
                aria-pressed={isActive}
                onClick={() => {
                  dispatch({ type: 'draft/selectProduct', productId: s.productId });
                  goTo('konfigurator');
                }}
              >
                <span className="style-swatch__dot" style={{ background: s.swatch }} aria-hidden="true" />
                <span className="style-swatch__label">{s.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="style-picker__active" aria-live="polite">
        {activeName ? (
          <>
            Odabrano: <strong>{activeName}</strong>
          </>
        ) : (
          'Odaberite primjer i otvorite ga u konfiguratoru.'
        )}
      </p>
    </div>
  );
}
