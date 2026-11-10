import type { ComponentTranslations } from "@/lib/i18n/types";

export const translations: ComponentTranslations = {
  Name: "Nimi",
  "e.g. Heating season start": "esim. Lämmityskausi alkaa",
  "Date range": "Päiväväli",
  Start: "Alku",
  End: "Loppu",
  "Use previous range": "Käytä edellistä aluetta",
  "Use next range": "Käytä seuraavaa aluetta",
  "Delete date window": "Poista aikaikkuna",
  "Enter a name for this date window.": "Anna tälle aikaikkunalle nimi.",
  "The start date must be before the end date.":
    "Alkupäivän on oltava ennen loppupäivää.",
  Cancel: "Peruuta",
  "A date window saves a date range as a tab, either fixed dates or a period relative to the selected range, so you can preview it against the selected range or jump the chart to it.":
    "Aikaikkuna tallentaa päivävälin välilehdeksi, joko kiinteinä päivinä tai valittuun alueeseen suhteutettuna jaksona, jotta voit verrata sitä valittuun alueeseen tai siirtää kaavion siihen.",
  Type: "Tyyppi",
  "Fixed dates": "Kiinteät päivät",
  "Relative to selected range": "Suhteessa valittuun alueeseen",
  Period: "Jakso",
  Currently: "Nyt",
  "No data yet for this period while the chart is up to date.":
    "Tälle jaksolle ei ole vielä tietoja, kun kaavio on ajan tasalla.",
  "The window always has the same length as the selected range and moves with it.":
    "Ikkuna on aina yhtä pitkä kuin valittu alue ja liikkuu sen mukana.",
};
