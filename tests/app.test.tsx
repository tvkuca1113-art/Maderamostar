import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App';

/** Pokreće odgođene skrol/fokus akcije (goTo koristi setTimeout 0). */
async function flush() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 5));
  });
}

beforeEach(() => {
  // jsdom nema WebGL: aplikacija mora koristiti fotografiju kao rezervni prikaz.
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
});

describe('Aplikacija — tok od modela do upita', () => {
  it('odabir modela u katalogu ažurira konfigurator, kalkulator i sažetak', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Pogledaj detalje: Sara' }));
    const dialog = screen.getByRole('dialog', { name: 'Sara' });
    expect(within(dialog).getByText('Osobine prikazane izvedbe')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: /Odaberi za svoj dom/ }));
    await flush();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    const konfigurator = document.getElementById('konfigurator')!;
    expect(within(konfigurator).getByRole('radio', { name: 'Sara' })).toBeChecked();
    expect(screen.getByLabelText('Odabrani model')).toHaveValue('sara-bijeli');
    const summary = konfigurator.querySelector('.config-panel__summary') as HTMLElement;
    expect(within(summary).getByText('Sara')).toBeInTheDocument();
  });

  it('kalkulator bez cjenovnika priprema upit i ne prikazuje iznos', async () => {
    const user = userEvent.setup();
    render(<App />);
    const calc = document.getElementById('kalkulator')!;
    await user.click(within(calc).getByRole('button', { name: /Pripremi procjenu/ }));
    expect(within(calc).getAllByText(/Unesite širinu otvora/).length).toBeGreaterThan(0);
    expect(within(calc).queryByText('Vaš izbor je spreman.')).not.toBeInTheDocument();

    await user.click(within(calc).getByLabelText('Ne znam mjere'));
    await user.type(within(calc).getByLabelText('Mjesto montaže'), 'Mostar');
    await user.click(within(calc).getByRole('button', { name: /Pripremi procjenu/ }));
    const result = calc.querySelector('.calc__result') as HTMLElement;
    expect(within(result).getByText('Vaš izbor je spreman.')).toBeInTheDocument();
    expect(within(result).getByText('Nisu poznate')).toBeInTheDocument();
    expect(result.textContent).not.toMatch(/KM|0,00/);
  });

  it('pogrešna količina ima jasnu poruku', async () => {
    const user = userEvent.setup();
    render(<App />);
    const calc = document.getElementById('kalkulator')!;
    await user.click(within(calc).getByLabelText('Ne znam mjere'));
    const qty = within(calc).getByLabelText('Broj vrata');
    await user.clear(qty);
    await user.type(qty, '2,5');
    await user.click(within(calc).getByRole('button', { name: /Pripremi procjenu/ }));
    expect(within(calc).getByText(/cijeli broj, najmanje 1/)).toBeInTheDocument();
    expect(qty).toHaveAttribute('aria-invalid', 'true');
  });

  it('projekt za više prostorija, upit, kopiranje i preuzimanje', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true });
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const createObjectURL = vi.fn().mockReturnValue('blob:madera');
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = vi.fn();
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    render(<App />);
    const k = document.getElementById('konfigurator')!;
    // 1. Spavaća soba, mjere nepoznate
    await user.click(within(k).getByLabelText('Ne znam mjere'));
    await user.selectOptions(within(k).getByLabelText('Prostorija'), 'Spavaća soba');
    await user.click(within(k).getByRole('button', { name: /Dodaj u moj projekt/ }));
    expect(within(k).getByText(/Dodano u projekt/)).toBeInTheDocument();
    // 2. Hodnik, Patras, 2 kom., bijela
    await user.click(within(k).getByRole('radio', { name: 'Patras' }));
    await user.selectOptions(within(k).getByLabelText('Prostorija'), 'Hodnik');
    const qty = within(k).getByLabelText('Broj vrata');
    await user.clear(qty);
    await user.type(qty, '2');
    await user.click(within(k).getByRole('radio', { name: 'Bijela' }));
    await user.click(within(k).getByRole('button', { name: /Dodaj u moj projekt/ }));

    const projekt = document.getElementById('projekt')!;
    expect(within(projekt).getAllByRole('listitem')).toHaveLength(2);
    expect(within(projekt).getByText(/3/, { selector: 'strong' })).toBeInTheDocument();

    await user.click(within(projekt).getByRole('button', { name: 'Nastavi na upit' }));
    const dialog = screen.getByRole('dialog', { name: 'Pregled upita' });
    await user.click(within(dialog).getByRole('button', { name: 'Pripremi upit' }));
    expect(within(dialog).getByText('Unesite ime.')).toBeInTheDocument();
    expect(within(dialog).queryByText(/Upit je pripremljen/)).not.toBeInTheDocument();

    await user.type(within(dialog).getByLabelText('Ime *'), 'Amra');
    await user.type(within(dialog).getByLabelText('Telefon *'), '061 111 222');
    await user.type(within(dialog).getByLabelText('Mjesto montaže *'), 'Mostar');
    await user.click(within(dialog).getByRole('button', { name: 'Pripremi upit' }));
    expect(within(dialog).getByText('Upit je pripremljen. Kontaktirajte Maderu i podijelite svoj izbor.')).toBeInTheDocument();
    // Nikad se ne tvrdi da je upit poslan.
    expect(dialog.textContent).not.toMatch(/poslan/i);

    await user.click(within(dialog).getByRole('button', { name: 'Kopiraj upit' }));
    expect(writeText).toHaveBeenCalledTimes(1);
    const text = writeText.mock.calls[0][0] as string;
    expect(text).toContain('Upit za Madera vrata.');
    expect(text).toContain('Ukupno: 3 vrata.');
    expect(text).toContain('Spavaća soba: Hrast furnir H, 1 kom., mjere nisu poznate');
    expect(text).toContain('Hodnik: Patras, 2 kom.');
    expect(text).toContain('željena bijela obrada');
    expect(within(dialog).getByText(/Upit je kopiran/)).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Preuzmi svoj izbor' }));
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(createObjectURL.mock.calls[0][0]).toBeInstanceOf(Blob);
    expect(clickSpy).toHaveBeenCalled();

    // Kontaktni podaci se ne spremaju lokalno.
    const stored = window.localStorage.getItem('madera:projekt:v1') ?? '';
    expect(stored).toContain('Hodnik');
    expect(stored).not.toContain('Amra');
    expect(stored).not.toContain('061 111 222');
  });

  it('projekt se obnavlja nakon osvježavanja stranice', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    const k = document.getElementById('konfigurator')!;
    await user.click(within(k).getByLabelText('Ne znam mjere'));
    await user.selectOptions(within(k).getByLabelText('Prostorija'), 'Kupatilo');
    await user.click(within(k).getByRole('button', { name: /Dodaj u moj projekt/ }));
    unmount();
    render(<App />);
    expect(within(document.getElementById('projekt')!).getByText('Kupatilo')).toBeInTheDocument();
  });
});

