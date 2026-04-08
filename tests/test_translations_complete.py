"""
test_translations_complete.py

Ensures that every backend locale translation file in
custom_components/hass_datapoints/translations/ is:

  1. Present for every supported non-English locale.
  2. Structurally complete — every leaf key present in en.json also exists in
     the locale file, and there are no stale extra keys.
  3. Meaningfully translated — no leaf value is identical to the English
     source value, unless the path is listed in BACKEND_WHITELIST.

WHITELIST POLICY
────────────────
Add a dot-separated leaf path to BACKEND_WHITELIST when its translated value
is intentionally identical to English in one or more target locales.  Each
entry must have an inline comment explaining why:

  • Proper nouns / product names  ("Datapoints")
  • Technical terms used as loan-words  ("MDI icon name.")
  • Words that are spelled identically in a specific language
    (French: "Message", "Annotation"; Spanish: "Color")

Paths not in the whitelist that evaluate to the same string as English will
cause this test to fail, prompting a human to either translate the string or
consciously acknowledge it belongs in the whitelist.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

# ── Configuration ─────────────────────────────────────────────────────────────

TRANSLATIONS_DIR = (
    Path(__file__).parent.parent
    / "custom_components"
    / "hass_datapoints"
    / "translations"
)

# Canonical locale list — read from the same JSON file consumed by localize.ts
# so adding a new locale there automatically covers the backend tests too.
_LOCALES_JSON = (
    Path(__file__).parent.parent
    / "custom_components"
    / "hass_datapoints"
    / "src"
    / "lib"
    / "i18n"
    / "supported-locales.json"
)
with _LOCALES_JSON.open(encoding="utf-8") as _fh:
    NON_ENGLISH_LOCALES: list[str] = json.load(_fh)

# Dot-separated leaf paths whose value is intentionally identical to English.
BACKEND_WHITELIST: frozenset[str] = frozenset(
    {
        # "Datapoints" is the product name — identical across all locales.
        "config.step.user.title",
        # French: "message" and "annotation" are unchanged loan words.
        "services.record.fields.message.name",
        "services.record.fields.annotation.name",
        # Spanish: "color" is spelled identically in Spanish.
        "services.record.fields.color.name",
    }
)


# ── Helpers ───────────────────────────────────────────────────────────────────


def _leaf_paths(obj: object, prefix: str = "") -> dict[str, str]:
    """Recursively collect every leaf string in *obj* as {dot.path: value}."""
    result: dict[str, str] = {}
    if isinstance(obj, dict):
        for key, value in obj.items():
            full = f"{prefix}.{key}" if prefix else key
            result.update(_leaf_paths(value, full))
    elif isinstance(obj, str):
        result[prefix] = obj
    return result


def _load(locale: str) -> dict[str, str]:
    path = TRANSLATIONS_DIR / f"{locale}.json"
    with path.open(encoding="utf-8") as fh:
        return _leaf_paths(json.load(fh))


# ── Tests ─────────────────────────────────────────────────────────────────────


class DescribeBackendTranslations:
    """Backend HA translation JSON completeness and accuracy tests."""

    # ── 1. File presence ──────────────────────────────────────────────────────

    def test_GIVEN_translations_dir_WHEN_checked_THEN_english_reference_exists(self):
        assert (TRANSLATIONS_DIR / "en.json").exists(), (
            "Missing English reference: translations/en.json"
        )

    @pytest.mark.parametrize("locale", NON_ENGLISH_LOCALES)
    def test_GIVEN_locale_WHEN_checked_THEN_translation_file_exists(self, locale: str):
        path = TRANSLATIONS_DIR / f"{locale}.json"
        assert path.exists(), (
            f"Missing translation file: translations/{locale}.json"
        )

    # ── 2. Structural completeness ────────────────────────────────────────────

    @pytest.mark.parametrize("locale", NON_ENGLISH_LOCALES)
    def test_GIVEN_english_reference_WHEN_locale_checked_THEN_no_missing_keys(
        self, locale: str
    ):
        en = _load("en")
        loc = _load(locale)
        missing = sorted(set(en) - set(loc))
        assert not missing, (
            f"Locale '{locale}' is missing {len(missing)} key(s):\n"
            + "\n".join(f"  {k}" for k in missing)
        )

    @pytest.mark.parametrize("locale", NON_ENGLISH_LOCALES)
    def test_GIVEN_english_reference_WHEN_locale_checked_THEN_no_stale_extra_keys(
        self, locale: str
    ):
        en = _load("en")
        loc = _load(locale)
        extra = sorted(set(loc) - set(en))
        assert not extra, (
            f"Locale '{locale}' has {len(extra)} stale key(s) not present in en.json.\n"
            "Remove them or add the corresponding key to en.json:\n"
            + "\n".join(f"  {k}" for k in extra)
        )

    # ── 3. Translation completeness ───────────────────────────────────────────

    @pytest.mark.parametrize("locale", NON_ENGLISH_LOCALES)
    def test_GIVEN_locale_WHEN_values_checked_THEN_no_strings_identical_to_english(
        self, locale: str
    ):
        en = _load("en")
        loc = _load(locale)

        untranslated = sorted(
            path
            for path, en_value in en.items()
            if path not in BACKEND_WHITELIST
            and loc.get(path) == en_value
        )

        assert not untranslated, (
            f"Locale '{locale}' has {len(untranslated)} value(s) identical to English.\n"
            "Either translate these strings or add their paths to BACKEND_WHITELIST "
            "with a justification comment:\n"
            + "\n".join(f"  {p!r}: {en[p]!r}" for p in untranslated)
        )
