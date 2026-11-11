import type { ComponentTranslations } from "@/lib/i18n/types";

export const translations: ComponentTranslations = {
  Unverified: "Non vérifié",
  Retry: "Réessayer",
  "Anomaly activity timed out.": "L’activité des anomalies a expiré.",
  "Anomaly detection is busy.": "La détection d’anomalies est occupée.",
  "Anomaly activity was cancelled.": "L’activité des anomalies a été annulée.",
  "Anomaly activity could not be loaded.":
    "Impossible de charger l’activité des anomalies.",
  "Anomaly details could not be loaded.":
    "Impossible de charger le détail des anomalies.",
  "Counts are from the last successful scan, {0}.":
    "Les chiffres proviennent de la dernière analyse réussie, {0}.",
  "No successful scan yet.": "Aucune analyse réussie pour l’instant.",
  "Waiting for a scan with the current settings.":
    "En attente d’une analyse avec les paramètres actuels.",
  "The latest scan timed out.": "La dernière analyse a expiré.",
  "The latest scan was skipped because detection was busy.":
    "La dernière analyse a été ignorée car la détection était occupée.",
  "The latest scan was cancelled.": "La dernière analyse a été annulée.",
  "The latest scan failed.": "La dernière analyse a échoué.",
  "Showing the previous result for this range.":
    "Affichage du résultat précédent pour cette période.",
  "Activity for this range is unavailable.":
    "L’activité pour cette période n’est pas disponible.",
};
