import type { LocaleModule } from "@lit/localize";

export const templates = {
  "Loading Datapoints…": "Ladataan Datapoints…",
  Datapoints: "Datapoints",
  "Page options": "Sivun asetukset",
  "Download spreadsheet": "Lataa taulukko",
  "Save page state": "Tallenna sivun tila",
  "Restore saved page": "Palauta tallennettu sivu",
  "Clear saved page": "Tyhjennä tallennettu sivu",
  "Expand targets sidebar": "Laajenna kohteiden sivupalkki",
  "Collapse targets sidebar": "Kutista kohteiden sivupalkki",
  "Toggle sidebar": "Vaihda sivupalkki",
  Start: "Alku",
  End: "Loppu",
  "Select date range": "Valitse aikaväli",
  "Timeline options": "Aikajanan asetukset",
  "Zoom level": "Zoomaustaso",
  "Date snapping": "Päivän kohdistus",
  Auto: "Automaattinen",
  Hour: "Tunti",
  "Show anomalies": "Näytä poikkeamat",
  Sensitivity: "Herkkyys",
  "Use downsampled data for detection":
    "Käytä alasnäytteistettyä dataa havaitsemiseen",
  "Rate window": "Muutosikkuna",
  "Rolling window": "Liukuva ikkuna",
  "Min flat duration": "Pienin tasainen kesto",
  "Compare to window": "Vertaa ikkunaan",
  "— select window —": "— valitse ikkuna —",
  "When methods overlap": "Kun menetelmät menevät päällekkäin",
  Low: "Matala",
  Medium: "Keskitaso",
  High: "Korkea",
  "Trend deviation": "Trendipoikkeama",
  "Sudden change": "Äkillinen muutos",
  "Statistical outlier (IQR)": "Tilastollinen poikkeama (IQR)",
  "Rolling Z-score": "Liukuva Z-arvo",
  "Flat-line / stuck value": "Tasainen / jumittunut arvo",
  "Comparison window deviation": "Vertailuikkunan poikkeama",
  "Flags points that deviate significantly from a fitted trend line. Good for catching gradual drift or sudden jumps away from a steady baseline.":
    "Merkitsee pisteet, jotka poikkeavat selvästi sovitetusta trendiviivasta. Sopii asteittaisen ajautumisen tai äkillisten hyppyjen löytämiseen.",
  "Flags unusually fast rises or drops compared to the typical rate of change. Best for detecting spikes, crashes, or rapid transitions.":
    "Merkitsee poikkeuksellisen nopeat nousut ja laskut verrattuna tyypilliseen muutosnopeuteen. Paras piikkien ja romahdusten havaitsemiseen.",
  "Uses the interquartile range to flag values far outside the normal spread of data. Robust against outliers that skew averages.":
    "Käyttää interkvartiiliväliä arvojen merkitsemiseen, kun ne ovat kaukana normaalista vaihtelusta. Kestävä poikkeaville arvoille, jotka vääristävät keskiarvoja.",
  "Compares each value to a rolling mean and standard deviation. Catches unusual readings relative to recent context rather than the whole series.":
    "Vertaa jokaista arvoa liukuvaan keskiarvoon ja keskihajontaan. Löytää epätavalliset lukemat suhteessa tuoreeseen kontekstiin.",
  "Flags when a sensor reports nearly the same value for an unusually long time. Useful for detecting stuck sensors or frozen readings.":
    "Merkitsee tilanteet, joissa sensori raportoi lähes samaa arvoa poikkeuksellisen pitkään. Hyödyllinen jumittuneiden antureiden löytämiseen.",
  "Compares the current period to a reference date window. Highlights differences from an expected historical pattern, such as last week or the same day last year.":
    "Vertaa nykyistä jaksoa viiteajanjaksoon. Korostaa erot odotetusta historiallisesta mallista, kuten viime viikkoon tai samaan päivään viime vuonna.",
  "Show all anomalies": "Näytä kaikki poikkeamat",
  "Highlight overlaps": "Korosta päällekkäisyydet",
  "Overlaps only": "Vain päällekkäisyydet",
  "Computing…": "Lasketaan…",
} satisfies LocaleModule["templates"];
