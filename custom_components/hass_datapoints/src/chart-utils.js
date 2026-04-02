import {
  areaIcon,
  areaName,
  deviceIcon,
  deviceName,
  entityIcon,
  entityName,
  labelIcon,
  labelName,
} from "./entity-name.js";
import { esc, fmtDateTime } from "./helpers.js";
import { ChartRenderer } from "./chart-renderer.js";

/**
 * Shared chart card utilities – styles, shell HTML, canvas setup, tooltips.
 */

export const CHART_STYLE = `
  :host {
    display: block;
    height: 100%;
    min-height: 0;
    --dp-spacing-xs: calc(var(--spacing, 8px) * 0.5);
    --dp-spacing-sm: var(--spacing, 8px);
    --dp-spacing-md: calc(var(--spacing, 8px) * 1.5);
    --dp-spacing-lg: calc(var(--spacing, 8px) * 2);
    --dp-spacing-xl: calc(var(--spacing, 8px) * 2.5);
    --ha-tooltip-background-color: color-mix(in srgb, #0f1218 96%, transparent);
    --ha-tooltip-text-color: rgba(255, 255, 255, 0.96);
    --ha-tooltip-padding: calc(var(--dp-spacing-sm) + 2px) calc(var(--dp-spacing-md) + 2px);
    --ha-tooltip-border-radius: 10px;
    --ha-tooltip-arrow-size: 10px;
    --ha-tooltip-font-size: 0.86rem;
    --ha-tooltip-line-height: 1.1;
  }
  ha-card { padding: 0; overflow: visible; height: 100%; display: flex; flex-direction: column; }
  .card-header {
    padding: var(--dp-spacing-lg) var(--dp-spacing-lg) 0;
    font-size: 1.1em;
    font-weight: 500;
    color: var(--primary-text-color);
    flex: 0 0 auto;
  }
  .chart-top-slot[hidden] {
    display: none;
  }
  .chart-top-slot {
    position: relative;
    flex: 0 0 auto;
    min-width: 0;
    z-index: 1;
  }
  .chart-tabs-shell {
    position: relative;
    min-width: 0;
    border-bottom: 1px solid color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 88%, transparent);
    z-index: 1;
    display: flex;
    align-items: center;
    gap: calc(var(--dp-spacing-sm, 8px));
  }
  .chart-tabs-rail {
    min-width: 0;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
    padding-right: 10px;
    flex-grow: 1;
  }
  .chart-tabs-rail::-webkit-scrollbar {
    display: none;
  }
  .chart-tabs {
    display: flex;
    align-items: flex-end;
    width: 100%;
    min-width: 0;
    gap: 0;
    padding: 0 var(--dp-spacing-md);
    box-sizing: border-box;
  }
  .chart-tab {
    display: flex;
    align-items: stretch;
    min-width: 0;
    border-bottom: 2px solid transparent;
    transition: border-color 120ms ease, color 120ms ease, opacity 120ms ease;
  }
  .chart-tab-trigger {
    position: relative;
    display: inline-flex;
    align-items: stretch;
    flex: 1 1 auto;
    min-width: 0;
    border: 0;
    border-radius: 0;
    padding: var(--dp-spacing-sm) var(--dp-spacing-md);
    background: transparent;
    color: var(--secondary-text-color);
    font: inherit;
    font-size: 0.86rem;
    line-height: 1.2;
    white-space: nowrap;
    cursor: pointer;
    transition: border-color 120ms ease, color 120ms ease, opacity 120ms ease;
  }
  .chart-tab-trigger:hover,
  .chart-tab-trigger:focus-visible {
    color: var(--primary-text-color);
    outline: none;
  }
  .chart-tab:hover {
    border-bottom-color: color-mix(in srgb, var(--primary-color, #03a9f4) 44%, transparent);
  }
  .chart-tab:hover .chart-tab-trigger {
    color: var(--primary-text-color);
  }
  .chart-tab.previewing {
    border-bottom-color: color-mix(in srgb, var(--primary-color, #03a9f4) 62%, transparent);
  }
  .chart-tab.previewing .chart-tab-trigger {
    color: var(--primary-text-color);
  }
  .chart-tab.active {
    border-bottom-color: var(--primary-color, #03a9f4);
  }
  .chart-tab.loading .chart-tab-trigger,
  .chart-tab.loading .chart-tab-actions {
    opacity: 0.55;
  }
  .chart-tab.loading .chart-tab-trigger,
  .chart-tab.loading .chart-tab-trigger .chart-tab-detail,
  .chart-tab.loading .chart-tab-action {
    color: var(--secondary-text-color);
  }
  .chart-tab.active .chart-tab-trigger {
    color: var(--primary-text-color);
    font-weight: 600;
    cursor: default;
  }
  .chart-tab-content {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }
  .chart-tab-main {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }
  .chart-tab-label {
    font-weight: inherit;
  }
  .chart-tab-spinner {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 2px solid color-mix(in srgb, var(--secondary-text-color, #6b7280) 28%, transparent);
    border-top-color: currentColor;
    animation: chart-spinner 0.9s linear infinite;
    flex: 0 0 auto;
  }
  .chart-tab-detail {
    font-size: 0.73rem;
    line-height: 1.2;
    color: var(--secondary-text-color);
    font-weight: 400;
  }
  .chart-tab-detail-row {
    display: flex;
    align-items: center;
    gap: 4px;
    min-width: 0;
    line-height: 1;
  }
  .chart-tab-preview-row {
    display: flex;
    align-items: center;
    gap: 4px;
    min-width: 0;
    line-height: 1;
  }
  .chart-tab-preview {
    font-size: 0.68rem;
    line-height: 1.15;
    color: color-mix(in srgb, var(--warning-color, #f59e0b) 58%, var(--secondary-text-color, #6b7280));
    font-weight: 500;
  }
  .chart-tab-actions {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    margin-left: -2px;
    padding-right: var(--dp-spacing-md);
    padding-bottom: 2px;
    align-self: center;
    transform: translateY(0);
    flex: 0 0 auto;
  }
  .chart-tab-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: var(--secondary-text-color);
    cursor: pointer;
    flex: 0 0 auto;
  }
  .chart-tab-action ha-icon {
    --mdc-icon-size: 12px;
    display: block;
  }
  .chart-tab-action:hover,
  .chart-tab-action:focus-visible {
    background: color-mix(in srgb, var(--primary-text-color, #111) 8%, transparent);
    color: var(--primary-text-color);
    outline: none;
  }
  .chart-tab-action.delete:hover,
  .chart-tab-action.delete:focus-visible {
    color: var(--error-color, #db4437);
  }
  .chart-tab-action.delete {
    background: color-mix(in srgb, var(--primary-text-color, #111) 7%, transparent);
  }
  .chart-tab-action.delete:hover,
  .chart-tab-action.delete:focus-visible {
    background: color-mix(in srgb, var(--error-color, #db4437) 14%, transparent);
  }
  .chart-tab.active .chart-tab-detail,
  .chart-tab.previewing .chart-tab-detail,
  .chart-tab.active .chart-tab-preview,
  .chart-tab.previewing .chart-tab-preview,
  .chart-tab:hover .chart-tab-detail,
  .chart-tab:hover .chart-tab-preview,
  .chart-tab-trigger:hover .chart-tab-detail,
  .chart-tab-trigger:hover .chart-tab-preview,
  .chart-tab-trigger:focus-visible .chart-tab-detail,
  .chart-tab-trigger:focus-visible .chart-tab-preview {
    color: color-mix(in srgb, var(--secondary-text-color, #6b7280) 88%, var(--primary-text-color, #111));
  }
  .chart-tabs-add {
    margin-right: calc(var(--dp-spacing-sm, 16px));
    display: inline-flex;
    align-items: center;
    gap: calc(var(--spacing, 8px) * 0.75);
    padding: calc(var(--dp-spacing-sm, 8px) * 0.625) var(--dp-spacing-sm);
    height: 26px;
    border: 0px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--primary-color, #03a9f4) 12%, var(--card-background-color, #fff));
    color: var(--primary-color, #03a9f4);
    font: inherit;
    font-size: 0.82rem;
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
    z-index: 2;
  }
  .chart-tabs-add ha-icon {
    --mdc-icon-size: 16px;
  }
  .chart-tabs-add:hover,
  .chart-tabs-add:focus-visible {
    background: color-mix(in srgb, var(--primary-color, #03a9f4) 18%, var(--card-background-color, #fff));
    outline: none;
  }
  .chart-tabs-shell.overflowing .chart-tabs-add {
    top: var(--dp-spacing-xs);
    transform: none;
    width: 34px;
    min-width: 34px;
    height: 34px;
    padding: 0;
    justify-content: center;
    border-radius: 999px;
  }
  .chart-tabs-shell.overflowing .chart-tabs-add-label {
    display: none;
  }
  .chart-wrap {
    position: relative;
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    min-height: 0;
    padding: var(--dp-spacing-sm) var(--dp-spacing-md) var(--dp-spacing-md);
    box-sizing: border-box;
    overflow: visible;
    isolation: isolate;
    z-index: 3;
  }
  .chart-preview-overlay[hidden] {
    display: none;
  }
  .chart-preview-overlay {
    position: absolute;
    top: var(--dp-spacing-sm);
    left: var(--dp-spacing-md);
    display: flex;
    flex-direction: column;
    gap: 2px;
    max-width: min(340px, calc(100% - (var(--dp-spacing-lg) * 2)));
    padding: 8px 12px;
    border-radius: 10px;
    background: color-mix(in srgb, var(--card-background-color, #fff) 90%, transparent);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
    backdrop-filter: blur(4px);
    pointer-events: none;
    z-index: 4;
  }
  .chart-preview-kicker {
    font-size: 0.68rem;
    line-height: 1.15;
    color: color-mix(in srgb, var(--warning-color, #f59e0b) 72%, var(--secondary-text-color, #6b7280));
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .chart-preview-title {
    font-size: 0.84rem;
    line-height: 1.2;
    color: var(--primary-text-color);
    font-weight: 600;
  }
  .chart-preview-line {
    font-size: 0.74rem;
    line-height: 1.2;
    color: var(--secondary-text-color);
  }
  .chart-preview-line strong {
    color: color-mix(in srgb, var(--warning-color, #f59e0b) 72%, var(--primary-text-color, #111));
    font-weight: 600;
  }
  .chart-scroll-viewport {
    position: relative;
    flex: 1 1 auto;
    min-height: 0;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-gutter: stable both-edges;
    -webkit-overflow-scrolling: touch;
  }
  .chart-stage {
    position: relative;
    min-height: 100%;
  }
  .chart-icon-overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 2;
  }
  .chart-event-icon {
    position: absolute;
    width: 18px;
    height: 18px;
    transform: translate(-50%, -50%);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    pointer-events: auto;
    cursor: pointer;
    border: 0;
    padding: 0;
    margin: 0;
    background: transparent;
    border-radius: 50%;
  }
  .chart-event-icon ha-icon {
    --mdc-icon-size: 14px;
    pointer-events: none;
  }
  .chart-axis-overlay {
    position: absolute;
    top: 0;
    bottom: 0;
    display: none;
    pointer-events: none;
    background: var(--card-background-color, var(--primary-background-color, #fff));
    overflow: hidden;
    z-index: 3;
    border-bottom-left-radius: 11px;
  }
  .chart-axis-overlay.visible {
    display: block;
  }
  .chart-axis-overlay.left {
    left: 0;
  }
  .chart-axis-overlay.right {
    right: 0;
  }
  .chart-axis-divider {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 1px;
    background: rgba(128,128,128,0.35);
  }
  .chart-axis-overlay.left .chart-axis-divider {
    right: 0;
  }
  .chart-axis-overlay.right .chart-axis-divider {
    left: 0;
  }
  .chart-axis-label,
  .chart-axis-unit {
    position: absolute;
    color: var(--secondary-text-color);
    font: 12px sans-serif;
    line-height: 1;
    white-space: nowrap;
  }
  .chart-axis-label {
    transform: translateY(calc(-50% + 6px));
  }
  .chart-axis-unit {
    font-weight: 500;
  }
  canvas { display: block; }
  .chart-loading {
    position: absolute;
    top: var(--dp-spacing-sm);
    left: var(--dp-spacing-md);
    display: none;
    align-items: center;
    justify-content: center;
    width: calc(var(--spacing, 8px) * 3);
    height: calc(var(--spacing, 8px) * 3);
    border-radius: 999px;
    background: color-mix(in srgb, var(--card-background-color, #fff) 92%, transparent);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
    z-index: 6;
    pointer-events: none;
  }
  .chart-loading.active {
    display: inline-flex;
  }
  .chart-loading-spinner {
    width: calc(var(--spacing, 8px) * 2);
    height: calc(var(--spacing, 8px) * 2);
    border-radius: 50%;
    border: 2px solid color-mix(in srgb, var(--primary-color, #03a9f4) 22%, transparent);
    border-top-color: var(--primary-color, #03a9f4);
    animation: chart-spinner 0.9s linear infinite;
  }
  @keyframes chart-spinner {
    to {
      transform: rotate(360deg);
    }
  }
  .chart-message {
    position: absolute;
    inset: 0;
    display: none;
    align-items: center;
    justify-content: center;
    padding: calc(var(--spacing, 8px) * 5) var(--dp-spacing-lg);
    text-align: center;
    color: var(--secondary-text-color);
    font-size: 0.95rem;
    pointer-events: none;
    z-index: 2;
  }
  .chart-message.visible {
    display: flex;
  }
  .chart-crosshair {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .chart-crosshair[hidden] {
    display: none;
  }
  .crosshair-line {
    position: absolute;
    background: color-mix(in srgb, var(--primary-text-color, #111) 24%, transparent);
  }
  .crosshair-line.vertical {
    width: 1px;
    transform: translateX(-50%);
  }
  .crosshair-line.horizontal {
    height: 1px;
    transform: translateY(-50%);
  }
  .crosshair-line.horizontal.series {
    left: 0;
    width: 100%;
  }
  .crosshair-line.horizontal.series.subtle {
    background: currentColor;
    opacity: 0.22;
  }
  .crosshair-line.horizontal.series.emphasized {
    height: 0;
    background: transparent;
    border-top: 1px dashed currentColor;
    opacity: 0.9;
  }
  .crosshair-points {
    position: absolute;
    inset: 0;
  }
  .crosshair-point {
    position: absolute;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 2px solid var(--card-background-color, #fff);
    box-shadow: 0 2px 6px rgba(0,0,0,0.18);
    transform: translate(-50%, -50%);
  }
  .crosshair-axis-dot {
    position: absolute;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    border: 2px solid var(--card-background-color, #fff);
    box-shadow: 0 1px 4px rgba(0,0,0,0.28);
    transform: translate(-50%, -50%);
  }
  .chart-axis-hover-dot {
    position: absolute;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    border: 2px solid var(--card-background-color, #fff);
    box-shadow: 0 1px 4px rgba(0,0,0,0.28);
    top: 0;
    transform: translateY(-50%);
  }
  .chart-axis-hover-dot.left {
    right: 0;
    transform: translate(50%, -50%);
  }
  .chart-axis-hover-dot.right {
    left: 0;
    transform: translate(-50%, -50%);
  }
  .chart-zoom-selection {
    position: absolute;
    border-radius: 6px;
    border: 1px solid color-mix(in srgb, var(--primary-color, #03a9f4) 78%, transparent);
    background: color-mix(in srgb, var(--primary-color, #03a9f4) 18%, transparent);
    pointer-events: none;
    opacity: 0;
    transition: opacity 120ms ease;
  }
  .chart-zoom-selection.visible {
    opacity: 1;
  }
  .chart-add-annotation {
    position: absolute;
    width: 24px;
    height: 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    margin: 0;
    border: 1px solid color-mix(in srgb, var(--secondary-text-color, #616161) 22%, transparent);
    border-radius: 8px;
    background: color-mix(in srgb, var(--secondary-background-color, #f3f4f6) 94%, transparent);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.16);
    color: var(--secondary-text-color, #616161);
    cursor: pointer;
    z-index: 4;
    transform: translate(-50%, -50%);
  }
  .chart-add-annotation ha-icon {
    --mdc-icon-size: 14px;
    pointer-events: none;
  }
  .chart-add-annotation:hover,
  .chart-add-annotation:focus-visible {
    background: color-mix(in srgb, var(--secondary-background-color, #f3f4f6) 82%, transparent);
    color: var(--primary-text-color);
    outline: none;
  }
  .chart-add-annotation[hidden] {
    display: none;
  }
  .chart-zoom-out {
    position: absolute;
    top: var(--dp-spacing-md);
    right: var(--dp-spacing-lg);
    display: inline-flex;
    align-items: center;
    gap: calc(var(--spacing, 8px) * 0.75);
    padding: calc(var(--spacing, 8px) * 0.875) var(--dp-spacing-md);
    border: 1px solid color-mix(in srgb, var(--primary-color, #03a9f4) 26%, transparent);
    border-radius: 999px;
    background: color-mix(in srgb, var(--primary-color, #03a9f4) 12%, var(--card-background-color, #fff));
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    color: var(--primary-color, #03a9f4);
    font: inherit;
    font-size: 0.82rem;
    font-weight: 500;
    cursor: pointer;
    z-index: 4;
  }
  .chart-zoom-out ha-icon {
    --mdc-icon-size: 16px;
  }
  .chart-zoom-out[hidden] {
    display: none;
  }
  .chart-zoom-out:hover,
  .chart-zoom-out:focus-visible {
    background: color-mix(in srgb, var(--primary-color, #03a9f4) 18%, var(--card-background-color, #fff));
    outline: none;
  }
  .chart-adjust-axis {
    position: absolute;
    left: var(--dp-spacing-lg);
    bottom: var(--dp-spacing-lg);
    display: inline-flex;
    align-items: center;
    gap: calc(var(--spacing, 8px) * 0.75);
    padding: calc(var(--spacing, 8px) * 0.875) var(--dp-spacing-md);
    border: 1px solid color-mix(in srgb, var(--primary-color, #03a9f4) 26%, transparent);
    border-radius: 999px;
    background: color-mix(in srgb, var(--primary-color, #03a9f4) 12%, var(--card-background-color, #fff));
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    color: var(--primary-color, #03a9f4);
    font: inherit;
    font-size: 0.82rem;
    font-weight: 500;
    cursor: pointer;
    z-index: 4;
  }
  .chart-adjust-axis[hidden] {
    display: none;
  }
  .chart-adjust-axis:hover,
  .chart-adjust-axis:focus-visible {
    background: color-mix(in srgb, var(--primary-color, #03a9f4) 18%, var(--card-background-color, #fff));
    outline: none;
  }
  .legend {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    gap: var(--dp-spacing-sm);
    padding: var(--dp-spacing-sm) var(--dp-spacing-md) var(--dp-spacing-md);
    padding-left: max(var(--dp-spacing-md), var(--dp-chart-axis-left-width, 0px));
    padding-right: max(var(--dp-spacing-md), var(--dp-chart-axis-right-width, 0px));
    flex: 0 0 auto;
    border-top: 1px solid color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 88%, transparent);
    min-width: 0;
    max-width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: thin;
    -webkit-overflow-scrolling: touch;
  }
  .legend.wrap-rows {
    flex-wrap: wrap;
    align-items: flex-start;
    overflow-x: hidden;
    overflow-y: auto;
    max-height: calc((30px * 3) + (var(--dp-spacing-sm) * 2));
  }
  .legend-item {
    display: flex;
    align-items: center;
    gap: calc(var(--spacing, 8px) * 0.625);
    font-size: 0.78em;
    color: var(--secondary-text-color);
    flex: 0 0 auto;
  }
  .legend.wrap-rows .legend-item {
    max-width: 100%;
  }
  .legend-toggle {
    border: 0;
    padding: calc(var(--spacing, 8px) * 0.375) var(--dp-spacing-sm);
    background: none;
    font: inherit;
    text-align: left;
    cursor: pointer;
    border-radius: 999px;
    transition: opacity 120ms ease, color 120ms ease, background-color 120ms ease;
  }
  .legend-toggle:hover,
  .legend-toggle:focus-visible {
    color: var(--primary-text-color);
    background: color-mix(in srgb, var(--primary-text-color, #111) 6%, transparent);
    outline: none;
  }
  .legend-toggle[aria-pressed="false"] {
    opacity: 0.45;
  }
  .legend-line {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex: 0 0 12px;
  }
  .tooltip {
    position: fixed;
    background: color-mix(in srgb, #0f1218 96%, transparent);
    border: 1px solid color-mix(in srgb, #ffffff 14%, transparent);
    border-radius: 10px;
    padding: calc(var(--dp-spacing-sm) + 2px) calc(var(--dp-spacing-md) + 2px);
    font-size: 0.86rem;
    line-height: 1.1;
    box-shadow: 0 10px 24px rgba(0,0,0,0.28);
    pointer-events: none;
    display: none;
    max-width: clamp(220px, 30vw, 320px);
    z-index: 1200;
    color: rgba(255, 255, 255, 0.96);
  }
  .tt-dot {
    display: inline-block;
    width: 8px; height: 8px;
    border-radius: 50%;
    margin-right: var(--dp-spacing-xs);
    flex-shrink: 0;
  }
  .tt-time { color: rgba(255, 255, 255, 0.72); margin-bottom: calc(var(--spacing, 8px) * 0.375); }
  .tt-value { color: rgba(255, 255, 255, 0.78); margin-bottom: var(--dp-spacing-xs); }
  .tt-series {
    display: grid;
    gap: var(--dp-spacing-xs);
    margin-bottom: var(--dp-spacing-xs);
  }
  .tt-series-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--dp-spacing-md);
    min-width: 0;
  }
  .tt-series-row.subordinate {
    padding-left: calc(var(--spacing, 8px) * 2.25);
  }
  .tt-series-main {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: calc(var(--spacing, 8px) * 0.75);
  }
  .tt-series-label {
    min-width: 0;
    color: rgba(255, 255, 255, 0.76);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .tt-series-value {
    flex: 0 0 auto;
    color: rgba(255, 255, 255, 0.96);
    font-weight: 500;
    white-space: nowrap;
    text-align: right;
  }
  .tt-message-row {
    display: flex;
    align-items: flex-start;
    gap: var(--dp-spacing-xs);
  }
  .tt-message { font-weight: 500; }
  .tt-annotation {
    color: rgba(255, 255, 255, 0.74);
    margin-top: var(--dp-spacing-xs);
    margin-left: calc(8px + var(--dp-spacing-xs) + calc(var(--spacing, 8px) * 0.75));
    white-space: pre-wrap;
    line-height: 1.4;
  }
  .tooltip.secondary {
    max-width: 260px;
  }
  .tooltip.annotation-tooltip {
    max-width: 300px;
  }
  .tt-secondary {
    display: grid;
    gap: calc(var(--spacing, 8px) * 0.5);
  }
  .tt-secondary-title {
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.72);
  }
  .tt-secondary-text {
    font-size: 0.88rem;
    line-height: 1.45;
    color: rgba(255, 255, 255, 0.9);
    white-space: pre-wrap;
  }
  .tt-secondary-text.muted {
    color: rgba(255, 255, 255, 0.74);
  }
  .tt-entities {
    display: flex;
    flex-wrap: wrap;
    gap: var(--dp-spacing-xs);
    margin-top: calc(var(--spacing, 8px) * 0.75);
  }
  .tt-entity-chip {
    display: inline-flex;
    align-items: center;
    gap: calc(var(--spacing, 8px) * 0.5);
    max-width: 100%;
    padding: 2px 8px;
    border-radius: 999px;
    background: color-mix(in srgb, #ffffff 10%, transparent);
    color: rgba(255, 255, 255, 0.82);
    white-space: nowrap;
  }
  .tt-entity-chip ha-icon {
    --mdc-icon-size: 12px;
    flex: 0 0 auto;
  }
  .tt-entity-chip span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .chart-modal[hidden] {
    display: none;
  }
  .chart-modal {
    position: absolute;
    inset: 0;
    z-index: 250;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--dp-spacing-lg);
    box-sizing: border-box;
  }
  .chart-modal-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(15, 18, 24, 0.42);
    backdrop-filter: blur(2px);
  }
  .chart-modal-panel {
    position: relative;
    z-index: 1;
    width: min(560px, calc(100vw - (var(--spacing, 8px) * 4)));
    max-height: calc(100% - (var(--spacing, 8px) * 4));
    overflow: auto;
    border-radius: 16px;
  }
`;

