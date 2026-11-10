/**
 * URL state for which page of the Datapoints panel is showing: the history
 * chart (default, no param) or the anomaly monitors page (`view=monitors`).
 *
 * Kept in its own query param so browser back/forward moves between the two
 * pages. The history page's own URL writer only touches the params it owns, so
 * `view` survives range/target updates made while the monitors page is open.
 */

export const PAGE_VIEW_PARAM = "view";

export type DatapointsPageView = "history" | "monitors";

/** Read the current page view from a URL (defaults to the current location). */
export function readPageViewFromUrl(
  href: string = window.location.href
): DatapointsPageView {
  try {
    return new URL(href).searchParams.get(PAGE_VIEW_PARAM) === "monitors"
      ? "monitors"
      : "history";
  } catch {
    return "history";
  }
}

/** Return *href* with the page view param set (or removed for "history"). */
export function withPageView(href: string, view: DatapointsPageView): string {
  const url = new URL(href);
  if (view === "monitors") {
    url.searchParams.set(PAGE_VIEW_PARAM, "monitors");
  } else {
    url.searchParams.delete(PAGE_VIEW_PARAM);
  }
  return `${url.pathname}${url.search}${url.hash}`;
}

/**
 * Write the page view into the browser URL. `push` adds a history entry so the
 * browser back button returns to the previous page; otherwise it replaces.
 * No-op when the URL already reflects *view*.
 */
export function writePageViewToUrl(
  view: DatapointsPageView,
  { push = false }: { push?: boolean } = {}
): void {
  if (readPageViewFromUrl() === view) {
    return;
  }
  const next = withPageView(window.location.href, view);
  if (push) {
    window.history.pushState(null, "", next);
  } else {
    window.history.replaceState(null, "", next);
  }
}
