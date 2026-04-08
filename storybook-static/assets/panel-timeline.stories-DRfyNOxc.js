import{b as e}from"./iframe-maWesKjk.js";import"./panel-timeline-DIdy8ac-.js";import"./preload-helper-PPVm8Dsz.js";import"./property-DyW-YDBW.js";import"./state-D8ZE3MQ0.js";import"./range-timeline-kmNm3Bww.js";import"./localize-Cz1ya3ms.js";import"./range-handle-B7j9y8oM.js";import"./localized-decorator-CXjGGqe_.js";const v=new Date("2024-01-15T00:00:00Z"),$={baselineMs:48*36e5,boundsUnit:"hour",contextUnit:"day",majorUnit:"hour",labelUnit:"hour",minorUnit:"hour",pixelsPerUnit:9},u={baselineMs:28*864e5,boundsUnit:"day",contextUnit:"month",detailUnit:"hour",detailStep:12,majorUnit:"day",labelUnit:"day",minorUnit:"day",pixelsPerUnit:30},n={min:v.getTime()-3*864e5,max:v.getTime()+3*864e5,config:$},h={min:v.getTime()-10*864e5,max:v.getTime()+10*864e5,config:u},t=new Date("2024-01-15T08:00:00Z"),a=new Date("2024-01-15T20:00:00Z"),g=[{timestamp:new Date("2024-01-14T09:30:00Z"),color:"#03a9f4"},{timestamp:new Date("2024-01-15T14:15:00Z"),color:"#ff9800"},{timestamp:new Date("2024-01-16T06:45:00Z"),color:"#4caf50"}],B={title:"Molecules/Panel Timeline",component:"panel-timeline",parameters:{actions:{handles:["dp-range-draft","dp-range-commit","dp-range-period-select","dp-range-period-hover","dp-range-period-leave","dp-range-scroll"]},layout:"padded",docs:{description:{component:"`panel-timeline` wraps `range-timeline` and adds the panel-history-specific\noverlay layers: hover preview, comparison preview, zoom highlights, chart hover\nlines, and event dots.\n\nAll `dp-range-*` events from the inner atom bubble through naturally."}}},argTypes:{zoomLevel:{control:"select",options:["day","week_expanded","week_compressed","month_short","month_expanded","month_compressed","quarterly"]},dateSnapping:{control:"select",options:["auto","hour","day","week","month"]},isLiveEdge:{control:"boolean"},chartHoverTimeMs:{control:"number",description:"Timestamp (ms) of chart hover line. Set to null to hide."},chartHoverWindowTimeMs:{control:"number",description:"Timestamp (ms) of comparison chart hover line."}},args:{zoomLevel:"day",dateSnapping:"auto",isLiveEdge:!1,chartHoverTimeMs:null,chartHoverWindowTimeMs:null},render:i=>e`
    <div style="display: flex; padding: 8px 0;">
      <panel-timeline
        .startTime=${t}
        .endTime=${a}
        .rangeBounds=${n}
        .zoomLevel=${i.zoomLevel}
        .dateSnapping=${i.dateSnapping}
        .isLiveEdge=${i.isLiveEdge}
        .chartHoverTimeMs=${i.chartHoverTimeMs??null}
        .chartHoverWindowTimeMs=${i.chartHoverWindowTimeMs??null}
        .events=${[]}
      ></panel-timeline>
    </div>
  `},r={},o={render:()=>e`
    <div style="display: flex; padding: 8px 0;">
      <panel-timeline
        .startTime=${new Date("2024-01-15T06:00:00Z")}
        .endTime=${new Date("2024-01-15T23:59:00Z")}
        .rangeBounds=${n}
        zoomLevel="day"
        dateSnapping="auto"
        .isLiveEdge=${!0}
        .events=${[]}
      ></panel-timeline>
    </div>
  `},s={render:()=>e`
    <div style="display: flex; padding: 8px 0;">
      <panel-timeline
        .startTime=${t}
        .endTime=${a}
        .rangeBounds=${n}
        zoomLevel="day"
        dateSnapping="auto"
        .chartHoverTimeMs=${new Date("2024-01-15T12:00:00Z").getTime()}
        .events=${[]}
      ></panel-timeline>
    </div>
  `},d={render:()=>e`
    <div style="display: flex; padding: 8px 0;">
      <panel-timeline
        .startTime=${t}
        .endTime=${a}
        .rangeBounds=${n}
        zoomLevel="day"
        dateSnapping="auto"
        .chartHoverTimeMs=${new Date("2024-01-15T12:00:00Z").getTime()}
        .chartHoverWindowTimeMs=${new Date("2024-01-14T12:00:00Z").getTime()}
        .events=${[]}
      ></panel-timeline>
    </div>
  `},m={render:()=>e`
    <div style="display: flex; padding: 8px 0;">
      <panel-timeline
        .startTime=${t}
        .endTime=${a}
        .rangeBounds=${n}
        zoomLevel="day"
        dateSnapping="auto"
        .comparisonPreview=${{start:new Date("2024-01-14T08:00:00Z").getTime(),end:new Date("2024-01-14T20:00:00Z").getTime()}}
        .events=${[]}
      ></panel-timeline>
    </div>
  `},p={render:()=>e`
    <div style="display: flex; padding: 8px 0;">
      <panel-timeline
        .startTime=${t}
        .endTime=${a}
        .rangeBounds=${n}
        zoomLevel="day"
        dateSnapping="auto"
        .zoomRange=${{start:new Date("2024-01-15T10:00:00Z").getTime(),end:new Date("2024-01-15T14:00:00Z").getTime()}}
        .events=${[]}
      ></panel-timeline>
    </div>
  `},l={render:()=>e`
    <div style="display: flex; padding: 8px 0;">
      <panel-timeline
        .startTime=${t}
        .endTime=${a}
        .rangeBounds=${n}
        zoomLevel="day"
        dateSnapping="auto"
        .events=${g}
      ></panel-timeline>
    </div>
  `},c={render:()=>e`
    <div style="display: flex; padding: 8px 0;">
      <panel-timeline
        .startTime=${new Date("2024-01-13T00:00:00Z")}
        .endTime=${new Date("2024-01-16T00:00:00Z")}
        .rangeBounds=${h}
        zoomLevel="week_expanded"
        dateSnapping="day"
        .events=${g}
      ></panel-timeline>
    </div>
  `},T={render:()=>e`
    <div style="display: flex; padding: 8px 0;">
      <panel-timeline
        .startTime=${t}
        .endTime=${a}
        .rangeBounds=${n}
        zoomLevel="day"
        dateSnapping="auto"
        .comparisonPreview=${{start:new Date("2024-01-14T08:00:00Z").getTime(),end:new Date("2024-01-14T20:00:00Z").getTime()}}
        .zoomRange=${{start:new Date("2024-01-15T10:00:00Z").getTime(),end:new Date("2024-01-15T14:00:00Z").getTime()}}
        .chartHoverTimeMs=${new Date("2024-01-15T12:00:00Z").getTime()}
        .events=${g}
      ></panel-timeline>
    </div>
  `};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:"{}",...r.parameters?.docs?.source},description:{story:"Default day-level timeline with no overlays active.",...r.parameters?.docs?.description}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <div style="display: flex; padding: 8px 0;">
      <panel-timeline
        .startTime=\${new Date("2024-01-15T06:00:00Z")}
        .endTime=\${new Date("2024-01-15T23:59:00Z")}
        .rangeBounds=\${DAY_BOUNDS}
        zoomLevel="day"
        dateSnapping="auto"
        .isLiveEdge=\${true}
        .events=\${[]}
      ></panel-timeline>
    </div>
  \`
}`,...o.parameters?.docs?.source},description:{story:"End handle shows live-edge breathing animation.",...o.parameters?.docs?.description}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <div style="display: flex; padding: 8px 0;">
      <panel-timeline
        .startTime=\${START}
        .endTime=\${END}
        .rangeBounds=\${DAY_BOUNDS}
        zoomLevel="day"
        dateSnapping="auto"
        .chartHoverTimeMs=\${new Date("2024-01-15T12:00:00Z").getTime()}
        .events=\${[]}
      ></panel-timeline>
    </div>
  \`
}`,...s.parameters?.docs?.source},description:{story:"Chart hover line visible at a specific timestamp.",...s.parameters?.docs?.description}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <div style="display: flex; padding: 8px 0;">
      <panel-timeline
        .startTime=\${START}
        .endTime=\${END}
        .rangeBounds=\${DAY_BOUNDS}
        zoomLevel="day"
        dateSnapping="auto"
        .chartHoverTimeMs=\${new Date("2024-01-15T12:00:00Z").getTime()}
        .chartHoverWindowTimeMs=\${new Date("2024-01-14T12:00:00Z").getTime()}
        .events=\${[]}
      ></panel-timeline>
    </div>
  \`
}`,...d.parameters?.docs?.source},description:{story:"Both chart hover line and comparison window hover line visible.",...d.parameters?.docs?.description}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <div style="display: flex; padding: 8px 0;">
      <panel-timeline
        .startTime=\${START}
        .endTime=\${END}
        .rangeBounds=\${DAY_BOUNDS}
        zoomLevel="day"
        dateSnapping="auto"
        .comparisonPreview=\${{
    start: new Date("2024-01-14T08:00:00Z").getTime(),
    end: new Date("2024-01-14T20:00:00Z").getTime()
  }}
        .events=\${[]}
      ></panel-timeline>
    </div>
  \`
}`,...m.parameters?.docs?.source},description:{story:"Comparison window preview band.",...m.parameters?.docs?.description}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <div style="display: flex; padding: 8px 0;">
      <panel-timeline
        .startTime=\${START}
        .endTime=\${END}
        .rangeBounds=\${DAY_BOUNDS}
        zoomLevel="day"
        dateSnapping="auto"
        .zoomRange=\${{
    start: new Date("2024-01-15T10:00:00Z").getTime(),
    end: new Date("2024-01-15T14:00:00Z").getTime()
  }}
        .events=\${[]}
      ></panel-timeline>
    </div>
  \`
}`,...p.parameters?.docs?.source},description:{story:"Zoom highlight band — shown when a chart zoom is active.",...p.parameters?.docs?.description}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <div style="display: flex; padding: 8px 0;">
      <panel-timeline
        .startTime=\${START}
        .endTime=\${END}
        .rangeBounds=\${DAY_BOUNDS}
        zoomLevel="day"
        dateSnapping="auto"
        .events=\${SAMPLE_EVENTS}
      ></panel-timeline>
    </div>
  \`
}`,...l.parameters?.docs?.source},description:{story:"Event dots rendered on the timeline.",...l.parameters?.docs?.description}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <div style="display: flex; padding: 8px 0;">
      <panel-timeline
        .startTime=\${new Date("2024-01-13T00:00:00Z")}
        .endTime=\${new Date("2024-01-16T00:00:00Z")}
        .rangeBounds=\${WEEK_BOUNDS}
        zoomLevel="week_expanded"
        dateSnapping="day"
        .events=\${SAMPLE_EVENTS}
      ></panel-timeline>
    </div>
  \`
}`,...c.parameters?.docs?.source},description:{story:"Week-expanded zoom with events.",...c.parameters?.docs?.description}}};T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <div style="display: flex; padding: 8px 0;">
      <panel-timeline
        .startTime=\${START}
        .endTime=\${END}
        .rangeBounds=\${DAY_BOUNDS}
        zoomLevel="day"
        dateSnapping="auto"
        .comparisonPreview=\${{
    start: new Date("2024-01-14T08:00:00Z").getTime(),
    end: new Date("2024-01-14T20:00:00Z").getTime()
  }}
        .zoomRange=\${{
    start: new Date("2024-01-15T10:00:00Z").getTime(),
    end: new Date("2024-01-15T14:00:00Z").getTime()
  }}
        .chartHoverTimeMs=\${new Date("2024-01-15T12:00:00Z").getTime()}
        .events=\${SAMPLE_EVENTS}
      ></panel-timeline>
    </div>
  \`
}`,...T.parameters?.docs?.source},description:{story:"All overlays visible simultaneously.",...T.parameters?.docs?.description}}};const z=["Default","LiveEdge","ChartHoverLine","ChartHoverWithComparisonLine","ComparisonPreview","ZoomHighlight","WithEvents","WeekWithEvents","AllOverlays"];export{T as AllOverlays,s as ChartHoverLine,d as ChartHoverWithComparisonLine,m as ComparisonPreview,r as Default,o as LiveEdge,c as WeekWithEvents,l as WithEvents,p as ZoomHighlight,z as __namedExportsOrder,B as default};
