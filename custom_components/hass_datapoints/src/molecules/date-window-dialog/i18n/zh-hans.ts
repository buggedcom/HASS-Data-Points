import type { ComponentTranslations } from "@/lib/i18n/types";

export const translations: ComponentTranslations = {
  Name: "名称",
  "e.g. Heating season start": "例如：供暖季开始",
  "Date range": "日期范围",
  Start: "开始",
  End: "结束",
  "Use previous range": "使用上一个范围",
  "Use next range": "使用下一个范围",
  "Delete date window": "删除日期窗口",
  "Enter a name for this date window.": "请为此日期窗口输入名称。",
  "The start date must be before the end date.": "开始日期必须早于结束日期。",
  Cancel: "取消",
  "A date window saves a date range as a tab, either fixed dates or a period relative to the selected range, so you can preview it against the selected range or jump the chart to it.":
    "日期窗口将一个日期范围保存为标签页，可以是固定日期，也可以是相对于所选范围的时段，方便与所选范围对比或将图表跳转到该范围。",
  Type: "类型",
  "Fixed dates": "固定日期",
  "Relative to selected range": "相对于所选范围",
  Period: "时段",
  Currently: "当前",
  "No data yet for this period while the chart is up to date.":
    "图表保持最新时，此时段尚无数据。",
  "The window always has the same length as the selected range and moves with it.":
    "窗口始终与所选范围等长，并随之移动。",
};
