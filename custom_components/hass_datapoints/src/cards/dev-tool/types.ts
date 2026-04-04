export interface ChangeItem {
  timestamp: string;
  message: string;
  entity_id: string;
  icon: string;
  color: string;
}

export interface WindowConfig {
  id: number;
  label: string;
  startDt: string;
  hours: number;
}

export interface WindowResult {
  id: number;
  label: string;
  startDt: string;
  hours: number;
  changes: ChangeItem[];
  selected: number[];
}
