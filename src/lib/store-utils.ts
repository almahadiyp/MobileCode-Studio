import { useSyncExternalStore, useRef } from 'react';

type SetState<T> = (partial: Partial<T> | ((prev: T) => Partial<T>)) => void;
type GetState<T> = () => T;
type Subscribe = (listener: () => void) => () => void;

export interface Store<T> {
  getState: GetState<T>;
  setState: SetState<T>;
  subscribe: Subscribe;
}

export function create<T extends object>(
  initializer: (set: SetState<T>, get: GetState<T>) => T,
): Store<T> & {
  (selector?: (state: T) => T): T;
  setState: SetState<T>;
  getState: GetState<T>;
  subscribe: Subscribe;
  useShallow: <U extends object>(selector: (state: T) => U) => U;
} {
  let state: T;
  const listeners = new Set<() => void>();

  const setState: SetState<T> = (partial) => {
    const next = typeof partial === 'function' ? (partial as (p: T) => Partial<T>)(state) : partial;
    state = { ...state, ...next };
    listeners.forEach((l) => l());
  };

  const getState: GetState<T> = () => state;
  const subscribe: Subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  state = initializer(setState, getState);

  const hook = <U,>(selector?: (state: T) => U): U | T => {
    const sel = selector ?? ((s: T) => s as unknown as U);
    return useSyncExternalStore(
      subscribe,
      () => sel(getState()),
      () => sel(getState()),
    ) as U;
  };

  function useShallow<U extends object>(selector: (state: T) => U): U {
    const prev = useRef<U | undefined>(undefined);
    return useSyncExternalStore(
      subscribe,
      () => {
        const next = selector(getState());
        if (prev.current && shallowEqual(prev.current, next)) return prev.current;
        prev.current = next;
        return next;
      },
      () => selector(getState()),
    );
  }

  (hook as any).getState = getState;
  (hook as any).setState = setState;
  (hook as any).subscribe = subscribe;
  (hook as any).useShallow = useShallow;
  return hook as any;
}

function shallowEqual(a: object, b: object): boolean {
  if (Object.is(a, b)) return true;
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (const k of ka) {
    if (!(k in b) || !Object.is((a as any)[k], (b as any)[k])) return false;
  }
  return true;
}