export function buildChartCardShell(title) {
  return `
    <style>${CHART_STYLE}</style>
    <ha-card>
      ${title ? `<div class="card-header">${esc(title)}</div>` : ""}
      <div class="chart-top-slot" id="chart-top-slot" hidden></div>
      <div class="chart-wrap">
        <div class="chart-preview-overlay" id="chart-preview-overlay" hidden></div>
        <div class="chart-scroll-viewport" id="chart-scroll-viewport">
          <div class="chart-stage" id="chart-stage">
            <div class="chart-loading active" id="loading" aria-hidden="true">
              <div class="chart-loading-spinner"></div>
            </div>
            <div class="chart-message" id="chart-message"></div>
            <canvas id="chart"></canvas>
            <div class="chart-icon-overlay" id="chart-icon-overlay"></div>
            <div class="chart-crosshair" id="chart-crosshair" hidden>
              <div class="crosshair-line vertical" id="crosshair-vertical"></div>
              <div class="crosshair-line horizontal" id="crosshair-horizontal"></div>
              <div class="crosshair-points" id="crosshair-points"></div>
            </div>
            <button type="button" class="chart-add-annotation" id="chart-add-annotation" hidden aria-label="Create data point">
              <ha-icon icon="mdi:plus"></ha-icon>
            </button>
            <ha-tooltip for="chart-add-annotation" placement="bottom" distance="8" show-delay="1000">Create Data Point</ha-tooltip>
            <div class="chart-zoom-selection" id="chart-zoom-selection" hidden></div>
          </div>
        </div>
        <div class="chart-axis-overlay left" id="chart-axis-left"></div>
        <div class="chart-axis-overlay right" id="chart-axis-right"></div>
        <button type="button" class="chart-zoom-out" id="chart-zoom-out" hidden>
          <ha-icon icon="mdi:magnify-minus-outline"></ha-icon>
          <span>Zoom out</span>
        </button>
        <button type="button" class="chart-adjust-axis" id="chart-adjust-axis" hidden>
          <span>Adjust Y-Axis</span>
        </button>
        <div class="tooltip" id="tooltip">
          <div class="tt-time" id="tt-time"></div>
          <div class="tt-value" id="tt-value" style="display:none"></div>
          <div class="tt-series" id="tt-series" style="display:none"></div>
          <div class="tt-message-row" id="tt-message-row" style="display:none">
            <span class="tt-dot" id="tt-dot"></span>
            <span class="tt-message" id="tt-message"></span>
          </div>
          <div class="tt-annotation" id="tt-annotation" style="display:none"></div>
          <div class="tt-entities" id="tt-entities" style="display:none"></div>
        </div>
        <div class="tooltip secondary" id="anomaly-tooltip">
          <div class="tt-secondary">
            <div class="tt-secondary-title" id="tt-secondary-title"></div>
            <div class="tt-secondary-text" id="tt-secondary-description"></div>
            <div class="tt-secondary-text" id="tt-secondary-alert"></div>
            <div class="tt-secondary-text muted" id="tt-secondary-instruction"></div>
          </div>
        </div>
        <div id="annotation-tooltips"></div>
      <div class="legend" id="legend"></div>
    </ha-card>`;
}

