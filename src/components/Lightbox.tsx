import { useUi } from '../state/ui';
import { Dialog } from './Dialog';

/** Prikazuje cijelu originalnu fotografiju, bez rezanja i filtera. */
export function Lightbox() {
  const { lightbox, closeLightbox } = useUi();
  if (!lightbox) return null;
  return (
    <Dialog open onClose={closeLightbox} labelledBy="lightbox-naslov" className="dialog--lightbox">
      <button type="button" className="dialog__close dialog__close--light" onClick={closeLightbox} aria-label="Zatvori fotografiju">
        ×
      </button>
      <figure className="lightbox">
        <img src={lightbox.src} alt={lightbox.alt} width={lightbox.width} height={lightbox.height} />
        <figcaption id="lightbox-naslov">{lightbox.caption ?? lightbox.alt}</figcaption>
      </figure>
    </Dialog>
  );
}
