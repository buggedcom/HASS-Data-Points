export interface RangeZoomConfig {
  baselineMs: number;
  boundsUnit: string;
  contextUnit: string;
  detailUnit?: string;
  detailStep?: number;
  majorUnit: string;
  labelUnit: string;
  minorUnit: string;
  pixelsPerUnit: number;
}

export interface RangeBounds {
  min: number;
  max: number;
  config: RangeZoomConfig;
}
