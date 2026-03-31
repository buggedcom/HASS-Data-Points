/**
 * Shared domain types for atoms, molecules, and lib utilities.
 */

export interface HassStateAttributes {
  friendly_name?: string;
  icon?: string;
  unit_of_measurement?: string;
  device_class?: string;
  [key: string]: unknown;
}

export interface HassState {
  entity_id: string;
  state: string;
  attributes: HassStateAttributes;
  last_changed: string;
  last_updated: string;
}

export interface HassEntity {
  entity_id: string;
  device_id: string | null;
  area_id: string | null;
  labels: string[];
}

export interface HassDevice {
  id: string;
  name: string;
  area_id: string | null;
}

export interface HassArea {
  area_id: string;
  name: string;
}

export interface HassConnection {
  subscribeEvents(callback: (...args: unknown[]) => void, eventType: string): Promise<() => void>;
  sendMessagePromise(message: Record<string, unknown>): Promise<unknown>;
}

export interface HassLike {
  states: Record<string, HassState>;
  entities: Record<string, HassEntity>;
  devices: Record<string, HassDevice>;
  areas: Record<string, HassArea>;
  connection: HassConnection;
  callService(domain: string, service: string, data?: Record<string, unknown>): Promise<void>;
}

export interface SelectOption {
  label: string;
  value: string;
}

export interface SeriesItem {
  entityId: string;
  label: string;
  color: string;
  unit?: string;
}

export type ChipItemType = "entity" | "device" | "area" | "label";

export interface ChipItem {
  type: ChipItemType;
  id: string;
}

export interface EventRecord {
  id: string;
  message: string;
  annotation: string | null;
  icon: string | null;
  color: string;
  timestamp: string;
  entity_id: string | null;
  device_id: string | null;
  area_id: string | null;
  label_id: string | null;
  dev: boolean;
}

export type CardConfig = Record<string, unknown>;