describe('Rezervni tokovi', () => {
  it('bez WebGL-a i uz smanjeno kretanje: fotografija, izbor i upit rade', async () => {
    const original = window.matchMedia;
    window.matchMedia = ((q: string) => ({
      matches: q.includes('prefers-reduced-motion'),
      media: q,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })) as typeof window.matchMedia;
    const scrollSpy = vi.spyOn(Element.prototype, 'scrollIntoView');
    const user = userEvent.setup();
    render(<App />);
    const k = document.getElementById('konfigurator')!;
    expect(within(k).getByRole('button', { name: '3D prikaz' })).toBeDisabled();
    expect(within(k).getByText(/3D prikaz nije dostupan na ovom uređaju/)).toBeInTheDocument();
    expect(within(k).getByRole('button', { name: /Uvećaj fotografiju: Hrast furnir H/ })).toBeInTheDocument();

    await user.click(within(k).getByLabelText('Ne znam mjere'));
    await user.click(within(k).getByRole('button', { name: /Zatraži ponudu za ova vrata/ }));
    expect(screen.getByRole('dialog', { name: 'Pregled upita' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Zatvori upit' }));

    await user.click(screen.getAllByRole('button', { name: /Hrast$/ })[0]);
    await flush();
    expect(scrollSpy).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'auto' }));
    window.matchMedia = original;
  });

  it('filter kataloga prikazuje odgovarajuće zapise', async () => {
    const user = userEvent.setup();
    render(<App />);
    const modeli = document.getElementById('modeli')!;
    await user.click(within(modeli).getByRole('button', { name: 'Klizna' }));
    expect(within(modeli).getAllByRole('article')).toHaveLength(1);
    expect(within(modeli).getByText('Klizna vrata sa staklom')).toBeInTheDocument();
    await user.click(within(modeli).getByRole('button', { name: 'Staklo' }));
    expect(within(modeli).getAllByRole('article').length).toBe(4);
    await user.click(within(modeli).getByRole('button', { name: 'Sva vrata' }));
    expect(within(modeli).getAllByRole('article')).toHaveLength(6);
    await user.click(within(modeli).getByRole('button', { name: /Pogledaj sve izvedbe/ }));
    expect(within(modeli).getAllByRole('article')).toHaveLength(11);
  });
});
