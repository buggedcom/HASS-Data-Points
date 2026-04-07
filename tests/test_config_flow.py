"""Tests for custom_components.hass_datapoints.config_flow."""
from __future__ import annotations

import pytest

from custom_components.hass_datapoints.config_flow import DatapointsConfigFlow


# ---------------------------------------------------------------------------
# DatapointsConfigFlow.async_step_user
# ---------------------------------------------------------------------------

class DescribeAsyncStepUser:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.flow = DatapointsConfigFlow()

    async def test_GIVEN_no_user_input_WHEN_step_called_THEN_returns_form(self):
        result = await self.flow.async_step_user(user_input=None)
        assert result["type"] == "form"

    async def test_GIVEN_no_user_input_WHEN_step_called_THEN_form_step_id_is_user(self):
        result = await self.flow.async_step_user(user_input=None)
        assert result["step_id"] == "user"

    async def test_GIVEN_user_input_provided_WHEN_step_called_THEN_creates_entry(self):
        result = await self.flow.async_step_user(user_input={})
        assert result["type"] == "create_entry"

    async def test_GIVEN_user_input_provided_WHEN_step_called_THEN_title_is_hass_data_points(self):
        result = await self.flow.async_step_user(user_input={})
        assert result["title"] == "Hass Data Points"

    async def test_GIVEN_user_input_provided_WHEN_step_called_THEN_data_is_empty(self):
        result = await self.flow.async_step_user(user_input={})
        assert result["data"] == {}

    async def test_GIVEN_flow_created_WHEN_step_called_THEN_sets_unique_id_to_domain(self):
        from custom_components.hass_datapoints.const import DOMAIN
        await self.flow.async_step_user(user_input=None)
        assert self.flow._unique_id == DOMAIN
