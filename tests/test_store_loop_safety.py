"""Loop-safety tests for the DatapointsStore event accessors.

These guard the seam closed by issue #18: every event read must be an
awaitable that dispatches the blocking ``_EventDb`` call to the executor,
while the in-memory monitor reads stay synchronous.

The test harness runs executor jobs inline (see ``conftest.mock_store``), so
"runs on an executor thread" is not observable. We therefore assert the
*dispatch* — that the blocking method is handed to ``async_add_executor_job``
— rather than thread identity.
"""

from __future__ import annotations

import inspect


class DescribeEventAccessorDispatch:
    async def test_GIVEN_async_get_events_WHEN_awaited_THEN_dispatches_event_db_query_to_executor(
        self, mock_store
    ):
        store = mock_store
        spy = store._hass.async_add_executor_job

        await store.async_get_events(entity_ids=["sensor.a"], limit=5)

        spy.assert_awaited()
        # The dispatched callable is a functools.partial binding onto
        # _EventDb.query — assert on .func, not partial equality. (Bound
        # methods are fresh objects per attribute access, so compare by
        # value, which matches __func__ + __self__.)
        dispatched = spy.call_args.args[0]
        assert dispatched.func == store._event_db.query

    async def test_GIVEN_async_get_event_count_WHEN_awaited_THEN_dispatches_count_to_executor(
        self, mock_store
    ):
        store = mock_store
        spy = store._hass.async_add_executor_job

        await store.async_get_event_count()

        assert spy.call_args.args[0] == store._event_db.count


class DescribeEventAccessorsAreCoroutines:
    def test_GIVEN_six_named_event_accessors_WHEN_inspected_THEN_all_are_coroutine_functions(
        self, mock_store
    ):
        store = mock_store
        for name in (
            "async_get_events",
            "async_get_event_count",
            "async_get_last_event",
            "async_get_events_count_in_range",
            "async_get_automation_manual_counts",
            "async_get_event_bounds",
        ):
            accessor = getattr(store, name)
            assert inspect.iscoroutinefunction(accessor), (
                f"{name} must be a coroutine function"
            )

    def test_GIVEN_monitor_reads_WHEN_inspected_THEN_they_remain_synchronous(
        self, mock_store
    ):
        store = mock_store
        # Monitors are in-memory JSON reads and must NOT become coroutines —
        # this guards against an over-broad get_* → async sweep.
        assert not inspect.iscoroutinefunction(store.get_monitors)
        assert not inspect.iscoroutinefunction(store.get_monitor)
