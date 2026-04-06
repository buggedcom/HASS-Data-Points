import { vi } from "vitest";

/**
 * Creates a minimal mock of the Home Assistant `hass` object
 * for use in component tests.
 */
export function createMockHass(overrides: RecordWithUnknownValues = {}) {
  return {
    states: {
      "sensor.temperature": {
        entity_id: "sensor.temperature",
        state: "22.5",
        attributes: {
          friendly_name: "Temperature",
          icon: "mdi:thermometer",
          unit_of_measurement: "°C",
          device_class: "temperature",
        },
        last_changed: "2026-03-31T10:00:00Z",
        last_updated: "2026-03-31T10:00:00Z",
      },
      "sensor.humidity": {
        entity_id: "sensor.humidity",
        state: "55",
        attributes: {
          friendly_name: "Humidity",
          icon: "mdi:water-percent",
          unit_of_measurement: "%",
          device_class: "humidity",
        },
        last_changed: "2026-03-31T10:00:00Z",
        last_updated: "2026-03-31T10:00:00Z",
      },
      "binary_sensor.motion": {
        entity_id: "binary_sensor.motion",
        state: "off",
        attributes: {
          friendly_name: "Motion Sensor",
          icon: "mdi:motion-sensor",
          device_class: "motion",
        },
        last_changed: "2026-03-31T09:30:00Z",
        last_updated: "2026-03-31T09:30:00Z",
      },
    },
    entities: {
      "sensor.temperature": {
        entity_id: "sensor.temperature",
        device_id: "device_1",
        area_id: "area_1",
        labels: [],
      },
      "sensor.humidity": {
        entity_id: "sensor.humidity",
        device_id: "device_1",
        area_id: "area_1",
        labels: [],
      },
      "binary_sensor.motion": {
        entity_id: "binary_sensor.motion",
        device_id: "device_2",
        area_id: "area_2",
        labels: [],
      },
    },
    devices: {
      device_1: {
        id: "device_1",
        name: "Living Room Sensor",
        area_id: "area_1",
      },
      device_2: {
        id: "device_2",
        name: "Hallway Sensor",
        area_id: "area_2",
      },
    },
    areas: {
      area_1: { area_id: "area_1", name: "Living Room" },
      area_2: { area_id: "area_2", name: "Hallway" },
    },
    connection: {
      subscribeEvents: vi.fn(() => Promise.resolve(vi.fn())),
      sendMessagePromise: vi.fn(() => Promise.resolve({})),
    },
    callService: vi.fn(() => Promise.resolve()),
    ...overrides,
  };
}
