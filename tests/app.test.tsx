import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import App from '../src/App';
import { emptyConfig, initialState, type State } from '../src/state/store';

/** Pokreće odgođene skrol/fokus akcije (goTo koristi setTimeout 0). */
async function flush() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 5));
  });
}

const konf = () => document.getElementById('konfigurator')!;

/** Prolazi kroz korake konfiguratora i dodaje trenutni izbor u Moj izbor. */
async function addViaConfigurator(user: ReturnType<typeof userEvent.setup>, opts: { model?: string; room: string; qty?: string; finish?: string }) {
  const k = konf();
  await user.click(within(k).getByRole('button', { name: /Model i izgled/ }));
  if (opts.model) await user.click(within(k).getByRole('radio', { name: opts.model }));
  if (opts.finish) await user.click(within(k).getByRole('radio', { name: opts.finish }));
  await user.click(within(k).getByRole('button', { name: /Dalje: mjere i prostorija/ }));
  const unknown = within(k).getByLabelText('Ne znam mjere');
  if (!(unknown as HTMLInputElement).checked) await user.click(unknown);
  const qty = within(k).getByLabelText('Broj vrata');
  await user.clear(qty);
  await user.type(qty, opts.qty ?? '1');
  await user.selectOptions(within(k).getByLabelText('Prostorija'), opts.room);
  await user.click(within(k).getByRole('button', { name: /Dalje: pregled/ }));
  await user.click(within(k).getByRole('button', { name: /Dodaj u Moj izbor/ }));
}

