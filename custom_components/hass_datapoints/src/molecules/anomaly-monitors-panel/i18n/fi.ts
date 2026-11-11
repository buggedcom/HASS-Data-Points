import type { ComponentTranslations } from "@/lib/i18n/types";

export const translations: ComponentTranslations = {
  Unverified: "Vahvistamaton",
  Retry: "Yritä uudelleen",
  "Anomaly activity timed out.":
    "Poikkeama-aktiivisuuden haku aikakatkaistiin.",
  "Anomaly detection is busy.": "Poikkeamien tunnistus on varattu.",
  "Anomaly activity was cancelled.": "Poikkeama-aktiivisuuden haku peruttiin.",
  "Anomaly activity could not be loaded.":
    "Poikkeama-aktiivisuutta ei voitu ladata.",
  "Anomaly details could not be loaded.":
    "Poikkeamien tietoja ei voitu ladata.",
  "Counts are from the last successful scan, {0}.":
    "Määrät ovat viimeisimmästä onnistuneesta tarkistuksesta, {0}.",
  "No successful scan yet.": "Onnistunutta tarkistusta ei ole vielä tehty.",
  "Waiting for a scan with the current settings.":
    "Odotetaan tarkistusta nykyisillä asetuksilla.",
  "The latest scan timed out.": "Viimeisin tarkistus aikakatkaistiin.",
  "The latest scan was skipped because detection was busy.":
    "Viimeisin tarkistus ohitettiin, koska tunnistus oli varattu.",
  "The latest scan was cancelled.": "Viimeisin tarkistus peruttiin.",
  "The latest scan failed.": "Viimeisin tarkistus epäonnistui.",
  "Showing the previous result for this range.":
    "Näytetään tämän aikavälin edellinen tulos.",
  "Activity for this range is unavailable.":
    "Tämän aikavälin aktiivisuus ei ole saatavilla.",
};
