import type { ComponentTranslations } from "@/lib/i18n/types";

export const translations: ComponentTranslations = {
  Unverified: "未验证",
  Retry: "重试",
  "Anomaly activity timed out.": "异常活动加载超时。",
  "Anomaly detection is busy.": "异常检测正忙。",
  "Anomaly activity was cancelled.": "异常活动已取消。",
  "Anomaly activity could not be loaded.": "无法加载异常活动。",
  "Anomaly details could not be loaded.": "无法加载异常详情。",
  "Counts are from the last successful scan, {0}.":
    "计数来自上次成功的扫描（{0}）。",
  "No successful scan yet.": "尚无成功的扫描。",
  "Waiting for a scan with the current settings.":
    "正在等待使用当前设置进行扫描。",
  "The latest scan timed out.": "最近一次扫描超时。",
  "The latest scan was skipped because detection was busy.":
    "由于检测繁忙，已跳过最近一次扫描。",
  "The latest scan was cancelled.": "最近一次扫描已取消。",
  "The latest scan failed.": "最近一次扫描失败。",
  "Showing the previous result for this range.": "正在显示此范围的上一个结果。",
  "Activity for this range is unavailable.": "此范围的活动不可用。",
};