describe('Aplikacija — tok od modela do upita', () => {
  it('„Odaberi model” u katalogu ažurira konfigurator, planer i sažetak', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Odaberi model: Sara' }));
    await flush();
    const k = konf();
    expect(within(k).getByRole('radio', { name: 'Sara' })).toBeChecked();
    expect(screen.getByLabelText('Model')).toHaveValue('sara-bijeli');
    expect(within(k).getAllByText('Sara').length).toBeGreaterThan(0);

    // Detalji modela su sekundarni, ali i dalje vode u konfigurator.
    await user.click(screen.getByRole('button', { name: 'Pogledaj detalje: Patras' }));
    const dialog = screen.getByRole('dialog', { name: 'Patras' });
    await user.click(within(dialog).getByRole('button', { name: /Odaberi za svoj dom/ }));
    await flush();
    expect(within(konf()).getByRole('radio', { name: 'Patras' })).toBeChecked();
  });

  it('planer bez cjenovnika prikazuje „Cijena na upit” i ne proizvodi iznos', async () => {
    const user = userEvent.setup();
    render(<App />);
    const calc = document.getElementById('kalkulator')!;
    expect(within(calc).getByRole('heading', { name: 'Planer vrata za cijeli dom' })).toBeInTheDocument();
    expect(within(calc).getByText('Cijena na upit')).toBeInTheDocument();
    await user.click(within(calc).getByRole('button', { name: /Pregledaj izbor/ }));
    expect(within(calc).getAllByText(/Unesite širinu otvora/).length).toBeGreaterThan(0);

    await user.click(within(calc).getByLabelText('Ne znam mjere'));
    await user.type(within(calc).getByLabelText('Mjesto montaže'), 'Mostar');
    await user.click(within(calc).getByRole('button', { name: /Pregledaj izbor/ }));
    const result = calc.querySelector('.calc__result') as HTMLElement;
    expect(within(result).getByText('Vaš izbor je spreman.')).toBeInTheDocument();
    expect(result.textContent).not.toMatch(/KM|0,00/);
  });

  it('količina 0 i decimalna količina imaju jasnu poruku; decimalni zarez u mjerama radi', async () => {
    const user = userEvent.setup();
    render(<App />);
    const calc = document.getElementById('kalkulator')!;
    await user.type(within(calc).getByLabelText('Širina otvora (cm)'), '80,5');
    await user.type(within(calc).getByLabelText('Visina otvora (cm)'), '205');
    const qty = within(calc).getByLabelText('Broj vrata');
    await user.clear(qty);
    await user.type(qty, '0');
    await user.click(within(calc).getByRole('button', { name: /Pregledaj izbor/ }));
    expect(within(calc).getByText(/najmanje 1/)).toBeInTheDocument();
    expect(qty).toHaveAttribute('aria-invalid', 'true');
    expect(within(calc).getByLabelText('Širina otvora (cm)')).not.toHaveAttribute('aria-invalid');
    await user.clear(qty);
    await user.type(qty, '2,5');
    expect(within(calc).getByText(/cijeli broj/)).toBeInTheDocument();
  });

  it('konfigurator u tri koraka: Nazad ne briše izbor, greška fokusira polje', async () => {
    const user = userEvent.setup();
    render(<App />);
    const k = konf();
    await user.click(within(k).getByRole('radio', { name: 'Tamna / antracit' }));
    await user.click(within(k).getByRole('button', { name: /Dalje: mjere i prostorija/ }));
    await user.click(within(k).getByRole('button', { name: /Dalje: pregled/ }));
    await flush();
    const width = within(k).getByLabelText('Širina otvora (cm)');
    expect(width).toHaveAttribute('aria-invalid', 'true');
    expect(width).toHaveFocus();
    await user.type(width, '80');
    await user.type(within(k).getByLabelText('Visina otvora (cm)'), '200');
    await user.click(within(k).getByRole('button', { name: 'Nazad' }));
    expect(within(k).getByRole('radio', { name: 'Tamna / antracit' })).toBeChecked();
    await user.click(within(k).getByRole('button', { name: /Dalje: mjere i prostorija/ }));
    expect(within(k).getByLabelText('Širina otvora (cm)')).toHaveValue('80');
  });

  it('Moj izbor: dodavanje, dupliranje s promjenom prostorije, upit, kopiranje i preuzimanje', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true });
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const createObjectURL = vi.fn().mockReturnValue('blob:madera');
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    render(<App />);
    await addViaConfigurator(user, { room: 'Spavaća soba' });
    expect(within(konf()).getByText(/Dodano u Moj izbor/)).toBeInTheDocument();
    await addViaConfigurator(user, { model: 'Patras', room: 'Hodnik', qty: '2', finish: 'Bijela' });

    const projekt = document.getElementById('projekt')!;
    expect(within(projekt).getAllByRole('listitem')).toHaveLength(2);
    await user.click(within(projekt).getByRole('button', { name: 'Dupliraj: Hodnik' }));
    const roomSelects = within(projekt).getAllByLabelText(/Prostorija za stavku/);
    expect(roomSelects).toHaveLength(3);
    expect(roomSelects[2]).toHaveFocus();
    await user.selectOptions(roomSelects[2], 'Kupatilo');
    expect(within(projekt).getByRole('button', { name: /Ponuda za cijeli izbor \(5 vrata\)/ })).toBeInTheDocument();

    await user.click(within(projekt).getByRole('button', { name: /Ponuda za cijeli izbor/ }));
    const dialog = screen.getByRole('dialog', { name: /Ponuda za cijeli izbor/ });
    await user.click(within(dialog).getByRole('button', { name: 'Pripremi upit' }));
    expect(within(dialog).getByText('Unesite ime.')).toBeInTheDocument();
    await user.type(within(dialog).getByLabelText('Ime *'), 'Amra');
    await user.type(within(dialog).getByLabelText('Telefon *'), '061 111 222');
    await user.type(within(dialog).getByLabelText('Mjesto montaže *'), 'Mostar');
    await user.click(within(dialog).getByRole('button', { name: 'Pripremi upit' }));
    expect(within(dialog).getByText('Upit je pripremljen, još nije poslan.')).toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: /JSON/ })).not.toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Kopiraj upit' }));
    const text = writeText.mock.calls[0][0] as string;
    expect(text).toContain('Ukupno: 5 vrata.');
    expect(text).toContain('Spavaća soba: Hrast furnir H, 1 kom., mjere nisu poznate');
    expect(text).toContain('Hodnik: Patras, 2 kom.');
    expect(text).toContain('Kupatilo: Patras, 2 kom.');
    await user.click(within(dialog).getByRole('button', { name: 'Preuzmi tekst (.txt)' }));
    expect(createObjectURL.mock.calls[0][0]).toBeInstanceOf(Blob);

    const stored = window.localStorage.getItem('madera:projekt:v1') ?? '';
    expect(stored).toContain('Kupatilo');
    expect(stored).not.toContain('Amra');
    expect(stored).not.toContain('061 111 222');
  });

  it('Moj izbor se obnavlja nakon osvježavanja stranice', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    await addViaConfigurator(user, { room: 'Kupatilo' });
    unmount();
    render(<App />);
    expect(within(document.getElementById('projekt')!).getByLabelText(/Prostorija za stavku 1/)).toHaveValue('Kupatilo');
  });
});

