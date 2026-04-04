import { configureLocalization, localized, msg } from "@lit/localize";

const { getLocale, setLocale } = configureLocalization({
  sourceLocale: "en",
  targetLocales: ["fi"],
  loadLocale: async (locale) => {
    if (locale === "fi") {
      return import("./locales/fi");
    }

    throw new Error(`Unsupported locale "${locale}"`);
  },
});

function normalizeLocale(locale: string | null | undefined): string {
  const normalizedLocale = (locale ?? "")
    .trim()
    .replaceAll("_", "-")
    .toLowerCase();

  if (!normalizedLocale) {
    return "en";
  }

  if (normalizedLocale === "fi" || normalizedLocale.startsWith("fi-")) {
    return "fi";
  }

  return "en";
}

export async function setFrontendLocale(
  locale: string | null | undefined
): Promise<string> {
  const nextLocale = normalizeLocale(locale);

  if (getLocale() !== nextLocale) {
    await setLocale(nextLocale);
  }

  return nextLocale;
}

export async function syncFrontendLocale(
  hass?: { language?: string } | null
): Promise<string> {
  return setFrontendLocale(hass?.language);
}

export function localizeText(message: string): string {
  return msg(message, { id: message });
}

export { getLocale, localized, msg };
