import type { ComponentTranslations } from "@/lib/i18n/types";

export const translations: ComponentTranslations = {
  Unverified: "Não verificado",
  Retry: "Tentar novamente",
  "Anomaly activity timed out.":
    "A atividade de anomalias excedeu o tempo limite.",
  "Anomaly detection is busy.": "A deteção de anomalias está ocupada.",
  "Anomaly activity was cancelled.": "A atividade de anomalias foi cancelada.",
  "Anomaly activity could not be loaded.":
    "Não foi possível carregar a atividade de anomalias.",
  "Anomaly details could not be loaded.":
    "Não foi possível carregar os detalhes das anomalias.",
  "Counts are from the last successful scan, {0}.":
    "As contagens são da última verificação bem-sucedida, {0}.",
  "No successful scan yet.": "Ainda não há nenhuma verificação bem-sucedida.",
  "Waiting for a scan with the current settings.":
    "A aguardar uma verificação com as definições atuais.",
  "The latest scan timed out.": "A última verificação excedeu o tempo limite.",
  "The latest scan was skipped because detection was busy.":
    "A última verificação foi ignorada porque a deteção estava ocupada.",
  "The latest scan was cancelled.": "A última verificação foi cancelada.",
  "The latest scan failed.": "A última verificação falhou.",
  "Showing the previous result for this range.":
    "A mostrar o resultado anterior para este intervalo.",
  "Activity for this range is unavailable.":
    "A atividade para este intervalo não está disponível.",
};