/**
 * Reads the HA `--secondary-text-color` CSS variable from the given element so
 * canvas-drawn axis labels use the correct colour for the active light/dark theme.
 * Falls back to the dark-mode default when the variable is unavailable.
 */
export function resolveChartLabelColor(el) {
  if (!el) {
    return "rgba(214,218,224,0.92)";
  }
  const raw = getComputedStyle(el).getPropertyValue("--secondary-text-color").trim();
  if (raw) {
    return raw;
  }
  return "rgba(214,218,224,0.92)";
}

export function setupCanvas(canvas, container, cssHeight, cssWidth = null) {
  const dpr = window.devicePixelRatio || 1;
  // Safari caps canvas pixel dimensions at 16,383. Chrome/Firefox at ~32,767.
  // Use the Safari limit (16,383) so the canvas is never silently blanked by
  // the browser resetting it to 300×150 when dimensions are exceeded.
  const maxCssDim = Math.floor(16383 / dpr);
  const styles = getComputedStyle(container);
  const paddingX =
    (Number.parseFloat(styles.paddingLeft || "0") || 0)
    + (Number.parseFloat(styles.paddingRight || "0") || 0);
  const paddingY =
    (Number.parseFloat(styles.paddingTop || "0") || 0)
    + (Number.parseFloat(styles.paddingBottom || "0") || 0);
  const measuredWidth = cssWidth ?? (container.clientWidth || 360);
  const w = Math.min(maxCssDim, Math.max(1, Math.round(measuredWidth - paddingX)));
  const requestedHeight = cssHeight ?? container.clientHeight ?? 220;
  const h = Math.min(maxCssDim, Math.max(120, Math.round(requestedHeight - paddingY)));
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  canvas.getContext("2d").scale(dpr, dpr);
  return { w, h };
}

export function renderChartAxisOverlays(card, renderer, axes = []) {
  const leftEl = card.shadowRoot?.getElementById("chart-axis-left");
  const rightEl = card.shadowRoot?.getElementById("chart-axis-right");
  if (!leftEl || !rightEl || !renderer) return;

  const leftWidth = Math.max(0, renderer.pad.left);
  const rightWidth = Math.max(0, renderer.pad.right);
  leftEl.style.width = `${leftWidth}px`;
  rightEl.style.width = `${rightWidth}px`;

  const chartWrap = card.shadowRoot?.querySelector(".chart-wrap");
  if (chartWrap) {
    chartWrap.style.setProperty("--dp-chart-axis-left-width", `${leftWidth}px`);
    chartWrap.style.setProperty("--dp-chart-axis-right-width", `${rightWidth}px`);
  }

  const axisSlotWidth = ChartRenderer.AXIS_SLOT_WIDTH;
  const axisOffset = (axis) => 10 + (axis.slot * axisSlotWidth);
  const unitCounts = axes.reduce((counts, axis) => {
    if (!axis?.unit) {
      return counts;
    }
    counts.set(axis.unit, (counts.get(axis.unit) || 0) + 1);
    return counts;
  }, new Map());
  const axisTextStyle = (axis) => {
    const duplicateUnit = !!axis?.unit && (unitCounts.get(axis.unit) || 0) > 1;
    if (!duplicateUnit || !axis?.color) {
      return "";
    }
    return `color:${esc(axis.color)};`;
  };

  const buildAxisMarkup = (axis) => {
    const labels = (axis.ticks || []).map((tick) => {
      const y = renderer.yOf(tick, axis.min, axis.max);
      return `<div class="chart-axis-label" style="top:${Math.round(y) + 1}px;${axis.side === "left" ? `right:${axisOffset(axis)}px;text-align:right;` : `left:${axisOffset(axis)}px;text-align:left;`}${axisTextStyle(axis)}">${esc(renderer._formatAxisTick(tick, axis.unit))}</div>`;
    }).join("");
    const unit = axis.unit
      ? `<div class="chart-axis-unit" style="top:${Math.max(0, renderer.pad.top - 18)}px;${axis.side === "left" ? `right:${axisOffset(axis)}px;text-align:right;` : `left:${axisOffset(axis)}px;text-align:left;`}${axisTextStyle(axis)}">${esc(axis.unit)}</div>`
      : "";
    return `${labels}${unit}`;
  };

  const leftAxes = axes.filter((axis) => axis.side !== "right");
  const rightAxes = axes.filter((axis) => axis.side === "right");

  leftEl.innerHTML = leftAxes.length
    ? `<div class="chart-axis-divider"></div>${leftAxes.map((axis) => buildAxisMarkup(axis)).join("")}`
    : "";
  rightEl.innerHTML = rightAxes.length
    ? `<div class="chart-axis-divider"></div>${rightAxes.map((axis) => buildAxisMarkup(axis)).join("")}`
    : "";

  leftEl.classList.toggle("visible", !!leftAxes.length);
  rightEl.classList.toggle("visible", !!rightAxes.length);
}

export function renderChartAxisHoverDots(card, hoverValues = []) {
  const leftEl = card.shadowRoot?.getElementById("chart-axis-left");
  const rightEl = card.shadowRoot?.getElementById("chart-axis-right");
  const scrollViewport = card.shadowRoot?.getElementById("chart-scroll-viewport");
  if (!leftEl || !rightEl) return;

  leftEl.querySelectorAll(".chart-axis-hover-dot").forEach((el) => el.remove());
  rightEl.querySelectorAll(".chart-axis-hover-dot").forEach((el) => el.remove());
  const verticalOffset = scrollViewport?.offsetTop || 0;

  hoverValues
    .filter((entry) => entry?.hasValue !== false && Number.isFinite(entry?.y))
    .forEach((entry) => {
      const target = entry.axisSide === "right" ? rightEl : leftEl;
      const dot = document.createElement("span");
      dot.className = `chart-axis-hover-dot ${entry.axisSide === "right" ? "right" : "left"}`;
      dot.style.top = `${verticalOffset + entry.y}px`;
      dot.style.background = entry.color || "#03a9f4";
      dot.style.opacity = `${Number.isFinite(entry.opacity) ? entry.opacity : 1}`;
      target.appendChild(dot);
    });
}

