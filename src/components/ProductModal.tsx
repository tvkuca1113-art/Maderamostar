import { assetFor, getProduct } from '../data';
import { featureLabel } from '../lib/options';
import { useStore } from '../state/store';
import { useUi } from '../state/ui';
import { recordLabel } from './Catalog';
import { Dialog } from './Dialog';
import { ArrowIcon } from './Header';
import { ProductPicture } from './Picture';

export function ProductModal() {
  const { productId, closeProduct, openLightbox, goTo } = useUi();
  const { dispatch } = useStore();
  const product = productId ? getProduct(productId) : undefined;
  if (!product) return null;
  const meta = assetFor(product.image);

  return (
    <Dialog open onClose={closeProduct} labelledBy="detalj-naslov" className="dialog--product">
      <button type="button" className="dialog__close" onClick={closeProduct} aria-label="Zatvori detalje">
        ×
      </button>
      <div className="product-detail">
        <div className="product-detail__media">
          <button
            type="button"
            className="zoom-button"
            aria-label={`Uvećaj fotografiju: ${product.displayName}`}
            onClick={() =>
              openLightbox({ src: product.image, alt: product.imageAlt, caption: product.displayName, width: meta?.width, height: meta?.height })
            }
          >
            <ProductPicture src={product.image} alt={product.imageAlt} sizes="(max-width: 767px) 90vw, 520px" loading="eager" />
            <span className="zoom-button__label" aria-hidden="true">
              Uvećaj fotografiju
            </span>
          </button>
        </div>
        <div className="product-detail__body">
          <p className="tag">{recordLabel(product)}</p>
          <h2 id="detalj-naslov">{product.displayName}</h2>
          <p className="product-detail__text">{product.description}</p>

          <h3 className="h-small">Osobine prikazane izvedbe</h3>
          <ul className="feature-list">
            {product.observedFeatures.map((f) => (
              <li key={f}>{featureLabel(f)}</li>
            ))}
          </ul>
          <p className="muted small">Osobine su vidljive na fotografiji ili navedene u opisu iste objave.</p>

          <h3 className="h-small">Želje za ponudu</h3>
          <ul className="wish-list">
            <li>
              Obrada i boja <span className="badge">Dostupnost uz potvrdu</span>
            </li>
            <li>
              Kvaka i okovi <span className="badge">Dostupnost uz potvrdu</span>
            </li>
            <li>
              Mjere i smjer otvaranja <span className="badge">Potvrda pri mjerenju</span>
            </li>
          </ul>
          <p className="muted small">{product.commercialNote}</p>

          <div className="product-detail__actions">
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => {
                dispatch({ type: 'draft/selectProduct', productId: product.id });
                closeProduct();
                goTo('konfigurator');
              }}
            >
              Odaberi za svoj dom
              <ArrowIcon />
            </button>
            <a className="text-link" href={product.sourceUrl} target="_blank" rel="noopener noreferrer">
              Izvorna objava na Instagramu<span className="visually-hidden"> (otvara se u novom prozoru)</span>
            </a>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
