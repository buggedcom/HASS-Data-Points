import type { ComponentTranslations } from "@/lib/i18n/types";

export const translations: ComponentTranslations = {
  Unverified: "Unbestätigt",
  Retry: "Erneut versuchen",
  "Anomaly activity timed out.":
    "Die Anomalieaktivität hat das Zeitlimit überschritten.",
  "Anomaly detection is busy.": "Die Anomalieerkennung ist ausgelastet.",
  "Anomaly activity was cancelled.": "Die Anomalieaktivität wurde abgebrochen.",
  "Anomaly activity could not be loaded.":
    "Die Anomalieaktivität konnte nicht geladen werden.",
  "Anomaly details could not be loaded.":
    "Anomaliedetails konnten nicht geladen werden.",
  "Counts are from the last successful scan, {0}.":
    "Die Zahlen stammen aus dem letzten erfolgreichen Scan, {0}.",
  "No successful scan yet.": "Noch kein erfolgreicher Scan.",
  "Waiting for a scan with the current settings.":
    "Warte auf einen Scan mit den aktuellen Einstellungen.",
  "The latest scan timed out.":
    "Der letzte Scan hat das Zeitlimit überschritten.",
  "The latest scan was skipped because detection was busy.":
    "Der letzte Scan wurde übersprungen, weil die Erkennung ausgelastet war.",
  "The latest scan was cancelled.": "Der letzte Scan wurde abgebrochen.",
  "The latest scan failed.": "Der letzte Scan ist fehlgeschlagen.",
  "Showing the previous result for this range.":
    "Es wird das vorherige Ergebnis für diesen Zeitraum angezeigt.",
  "Activity for this range is unavailable.":
    "Die Aktivität für diesen Zeitraum ist nicht verfügbar.",
};