export function clampChartValue(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function formatTooltipValue(value, unit = "") {
  if (value == null || value === "" || Number.isNaN(Number(value))) return "";
  return `${Number(value).toFixed(2).replace(/\.00$/, "")}${unit ? ` ${unit}` : ""}`;
}

export function formatTooltipDisplayValue(value, unit = "") {
  if (value == null || value === "") return "No value";
  if (typeof value === "string") {
    return unit ? `${value} ${unit}` : value;
  }
  return formatTooltipValue(value, unit);
}

function formatTooltipDateTimeFromMs(timeMs) {
  if (!Number.isFinite(timeMs)) {
    return "";
  }
  return fmtDateTime(new Date(timeMs).toISOString());
}

const ANOMALY_METHOD_LABELS = {
  trend_residual: "Trend deviation",
  rate_of_change: "Sudden change",
  iqr: "Statistical outlier (IQR)",
  rolling_zscore: "Rolling Z-score",
  persistence: "Flat-line / stuck",
  comparison_window: "Comparison window",
};

function buildAnomalyMethodSection(region) {
  // Returns { methodLabel, description, alert } for a single region, or null if invalid.
  if (!region?.cluster?.points?.length) return null;
  const points = region.cluster.points;
  const startPoint = points[0];
  const endPoint = points[points.length - 1];
  const peakPoint = points.reduce((peak, p) => (!peak || Math.abs(p.residual) > Math.abs(peak.residual) ? p : peak), null);
  if (!peakPoint) return null;

  const label = region.label || region.relatedEntityId || "Series";
  const unit = region.unit || "";
  const cluster = region.cluster;
  const method = cluster.anomalyMethod;
  const methodLabel = ANOMALY_METHOD_LABELS[method] || method;

  let description;
  let alert;
  if (method === "rate_of_change") {
    const rateUnit = unit ? `${unit}/h` : "units/h";
    description = `${label} shows an unusual rate of change between ${formatTooltipDateTimeFromMs(startPoint.timeMs)} and ${formatTooltipDateTimeFromMs(endPoint.timeMs)}.`;
    alert = `Peak rate deviation: ${formatTooltipValue(peakPoint.residual, rateUnit)} from a typical rate of ${formatTooltipValue(peakPoint.baselineValue, rateUnit)} at ${formatTooltipDateTimeFromMs(peakPoint.timeMs)}.`;
  } else if (method === "iqr") {
    description = `${label} contains statistical outliers between ${formatTooltipDateTimeFromMs(startPoint.timeMs)} and ${formatTooltipDateTimeFromMs(endPoint.timeMs)}.`;
    alert = `Peak value: ${formatTooltipValue(peakPoint.value, unit)}, deviating ${formatTooltipValue(Math.abs(peakPoint.residual), unit)} from the median at ${formatTooltipDateTimeFromMs(peakPoint.timeMs)}.`;
  } else if (method === "rolling_zscore") {
    description = `${label} shows statistically unusual values between ${formatTooltipDateTimeFromMs(startPoint.timeMs)} and ${formatTooltipDateTimeFromMs(endPoint.timeMs)}.`;
    alert = `Peak deviation: ${formatTooltipValue(peakPoint.residual, unit)} from a rolling mean of ${formatTooltipValue(peakPoint.baselineValue, unit)} at ${formatTooltipDateTimeFromMs(peakPoint.timeMs)}.`;
  } else if (method === "persistence") {
    const flatRange = typeof cluster.flatRange === "number" ? cluster.flatRange : null;
    const rangeStr = flatRange !== null ? ` (range: ${formatTooltipValue(flatRange, unit)})` : "";
    description = `${label} appears stuck or flat between ${formatTooltipDateTimeFromMs(startPoint.timeMs)} and ${formatTooltipDateTimeFromMs(endPoint.timeMs)}${rangeStr}.`;
    alert = `Value remained near ${formatTooltipValue(peakPoint.baselineValue, unit)} for an unusually long period.`;
  } else if (method === "comparison_window") {
    description = `${label} deviates significantly from the comparison window between ${formatTooltipDateTimeFromMs(startPoint.timeMs)} and ${formatTooltipDateTimeFromMs(endPoint.timeMs)}.`;
    alert = `Peak deviation from comparison: ${formatTooltipValue(peakPoint.residual, unit)} at ${formatTooltipDateTimeFromMs(peakPoint.timeMs)}.`;
  } else {
    description = `${label} deviates from its expected trend between ${formatTooltipDateTimeFromMs(startPoint.timeMs)} and ${formatTooltipDateTimeFromMs(endPoint.timeMs)}.`;
    alert = `Peak deviation: ${formatTooltipValue(peakPoint.residual, unit)} from a baseline of ${formatTooltipValue(peakPoint.baselineValue, unit)} at ${formatTooltipDateTimeFromMs(peakPoint.timeMs)}.`;
  }
  return { methodLabel, description, alert };
}

function buildAnomalyTooltipContent(regions) {
  let regionsArray;
  if (Array.isArray(regions)) {
    regionsArray = regions;
  } else if (regions) {
    regionsArray = [regions];
  } else {
    regionsArray = [];
  }
  if (regionsArray.length === 0) return null;

  const sections = regionsArray.map(buildAnomalyMethodSection).filter(Boolean);
  if (sections.length === 0) return null;

  const instruction = "Click the highlighted circle to add an annotation.";

  // Single region — check for "only" mode overlap (single cluster confirmed by multiple methods)
  if (sections.length === 1) {
    const section = sections[0];
    const cluster = regionsArray[0]?.cluster;
    const detectedByMethods = Array.isArray(cluster?.detectedByMethods) && cluster.detectedByMethods.length > 1
      ? cluster.detectedByMethods
      : null;
    const isMultiMethod = detectedByMethods !== null;
    const title = isMultiMethod ? "⚠️ Multi-method Anomaly" : "⚠️ Anomaly Insight";
    const confirmedNote = isMultiMethod
      ? `\nConfirmed by ${detectedByMethods.length} methods: ${detectedByMethods.map((m) => ANOMALY_METHOD_LABELS[m] || m).join(", ")}.`
      : "";
    return {
      title,
      description: section.description + confirmedNote,
      alert: `Alert: ${section.alert}`,
      instruction,
    };
  }

  // Multiple regions — show each method's finding separately
  const description = sections.map((s) => `${s.methodLabel}:\n${s.description}`).join("\n\n");
  const alert = sections.map((s) => `${s.methodLabel}: ${s.alert}`).join("\n");
  return {
    title: "⚠️ Multi-method Anomaly",
    description,
    alert,
    instruction,
  };
}

export function positionTooltip(tooltip, clientX, clientY, bounds = null) {
  tooltip.style.display = "block";
  const tipRect = tooltip.getBoundingClientRect();
  const tipW = tipRect.width || 220;
  const tipH = tipRect.height || 64;
  const gap = 12;
  const minLeft = Number.isFinite(bounds?.left) ? bounds.left : gap;
  const maxLeft = Number.isFinite(bounds?.right) ? bounds.right : (window.innerWidth - gap);
  const minTop = Number.isFinite(bounds?.top) ? bounds.top : gap;
  const maxTop = Number.isFinite(bounds?.bottom) ? bounds.bottom : (window.innerHeight - gap);

  let left = clientX + gap;
  if (left + tipW > maxLeft) {
    left = clientX - tipW - gap;
  }

  let top = clientY - tipH - gap;
  if (top < minTop) {
    top = clientY + gap;
  }
  if (top + tipH > maxTop) {
    top = Math.max(minTop, clientY - tipH - gap);
  }

  left = Math.min(Math.max(left, minLeft), Math.max(minLeft, maxLeft - tipW));
  top = Math.min(Math.max(top, minTop), Math.max(minTop, maxTop - tipH));

  tooltip.style.left = `${left  }px`;
  tooltip.style.top = `${top  }px`;
}

function positionAnomalyTooltip(tooltip, clientX, clientY, mainTooltip, bounds = null) {
  if (!tooltip) return;
  tooltip.style.display = "block";
  const tipRect = tooltip.getBoundingClientRect();
  const tipW = tipRect.width || 220;
  const tipH = tipRect.height || 64;
  const gap = 12; // same gap as the main tooltip
  const minLeft = Number.isFinite(bounds?.left) ? bounds.left : gap;
  const maxLeft = Number.isFinite(bounds?.right) ? bounds.right : (window.innerWidth - gap);
  const minTop = Number.isFinite(bounds?.top) ? bounds.top : gap;
  const maxTop = Number.isFinite(bounds?.bottom) ? bounds.bottom : (window.innerHeight - gap);

  // Primary position: left of crosshair with the same gap as the main tooltip
  // → right edge of anomaly tooltip lands at clientX - gap (symmetric with main tooltip)
  let left = clientX - gap - tipW;
  if (left < minLeft) {
    // No room on the left — fall back to right of main tooltip
    const mainRect = mainTooltip ? mainTooltip.getBoundingClientRect() : null;
    left = mainRect ? mainRect.right + gap : clientX + gap;
  }

  // Vertically align with the top of the main tooltip
  const mainRect = mainTooltip ? mainTooltip.getBoundingClientRect() : null;
  let top = mainRect ? mainRect.top : (clientY - tipH - gap);
  if (top + tipH > maxTop) top = Math.max(minTop, maxTop - tipH);

  left = Math.min(Math.max(left, minLeft), Math.max(minLeft, maxLeft - tipW));
  top = Math.min(Math.max(top, minTop), Math.max(minTop, maxTop - tipH));

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

function positionSecondaryTooltip(tooltip, anchorTooltip, bounds = null) {
  if (!tooltip || !anchorTooltip) {
    return;
  }
  tooltip.style.display = "block";
  const anchorRect = anchorTooltip.getBoundingClientRect();
  const tipRect = tooltip.getBoundingClientRect();
  const gap = 10;
  const minLeft = Number.isFinite(bounds?.left) ? bounds.left : gap;
  const maxLeft = Number.isFinite(bounds?.right) ? bounds.right : (window.innerWidth - gap);
  const minTop = Number.isFinite(bounds?.top) ? bounds.top : gap;
  const maxTop = Number.isFinite(bounds?.bottom) ? bounds.bottom : (window.innerHeight - gap);

  let left = anchorRect.right + gap;
  if (left + tipRect.width > maxLeft) {
    left = anchorRect.left - tipRect.width - gap;
  }

  let top = anchorRect.top;
  if (top + tipRect.height > maxTop) {
    top = Math.max(minTop, maxTop - tipRect.height);
  }

  left = Math.min(Math.max(left, minLeft), Math.max(minLeft, maxLeft - tipRect.width));
  top = Math.min(Math.max(top, minTop), Math.max(minTop, maxTop - tipRect.height));

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

function positionTooltipBelow(tooltip, anchorTooltip, bounds = null) {
  if (!tooltip || !anchorTooltip) {
    return;
  }
  tooltip.style.display = "block";
  const anchorRect = anchorTooltip.getBoundingClientRect();
  const tipRect = tooltip.getBoundingClientRect();
  const gap = 8;
  const minLeft = Number.isFinite(bounds?.left) ? bounds.left : gap;
  const maxLeft = Number.isFinite(bounds?.right) ? bounds.right : (window.innerWidth - gap);
  const minTop = Number.isFinite(bounds?.top) ? bounds.top : gap;
  const maxTop = Number.isFinite(bounds?.bottom) ? bounds.bottom : (window.innerHeight - gap);

  let left = anchorRect.left;
  if (left + tipRect.width > maxLeft) {
    left = Math.max(minLeft, maxLeft - tipRect.width);
  }

  let top = anchorRect.bottom + gap;
  if (top + tipRect.height > maxTop) {
    top = Math.max(minTop, anchorRect.top - tipRect.height - gap);
  }

  left = Math.min(Math.max(left, minLeft), Math.max(minLeft, maxLeft - tipRect.width));
  top = Math.min(Math.max(top, minTop), Math.max(minTop, maxTop - tipRect.height));

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

function getAnnotationTooltipContainer(card) {
  if (!card?.shadowRoot) {
    return null;
  }
  return card.shadowRoot.getElementById("annotation-tooltips");
}

function clearAnnotationTooltips(card) {
  const container = getAnnotationTooltipContainer(card);
  if (!container) {
    return;
  }
  container.innerHTML = "";
}

function buildAnnotationTooltip(card, event) {
  const tooltip = document.createElement("div");
  tooltip.className = "tooltip secondary annotation-tooltip";

  const hasValue = event?.chart_value != null && event.chart_value !== "";
  const valueMarkup = hasValue
    ? `<div class="tt-value">${esc(formatTooltipValue(event.chart_value, event.chart_unit))}</div>`
    : "";
  const message = event?.message || "Data point";
  const annotation = event?.annotation && event.annotation !== event.message
    ? event.annotation
    : "";
  const relatedMarkup = buildTooltipRelatedChips(card?._hass, event);

  tooltip.innerHTML = `
    <div class="tt-time">${esc(fmtDateTime(event.timestamp))}</div>
    ${valueMarkup}
    <div class="tt-message-row">
      <span class="tt-dot" style="background:${esc(event?.color || "#03a9f4")}"></span>
      <span class="tt-message">${esc(message)}</span>
    </div>
    <div class="tt-annotation" style="display:${annotation ? "block" : "none"}">${esc(annotation)}</div>
    <div class="tt-entities" style="display:${relatedMarkup ? "flex" : "none"}">${relatedMarkup}</div>
  `;
  return tooltip;
}

function renderAnnotationTooltips(card, hover, anchorTooltip, bounds = null) {
  const container = getAnnotationTooltipContainer(card);
  if (!container) {
    return [];
  }
  clearAnnotationTooltips(card);
  const annotationEvents = Array.isArray(hover?.events) ? hover.events : [];
  if (!annotationEvents.length) {
    return [];
  }

  const renderedTooltips = [];
  let anchorEl = anchorTooltip;
  for (const event of annotationEvents) {
    const tooltip = buildAnnotationTooltip(card, event);
    container.appendChild(tooltip);
    if (renderedTooltips.length === 0) {
      positionSecondaryTooltip(tooltip, anchorEl, bounds);
    } else {
      positionTooltipBelow(tooltip, anchorEl, bounds);
    }
    renderedTooltips.push(tooltip);
    anchorEl = tooltip;
  }
  return renderedTooltips;
}

export function showTooltip(card, canvas, renderer, event, clientX, clientY) {
  const tooltip = card.shadowRoot.getElementById("tooltip");
  const ttTime = card.shadowRoot.getElementById("tt-time");
  const ttValue = card.shadowRoot.getElementById("tt-value");
  const ttSeries = card.shadowRoot.getElementById("tt-series");
  const ttMessageRow = card.shadowRoot.getElementById("tt-message-row");
  const ttDot = card.shadowRoot.getElementById("tt-dot");
  const ttMsg = card.shadowRoot.getElementById("tt-message");
  const ttAnn = card.shadowRoot.getElementById("tt-annotation");
  const ttEntities = card.shadowRoot.getElementById("tt-entities");

  ttTime.textContent = fmtDateTime(event.timestamp);
  const hasValue = event.chart_value != null && event.chart_value !== "";
  ttValue.textContent = hasValue ? formatTooltipValue(event.chart_value, event.chart_unit) : "";
  ttValue.style.display = hasValue ? "block" : "none";
  if (ttSeries) {
    ttSeries.innerHTML = "";
    ttSeries.style.display = "none";
  }
  ttDot.style.background = event.color || "#03a9f4";
  ttMsg.textContent = event.message;
  if (ttMessageRow) ttMessageRow.style.display = "flex";
  const ann = event.annotation !== event.message ? event.annotation : "";
  ttAnn.textContent = ann || "";
  ttAnn.style.display = ann ? "block" : "none";
  const relatedMarkup = buildTooltipRelatedChips(card._hass, event);
  ttEntities.innerHTML = relatedMarkup;
  ttEntities.style.display = relatedMarkup ? "flex" : "none";

  const chartBounds = card.shadowRoot?.querySelector(".chart-wrap")?.getBoundingClientRect();
  positionTooltip(tooltip, clientX, clientY, chartBounds ? {
    left: chartBounds.left + 8,
    right: chartBounds.right - 8,
    top: chartBounds.top + 8,
    bottom: chartBounds.bottom - 8,
  } : null);
}

export function hideTooltip(card) {
  const tooltip = card.shadowRoot.getElementById("tooltip");
  const anomalyTooltip = card.shadowRoot.getElementById("anomaly-tooltip");
  if (tooltip) {
    tooltip.style.display = "none";
  }
  if (anomalyTooltip) {
    anomalyTooltip.style.display = "none";
  }
  clearAnnotationTooltips(card);
}

function resolveTooltipSeriesLabel(entry) {
  const isSubordinate = entry.grouped === true && entry.rawVisible === true;
  if (entry.comparison === true) {
    if (entry.grouped === true) {
      return entry.windowLabel || "Date window";
    }
      return `${entry.windowLabel || "Date window"}: ${entry.label || ""}`;

  } if (entry.trend === true) {
    if (isSubordinate) {
      return "Trend";
    }
      return `Trend: ${entry.baseLabel || entry.label || ""}`;

  } if (entry.rate === true) {
    if (isSubordinate) {
      return "Rate";
    }
      return `Rate: ${entry.baseLabel || entry.label || ""}`;

  } if (entry.delta === true) {
    if (isSubordinate) {
      return "Delta";
    }
      return `Delta: ${entry.baseLabel || entry.label || ""}`;

  } if (entry.summary === true) {
    const summaryLabel = String(entry.summaryType || "").toUpperCase();
    if (isSubordinate) {
      return summaryLabel;
    }
      return `${summaryLabel}: ${entry.baseLabel || entry.label || ""}`;

  } if (entry.threshold === true) {
    if (isSubordinate) {
      return "Threshold";
    }
      return `Threshold: ${entry.baseLabel || entry.label || ""}`;

  }
    return entry.label || "";

}

export function showLineChartTooltip(card, hover, clientX, clientY) {
  const tooltip = card.shadowRoot.getElementById("tooltip");
  const ttTime = card.shadowRoot.getElementById("tt-time");
  const ttValue = card.shadowRoot.getElementById("tt-value");
  const ttSeries = card.shadowRoot.getElementById("tt-series");
  const anomalyTooltip = card.shadowRoot.getElementById("anomaly-tooltip");
  const ttSecondaryTitle = card.shadowRoot.getElementById("tt-secondary-title");
  const ttSecondaryDescription = card.shadowRoot.getElementById("tt-secondary-description");
  const ttSecondaryAlert = card.shadowRoot.getElementById("tt-secondary-alert");
  const ttSecondaryInstruction = card.shadowRoot.getElementById("tt-secondary-instruction");
  const ttMessageRow = card.shadowRoot.getElementById("tt-message-row");
  const ttMsg = card.shadowRoot.getElementById("tt-message");
  const ttAnn = card.shadowRoot.getElementById("tt-annotation");
  const ttEntities = card.shadowRoot.getElementById("tt-entities");
  if (!tooltip || !ttTime || !ttValue || !ttMessageRow || !ttMsg || !ttAnn || !ttEntities) {
    return;
  }

  const rangeStartMs = Number.isFinite(hover.rangeStartMs) ? hover.rangeStartMs : hover.timeMs;
  const rangeEndMs = Number.isFinite(hover.rangeEndMs) ? hover.rangeEndMs : hover.timeMs;
  ttTime.textContent = rangeStartMs === rangeEndMs
    ? fmtDateTime(new Date(hover.timeMs).toISOString())
    : `${fmtDateTime(new Date(rangeStartMs).toISOString())} - ${fmtDateTime(new Date(rangeEndMs).toISOString())}`;

  const values = Array.isArray(hover.values) ? hover.values : [];
  const trendValues = Array.isArray(hover.trendValues) ? hover.trendValues : [];
  const rateValues = Array.isArray(hover.rateValues) ? hover.rateValues : [];
  const deltaValues = Array.isArray(hover.deltaValues) ? hover.deltaValues : [];
  const summaryValues = Array.isArray(hover.summaryValues) ? hover.summaryValues : [];
  const thresholdValues = Array.isArray(hover.thresholdValues) ? hover.thresholdValues : [];
  const binaryValues = Array.isArray(hover.binaryValues) ? hover.binaryValues : [];
  const comparisonValues = Array.isArray(hover.comparisonValues) ? hover.comparisonValues : [];
  const displayRows = [];
  const usedTrendRows = new Set();
  const usedRateRows = new Set();
  const usedDeltaRows = new Set();
  const usedSummaryRows = new Set();
  const usedThresholdRows = new Set();
  const usedComparisonRows = new Set();
  values.forEach((entry, index) => {
    displayRows.push(entry);
    trendValues.forEach((trendEntry, trendIndex) => {
      if (usedTrendRows.has(trendIndex)) {
        return;
      }
      const sameEntity = trendEntry.relatedEntityId && trendEntry.relatedEntityId === entry.entityId;
      const sameLabel = !trendEntry.relatedEntityId && trendEntry.baseLabel && trendEntry.baseLabel === entry.label;
      if (!sameEntity && !sameLabel) {
        return;
      }
      usedTrendRows.add(trendIndex);
      displayRows.push({
        ...trendEntry,
        rawVisible: trendEntry.rawVisible !== false,
        grouped: true,
        key: `trend-${index}-${trendIndex}`,
      });
    });
    rateValues.forEach((rateEntry, rateIndex) => {
      if (usedRateRows.has(rateIndex)) {
        return;
      }
      const sameEntity = rateEntry.relatedEntityId && rateEntry.relatedEntityId === entry.entityId;
      const sameLabel = !rateEntry.relatedEntityId && rateEntry.baseLabel && rateEntry.baseLabel === entry.label;
      if (!sameEntity && !sameLabel) {
        return;
      }
      usedRateRows.add(rateIndex);
      displayRows.push({
        ...rateEntry,
        rawVisible: rateEntry.rawVisible !== false,
        grouped: true,
        key: `rate-${index}-${rateIndex}`,
      });
    });
    deltaValues.forEach((deltaEntry, deltaIndex) => {
      if (usedDeltaRows.has(deltaIndex)) {
        return;
      }
      const sameEntity = deltaEntry.relatedEntityId && deltaEntry.relatedEntityId === entry.entityId;
      const sameLabel = !deltaEntry.relatedEntityId && deltaEntry.baseLabel && deltaEntry.baseLabel === entry.label;
      if (!sameEntity && !sameLabel) {
        return;
      }
      usedDeltaRows.add(deltaIndex);
      displayRows.push({
        ...deltaEntry,
        rawVisible: deltaEntry.rawVisible !== false,
        grouped: true,
        key: `delta-${index}-${deltaIndex}`,
      });
    });
    summaryValues.forEach((summaryEntry, summaryIndex) => {
      if (usedSummaryRows.has(summaryIndex)) {
        return;
      }
      const sameEntity = summaryEntry.relatedEntityId && summaryEntry.relatedEntityId === entry.entityId;
      const sameLabel = !summaryEntry.relatedEntityId && summaryEntry.baseLabel && summaryEntry.baseLabel === entry.label;
      if (!sameEntity && !sameLabel) {
        return;
      }
      usedSummaryRows.add(summaryIndex);
      displayRows.push({
        ...summaryEntry,
        rawVisible: summaryEntry.rawVisible !== false,
        grouped: true,
        key: `summary-${index}-${summaryIndex}`,
      });
    });
    thresholdValues.forEach((thresholdEntry, thresholdIndex) => {
      if (usedThresholdRows.has(thresholdIndex)) {
        return;
      }
      const sameEntity = thresholdEntry.relatedEntityId && thresholdEntry.relatedEntityId === entry.entityId;
      const sameLabel = !thresholdEntry.relatedEntityId && thresholdEntry.baseLabel && thresholdEntry.baseLabel === entry.label;
      if (!sameEntity && !sameLabel) {
        return;
      }
      usedThresholdRows.add(thresholdIndex);
      displayRows.push({
        ...thresholdEntry,
        rawVisible: thresholdEntry.rawVisible !== false,
        grouped: true,
        key: `threshold-${index}-${thresholdIndex}`,
      });
    });
    comparisonValues.forEach((compEntry, compIndex) => {
      if (usedComparisonRows.has(compIndex)) {
        return;
      }
      if (!compEntry.relatedEntityId || compEntry.relatedEntityId !== entry.entityId) {
        return;
      }
      usedComparisonRows.add(compIndex);
      displayRows.push({
        ...compEntry,
        grouped: true,
        comparison: true,
        key: `comparison-${index}-${compIndex}`,
      });
    });
  });
  trendValues.forEach((trendEntry, trendIndex) => {
    if (usedTrendRows.has(trendIndex)) {
      return;
    }
    displayRows.push({
      ...trendEntry,
      rawVisible: trendEntry.rawVisible !== false,
    });
  });
  rateValues.forEach((rateEntry, rateIndex) => {
    if (usedRateRows.has(rateIndex)) {
      return;
    }
    displayRows.push({
      ...rateEntry,
      rawVisible: rateEntry.rawVisible !== false,
    });
  });
  deltaValues.forEach((deltaEntry, deltaIndex) => {
    if (usedDeltaRows.has(deltaIndex)) {
      return;
    }
    displayRows.push({
      ...deltaEntry,
      rawVisible: deltaEntry.rawVisible !== false,
    });
  });
  summaryValues.forEach((summaryEntry, summaryIndex) => {
    if (usedSummaryRows.has(summaryIndex)) {
      return;
    }
    displayRows.push({
      ...summaryEntry,
      rawVisible: summaryEntry.rawVisible !== false,
    });
  });
  thresholdValues.forEach((thresholdEntry, thresholdIndex) => {
    if (usedThresholdRows.has(thresholdIndex)) {
      return;
    }
    displayRows.push({
      ...thresholdEntry,
      rawVisible: thresholdEntry.rawVisible !== false,
    });
  });
  comparisonValues.forEach((compEntry, compIndex) => {
    if (usedComparisonRows.has(compIndex)) {
      return;
    }
    displayRows.push({ ...compEntry, comparison: true });
  });
  displayRows.push(...binaryValues);
  const useSingleValueMode =
    values.length === 1
    && trendValues.length === 0
    && rateValues.length === 0
    && deltaValues.length === 0
    && summaryValues.length === 0
    && thresholdValues.length === 0
    && comparisonValues.length === 0
    && binaryValues.length === 0;
  if (useSingleValueMode) {
    const value = displayRows[0];
    ttValue.textContent = value ? formatTooltipDisplayValue(value.value, value.unit) : "";
    ttValue.style.display = value ? "block" : "none";
    if (ttSeries) {
      ttSeries.innerHTML = "";
      ttSeries.style.display = "none";
    }
  } else {
    ttValue.textContent = "";
    ttValue.style.display = "none";
    if (ttSeries) {
      ttSeries.innerHTML = displayRows.map((entry) => `
        <div class="tt-series-row ${entry.grouped === true && entry.rawVisible === true ? "subordinate" : ""}">
          <div class="tt-series-main">
            ${entry.grouped === true && entry.rawVisible === true
              ? ""
              : `<span class="tt-dot" style="background:${esc(entry.color || "#03a9f4")}"></span>`}
            <span class="tt-series-label">${esc(resolveTooltipSeriesLabel(entry))}</span>
          </div>
          <span class="tt-series-value">${esc(formatTooltipDisplayValue(entry.value, entry.unit))}</span>
        </div>
      `).join("");
      ttSeries.style.display = displayRows.length ? "grid" : "none";
    }
  }

  ttMessageRow.style.display = "none";
  ttMsg.textContent = "";
  ttAnn.textContent = "";
  ttAnn.style.display = "none";
  ttEntities.innerHTML = "";
  ttEntities.style.display = "none";

  if (anomalyTooltip && ttSecondaryTitle && ttSecondaryDescription && ttSecondaryAlert && ttSecondaryInstruction) {
    const anomalyContent = buildAnomalyTooltipContent(hover.anomalyRegions);
    if (anomalyContent) {
      ttSecondaryTitle.textContent = anomalyContent.title;
      ttSecondaryDescription.textContent = anomalyContent.description;
      ttSecondaryAlert.textContent = anomalyContent.alert;
      ttSecondaryInstruction.textContent = anomalyContent.instruction;
    } else {
      ttSecondaryTitle.textContent = "";
      ttSecondaryDescription.textContent = "";
      ttSecondaryAlert.textContent = "";
      ttSecondaryInstruction.textContent = "";
      anomalyTooltip.style.display = "none";
    }
  }

  const chartBounds = card.shadowRoot?.querySelector(".chart-wrap")?.getBoundingClientRect();
  positionTooltip(tooltip, clientX, clientY, chartBounds ? {
    left: chartBounds.left + 8,
    right: chartBounds.right - 8,
    top: chartBounds.top + 8,
    bottom: chartBounds.bottom - 8,
  } : null);
  if (anomalyTooltip && hover.anomalyRegions?.length > 0) {
    positionAnomalyTooltip(anomalyTooltip, clientX, clientY, tooltip, chartBounds ? {
      left: chartBounds.left + 8,
      right: chartBounds.right - 8,
      top: chartBounds.top + 8,
      bottom: chartBounds.bottom - 8,
    } : null);
  }
  if (Array.isArray(hover.events) && hover.events.length > 0) {
    renderAnnotationTooltips(card, hover, tooltip, chartBounds ? {
      left: chartBounds.left + 8,
      right: chartBounds.right - 8,
      top: chartBounds.top + 8,
      bottom: chartBounds.bottom - 8,
    } : null);
  } else {
    clearAnnotationTooltips(card);
  }
}

export function buildTooltipRelatedChips(hass, event) {
  const entities = Array.isArray(event?.entity_ids) ? event.entity_ids : [];
  const devices = Array.isArray(event?.device_ids) ? event.device_ids : [];
  const areas = Array.isArray(event?.area_ids) ? event.area_ids : [];
  const labels = Array.isArray(event?.label_ids) ? event.label_ids : [];
  const chips = [
    ...entities.map((id) => ({
      icon: entityIcon(hass, id),
      label: entityName(hass, id),
    })),
    ...devices.map((id) => ({
      icon: deviceIcon(hass, id),
      label: deviceName(hass, id),
    })),
    ...areas.map((id) => ({
      icon: areaIcon(hass, id),
      label: areaName(hass, id),
    })),
    ...labels.map((id) => ({
      icon: labelIcon(hass, id),
      label: labelName(hass, id),
    })),
  ].filter((chip) => chip.label);
  if (!chips.length) return "";
  return chips.map((chip) => `
    <span class="tt-entity-chip" title="${esc(chip.label)}">
      <ha-icon icon="${esc(chip.icon)}"></ha-icon>
      <span>${esc(chip.label)}</span>
    </span>
  `).join("");
}

export function showLineChartCrosshair(card, renderer, hover) {
  const overlay = card.shadowRoot.getElementById("chart-crosshair");
  const vertical = card.shadowRoot.getElementById("crosshair-vertical");
  const horizontal = card.shadowRoot.getElementById("crosshair-horizontal");
  const points = card.shadowRoot.getElementById("crosshair-points");
  const addButton = card.shadowRoot.getElementById("chart-add-annotation");
  if (!overlay || !vertical || !horizontal || !points) return;

  overlay.hidden = false;
  vertical.style.left = `${hover.x}px`;
  if (hover.splitVertical) {
    vertical.style.top = `${hover.splitVertical.top}px`;
    vertical.style.height = `${hover.splitVertical.height}px`;
  } else {
    vertical.style.top = `${renderer.pad.top}px`;
    vertical.style.height = `${renderer.ch}px`;
  }
  horizontal.hidden = true;
  const crosshairValues = [
    ...(hover.values || []),
    ...((hover.showTrendCrosshairs === true) ? (hover.trendValues || []).filter((entry) => entry.showCrosshair === true) : []),
    ...(hover.rateValues || []),
    ...(hover.comparisonValues || []),
  ];
  points.innerHTML = `
    ${crosshairValues.filter((entry) => entry.hasValue !== false).map((entry) => `
      <span
        class="crosshair-line horizontal series ${hover.emphasizeGuides ? "emphasized" : "subtle"}"
        style="top:${entry.y}px;color:${esc(entry.color || "#03a9f4")};opacity:${Number.isFinite(entry.opacity) ? entry.opacity : 1}"
      ></span>
    `).join("")}
    ${crosshairValues.filter((entry) => entry.hasValue !== false).map((entry) => `
    <span
      class="crosshair-point"
      style="left:${entry.x}px;top:${entry.y}px;background:${esc(entry.color || "#03a9f4")};opacity:${Number.isFinite(entry.opacity) ? entry.opacity : 1}"
    ></span>
    `).join("")}
  `;
  renderChartAxisHoverDots(card, crosshairValues);
  if (addButton) {
    addButton.hidden = false;
    addButton.style.left = `${hover.x}px`;
    if (hover.splitVertical) {
      addButton.style.top = `${hover.splitVertical.top + hover.splitVertical.height}px`;
    } else {
      addButton.style.top = `${renderer.pad.top + renderer.ch}px`;
    }
  }
}

export function dispatchLineChartHover(card, hover) {
  card.dispatchEvent(new CustomEvent("hass-datapoints-chart-hover", {
    bubbles: true,
    composed: true,
    detail: hover ? { timeMs: hover.timeMs } : { timeMs: null },
  }));
}

export function hideLineChartHover(card) {
  dispatchLineChartHover(card, null);
  hideTooltip(card);
  const overlay = card.shadowRoot.getElementById("chart-crosshair");
  const points = card.shadowRoot.getElementById("crosshair-points");
  const addButton = card.shadowRoot.getElementById("chart-add-annotation");
  if (overlay) overlay.hidden = true;
  if (points) points.innerHTML = "";
  renderChartAxisHoverDots(card, []);
  const horizontal = card.shadowRoot.getElementById("crosshair-horizontal");
  if (horizontal) horizontal.hidden = true;
  if (addButton) addButton.hidden = true;
}

export function attachLineChartHover(card, canvas, renderer, series, events, t0, t1, vMin, vMax, axes = null, options = {}) {
  if (!canvas || !renderer) return;
  if (card._chartHoverCleanup) {
    card._chartHoverCleanup();
    card._chartHoverCleanup = null;
  }

  const eventThresholdMs = renderer.cw ? 14 * ((t1 - t0) / renderer.cw) : 0;
  const binaryStates = Array.isArray(options.binaryStates) ? options.binaryStates : [];
  const comparisonSeries = Array.isArray(options.comparisonSeries) ? options.comparisonSeries : [];
  const trendSeries = Array.isArray(options.trendSeries) ? options.trendSeries : [];
  const rateSeries = Array.isArray(options.rateSeries) ? options.rateSeries : [];
  const deltaSeries = Array.isArray(options.deltaSeries) ? options.deltaSeries : [];
  const summarySeries = Array.isArray(options.summarySeries) ? options.summarySeries : [];
  const thresholdSeries = Array.isArray(options.thresholdSeries) ? options.thresholdSeries : [];
  const anomalyRegions = Array.isArray(options.anomalyRegions) ? options.anomalyRegions : [];
  if (!series?.length && !binaryStates.length && !comparisonSeries.length && !trendSeries.length && !rateSeries.length && !deltaSeries.length && !summarySeries.length && !thresholdSeries.length && !anomalyRegions.length) return;
  const hoverSurfaceEl = options.hoverSurfaceEl || null;
  const addAnnotationButton = card.shadowRoot?.getElementById("chart-add-annotation") || null;
  const findAnomalyRegions = (clientX, clientY) => {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return [];
    }
    const localX = clientX - rect.left;
    const localY = clientY - rect.top;
    const hits = [];
    for (const region of anomalyRegions) {
      const radiusX = Number(region?.radiusX) || 0;
      const radiusY = Number(region?.radiusY) || 0;
      if (radiusX <= 0 || radiusY <= 0) {
        continue;
      }
      const dx = (localX - region.centerX) / radiusX;
      const dy = (localY - region.centerY) / radiusY;
      if ((dx * dx) + (dy * dy) <= 1) {
        hits.push(region);
      }
    }
    return hits;
  };
  const buildHoverState = (clientX, clientY) => {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height || !renderer.cw || !renderer.ch) return null;

    const localX = clampChartValue(clientX - rect.left, renderer.pad.left, renderer.pad.left + renderer.cw);
    const localY = clampChartValue(clientY - rect.top, renderer.pad.top, renderer.pad.top + renderer.ch);
    const ratio = renderer.cw ? (localX - renderer.pad.left) / renderer.cw : 0;
    const timeMs = t0 + ratio * (t1 - t0);
    const x = renderer.xOf(timeMs, t0, t1);

    const values = series.map((seriesItem) => {
      const value = renderer._interpolateValue(seriesItem.pts, timeMs);
      const axis = seriesItem.axis || (axes && axes[0]) || { min: vMin, max: vMax };
      if (value == null) {
        return {
          entityId: seriesItem.entityId,
          label: seriesItem.label || seriesItem.entityId || "",
          value: null,
          unit: seriesItem.unit || "",
          color: seriesItem.color,
          opacity: Number.isFinite(seriesItem.hoverOpacity) ? seriesItem.hoverOpacity : 1,
          hasValue: false,
          axisSide: axis.side === "right" ? "right" : "left",
          axisSlot: Number.isFinite(axis.slot) ? axis.slot : 0,
        };
      }
      return {
        entityId: seriesItem.entityId,
        label: seriesItem.label || seriesItem.entityId || "",
        value,
        unit: seriesItem.unit || "",
        color: seriesItem.color,
        opacity: Number.isFinite(seriesItem.hoverOpacity) ? seriesItem.hoverOpacity : 1,
        hasValue: true,
        x,
        y: renderer.yOf(value, axis.min, axis.max),
        axisSide: axis.side === "right" ? "right" : "left",
        axisSlot: Number.isFinite(axis.slot) ? axis.slot : 0,
      };
    });

    const comparisonValues = comparisonSeries.map((seriesItem) => {
      const value = renderer._interpolateValue(seriesItem.pts, timeMs);
      const axis = seriesItem.axis || (axes && axes[0]) || { min: vMin, max: vMax };
      if (value == null) {
        return {
          entityId: seriesItem.entityId,
          label: seriesItem.label || seriesItem.entityId || "",
          value: null,
          unit: seriesItem.unit || "",
          color: seriesItem.color,
          opacity: Number.isFinite(seriesItem.hoverOpacity) ? seriesItem.hoverOpacity : 1,
          hasValue: false,
          axisSide: axis.side === "right" ? "right" : "left",
          axisSlot: Number.isFinite(axis.slot) ? axis.slot : 0,
        };
      }
      return {
        entityId: seriesItem.entityId,
        label: seriesItem.label || seriesItem.entityId || "",
        value,
        unit: seriesItem.unit || "",
        color: seriesItem.color,
        opacity: Number.isFinite(seriesItem.hoverOpacity) ? seriesItem.hoverOpacity : 1,
        hasValue: true,
        x,
        y: renderer.yOf(value, axis.min, axis.max),
        axisSide: axis.side === "right" ? "right" : "left",
        axisSlot: Number.isFinite(axis.slot) ? axis.slot : 0,
      };
    });

    const trendValues = trendSeries.map((seriesItem) => {
      const value = renderer._interpolateValue(seriesItem.pts, timeMs);
      const axis = seriesItem.axis || (axes && axes[0]) || { min: vMin, max: vMax };
      if (value == null) {
        return {
          entityId: seriesItem.entityId,
          relatedEntityId: seriesItem.relatedEntityId || "",
          label: seriesItem.label || seriesItem.entityId || "",
          baseLabel: seriesItem.baseLabel || "",
          value: null,
          unit: seriesItem.unit || "",
          color: seriesItem.color,
          opacity: Number.isFinite(seriesItem.hoverOpacity) ? seriesItem.hoverOpacity : 1,
          hasValue: false,
          axisSide: axis.side === "right" ? "right" : "left",
          axisSlot: Number.isFinite(axis.slot) ? axis.slot : 0,
          trend: true,
          rawVisible: seriesItem.rawVisible !== false,
          showCrosshair: seriesItem.showCrosshair === true,
        };
      }
      return {
        entityId: seriesItem.entityId,
        relatedEntityId: seriesItem.relatedEntityId || "",
        label: seriesItem.label || seriesItem.entityId || "",
        baseLabel: seriesItem.baseLabel || "",
        value,
        unit: seriesItem.unit || "",
        color: seriesItem.color,
        opacity: Number.isFinite(seriesItem.hoverOpacity) ? seriesItem.hoverOpacity : 1,
        hasValue: true,
        x,
        y: renderer.yOf(value, axis.min, axis.max),
        axisSide: axis.side === "right" ? "right" : "left",
        axisSlot: Number.isFinite(axis.slot) ? axis.slot : 0,
        trend: true,
        rawVisible: seriesItem.rawVisible !== false,
        showCrosshair: seriesItem.showCrosshair === true,
      };
    });
    const rateValues = rateSeries.map((seriesItem) => {
      const value = renderer._interpolateValue(seriesItem.pts, timeMs);
      const axis = seriesItem.axis || (axes && axes[0]) || { min: vMin, max: vMax };
      if (value == null) {
        return {
          entityId: seriesItem.entityId,
          relatedEntityId: seriesItem.relatedEntityId || "",
          label: seriesItem.label || seriesItem.entityId || "",
          baseLabel: seriesItem.baseLabel || "",
          value: null,
          unit: seriesItem.unit || "",
          color: seriesItem.color,
          opacity: Number.isFinite(seriesItem.hoverOpacity) ? seriesItem.hoverOpacity : 1,
          hasValue: false,
          axisSide: axis.side === "right" ? "right" : "left",
          axisSlot: Number.isFinite(axis.slot) ? axis.slot : 0,
          rate: true,
          rawVisible: seriesItem.rawVisible !== false,
        };
      }
      return {
        entityId: seriesItem.entityId,
        relatedEntityId: seriesItem.relatedEntityId || "",
        label: seriesItem.label || seriesItem.entityId || "",
        baseLabel: seriesItem.baseLabel || "",
        value,
        unit: seriesItem.unit || "",
        color: seriesItem.color,
        opacity: Number.isFinite(seriesItem.hoverOpacity) ? seriesItem.hoverOpacity : 1,
        hasValue: true,
        x,
        y: renderer.yOf(value, axis.min, axis.max),
        axisSide: axis.side === "right" ? "right" : "left",
        axisSlot: Number.isFinite(axis.slot) ? axis.slot : 0,
        rate: true,
        rawVisible: seriesItem.rawVisible !== false,
      };
    });
    const deltaValues = deltaSeries.map((seriesItem) => {
      const value = renderer._interpolateValue(seriesItem.pts, timeMs);
      const axis = seriesItem.axis || (axes && axes[0]) || { min: vMin, max: vMax };
      if (value == null) {
        return {
          entityId: seriesItem.entityId,
          relatedEntityId: seriesItem.relatedEntityId || "",
          label: seriesItem.label || seriesItem.entityId || "",
          baseLabel: seriesItem.baseLabel || "",
          value: null,
          unit: seriesItem.unit || "",
          color: seriesItem.color,
          opacity: Number.isFinite(seriesItem.hoverOpacity) ? seriesItem.hoverOpacity : 1,
          hasValue: false,
          axisSide: axis.side === "right" ? "right" : "left",
          axisSlot: Number.isFinite(axis.slot) ? axis.slot : 0,
          delta: true,
          rawVisible: seriesItem.rawVisible !== false,
        };
      }
      return {
        entityId: seriesItem.entityId,
        relatedEntityId: seriesItem.relatedEntityId || "",
        label: seriesItem.label || seriesItem.entityId || "",
        baseLabel: seriesItem.baseLabel || "",
        value,
        unit: seriesItem.unit || "",
        color: seriesItem.color,
        opacity: Number.isFinite(seriesItem.hoverOpacity) ? seriesItem.hoverOpacity : 1,
        hasValue: true,
        x,
        y: renderer.yOf(value, axis.min, axis.max),
        axisSide: axis.side === "right" ? "right" : "left",
        axisSlot: Number.isFinite(axis.slot) ? axis.slot : 0,
        delta: true,
        rawVisible: seriesItem.rawVisible !== false,
      };
    });
    const summaryValues = summarySeries.map((seriesItem) => {
      const axis = seriesItem.axis || (axes && axes[0]) || { min: vMin, max: vMax };
      const value = Number(seriesItem.value);
      if (!Number.isFinite(value)) {
        return {
          entityId: seriesItem.entityId,
          relatedEntityId: seriesItem.relatedEntityId || "",
          label: seriesItem.label || seriesItem.entityId || "",
          baseLabel: seriesItem.baseLabel || "",
          value: null,
          unit: seriesItem.unit || "",
          color: seriesItem.color,
          opacity: Number.isFinite(seriesItem.hoverOpacity) ? seriesItem.hoverOpacity : 1,
          hasValue: false,
          axisSide: axis.side === "right" ? "right" : "left",
          axisSlot: Number.isFinite(axis.slot) ? axis.slot : 0,
          summaryType: seriesItem.summaryType || "",
          summary: true,
          rawVisible: seriesItem.rawVisible !== false,
        };
      }
      return {
        entityId: seriesItem.entityId,
        relatedEntityId: seriesItem.relatedEntityId || "",
        label: seriesItem.label || seriesItem.entityId || "",
        baseLabel: seriesItem.baseLabel || "",
        value,
        unit: seriesItem.unit || "",
        color: seriesItem.color,
        opacity: Number.isFinite(seriesItem.hoverOpacity) ? seriesItem.hoverOpacity : 1,
        hasValue: true,
        axisSide: axis.side === "right" ? "right" : "left",
        axisSlot: Number.isFinite(axis.slot) ? axis.slot : 0,
        summaryType: seriesItem.summaryType || "",
        summary: true,
        rawVisible: seriesItem.rawVisible !== false,
      };
    });
    const thresholdValues = thresholdSeries.map((seriesItem) => {
      const axis = seriesItem.axis || (axes && axes[0]) || { min: vMin, max: vMax };
      const value = Number(seriesItem.value);
      if (!Number.isFinite(value)) {
        return {
          entityId: seriesItem.entityId,
          relatedEntityId: seriesItem.relatedEntityId || "",
          label: seriesItem.label || seriesItem.entityId || "",
          baseLabel: seriesItem.baseLabel || "",
          value: null,
          unit: seriesItem.unit || "",
          color: seriesItem.color,
          opacity: Number.isFinite(seriesItem.hoverOpacity) ? seriesItem.hoverOpacity : 1,
          hasValue: false,
          axisSide: axis.side === "right" ? "right" : "left",
          axisSlot: Number.isFinite(axis.slot) ? axis.slot : 0,
          threshold: true,
          rawVisible: seriesItem.rawVisible !== false,
        };
      }
      return {
        entityId: seriesItem.entityId,
        relatedEntityId: seriesItem.relatedEntityId || "",
        label: seriesItem.label || seriesItem.entityId || "",
        baseLabel: seriesItem.baseLabel || "",
        value,
        unit: seriesItem.unit || "",
        color: seriesItem.color,
        opacity: Number.isFinite(seriesItem.hoverOpacity) ? seriesItem.hoverOpacity : 1,
        hasValue: true,
        axisSide: axis.side === "right" ? "right" : "left",
        axisSlot: Number.isFinite(axis.slot) ? axis.slot : 0,
        threshold: true,
        rawVisible: seriesItem.rawVisible !== false,
      };
    });

    const plottedValues = [
      ...values.filter((entry) => entry?.hasValue !== false),
      ...comparisonValues.filter((entry) => entry?.hasValue !== false),
      ...rateValues.filter((entry) => entry?.hasValue !== false),
      ...((options.showTrendCrosshairs === true) ? trendValues.filter((entry) => entry?.hasValue !== false && entry.showCrosshair === true) : []),
    ];

    let rangeStartMs = timeMs;
    let rangeEndMs = timeMs;
    let primary = plottedValues[0] || null;
    if (primary) {
      for (const entry of plottedValues) {
        if (Math.abs(entry.y - localY) < Math.abs(primary.y - localY)) {
          primary = entry;
        }
      }
    }
    const activePrimarySeries = primary
      ? (series.find((seriesItem) => seriesItem.entityId === primary.entityId) || null)
      : null;
    if (activePrimarySeries?.pts?.length) {
      const pts = activePrimarySeries.pts;
      let previous = null;
      let next = null;
      let previousIndex = -1;
      let nextIndex = -1;
      for (let index = 0; index < pts.length; index += 1) {
        const point = pts[index];
        if (point[0] <= timeMs) previous = point;
        if (point[0] <= timeMs) previousIndex = index;
        if (point[0] >= timeMs) {
          next = point;
          nextIndex = index;
          break;
        }
      }
      if (previous && next) {
        const prevPrev = pts[Math.max(0, previousIndex - 1)] || previous;
        const nextNext = pts[Math.min(pts.length - 1, nextIndex + 1)] || next;
        rangeStartMs = previous === next ? previous[0] : Math.round((previous[0] + prevPrev[0]) / 2);
        rangeEndMs = previous === next ? next[0] : Math.round((next[0] + nextNext[0]) / 2);
      } else if (previous) {
        rangeStartMs = previous[0];
        rangeEndMs = previous[0];
      } else if (next) {
        rangeStartMs = next[0];
        rangeEndMs = next[0];
      }
    }

    const binaryValues = binaryStates.map((entry) => {
      const activeSpan = (entry.spans || []).find((span) => timeMs >= span.start && timeMs <= span.end);
      return {
        label: entry.label || entry.entityId || "",
        value: activeSpan ? (entry.onLabel || "on") : (entry.offLabel || "off"),
        unit: "",
        color: entry.color,
        active: !!activeSpan,
      };
    }).filter(Boolean);
    if (
      !values.length
      && !binaryValues.length
      && !trendValues.length
      && !rateValues.length
      && !deltaValues.length
      && !summaryValues.length
      && !thresholdValues.length
      && !comparisonValues.length
    ) {
      return null;
    }

    const fallbackY = renderer.pad.top + 12;
    const hoverY = primary ? primary.y : fallbackY;

    const hoveredEvents = [];
    for (const event of events || []) {
      const eventTime = new Date(event.timestamp).getTime();
      if (eventTime < t0 || eventTime > t1) {
        continue;
      }
      const distance = Math.abs(eventTime - timeMs);
      if (distance <= eventThresholdMs) {
        hoveredEvents.push({
          ...event,
          _hoverDistanceMs: distance,
        });
      }
    }
    hoveredEvents.sort((left, right) => {
      const distanceDelta = (left._hoverDistanceMs || 0) - (right._hoverDistanceMs || 0);
      if (distanceDelta !== 0) {
        return distanceDelta;
      }
      return new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime();
    });
    const normalizedHoveredEvents = hoveredEvents.map(({ _hoverDistanceMs, ...event }) => event);

    return {
      x,
      y: hoverY,
      timeMs,
      rangeStartMs,
      rangeEndMs,
      values,
      trendValues,
      rateValues,
      deltaValues: options.showDeltaTooltip === true ? deltaValues : [],
      summaryValues,
      thresholdValues,
      comparisonValues,
      binaryValues,
      primary,
      event: normalizedHoveredEvents[0] || null,
      events: normalizedHoveredEvents,
      emphasizeGuides: options.emphasizeHoverGuides === true,
      showTrendCrosshairs: options.showTrendCrosshairs === true,
      hideRawData: options.hideRawData === true,
    };
  };

  const showFromPointer = (clientX, clientY) => {
    if (card._chartZoomDragging) return;
    const anomalyRegionsHit = findAnomalyRegions(clientX, clientY);
    const hover = buildHoverState(clientX, clientY);
    if (!hover) {
      card._chartLastHover = null;
      hideLineChartHover(card);
      canvas.style.cursor = "default";
      return;
    }
    hover.anomalyRegions = anomalyRegionsHit;
    card._chartLastHover = hover;
    showLineChartCrosshair(card, renderer, hover);
    if (options.showTooltip !== false || (Array.isArray(hover.events) && hover.events.length > 0)) {
      showLineChartTooltip(card, hover, clientX, clientY);
    } else {
      hideTooltip(card);
    }
    dispatchLineChartHover(card, hover);
    canvas.style.cursor = anomalyRegionsHit.length > 0 ? "pointer" : "crosshair";
  };

  const hideHover = () => {
    card._chartLastHover = null;
    hideLineChartHover(card);
    canvas.style.cursor = "default";
  };

  const onMouseMove = (ev) => showFromPointer(ev.clientX, ev.clientY);
  const onMouseLeave = (ev) => {
    const nextTarget = ev.relatedTarget;
    if (nextTarget && hoverSurfaceEl && hoverSurfaceEl.contains(nextTarget)) return;
    if (nextTarget && addAnnotationButton && addAnnotationButton.contains(nextTarget)) return;
    hideHover();
  };
  const onOverlayMove = (ev) => showFromPointer(ev.clientX, ev.clientY);
  const onOverlayLeave = (ev) => {
    const nextTarget = ev.relatedTarget;
    if (nextTarget && canvas.contains(nextTarget)) return;
    if (nextTarget && addAnnotationButton && addAnnotationButton.contains(nextTarget)) return;
    hideHover();
  };
  const onAddButtonLeave = (ev) => {
    const nextTarget = ev.relatedTarget;
    if (nextTarget && (canvas.contains(nextTarget) || (hoverSurfaceEl && hoverSurfaceEl.contains(nextTarget)))) return;
    hideHover();
  };
  const onAddButtonClick = (ev) => {
    if (typeof options.onAddAnnotation !== "function" || !card._chartLastHover) return;
    ev.preventDefault();
    ev.stopPropagation();
    options.onAddAnnotation(card._chartLastHover, ev);
  };
  const onContextMenu = (ev) => {
    if (typeof options.onContextMenu !== "function") return;
    const hover = buildHoverState(ev.clientX, ev.clientY);
    if (!hover) return;
    ev.preventDefault();
    card._chartLastHover = hover;
    showLineChartCrosshair(card, renderer, hover);
    showLineChartTooltip(card, hover, ev.clientX, ev.clientY);
    dispatchLineChartHover(card, hover);
    options.onContextMenu(hover, ev);
  };
  const onClick = (ev) => {
    if (typeof options.onAnomalyClick !== "function") {
      return;
    }
    const regions = findAnomalyRegions(ev.clientX, ev.clientY);
    if (!regions.length) {
      return;
    }
    ev.preventDefault();
    ev.stopPropagation();
    options.onAnomalyClick(regions, ev);
  };

  let touchTimer = null;
  const scheduleTouchHide = () => {
    if (touchTimer) window.clearTimeout(touchTimer);
    touchTimer = window.setTimeout(() => hideHover(), 1800);
  };
  const onTouchStart = (ev) => {
    ev.preventDefault();
    const touch = ev.touches[0];
    if (!touch) return;
    showFromPointer(touch.clientX, touch.clientY);
    scheduleTouchHide();
  };
  const onTouchMove = (ev) => {
    ev.preventDefault();
    const touch = ev.touches[0];
    if (!touch) return;
    showFromPointer(touch.clientX, touch.clientY);
    scheduleTouchHide();
  };
  const onTouchEnd = () => scheduleTouchHide();

  canvas.addEventListener("mousemove", onMouseMove);
  canvas.addEventListener("mouseleave", onMouseLeave);
  canvas.addEventListener("click", onClick);
  canvas.addEventListener("contextmenu", onContextMenu);
  canvas.addEventListener("touchstart", onTouchStart, { passive: false });
  canvas.addEventListener("touchmove", onTouchMove, { passive: false });
  canvas.addEventListener("touchend", onTouchEnd);
  canvas.addEventListener("touchcancel", onTouchEnd);
  hoverSurfaceEl?.addEventListener("mousemove", onOverlayMove);
  hoverSurfaceEl?.addEventListener("mouseleave", onOverlayLeave);
  addAnnotationButton?.addEventListener("mouseleave", onAddButtonLeave);
  addAnnotationButton?.addEventListener("click", onAddButtonClick);

  card._chartHoverCleanup = () => {
    canvas.removeEventListener("mousemove", onMouseMove);
    canvas.removeEventListener("mouseleave", onMouseLeave);
    canvas.removeEventListener("click", onClick);
    canvas.removeEventListener("contextmenu", onContextMenu);
    canvas.removeEventListener("touchstart", onTouchStart);
    canvas.removeEventListener("touchmove", onTouchMove);
    canvas.removeEventListener("touchend", onTouchEnd);
    canvas.removeEventListener("touchcancel", onTouchEnd);
    hoverSurfaceEl?.removeEventListener("mousemove", onOverlayMove);
    hoverSurfaceEl?.removeEventListener("mouseleave", onOverlayLeave);
    addAnnotationButton?.removeEventListener("mouseleave", onAddButtonLeave);
    addAnnotationButton?.removeEventListener("click", onAddButtonClick);
    if (touchTimer) {
      window.clearTimeout(touchTimer);
      touchTimer = null;
    }
    hideHover();
  };
}

export function attachLineChartRangeZoom(card, canvas, renderer, t0, t1, options = {}) {
  if (!canvas || !renderer) return;
  if (card._chartZoomCleanup) {
    card._chartZoomCleanup();
    card._chartZoomCleanup = null;
  }

  const selection = card.shadowRoot.getElementById("chart-zoom-selection");
  if (!selection) return;

  let pointerId = null;
  let startX = 0;
  let currentX = 0;
  let dragging = false;

  const hideSelection = () => {
    selection.hidden = true;
    selection.classList.remove("visible");
  };

  const clientXToTime = (clientX) => {
    const rect = canvas.getBoundingClientRect();
    const localX = clampChartValue(clientX - rect.left, renderer.pad.left, renderer.pad.left + renderer.cw);
    const ratio = renderer.cw ? (localX - renderer.pad.left) / renderer.cw : 0;
    return t0 + ratio * (t1 - t0);
  };

  const inPlotBounds = (clientX, clientY) => {
    const rect = canvas.getBoundingClientRect();
    const localX = clientX - rect.left;
    const localY = clientY - rect.top;
    return localX >= renderer.pad.left
      && localX <= renderer.pad.left + renderer.cw
      && localY >= renderer.pad.top
      && localY <= renderer.pad.top + renderer.ch;
  };

  const renderSelection = () => {
    const left = Math.min(startX, currentX);
    const width = Math.abs(currentX - startX);
    selection.style.left = `${left}px`;
    selection.style.top = `${renderer.pad.top}px`;
    selection.style.width = `${width}px`;
    selection.style.height = `${renderer.ch}px`;
    selection.hidden = false;
    selection.classList.add("visible");
  };

  const emitPreview = () => {
    if (!dragging || Math.abs(currentX - startX) < 8) {
      options.onPreview?.(null);
      return;
    }
    const rectLeft = canvas.getBoundingClientRect().left;
    const startTime = Math.min(
      clientXToTime(rectLeft + startX),
      clientXToTime(rectLeft + currentX),
    );
    const endTime = Math.max(
      clientXToTime(rectLeft + startX),
      clientXToTime(rectLeft + currentX),
    );
    options.onPreview?.({ startTime, endTime });
  };

  const resetDragging = (clearPreview = true) => {
    pointerId = null;
    dragging = false;
    card._chartZoomDragging = false;
    hideSelection();
    if (clearPreview) options.onPreview?.(null);
  };

  const onPointerMove = (ev) => {
    if (pointerId == null || ev.pointerId !== pointerId) return;
    currentX = clampChartValue(ev.clientX - canvas.getBoundingClientRect().left, renderer.pad.left, renderer.pad.left + renderer.cw);
    const movedPx = Math.abs(currentX - startX);
    if (!dragging && movedPx < 6) return;
    dragging = true;
    card._chartZoomDragging = true;
    hideLineChartHover(card);
    renderSelection();
    emitPreview();
    ev.preventDefault();
  };

  const finish = (ev) => {
    if (pointerId == null || ev.pointerId !== pointerId) return;
    const didDrag = dragging;
    const endX = currentX;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", finish);
    window.removeEventListener("pointercancel", finish);
    if (!didDrag || Math.abs(endX - startX) < 8) {
      resetDragging(true);
      return;
    }
    const rectLeft = canvas.getBoundingClientRect().left;
    const startTime = Math.min(clientXToTime(rectLeft + startX), clientXToTime(rectLeft + endX));
    const endTime = Math.max(clientXToTime(rectLeft + startX), clientXToTime(rectLeft + endX));
    options.onZoom?.({ startTime, endTime });
    resetDragging(false);
  };

  const onPointerDown = (ev) => {
    if (ev.button !== 0 || !inPlotBounds(ev.clientX, ev.clientY)) return;
    pointerId = ev.pointerId;
    const rect = canvas.getBoundingClientRect();
    startX = clampChartValue(ev.clientX - rect.left, renderer.pad.left, renderer.pad.left + renderer.cw);
    currentX = startX;
    dragging = false;
    card._chartZoomDragging = false;
    options.onPreview?.(null);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
  };

  const onDoubleClick = (ev) => {
    if (!inPlotBounds(ev.clientX, ev.clientY)) return;
    if (!options.onReset) return;
    ev.preventDefault();
    options.onReset();
  };

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("dblclick", onDoubleClick);

  card._chartZoomCleanup = () => {
    canvas.removeEventListener("pointerdown", onPointerDown);
    canvas.removeEventListener("dblclick", onDoubleClick);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", finish);
    window.removeEventListener("pointercancel", finish);
    resetDragging();
  };
}

export function attachTooltipBehaviour(card, canvas, renderer, events, t0, t1) {
  function findNearest(clientX) {
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const msPerPx = (t1 - t0) / renderer.cw;
    const threshold = 14 * msPerPx;
    const tAtX = t0 + ((x - renderer.pad.left) / renderer.cw) * (t1 - t0);

    let best = null;
    let bestDist = Infinity;
    for (const ev of events) {
      const t = new Date(ev.timestamp).getTime();
      if (t < t0 || t > t1) continue;
      const d = Math.abs(t - tAtX);
      if (d < threshold && d < bestDist) {
        bestDist = d;
        best = ev;
      }
    }
    return best;
  }

  canvas.addEventListener("mousemove", (e) => {
    const best = findNearest(e.clientX);
    if (best) {
      showTooltip(card, canvas, renderer, best, e.clientX, e.clientY);
      canvas.style.cursor = "pointer";
    } else {
      hideTooltip(card);
      canvas.style.cursor = "default";
    }
  });

  canvas.addEventListener("mouseleave", () => hideTooltip(card));

  let touchTimer = null;
  canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const best = findNearest(touch.clientX);
    if (best) {
      showTooltip(card, canvas, renderer, best, touch.clientX, touch.clientY);
      clearTimeout(touchTimer);
      touchTimer = setTimeout(() => hideTooltip(card), 3000);
    } else {
      hideTooltip(card);
    }
  }, { passive: false });

  canvas.addEventListener("touchmove", (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const best = findNearest(touch.clientX);
    if (best) {
      showTooltip(card, canvas, renderer, best, touch.clientX, touch.clientY);
      clearTimeout(touchTimer);
      touchTimer = setTimeout(() => hideTooltip(card), 3000);
    } else {
      hideTooltip(card);
    }
  }, { passive: false });
}
