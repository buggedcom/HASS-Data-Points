"""Shared fixtures and sys.modules stubs for hass_datapoints tests.

Neither homeassistant nor voluptuous/sqlalchemy are installed in the test
environment.  We stub every top-level import that the package's __init__.py
(and its transitive imports) pulls in, so individual sub-modules
(anomaly_detection, anomaly_cache, history_utils, store) can be imported
and tested in isolation.
"""
from __future__ import annotations

import sys
from unittest.mock import AsyncMock, MagicMock

import pytest


# ---------------------------------------------------------------------------
# Stub out third-party / HA modules before pytest collects any test file.
# Python executes custom_components/hass_datapoints/__init__.py whenever any
# sub-module is imported, so every module-level import there must be covered.
# ---------------------------------------------------------------------------

def _stub(name: str, obj: object | None = None) -> None:
    """Insert *obj* (or a fresh MagicMock) into sys.modules under *name*."""
    if name not in sys.modules:
        sys.modules[name] = obj if obj is not None else MagicMock()


# -- voluptuous ---------------------------------------------------------------
_vol = MagicMock()
_vol.Schema = MagicMock(return_value=MagicMock())
_vol.Required = MagicMock(return_value="required")
_vol.Optional = MagicMock(return_value="optional")
_vol.All = MagicMock(return_value=MagicMock())
_vol.Any = MagicMock(return_value=MagicMock())
_vol.Coerce = MagicMock(return_value=MagicMock())
_vol.Length = MagicMock(return_value=MagicMock())
_stub("voluptuous", _vol)

# -- sqlalchemy ---------------------------------------------------------------
_sa = MagicMock()
_sa.inspect = MagicMock()
_sa.text = MagicMock()
_stub("sqlalchemy", _sa)

# -- homeassistant core -------------------------------------------------------
_ha_core = MagicMock()
_ha_core.HomeAssistant = MagicMock
_ha_core.ServiceCall = MagicMock
_ha_core.callback = lambda f: f  # passthrough decorator
_stub("homeassistant", MagicMock())
_stub("homeassistant.core", _ha_core)

# -- homeassistant.config_entries ---------------------------------------------
_ha_ce = MagicMock()
_ha_ce.ConfigEntry = MagicMock
_stub("homeassistant.config_entries", _ha_ce)

# -- homeassistant.helpers ----------------------------------------------------
_ha_helpers = MagicMock()
_stub("homeassistant.helpers", _ha_helpers)

_ha_cv = MagicMock()
_ha_cv.string = MagicMock()
_ha_cv.boolean = MagicMock()
_ha_cv.entity_id = MagicMock()
_ha_cv.ensure_list = MagicMock()
_stub("homeassistant.helpers.config_validation", _ha_cv)

class _FakeStore:
    """Minimal stub for homeassistant.helpers.storage.Store."""
    def __init__(self, *args, **kwargs) -> None:
        pass

_ha_storage = MagicMock()
_ha_storage.Store = _FakeStore
_stub("homeassistant.helpers.storage", _ha_storage)

_ha_recorder_helper = MagicMock()
_stub("homeassistant.helpers.recorder", _ha_recorder_helper)

# -- homeassistant.components -------------------------------------------------
_ha_components = MagicMock()
_stub("homeassistant.components", _ha_components)

_stub("homeassistant.components.frontend", MagicMock())
_stub("homeassistant.components.panel_custom", MagicMock())
_stub("homeassistant.components.http", MagicMock())
_stub("homeassistant.components.websocket_api", MagicMock())
_stub("homeassistant.components.recorder", MagicMock())
_stub("homeassistant.components.recorder.history", MagicMock())
_stub("homeassistant.components.recorder.statistics", MagicMock())


# ---------------------------------------------------------------------------
# Reusable store fixture
# ---------------------------------------------------------------------------

@pytest.fixture()
def mock_store():
    """Return a HassRecordsStore backed by a fully async-mock Store."""
    from custom_components.hass_datapoints.store import HassRecordsStore  # noqa: PLC0415

    store = HassRecordsStore(MagicMock())

    inner = MagicMock()
    inner.async_load = AsyncMock(return_value=None)
    inner.async_save = AsyncMock(return_value=None)
    store._store = inner

    return store
