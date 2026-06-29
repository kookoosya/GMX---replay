/** Mock localStorage for referral pending tests. */
import {
  REF_PENDING_STORAGE_KEY,
  createPendingRecord,
  parsePendingRecord,
  serializePending,
} from "../../tools/lib/referral-pending-core.mjs";

export function createMockPendingStorage(seed = {}) {
  const data = new Map(Object.entries(seed));
  return {
    lsGet(key, fallback = "") {
      return data.has(key) ? data.get(key) : fallback;
    },
    lsSet(key, value) {
      if (value === undefined || value === null || value === "") data.delete(key);
      else data.set(key, String(value));
    },
    lsRemove(key) {
      data.delete(key);
    },
    dump() {
      return new Map(data);
    },
  };
}

export function createPendingAdapter(storage, overrides = {}) {
  const ls = storage || createMockPendingStorage();
  const key = overrides.storageKey || REF_PENDING_STORAGE_KEY;
  return {
    storageKey: key,
    readRaw: () => ls.lsGet(key, ""),
    readPending: (now) => parsePendingRecord(ls.lsGet(key, ""), now),
    writePending: (record) => {
      if (!record) ls.lsRemove(key);
      else ls.lsSet(key, serializePending(record));
    },
    clearPending: () => ls.lsRemove(key),
    ls,
  };
}

export function seedPending(code, now, ttlMs) {
  const record = createPendingRecord(code, { now, ttlMs });
  const storage = createMockPendingStorage({
    [REF_PENDING_STORAGE_KEY]: serializePending(record),
  });
  return { storage, record };
}
