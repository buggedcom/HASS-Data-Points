/**
 * Stable anomaly-detection failure codes shared with the backend.
 *
 * The backend never sends raw exception text; it sends one of these codes so
 * the UI can say *why* results are unavailable and never fall back to showing
 * zero anomalies.
 */
export type DetectionErrorCode =
  | "detection_timeout"
  | "detection_cancelled"
  | "detection_busy"
  | "detection_error";

/**
 * `last_scan_error` values: a detection code, or the sentinel persisted while
 * a scan runs after an unknown status (retained results not yet verified).
 */
export const SCAN_ERROR_UNVERIFIED = "unverified";
export type ScanErrorCode = DetectionErrorCode | typeof SCAN_ERROR_UNVERIFIED;

const KNOWN_CODES: ReadonlySet<string> = new Set<DetectionErrorCode>([
  "detection_timeout",
  "detection_cancelled",
  "detection_busy",
  "detection_error",
]);

/** A failed or superseded detection request, tagged with its stable code. */
export class DetectionRequestError extends Error {
  readonly code: DetectionErrorCode;

  constructor(code: DetectionErrorCode) {
    super(code);
    this.name = "DetectionRequestError";
    this.code = code;
  }
}

/**
 * Map any rejection (HA websocket error object, DetectionRequestError or a
 * transport failure) to a stable detection code.
 */
export function detectionErrorCode(err: unknown): DetectionErrorCode {
  const code =
    err && typeof err === "object" && "code" in err
      ? String((err as { code: unknown }).code)
      : "";
  return KNOWN_CODES.has(code)
    ? (code as DetectionErrorCode)
    : "detection_error";
}

/** Cancellation is the caller's own doing and is never shown as a failure. */
export function isDetectionCancelled(err: unknown): boolean {
  return detectionErrorCode(err) === "detection_cancelled";
}
