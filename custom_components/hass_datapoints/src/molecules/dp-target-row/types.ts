// ---------------------------------------------------------------------------
// Shared types for dp-target-row and related components
// ---------------------------------------------------------------------------

export interface NormalizedAnalysis {
  expanded: boolean;
  show_trend_lines: boolean;
  trend_method: string;
  trend_window: string;
  show_trend_crosshairs: boolean;
  show_summary_stats: boolean;
  show_rate_of_change: boolean;
  rate_window: string;
  show_threshold_analysis: boolean;
  show_threshold_shading: boolean;
  threshold_value: string;
  threshold_direction: string;
  show_anomalies: boolean;
  anomaly_methods: string[];
  anomaly_overlap_mode: string;
  anomaly_sensitivity: string;
  anomaly_rate_window: string;
  anomaly_zscore_window: string;
  anomaly_persistence_window: string;
  anomaly_comparison_window_id: string | null;
  show_delta_analysis: boolean;
  show_delta_tooltip: boolean;
  show_delta_lines: boolean;
  hide_source_series: boolean;
}

export interface ComparisonWindow {
  id: string;
  label?: string;
}

export interface HassEntityState {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
  last_changed?: string;
  last_updated?: string;
  context?: { id: string; parent_id: string | null; user_id: string | null };
}
