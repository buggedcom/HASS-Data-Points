import type { ComponentTranslations } from "@/lib/i18n/types";

export const translations: ComponentTranslations = {
  Unverified: "Sin verificar",
  Retry: "Reintentar",
  "Anomaly activity timed out.":
    "Se agotó el tiempo de la actividad de anomalías.",
  "Anomaly detection is busy.": "La detección de anomalías está ocupada.",
  "Anomaly activity was cancelled.": "Se canceló la actividad de anomalías.",
  "Anomaly activity could not be loaded.":
    "No se pudo cargar la actividad de anomalías.",
  "Anomaly details could not be loaded.":
    "No se pudieron cargar los detalles de las anomalías.",
  "Counts are from the last successful scan, {0}.":
    "Los recuentos son del último análisis correcto, {0}.",
  "No successful scan yet.": "Todavía no hay ningún análisis correcto.",
  "Waiting for a scan with the current settings.":
    "Esperando un análisis con la configuración actual.",
  "The latest scan timed out.": "Se agotó el tiempo del último análisis.",
  "The latest scan was skipped because detection was busy.":
    "Se omitió el último análisis porque la detección estaba ocupada.",
  "The latest scan was cancelled.": "Se canceló el último análisis.",
  "The latest scan failed.": "El último análisis falló.",
  "Showing the previous result for this range.":
    "Se muestra el resultado anterior para este intervalo.",
  "Activity for this range is unavailable.":
    "La actividad de este intervalo no está disponible.",
};
