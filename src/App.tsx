import { products } from './data';
import { StoreProvider, type State } from './state/store';
import { UiProvider } from './state/ui';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { QuickCalculator } from './components/QuickCalculator';
import { Catalog } from './components/Catalog';
import { Configurator } from './components/Configurator';
import { Project } from './components/Project';
import { Works } from './components/Works';
import { Contact, Faq, Process } from './components/InfoSections';
import { Footer } from './components/Footer';
import { ProductModal } from './components/ProductModal';
import { Lightbox } from './components/Lightbox';
import { InquiryDialog } from './components/InquiryDialog';
import { MobileBar } from './components/MobileBar';

export default function App({ initialState }: { initialState?: State }) {
  return (
    <StoreProvider validProductIds={products.map((p) => p.id)} initial={initialState}>
      <UiProvider>
        <a className="skip-link" href="#sadrzaj">
          Preskoči na sadržaj
        </a>
        <Header />
        <main id="sadrzaj">
          <Hero />
          <QuickCalculator />
          <Catalog />
          <Configurator />
          <Project />
          <Works />
          <Process />
          <Faq />
          <Contact />
        </main>
        <Footer />
        <MobileBar />
        <ProductModal />
        <Lightbox />
        <InquiryDialog />
      </UiProvider>
    </StoreProvider>
  );
}