describe('Obuhvat upita: trenutna vrata i cijeli izbor', () => {
  const milano3: State = {
    ...initialState,
    location: 'Mostar',
    items: [{ ...emptyConfig('milano-bijeli'), id: 'm', quantity: '3', dimsUnknown: true, room: 'Hodnik' }],
    draft: { ...emptyConfig('sara-bijeli'), quantity: '1', dimsUnknown: true },
  };

  it('Milano 3 + trenutna Sara 1: svaki upit ima tačan obuhvat; nakon dodavanja Sare 4 vrata', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true });
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    render(<App initialState={milano3} />);
    const calc = document.getElementById('kalkulator')!;
    await user.click(within(calc).getByRole('button', { name: /Pregledaj izbor/ }));
    const result = calc.querySelector('.calc__result') as HTMLElement;
    // Upozorenje o nespremljenom izboru stoji prije akcije za cijeli izbor.
    expect(within(result).getByText(/nisu u Mom izboru/)).toBeInTheDocument();

    async function preparedText(): Promise<string> {
      const d = screen.getByRole('dialog');
      if (!(within(d).getByLabelText('Ime *') as HTMLInputElement).value) {
        await user.type(within(d).getByLabelText('Ime *'), 'Test');
        await user.type(within(d).getByLabelText('Telefon *'), '061 222 333');
      }
      await user.click(within(d).getByRole('button', { name: 'Pripremi upit' }));
      await user.click(within(d).getByRole('button', { name: 'Kopiraj upit' }));
      return writeText.mock.calls[writeText.mock.calls.length - 1][0] as string;
    }

    await user.click(within(result).getByRole('button', { name: 'Ponuda za ova vrata' }));
    expect(screen.getByRole('dialog', { name: 'Ponuda za ova vrata' })).toBeInTheDocument();
    let text = await preparedText();
    expect(text).toContain('Ukupno: 1 vrata.');
    expect(text).toContain('Sara, 1 kom.');
    expect(text).not.toContain('Milano');
    await user.click(screen.getByRole('button', { name: 'Zatvori upit' }));

    await user.click(within(result).getByRole('button', { name: 'Ponuda za cijeli izbor (3 vrata)' }));
    const d = screen.getByRole('dialog', { name: 'Ponuda za cijeli izbor (3 vrata)' });
    expect(within(d).getByText(/nisu u Mom izboru i nisu uključena/)).toBeInTheDocument();
    text = await preparedText();
    expect(text).toContain('Ukupno: 3 vrata.');
    expect(text).toContain('Milano, 3 kom.');
    expect(text).not.toContain('Sara');
    // Prebacivanje obuhvata u istom dijalogu je eksplicitno.
    await user.click(within(d).getByRole('button', { name: /Samo trenutna vrata/ }));
    expect(screen.getByRole('dialog', { name: 'Ponuda za ova vrata' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Zatvori upit' }));

    await user.click(within(result).getByRole('button', { name: 'Dodaj u Moj izbor' }));
    expect(within(result).getByText('Već su u Mom izboru')).toBeInTheDocument();
    expect(within(result).queryByRole('button', { name: 'Dodaj u Moj izbor' })).not.toBeInTheDocument();
    expect(within(result).getByRole('button', { name: 'Ponuda za cijeli izbor (4 vrata)' })).toBeInTheDocument();
    expect(within(document.getElementById('projekt')!).getAllByLabelText(/Prostorija za stavku/)).toHaveLength(2);
  });
});

describe('Rezervni tokovi', () => {
  it('bez WebGL 2 i uz smanjeno kretanje: fotografija, jasna poruka, izbor i upit rade', async () => {
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
    const k = konf();
    expect(within(k).getByRole('button', { name: '3D prikaz' })).toBeDisabled();
    expect(within(k).getByText('3D trenutno nije dostupan. Nastavite s odabirom na fotografiji.')).toBeInTheDocument();
    expect(within(k).queryByRole('button', { name: 'Pokušaj ponovo' })).not.toBeInTheDocument();
    expect(within(k).queryByRole('button', { name: 'Otvori vrata' })).not.toBeInTheDocument();
    expect(within(k).getByRole('button', { name: /Uvećaj fotografiju: Hrast furnir H/ })).toBeInTheDocument();

    await user.click(within(k).getByRole('button', { name: /Dalje: mjere i prostorija/ }));
    await user.click(within(k).getByLabelText('Ne znam mjere'));
    await user.click(within(k).getByRole('button', { name: /Dalje: pregled/ }));
    await user.click(within(k).getByRole('button', { name: 'Ponuda za ova vrata' }));
    expect(screen.getByRole('dialog', { name: 'Ponuda za ova vrata' })).toBeInTheDocument();
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
    await user.click(within(modeli).getByRole('button', { name: 'Staklo' }));
    expect(within(modeli).getAllByRole('article').length).toBe(4);
    await user.click(within(modeli).getByRole('button', { name: 'Sva vrata' }));
    expect(within(modeli).getAllByRole('article')).toHaveLength(6);
    await user.click(within(modeli).getByRole('button', { name: /Pogledaj sve izvedbe/ }));
    expect(within(modeli).getAllByRole('article')).toHaveLength(11);
  });
});
