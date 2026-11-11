import type { HassLike } from "@/lib/types";

/**
 * Tracks in-flight cancellable requests and provides helpers to cancel them.
 *
 * A "slot key" identifies a logical request slot (e.g. entity + time range).
 * Before sending a new request for the same slot, call cancelPending() to abort
 * any previous request still running on the backend.
 */

const inFlightRequests = new Map<string, string>();

export function trackRequest(slotKey: string, requestId: string): void {
  inFlightRequests.set(slotKey, requestId);
}

export async function cancelPending(
  hass: Pick<HassLike, "connection">,
  slotKey: string
): Promise<void> {
  const prevId = inFlightRequests.get(slotKey);
  if (prevId) {
    inFlightRequests.delete(slotKey);
    await hass.connection.sendMessagePromise({
      type: "hass_datapoints/cancel",
      request_id: prevId,
    });
  }
}

export function clearRequest(slotKey: string): void {
  inFlightRequests.delete(slotKey);
}

export function createRequestId(): string {
  const cryptoApi = globalThis.crypto;
  if (typeof cryptoApi?.randomUUID === "function") {
    return cryptoApi.randomUUID();
  }

  if (typeof cryptoApi?.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    cryptoApi.getRandomValues(bytes);
    bytes[6] = (bytes[6] % 16) + 64;
    bytes[8] = (bytes[8] % 64) + 128;
    const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0"));
    return [
      hex.slice(0, 4).join(""),
      hex.slice(4, 6).join(""),
      hex.slice(6, 8).join(""),
      hex.slice(8, 10).join(""),
      hex.slice(10, 16).join(""),
    ].join("-");
  }

  return `req-${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}`;
}

// ---------------------------------------------------------------------------
// Owned request slots
// ---------------------------------------------------------------------------

/**
 * One cancellable request issued by an owner slot.
 *
 * A slot identifies *who* is asking and *for what purpose* (component
 * instance + purpose + series/monitor + comparison window), never the range
 * or config being asked for: those are a new generation within the same
 * slot. Starting a new generation cancels the previous one on the backend,
 * so replacing a chart's range cancels only that series' old request, never
 * another chart's or another series'.
 */
export interface OwnedRequest {
  readonly requestId: string;
  /** True while this generation is still the slot's latest request. */
  isCurrent(): boolean;
  /** Forget this generation if it is still current (call on completion). */
  release(): void;
}

const ownedSlots = new Map<string, string>();
let ownerSequence = 0;

/** A unique owner id for one component instance (prefix every slot with it). */
export function createRequestOwnerId(kind: string): string {
  ownerSequence += 1;
  return `${kind}#${ownerSequence}`;
}

/** Build an owner slot key: owner id, then purpose/series/window parts. */
export function ownerSlot(
  ownerId: string,
  ...parts: Array<string | number>
): string {
  return [ownerId, ...parts].join(":");
}

/** Ask the backend to cancel one request on this connection (fire and forget). */
export function sendCancelRequest(
  hass: Pick<HassLike, "connection">,
  requestId: string
): void {
  hass.connection
    .sendMessagePromise({
      type: "hass_datapoints/cancel",
      request_id: requestId,
    })
    .catch(() => {
      // The request may already have finished, or the socket closed.
    });
}

/**
 * Start a new generation in ``slotKey``, cancelling the previous generation
 * (if any) on the backend.
 */
export function beginOwnedRequest(
  hass: Pick<HassLike, "connection">,
  slotKey: string
): OwnedRequest {
  const previous = ownedSlots.get(slotKey);
  if (previous) {
    sendCancelRequest(hass, previous);
  }
  const requestId = createRequestId();
  ownedSlots.set(slotKey, requestId);
  return {
    requestId,
    isCurrent: () => ownedSlots.get(slotKey) === requestId,
    release: () => {
      if (ownedSlots.get(slotKey) === requestId) {
        ownedSlots.delete(slotKey);
      }
    },
  };
}

/** Cancel every in-flight generation whose slot starts with ``ownerId``. */
export function cancelOwnedRequests(
  hass: Nullable<Pick<HassLike, "connection">>,
  ownerId: string
): void {
  const prefix = `${ownerId}:`;
  for (const [slotKey, requestId] of [...ownedSlots]) {
    if (slotKey.startsWith(prefix)) {
      ownedSlots.delete(slotKey);
      if (hass) {
        sendCancelRequest(hass, requestId);
      }
    }
  }
}
