import { createContext, useContext, useEffect, useMemo, useReducer, type Dispatch, type ReactNode } from 'react';
import type { DoorConfig, ProjectItem } from '../types';

/**
 * Jedan izvor stanja za brzi kalkulator, konfigurator i projekt za cijeli dom.
 * Lokalno se čuva samo anonimna konfiguracija; kontaktni podaci se nikad ne spremaju ovdje.
 */

export const DEFAULT_PRODUCT_ID = 'hrast-furnir-h';
const STORAGE_KEY = 'madera:projekt:v1';

export function emptyConfig(productId = DEFAULT_PRODUCT_ID): DoorConfig {
  return {
    productId,
    finish: 'kao-na-fotografiji',
    handle: 'kao-na-fotografiji',
    handleSide: 'nisam-siguran',
    widthCm: '',
    heightCm: '',
    dimsUnknown: false,
    wallCm: '',
    quantity: '1',
    room: '',
    roomCustom: '',
  };
}

export interface State {
  draft: DoorConfig;
  items: ProjectItem[];
  location: string;
  editingId: string | null;
  lastAdded: { id: string; mode: 'added' | 'saved' } | null;
}

export type Action =
  | { type: 'draft/set'; patch: Partial<DoorConfig> }
  | { type: 'draft/selectProduct'; productId: string }
  | { type: 'draft/reset' }
  | { type: 'location/set'; location: string }
  | { type: 'project/addDraft'; id?: string }
  | { type: 'project/startEdit'; id: string }
  | { type: 'project/saveEdit' }
  | { type: 'project/cancelEdit' }
  | { type: 'project/duplicate'; id: string; newId?: string }
  | { type: 'project/remove'; id: string }
  | { type: 'project/clear' }
  | { type: 'notice/dismiss' };

let counter = 0;
export function newId(): string {
  counter += 1;
  return `v${Date.now().toString(36)}${counter.toString(36)}`;
}

export const initialState: State = {
  draft: emptyConfig(),
  items: [],
  location: '',
  editingId: null,
  lastAdded: null,
};

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'draft/set':
      return { ...state, draft: { ...state.draft, ...action.patch } };
    case 'draft/selectProduct':
      if (state.draft.productId === action.productId) return state;
      // Model se mijenja: mjere, količina i prostorija ostaju; želje vezane za model vraćaju se na prikazanu izvedbu.
      return {
        ...state,
        draft: { ...state.draft, productId: action.productId, finish: 'kao-na-fotografiji', handle: 'kao-na-fotografiji', handleSide: 'nisam-siguran' },
      };
    case 'draft/reset':
      return { ...state, draft: emptyConfig(state.draft.productId), editingId: null };
    case 'location/set':
      return { ...state, location: action.location };
    case 'project/addDraft': {
      const item: ProjectItem = { ...state.draft, id: action.id ?? newId() };
      return {
        ...state,
        items: [...state.items, item],
        // Nakon dodavanja zadrži model, a pripremi novu prostoriju.
        draft: { ...state.draft, room: '', roomCustom: '' },
        lastAdded: { id: item.id, mode: 'added' },
      };
    }
    case 'project/startEdit': {
      const item = state.items.find((i) => i.id === action.id);
      if (!item) return state;
      const { id: _id, ...cfg } = item;
      return { ...state, draft: cfg, editingId: item.id, lastAdded: null };
    }
    case 'project/saveEdit': {
      if (!state.editingId) return state;
      const id = state.editingId;
      return {
        ...state,
        items: state.items.map((i) => (i.id === id ? { ...state.draft, id } : i)),
        editingId: null,
        draft: { ...state.draft, room: '', roomCustom: '' },
        lastAdded: { id, mode: 'saved' },
      };
    }
    case 'project/cancelEdit':
      return { ...state, editingId: null, draft: { ...state.draft, room: '', roomCustom: '' } };
    case 'project/duplicate': {
      const idx = state.items.findIndex((i) => i.id === action.id);
      if (idx < 0) return state;
      const copy: ProjectItem = { ...state.items[idx], id: action.newId ?? newId() };
      const items = [...state.items];
      items.splice(idx + 1, 0, copy);
      return { ...state, items };
    }
    case 'project/remove':
      return {
        ...state,
        items: state.items.filter((i) => i.id !== action.id),
        editingId: state.editingId === action.id ? null : state.editingId,
        lastAdded: state.lastAdded?.id === action.id ? null : state.lastAdded,
      };
    case 'project/clear':
      return { ...state, items: [], editingId: null, lastAdded: null };
    case 'notice/dismiss':
      return { ...state, lastAdded: null };
    default:
      return state;
  }
}

function isConfig(x: unknown): x is DoorConfig {
  if (!x || typeof x !== 'object') return false;
  const c = x as Record<string, unknown>;
  return typeof c.productId === 'string' && typeof c.quantity === 'string' && typeof c.widthCm === 'string';
}

export function loadState(validProductIds: string[]): State {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw) as Partial<State>;
    const known = (c: DoorConfig) => validProductIds.includes(c.productId);
    const draft = isConfig(parsed.draft) && known(parsed.draft) ? { ...emptyConfig(), ...parsed.draft } : initialState.draft;
    const items = Array.isArray(parsed.items)
      ? parsed.items.filter((i): i is ProjectItem => isConfig(i) && known(i) && typeof (i as ProjectItem).id === 'string')
          .map((i) => ({ ...emptyConfig(), ...i }))
      : [];
    return {
      ...initialState,
      draft,
      items,
      location: typeof parsed.location === 'string' ? parsed.location : '',
    };
  } catch {
    return initialState;
  }
}

function saveState(state: State) {
  try {
    const { draft, items, location } = state;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ draft, items, location }));
  } catch {
    /* privatni način rada ili pun prostor — konfiguracija i dalje radi u memoriji */
  }
}

interface StoreValue {
  state: State;
  dispatch: Dispatch<Action>;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({
  children,
  validProductIds,
  initial,
}: {
  children: ReactNode;
  validProductIds: string[];
  initial?: State;
}) {
  const [state, dispatch] = useReducer(reducer, undefined, () => initial ?? loadState(validProductIds));
  useEffect(() => {
    saveState(state);
  }, [state.draft, state.items, state.location]); // eslint-disable-line react-hooks/exhaustive-deps
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore mora biti unutar StoreProvider');
  return ctx;
}
