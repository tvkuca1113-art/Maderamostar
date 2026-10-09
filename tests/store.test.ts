import { describe, expect, it } from 'vitest';
import { initialState, reducer, type State } from '../src/state/store';
import { validateConfig, isValid } from '../src/lib/validation';
import { buildInquiryText } from '../src/lib/inquiry';
import { getProduct } from '../src/data';

function run(state: State, ...actions: Parameters<typeof reducer>[1][]): State {
  return actions.reduce(reducer, state);
}

describe('Projekt za cijeli dom', () => {
  const three = run(
    initialState,
    { type: 'draft/set', patch: { room: 'Spavaća soba', dimsUnknown: true } },
    { type: 'project/addDraft', id: 'a' },
    { type: 'draft/selectProduct', productId: 'patras-bijeli' },
    { type: 'draft/set', patch: { room: 'Hodnik', quantity: '2', finish: 'bijela', dimsUnknown: false, widthCm: '80', heightCm: '200' } },
    { type: 'project/addDraft', id: 'b' },
    { type: 'draft/selectProduct', productId: 'sara-bijeli' },
    { type: 'draft/set', patch: { room: 'Kupatilo', quantity: '1' } },
    { type: 'project/addDraft', id: 'c' },
  );

  it('tri različite prostorije ostaju sačuvane nakon uređivanja jedne', () => {
    expect(three.items.map((i) => i.room)).toEqual(['Spavaća soba', 'Hodnik', 'Kupatilo']);
    const edited = run(
      three,
      { type: 'project/startEdit', id: 'b' },
      { type: 'draft/set', patch: { quantity: '3', handle: 'crna' } },
      { type: 'project/saveEdit' },
    );
    expect(edited.items).toHaveLength(3);
    expect(edited.items[1]).toMatchObject({ id: 'b', room: 'Hodnik', quantity: '3', handle: 'crna', productId: 'patras-bijeli' });
    expect(edited.items[0]).toEqual(three.items[0]);
    expect(edited.items[2]).toEqual(three.items[2]);
    expect(edited.editingId).toBeNull();
  });

  it('promjena modela zadržava mjere i količinu, a želje vraća na prikazanu izvedbu', () => {
    const s = run(
      initialState,
      { type: 'draft/set', patch: { widthCm: '80', heightCm: '200', quantity: '3', finish: 'tamna', handle: 'crna', handleSide: 'desno' } },
      { type: 'draft/selectProduct', productId: 'sara-bijeli' },
    );
    expect(s.draft).toMatchObject({ productId: 'sara-bijeli', widthCm: '80', heightCm: '200', quantity: '3', finish: 'kao-na-fotografiji', handle: 'kao-na-fotografiji', handleSide: 'nisam-siguran' });
  });

  it('dupliranje i uklanjanje rade', () => {
    const dup = run(three, { type: 'project/duplicate', id: 'a', newId: 'a2' });
    expect(dup.items.map((i) => i.id)).toEqual(['a', 'a2', 'b', 'c']);
    expect({ ...dup.items[1], id: 'a' }).toEqual(dup.items[0]);
    const removed = run(dup, { type: 'project/remove', id: 'b' });
    expect(removed.items.map((i) => i.id)).toEqual(['a', 'a2', 'c']);
  });

  it('odustajanje od uređivanja ne mijenja stavku', () => {
    const s = run(three, { type: 'project/startEdit', id: 'c' }, { type: 'draft/set', patch: { quantity: '9' } }, { type: 'project/cancelEdit' });
    expect(s.items[2].quantity).toBe('1');
  });

  it('sažetak upita navodi prostorije, količine i nepoznate mjere', () => {
    const text = buildInquiryText(three.items, 'Mostar', getProduct);
    expect(text).toContain('Mjesto montaže: Mostar.');
    expect(text).toContain('Ukupno: 4 vrata.');
    expect(text).toContain('Spavaća soba: Hrast furnir H, 1 kom., mjere nisu poznate');
    expect(text).toContain('Hodnik: Patras, 2 kom., približne mjere otvora 80 × 200 cm, željena bijela obrada');
    expect(text).toContain('Molim ponudu i potvrdu dostupnih opcija.');
  });
});

describe('Validacija', () => {
  const base = initialState.draft;
  it('„Ne znam mjere” uklanja obaveznost dimenzija', () => {
    expect(isValid(validateConfig({ ...base, dimsUnknown: false }))).toBe(false);
    expect(isValid(validateConfig({ ...base, dimsUnknown: true }))).toBe(true);
  });
  it('pogrešna količina ima jasnu poruku', () => {
    expect(validateConfig({ ...base, dimsUnknown: true, quantity: '1,5' }).quantity).toMatch(/cijeli broj/);
    expect(validateConfig({ ...base, dimsUnknown: true, quantity: '0' }).quantity).toMatch(/najmanje 1/);
    expect(validateConfig({ ...base, dimsUnknown: true, quantity: '' }).quantity).toBeTruthy();
  });
  it('prihvata decimalni zarez, odbija nerazumne unose', () => {
    expect(isValid(validateConfig({ ...base, widthCm: '80,5', heightCm: '203' }))).toBe(true);
    expect(validateConfig({ ...base, widthCm: '800', heightCm: '2000' }).widthCm).toMatch(/milimetrima/);
    expect(validateConfig({ ...base, widthCm: 'abc', heightCm: '200' }).widthCm).toMatch(/broj/);
    expect(validateConfig({ ...base, widthCm: '-80', heightCm: '200' }).widthCm).toBeTruthy();
  });
});
