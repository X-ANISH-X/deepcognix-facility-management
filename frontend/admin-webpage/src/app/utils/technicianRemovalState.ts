const TECHNICIAN_REMOVAL_STORAGE_KEY = 'admin-technician-removal-state-v1';
const DISABLE_WINDOW_MS = 24 * 60 * 60 * 1000;

type TechnicianRemovalStore = {
  disabledAtById: Record<string, string>;
  removedAtById: Record<string, string>;
};

export type TechnicianRemovalSnapshot = {
  disabledIds: Set<string>;
  removedIds: Set<string>;
  remainingMsById: Record<string, number>;
};

function getFallbackStore(): TechnicianRemovalStore {
  return {
    disabledAtById: {},
    removedAtById: {},
  };
}

function readStore(): TechnicianRemovalStore {
  if (typeof window === 'undefined') {
    return getFallbackStore();
  }

  try {
    const raw = window.localStorage.getItem(TECHNICIAN_REMOVAL_STORAGE_KEY);
    if (!raw) {
      return getFallbackStore();
    }

    const parsed = JSON.parse(raw) as Partial<TechnicianRemovalStore>;
    const disabledAtById = typeof parsed.disabledAtById === 'object' && parsed.disabledAtById
      ? Object.entries(parsed.disabledAtById)
        .filter(([id, ts]) => typeof id === 'string' && typeof ts === 'string')
        .reduce<Record<string, string>>((acc, [id, ts]) => {
          acc[id] = ts;
          return acc;
        }, {})
      : {};
    const removedAtById = typeof parsed.removedAtById === 'object' && parsed.removedAtById
      ? Object.entries(parsed.removedAtById)
        .filter(([id, ts]) => typeof id === 'string' && typeof ts === 'string')
        .reduce<Record<string, string>>((acc, [id, ts]) => {
          acc[id] = ts;
          return acc;
        }, {})
      : {};

    return { disabledAtById, removedAtById };
  } catch {
    return getFallbackStore();
  }
}

function writeStore(store: TechnicianRemovalStore): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(TECHNICIAN_REMOVAL_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Ignore storage errors and continue with in-memory state only.
  }
}

function normalizeStore(nowMs = Date.now()): TechnicianRemovalStore {
  const store = readStore();
  let changed = false;

  Object.entries(store.disabledAtById).forEach(([id, iso]) => {
    const disabledAtMs = new Date(iso).getTime();
    if (!Number.isFinite(disabledAtMs)) {
      delete store.disabledAtById[id];
      changed = true;
      return;
    }

    if (nowMs - disabledAtMs >= DISABLE_WINDOW_MS) {
      store.removedAtById[id] = new Date(disabledAtMs + DISABLE_WINDOW_MS).toISOString();
      delete store.disabledAtById[id];
      changed = true;
    }
  });

  if (changed) {
    writeStore(store);
  }

  return store;
}

export function getTechnicianRemovalSnapshot(nowMs = Date.now()): TechnicianRemovalSnapshot {
  const store = normalizeStore(nowMs);
  const disabledIds = new Set(Object.keys(store.disabledAtById));
  const removedIds = new Set(Object.keys(store.removedAtById));
  const remainingMsById: Record<string, number> = {};

  Object.entries(store.disabledAtById).forEach(([id, iso]) => {
    const disabledAtMs = new Date(iso).getTime();
    if (!Number.isFinite(disabledAtMs)) {
      return;
    }

    remainingMsById[id] = Math.max(0, DISABLE_WINDOW_MS - (nowMs - disabledAtMs));
  });

  return { disabledIds, removedIds, remainingMsById };
}

export function disableTechnicianForRemoval(technicianId: string, nowMs = Date.now()): TechnicianRemovalSnapshot {
  const store = normalizeStore(nowMs);
  store.disabledAtById[technicianId] = new Date(nowMs).toISOString();
  delete store.removedAtById[technicianId];
  writeStore(store);
  return getTechnicianRemovalSnapshot(nowMs);
}

export function reinstateTechnician(technicianId: string, nowMs = Date.now()): TechnicianRemovalSnapshot {
  const store = normalizeStore(nowMs);
  delete store.disabledAtById[technicianId];
  writeStore(store);
  return getTechnicianRemovalSnapshot(nowMs);
}

export function formatRemainingDisableTime(remainingMs: number): string {
  if (remainingMs <= 0) {
    return 'less than a minute';
  }

  const totalMinutes = Math.ceil(remainingMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) {
    return `${minutes}m`;
  }

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
}
