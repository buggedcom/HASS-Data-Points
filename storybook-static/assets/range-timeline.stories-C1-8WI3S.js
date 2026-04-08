import{b as t}from"./iframe-maWesKjk.js";import"./range-timeline-kmNm3Bww.js";import"./preload-helper-PPVm8Dsz.js";import"./property-DyW-YDBW.js";import"./localize-Cz1ya3ms.js";import"./range-handle-B7j9y8oM.js";import"./localized-decorator-CXjGGqe_.js";const g=new Date("2024-01-15T00:00:00Z");function c(n){const p={day:{baselineMs:1728e5,boundsUnit:"hour",contextUnit:"day",majorUnit:"hour",labelUnit:"hour",minorUnit:"hour",pixelsPerUnit:9},week_expanded:{baselineMs:24192e5,boundsUnit:"day",contextUnit:"month",detailUnit:"hour",detailStep:12,majorUnit:"day",labelUnit:"day",minorUnit:"day",pixelsPerUnit:30},month_short:{baselineMs:15552e6,boundsUnit:"week",contextUnit:"month",detailUnit:"day",majorUnit:"week",labelUnit:"week",minorUnit:"week",pixelsPerUnit:54}},m=p[n]??p.day,T=g.getTime()-3*864e5,h=g.getTime()+3*864e5;return{min:T,max:h,config:m}}const e=c("day"),y=c("week_expanded"),D=c("month_short"),u=new Date("2024-01-15T08:00:00Z"),v=new Date("2024-01-15T20:00:00Z"),_={title:"Atoms/Interactive/Range Timeline",component:"range-timeline",parameters:{actions:{handles:["dp-range-draft","dp-range-commit","dp-range-period-select","dp-range-period-hover","dp-range-period-leave","dp-range-scroll"]},layout:"padded",docs:{description:{component:'`range-timeline` is a scrollable, interactive time range slider atom.\n\nThe parent provides pre-computed `rangeBounds`, the effective `zoomLevel`,\n`dateSnapping`, and `startTime`/`endTime`. Panel-specific overlays are\ninjected via `<slot name="timeline-overlays">` and `<slot name="track-overlays">`.\n\n@fires dp-range-draft         - `{ start, end }` on each drag frame\n@fires dp-range-commit        - `{ start, end, push }` on drag complete\n@fires dp-range-period-select - `{ unit, startTime }` period button clicked\n@fires dp-range-period-hover  - `{ start, end }` period button hovered\n@fires dp-range-period-leave  - period button left\n@fires dp-range-scroll        - viewport scrolled'}}},argTypes:{zoomLevel:{control:"select",options:["day","week_expanded","week_compressed","month_short","month_expanded","month_compressed","quarterly"],description:"Resolved zoom level (no 'auto' — parent derives this)."},dateSnapping:{control:"select",options:["auto","hour","day","week","month"],description:"Snap unit for dragging handles."},isLiveEdge:{control:"boolean",description:"When true the end handle shows a red breathing animation."}},args:{zoomLevel:"day",dateSnapping:"auto",isLiveEdge:!1},render:n=>t`
    <div style="display: flex; padding: 8px 0;">
      <range-timeline
        .startTime=${u}
        .endTime=${v}
        .rangeBounds=${e}
        .zoomLevel=${n.zoomLevel}
        .dateSnapping=${n.dateSnapping}
        .isLiveEdge=${n.isLiveEdge}
      ></range-timeline>
    </div>
  `},a={},i={args:{isLiveEdge:!0},render:()=>t`
    <div style="display: flex; padding: 8px 0;">
      <range-timeline
        .startTime=${new Date("2024-01-15T06:00:00Z")}
        .endTime=${new Date("2024-01-15T23:59:00Z")}
        .rangeBounds=${e}
        zoomLevel="day"
        dateSnapping="auto"
        .isLiveEdge=${!0}
      ></range-timeline>
    </div>
  `},r={render:()=>t`
    <div style="display: flex; padding: 8px 0;">
      <range-timeline
        .startTime=${new Date("2024-01-13T00:00:00Z")}
        .endTime=${new Date("2024-01-16T00:00:00Z")}
        .rangeBounds=${y}
        zoomLevel="week_expanded"
        dateSnapping="auto"
        .isLiveEdge=${!1}
      ></range-timeline>
    </div>
  `},o={render:()=>t`
    <div style="display: flex; padding: 8px 0;">
      <range-timeline
        .startTime=${new Date("2024-01-08T00:00:00Z")}
        .endTime=${new Date("2024-01-15T00:00:00Z")}
        .rangeBounds=${D}
        zoomLevel="month_short"
        dateSnapping="auto"
        .isLiveEdge=${!1}
      ></range-timeline>
    </div>
  `},d={render:()=>t`
    <div style="display: flex; padding: 8px 0;">
      <range-timeline
        .startTime=${new Date(e.min)}
        .endTime=${new Date(e.max)}
        .rangeBounds=${e}
        zoomLevel="day"
        dateSnapping="auto"
        .isLiveEdge=${!1}
      ></range-timeline>
    </div>
  `},s={render:()=>t`
    <div style="display: flex; padding: 8px 0;">
      <range-timeline
        .startTime=${new Date("2024-01-15T11:00:00Z")}
        .endTime=${new Date("2024-01-15T12:00:00Z")}
        .rangeBounds=${e}
        zoomLevel="day"
        dateSnapping="hour"
      ></range-timeline>
    </div>
  `},l={render:()=>{const n=e.max-e.min,p=(new Date("2024-01-15T06:00:00Z").getTime()-e.min)/n*100,m=(new Date("2024-01-15T10:00:00Z").getTime()-new Date("2024-01-15T06:00:00Z").getTime())/n*100;return t`
      <div style="display: flex; padding: 8px 0;">
        <range-timeline
          .startTime=${u}
          .endTime=${v}
          .rangeBounds=${e}
          zoomLevel="day"
          dateSnapping="auto"
        >
          <div
            slot="track-overlays"
            style="
              position: absolute;
              top: -4px; height: 12px;
              left: ${p}%; width: ${m}%;
              border-radius: 999px;
              background: color-mix(in srgb, var(--primary-color, #03a9f4) 32%, transparent);
              pointer-events: none;
            "
          ></div>
        </range-timeline>
      </div>
    `}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:"{}",...a.parameters?.docs?.source},description:{story:"Default day-level zoom with a selection spanning 8 am – 8 pm.",...a.parameters?.docs?.description}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    isLiveEdge: true
  },
  render: () => html\`
    <div style="display: flex; padding: 8px 0;">
      <range-timeline
        .startTime=\${new Date("2024-01-15T06:00:00Z")}
        .endTime=\${new Date("2024-01-15T23:59:00Z")}
        .rangeBounds=\${DAY_BOUNDS}
        zoomLevel="day"
        dateSnapping="auto"
        .isLiveEdge=\${true}
      ></range-timeline>
    </div>
  \`
}`,...i.parameters?.docs?.source},description:{story:"End handle is on the live edge — shows red breathing indicator.",...i.parameters?.docs?.description}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <div style="display: flex; padding: 8px 0;">
      <range-timeline
        .startTime=\${new Date("2024-01-13T00:00:00Z")}
        .endTime=\${new Date("2024-01-16T00:00:00Z")}
        .rangeBounds=\${WEEK_BOUNDS}
        zoomLevel="week_expanded"
        dateSnapping="auto"
        .isLiveEdge=\${false}
      ></range-timeline>
    </div>
  \`
}`,...r.parameters?.docs?.source},description:{story:"Week-expanded zoom: days as major ticks, 12-hour detail ticks.",...r.parameters?.docs?.description}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <div style="display: flex; padding: 8px 0;">
      <range-timeline
        .startTime=\${new Date("2024-01-08T00:00:00Z")}
        .endTime=\${new Date("2024-01-15T00:00:00Z")}
        .rangeBounds=\${MONTH_BOUNDS}
        zoomLevel="month_short"
        dateSnapping="auto"
        .isLiveEdge=\${false}
      ></range-timeline>
    </div>
  \`
}`,...o.parameters?.docs?.source},description:{story:"Month-short zoom: weeks as major ticks, days as detail ticks.",...o.parameters?.docs?.description}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <div style="display: flex; padding: 8px 0;">
      <range-timeline
        .startTime=\${new Date(DAY_BOUNDS.min)}
        .endTime=\${new Date(DAY_BOUNDS.max)}
        .rangeBounds=\${DAY_BOUNDS}
        zoomLevel="day"
        dateSnapping="auto"
        .isLiveEdge=\${false}
      ></range-timeline>
    </div>
  \`
}`,...d.parameters?.docs?.source},description:{story:"Selection spans the full visible bounds — jump controls are hidden.",...d.parameters?.docs?.description}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <div style="display: flex; padding: 8px 0;">
      <range-timeline
        .startTime=\${new Date("2024-01-15T11:00:00Z")}
        .endTime=\${new Date("2024-01-15T12:00:00Z")}
        .rangeBounds=\${DAY_BOUNDS}
        zoomLevel="day"
        dateSnapping="hour"
      ></range-timeline>
    </div>
  \`
}`,...s.parameters?.docs?.source},description:{story:"Narrow one-hour selection centred in the day.",...s.parameters?.docs?.description}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => {
    const total = DAY_BOUNDS.max - DAY_BOUNDS.min;
    const leftPct = (new Date("2024-01-15T06:00:00Z").getTime() - DAY_BOUNDS.min) / total * 100;
    const widthPct = (new Date("2024-01-15T10:00:00Z").getTime() - new Date("2024-01-15T06:00:00Z").getTime()) / total * 100;
    return html\`
      <div style="display: flex; padding: 8px 0;">
        <range-timeline
          .startTime=\${START}
          .endTime=\${END}
          .rangeBounds=\${DAY_BOUNDS}
          zoomLevel="day"
          dateSnapping="auto"
        >
          <div
            slot="track-overlays"
            style="
              position: absolute;
              top: -4px; height: 12px;
              left: \${leftPct}%; width: \${widthPct}%;
              border-radius: 999px;
              background: color-mix(in srgb, var(--primary-color, #03a9f4) 32%, transparent);
              pointer-events: none;
            "
          ></div>
        </range-timeline>
      </div>
    \`;
  }
}`,...l.parameters?.docs?.source},description:{story:"Slot demo: a coloured band injected into the track-overlays slot.",...l.parameters?.docs?.description}}};const k=["Default","LiveEdge","WeekExpanded","MonthShort","FullRangeSelected","NarrowSelection","WithTrackOverlay"];export{a as Default,d as FullRangeSelected,i as LiveEdge,o as MonthShort,s as NarrowSelection,r as WeekExpanded,l as WithTrackOverlay,k as __namedExportsOrder,_ as default};
