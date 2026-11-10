"""Discoverable Data Points tools for Home Assistant's administrative LLM API."""

from __future__ import annotations

from typing import TYPE_CHECKING

from homeassistant.core import HomeAssistant, callback

from .const import DOMAIN, KEY_STORE

if TYPE_CHECKING:
    from homeassistant.components.llm import LLMTools
    from homeassistant.helpers.llm import LLMContext


@callback
def async_get_tools(
    hass: HomeAssistant, llm_context: LLMContext, api_id: str
) -> LLMTools | None:
    """Contribute only to the HA 2026.11+ administrator tool set.

    Lazy imports keep the optional platform inert on older HA releases, which
    do not request the homeassistant API, and avoid exposing unrestricted data
    through Assist's exposed-entity boundary.
    """
    if api_id != "homeassistant" or KEY_STORE not in hass.data.get(DOMAIN, {}):
        return None
    from homeassistant.components.llm import LLMTools  # noqa: PLC0415

    from .llm_tools import create_tools  # noqa: PLC0415

    return LLMTools(
        tools=create_tools(),
        prompt=(
            "Use hass_datapoints tools for chart history analysis, trends, rate, "
            "comparison deltas, thresholds, anomalies, calendar aggregates and annotations. "
            "analyze_chart accepts per-entity settings and explicit comparison windows; "
            "aggregate_entity handles measurement, binary state, event and meter data. "
            "Use the user's AI query brief for the current chart context; these tools "
            "cannot see a browser's selected range. Times must include a timezone. "
            "Results include pagination and scan timestamps; missing data is not zero. "
            "record creates an annotation only when the user requests it."
        ),
    )
