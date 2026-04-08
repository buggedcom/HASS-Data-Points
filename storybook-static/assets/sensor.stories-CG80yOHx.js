import{i as O,g as $,b as n}from"./iframe-maWesKjk.js";import{D as P}from"./constants-B5c5KCbY.js";import{n as z,f as D}from"./events-api-hvJ4BhpZ.js";import{l as I}from"./logger-CXy2rxCm.js";import"./pagination-CjLcFMPQ.js";import"./sensor-header-Bv7a3uo7.js";import"./sensor-chart-Cdz5ukMg.js";import"./sensor-records-y56EbN_o.js";import"./preload-helper-PPVm8Dsz.js";import"./property-DyW-YDBW.js";import"./color-BkgFqjP8.js";import"./chart-dom-bf6ubeYH.js";import"./format-DAmR8eHG.js";import"./state-D8ZE3MQ0.js";import"./sensor-record-item-DWIkc7Bp.js";const N=O`
  :host {
    display: block;
    height: 100%;
  }

  ha-card {
    padding: 0;
    overflow: hidden;
    height: 100%;
  }

  .card-shell {
    height: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
    position: relative;
  }

  .card-body {
    pointer-events: none;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    flex: 0 0 auto;
    height: calc(
      (
          var(--hr-body-rows, var(--row-size, 1)) *
            (var(--row-height, 1px) + var(--row-gap, 0px))
        ) - var(--row-gap, 0px) - var(--hr-footer-height, 0px)
    );
    min-height: 0;
    position: relative;
    overflow: hidden;
    z-index: 1;
  }

  sensor-chart {
    position: absolute;
    width: 100%;
    z-index: 0;
    height: calc(
      (
          var(--hr-body-rows, var(--row-size, 1)) *
            (var(--row-height, 1px) + var(--row-gap, 0px))
        ) - var(--row-gap, 0px) - var(--hr-footer-height, 0px)
    );
    min-height: 0;
    overflow: hidden;
  }

  sensor-records {
    flex: 1 1 0;
    min-height: 0;
    position: relative;
  }
`;var L=Object.defineProperty,F=(s,e,t)=>e in s?L(s,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):s[e]=t,p=(s,e,t)=>F(s,typeof e!="symbol"?e+"":e,t);class A extends ${constructor(){super(),p(this,"_initialized",!1),p(this,"_lastHistResult",null),p(this,"_lastEvents",[]),p(this,"_lastT0",null),p(this,"_lastT1",null),p(this,"_unsubscribe",null),p(this,"_resizeObserver",null),this._config={},this._hass=null,this._annEvents=[],this._hiddenEventIds=new Set,this._recordsFooterHeight=0}setConfig(e){if(!e.entity)throw new Error("hass-datapoints-sensor-card: `entity` is required");this._config={hours_to_show:24,annotation_style:"circle",show_records:!1,records_page_size:null,records_limit:null,...e}}set hass(e){this._hass=e,this._initialized||(this._initialized=!0,this._setupAutoRefresh())}get hass(){return this._hass}firstUpdated(){this._setupResizeObserver(),this._hass&&this._load()}connectedCallback(){super.connectedCallback(),this._initialized&&this._hass&&this._load()}disconnectedCallback(){super.disconnectedCallback(),this._unsubscribe&&(this._unsubscribe(),this._unsubscribe=null),this._resizeObserver&&(this._resizeObserver.disconnect(),this._resizeObserver=null)}_setupAutoRefresh(){this.hass&&this.hass.connection.subscribeEvents(()=>this._load(),`${P}_event_recorded`).then(e=>{this._unsubscribe=e}).catch(()=>{})}_setupResizeObserver(){window.ResizeObserver&&(this._resizeObserver=new ResizeObserver(()=>{this._applyLayoutSizing()}),this._resizeObserver.observe(this))}_applyLayoutSizing(){const e=this.shadowRoot?.querySelector(".card-shell");if(!e)return;const t=this._gridRows();if(!this._config?.show_records){e.style.setProperty("--hr-body-rows",String(t)),e.style.setProperty("--hr-footer-height","0px");return}const r=Math.max(3,t),o=Math.max(2,this._bodyRows(r));e.style.setProperty("--hr-body-rows",String(o)),e.style.setProperty("--hr-footer-height",`${Math.max(0,this._recordsFooterHeight)}px`)}_gridRows(){const e=getComputedStyle(this).getPropertyValue("--row-size").trim(),t=Number.parseInt(e,10);return Number.isFinite(t)&&t>0?t:this._config?.show_records?4:3}_bodyRows(e){return this._config?.show_records?Math.min(e-1,3+Math.floor(Math.max(0,e-4)/4)):e}_toggleEventVisibility(e){const t=new Set(this._hiddenEventIds);t.has(e)?t.delete(e):t.add(e),this._hiddenEventIds=t,this._lastHistResult!==null&&this._drawChart(this._lastHistResult,this._lastEvents,this._lastT0,this._lastT1)}_navigateToEventHistory(e){z(this,{entity_id:[this._config?.entity,...e?.entity_ids||[]].filter(Boolean),device_id:e?.device_ids||[],area_id:e?.area_ids||[],label_id:e?.label_ids||[]},{start_time:Number.isFinite(this._lastT0)?new Date(this._lastT0).toISOString():null,end_time:Number.isFinite(this._lastT1)?new Date(this._lastT1).toISOString():null})}_openTargetHistoryDialog(){const e=this._config?.entity;e&&this.dispatchEvent(new CustomEvent("hass-more-info",{bubbles:!0,composed:!0,detail:{entityId:e}}))}_onCardClick(e){const t=e.composedPath(),r=new Set(["BUTTON","A","INPUT","TEXTAREA","SELECT","PAGINATION-NAV"]);t.some(a=>a instanceof HTMLElement?r.has(a.tagName)?!0:!!a.closest("button,a,input,textarea,select,pagination-nav"):!1)||this._openTargetHistoryDialog()}async _load(){if(!this.hass)return;const e=new Date,t=new Date(e.getTime()-this._config.hours_to_show*3600*1e3),r=t.getTime(),o=e.getTime(),a=[this._config.entity];try{const[l,_]=await Promise.all([this.hass.connection.sendMessagePromise({type:"history/history_during_period",start_time:t.toISOString(),end_time:e.toISOString(),entity_ids:a,include_start_time_state:!0,significant_changes_only:!1,no_attributes:!0}),D(this.hass,t.toISOString(),e.toISOString(),a)]);this._drawChart(l||{},_||[],r,o)}catch(l){I.error("[hass-datapoints sensor-card]",l)}}_drawChart(e,t,r,o){this._lastHistResult=e,this._lastEvents=t,this._lastT0=r,this._lastT1=o,this._annEvents=t;const a=this.shadowRoot?.querySelector("sensor-chart");if(!a)return;a.hass=this.hass;const l=this._config.entity,_=this.hass?.states?.[l]?.attributes?.unit_of_measurement||"";a.draw(e,t,r,o,this._config,_,this._hiddenEventIds)}_onAnnotationClick(e){this._navigateToEventHistory(e.detail.event)}_onHeaderClick(e){e.preventDefault(),e.stopPropagation(),this._openTargetHistoryDialog()}render(){const e=this.hass?.states?.[this._config?.entity],t=this._config?.name||e?.attributes?.friendly_name||this._config?.entity||"—",r=e?.state??"—",o=e?.attributes?.unit_of_measurement||"";return n`
      <ha-card @click=${this._onCardClick}>
        <div class="card-shell">
          <div class="card-body">
            <sensor-header
              .name=${t}
              .value=${r}
              .unit=${o}
              .stateObj=${e}
              .hass=${this.hass}
              @dp-sensor-header-click=${this._onHeaderClick}
            ></sensor-header>
          </div>
          <sensor-chart
            .showAnnotationTooltips=${this._config.show_annotation_tooltips===!0}
            @dp-sensor-annotation-click=${this._onAnnotationClick}
          ></sensor-chart>
          ${this._config?.show_records?n`
                <sensor-records
                  .events=${this._annEvents}
                  .hiddenEventIds=${this._hiddenEventIds}
                  .pageSize=${this._config.records_page_size??null}
                  .limit=${this._config.records_limit??null}
                  .showFullMessage=${this._config.records_show_full_message!==!1}
                  @dp-sensor-record-toggle-visibility=${a=>{this._toggleEventVisibility(a.detail.id)}}
                  @dp-sensor-record-navigate=${a=>{this._navigateToEventHistory(a.detail.event)}}
                  @dp-sensor-pagination-visibility-change=${a=>{this._recordsFooterHeight=a.detail.visible===!0?a.detail.height:0}}
                ></sensor-records>
              `:""}
        </div>
      </ha-card>
    `}updated(){this._applyLayoutSizing()}static getConfigElement(){return document.createElement("hass-datapoints-sensor-card-editor")}static getStubConfig(){return{entity:"sensor.example",hours_to_show:24}}getGridOptions(){return this._config?.show_records?{rows:4,min_rows:4,max_rows:12}:{rows:3,min_rows:2,max_rows:5}}}p(A,"properties",{_config:{state:!0},_hass:{state:!0},_annEvents:{state:!0},_hiddenEventIds:{state:!0},_recordsFooterHeight:{state:!0}});p(A,"styles",N);customElements.get("hass-datapoints-sensor-card")||customElements.define("hass-datapoints-sensor-card",A);function U(s,{width:e=360,rows:t=2,rowHeight:r=56,rowGap:o=8}={}){const a=t*(r+o)-o;return n`
    <div
      style="
      width: ${e}px;
      height: ${a}px;
      --hr-body-rows: ${t};
      --row-size: ${t}px;
      --row-height: ${r}px;
      --row-gap: ${o}px;
      font-family: Roboto, sans-serif;
      background: var(--ha-card-background, #fff);
      border-radius: 12px;
      overflow: hidden;
    "
    >
      ${s}
    </div>
  `}const ie={title:"Charts/Sensor Card",component:"hass-datapoints-sensor-card",parameters:{layout:"centered"}};function d(s,e,t,r){const o=Date.now();return{[s]:Array.from({length:e+1},(a,l)=>{const _=o-(e-l)*3600*1e3;return{s:(t+r*Math.sin(l/e*Math.PI*4)).toFixed(1),lu:_/1e3}})}}function M(s,e){const t=Date.now();return[{id:"evt-1",message:"Unusual spike detected",annotation:"Temperature jumped +4°C in under an hour.",icon:"mdi:thermometer-alert",color:"#f44336",timestamp:new Date(t-e*.7*3600*1e3).toISOString(),entity_id:s,device_id:null,area_id:null,label_id:null,dev:!1},{id:"evt-2",message:"Window opened",annotation:null,icon:"mdi:window-open",color:"#2196f3",timestamp:new Date(t-e*.4*3600*1e3).toISOString(),entity_id:s,device_id:null,area_id:null,label_id:null,dev:!1},{id:"evt-3",message:"Heating turned on",annotation:"Manual override via thermostat.",icon:"mdi:radiator",color:"#ff9800",timestamp:new Date(t-e*.15*3600*1e3).toISOString(),entity_id:s,device_id:null,area_id:null,label_id:null,dev:!1}]}function c(s,e,t=[]){return{states:s,connection:{subscribeEvents:()=>Promise.resolve(()=>{}),sendMessagePromise:r=>r.type==="hass_datapoints/events"?Promise.resolve({events:t}):r.type==="history/history_during_period"?Promise.resolve(e):Promise.resolve({})}}}const h={"sensor.temperature":{state:"22.5",attributes:{friendly_name:"Living Room Temperature",unit_of_measurement:"°C",icon:"mdi:thermometer"}}},V={"sensor.power":{state:"1.42",attributes:{friendly_name:"Current Power Usage",unit_of_measurement:"kW",icon:"mdi:lightning-bolt"}}},q={"sensor.temperature":{state:"unavailable",attributes:{friendly_name:"Living Room Temperature",unit_of_measurement:"°C"}}};async function i(s,e,t){const r=s.querySelector("hass-datapoints-sensor-card");return r.setConfig(e),t&&(r.hass=t,await r._load(),await r.updateComplete),r}function m({width:s=360,rows:e=3}={}){return(t=>U(t(),{width:s,rows:e}))}const u=m({rows:3}),w={name:"Loading (no hass)",decorators:[u],render:()=>n`<hass-datapoints-sensor-card></hass-datapoints-sensor-card>`,play:async({canvasElement:s})=>{await i(s,{entity:"sensor.temperature",hours_to_show:24})}},y={render:()=>n`<hass-datapoints-sensor-card></hass-datapoints-sensor-card>`,decorators:[u],play:async({canvasElement:s})=>{await i(s,{entity:"sensor.temperature",hours_to_show:24},c(h,d("sensor.temperature",24,21.5,3)))}},g={name:"Power Sensor (custom colour)",decorators:[u],render:()=>n`<hass-datapoints-sensor-card></hass-datapoints-sensor-card>`,play:async({canvasElement:s})=>{await i(s,{entity:"sensor.power",hours_to_show:24,graph_color:"#ff9800"},c(V,d("sensor.power",24,1.4,.6)))}},v={render:()=>n`<hass-datapoints-sensor-card></hass-datapoints-sensor-card>`,decorators:[u],play:async({canvasElement:s})=>{await i(s,{entity:"sensor.temperature",hours_to_show:24},c(q,d("sensor.temperature",20,21.5,3)))}},f={name:"With Annotations (circles)",decorators:[u],render:()=>n`<hass-datapoints-sensor-card></hass-datapoints-sensor-card>`,play:async({canvasElement:s})=>{await i(s,{entity:"sensor.temperature",hours_to_show:24,annotation_style:"circle"},c(h,d("sensor.temperature",24,21.5,3),M("sensor.temperature",24)))}},b={name:"With Annotations (lines)",decorators:[u],render:()=>n`<hass-datapoints-sensor-card></hass-datapoints-sensor-card>`,play:async({canvasElement:s})=>{await i(s,{entity:"sensor.temperature",hours_to_show:24,annotation_style:"line"},c(h,d("sensor.temperature",24,21.5,3),M("sensor.temperature",24)))}},E={name:"With Annotations & Records",decorators:[m({rows:4})],render:()=>n`<hass-datapoints-sensor-card></hass-datapoints-sensor-card>`,play:async({canvasElement:s})=>{await i(s,{entity:"sensor.temperature",hours_to_show:24,annotation_style:"circle",show_records:!0},c(h,d("sensor.temperature",24,21.5,3),M("sensor.temperature",24)))}},S={name:"With Records (empty)",decorators:[m({rows:4})],render:()=>n`<hass-datapoints-sensor-card></hass-datapoints-sensor-card>`,play:async({canvasElement:s})=>{await i(s,{entity:"sensor.temperature",hours_to_show:24,show_records:!0},c(h,d("sensor.temperature",24,21.5,3)))}},k={name:"Extended Range (7 days)",render:()=>n`<hass-datapoints-sensor-card></hass-datapoints-sensor-card>`,play:async({canvasElement:s})=>{await i(s,{entity:"sensor.temperature",hours_to_show:168,annotation_style:"circle"},c(h,d("sensor.temperature",168,20,4.5),M("sensor.temperature",168)))}},H={name:"Width: Narrow (320px)",decorators:[m({width:320,rows:3})],render:()=>n`<hass-datapoints-sensor-card></hass-datapoints-sensor-card>`,play:async({canvasElement:s})=>{await i(s,{entity:"sensor.temperature",hours_to_show:24},c(h,d("sensor.temperature",24,21.5,3)))}},C={name:"Width: Medium (400px)",decorators:[m({width:400,rows:3})],render:()=>n`<hass-datapoints-sensor-card></hass-datapoints-sensor-card>`,play:async({canvasElement:s})=>{await i(s,{entity:"sensor.temperature",hours_to_show:24},c(h,d("sensor.temperature",24,21.5,3)))}},x={name:"Width: Wide (560px)",decorators:[m({width:550,rows:3})],render:()=>n`<hass-datapoints-sensor-card></hass-datapoints-sensor-card>`,play:async({canvasElement:s})=>{await i(s,{entity:"sensor.temperature",hours_to_show:24},c(h,d("sensor.temperature",24,21.5,3)))}},W={name:"Height: 2 rows",decorators:[m({width:320,rows:2})],render:()=>n`<hass-datapoints-sensor-card></hass-datapoints-sensor-card>`,play:async({canvasElement:s})=>{await i(s,{entity:"sensor.temperature",hours_to_show:24},c(h,d("sensor.temperature",24,21.5,3)))}},R={name:"Height: 4 rows",decorators:[m({width:320,rows:4})],render:()=>n`<hass-datapoints-sensor-card></hass-datapoints-sensor-card>`,play:async({canvasElement:s})=>{await i(s,{entity:"sensor.temperature",hours_to_show:24},c(h,d("sensor.temperature",24,21.5,3)))}},T={name:"Height: 8 rows",decorators:[m({width:320,rows:8})],render:()=>n`<hass-datapoints-sensor-card></hass-datapoints-sensor-card>`,play:async({canvasElement:s})=>{await i(s,{entity:"sensor.temperature",hours_to_show:24},c(h,d("sensor.temperature",24,21.5,3)))}};w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  name: "Loading (no hass)",
  decorators: [defaultDecorator],
  render: () => html\`<hass-datapoints-sensor-card></hass-datapoints-sensor-card>\`,
  play: async ({
    canvasElement
  }) => {
    await setupCard(canvasElement, {
      entity: "sensor.temperature",
      hours_to_show: 24
    });
  }
}`,...w.parameters?.docs?.source},description:{story:'Before hass is attached the card shows its initial "Loading…" message.',...w.parameters?.docs?.description}}};y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  render: () => html\`<hass-datapoints-sensor-card></hass-datapoints-sensor-card>\`,
  decorators: [defaultDecorator],
  play: async ({
    canvasElement
  }) => {
    await setupCard(canvasElement, {
      entity: "sensor.temperature",
      hours_to_show: 24
    }, makeMockHass(temperatureState, makeHistory("sensor.temperature", 24, 21.5, 3.0)));
  }
}`,...y.parameters?.docs?.source},description:{story:"Temperature sensor with 24 h of history.",...y.parameters?.docs?.description}}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "Power Sensor (custom colour)",
  decorators: [defaultDecorator],
  render: () => html\`<hass-datapoints-sensor-card></hass-datapoints-sensor-card>\`,
  play: async ({
    canvasElement
  }) => {
    await setupCard(canvasElement, {
      entity: "sensor.power",
      hours_to_show: 24,
      graph_color: "#ff9800"
    }, makeMockHass(powerState, makeHistory("sensor.power", 24, 1.4, 0.6)));
  }
}`,...g.parameters?.docs?.source},description:{story:"Power sensor with a custom graph colour.",...g.parameters?.docs?.description}}};v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  render: () => html\`<hass-datapoints-sensor-card></hass-datapoints-sensor-card>\`,
  decorators: [defaultDecorator],
  play: async ({
    canvasElement
  }) => {
    await setupCard(canvasElement, {
      entity: "sensor.temperature",
      hours_to_show: 24
    }, makeMockHass(unavailableState, makeHistory("sensor.temperature", 20, 21.5, 3.0)));
  }
}`,...v.parameters?.docs?.source},description:{story:`Sensor currently unavailable — but history exists from before it went offline.
The chart shows past data; the value display shows "unavailable".`,...v.parameters?.docs?.description}}};f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "With Annotations (circles)",
  decorators: [defaultDecorator],
  render: () => html\`<hass-datapoints-sensor-card></hass-datapoints-sensor-card>\`,
  play: async ({
    canvasElement
  }) => {
    await setupCard(canvasElement, {
      entity: "sensor.temperature",
      hours_to_show: 24,
      annotation_style: "circle"
    }, makeMockHass(temperatureState, makeHistory("sensor.temperature", 24, 21.5, 3.0), makeEvents("sensor.temperature", 24)));
  }
}`,...f.parameters?.docs?.source},description:{story:"Three annotation markers as coloured icon circles on the chart line.",...f.parameters?.docs?.description}}};b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "With Annotations (lines)",
  decorators: [defaultDecorator],
  render: () => html\`<hass-datapoints-sensor-card></hass-datapoints-sensor-card>\`,
  play: async ({
    canvasElement
  }) => {
    await setupCard(canvasElement, {
      entity: "sensor.temperature",
      hours_to_show: 24,
      annotation_style: "line"
    }, makeMockHass(temperatureState, makeHistory("sensor.temperature", 24, 21.5, 3.0), makeEvents("sensor.temperature", 24)));
  }
}`,...b.parameters?.docs?.source},description:{story:"Annotation markers rendered as vertical lines.",...b.parameters?.docs?.description}}};E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  name: "With Annotations & Records",
  decorators: [withCardWrapper({
    rows: 4
  })],
  render: () => html\`<hass-datapoints-sensor-card></hass-datapoints-sensor-card>\`,
  play: async ({
    canvasElement
  }) => {
    await setupCard(canvasElement, {
      entity: "sensor.temperature",
      hours_to_show: 24,
      annotation_style: "circle",
      show_records: true
    }, makeMockHass(temperatureState, makeHistory("sensor.temperature", 24, 21.5, 3.0), makeEvents("sensor.temperature", 24)));
  }
}`,...E.parameters?.docs?.source},description:{story:"Annotations on chart plus the records list below.",...E.parameters?.docs?.description}}};S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "With Records (empty)",
  decorators: [withCardWrapper({
    rows: 4
  })],
  render: () => html\`<hass-datapoints-sensor-card></hass-datapoints-sensor-card>\`,
  play: async ({
    canvasElement
  }) => {
    await setupCard(canvasElement, {
      entity: "sensor.temperature",
      hours_to_show: 24,
      show_records: true
    }, makeMockHass(temperatureState, makeHistory("sensor.temperature", 24, 21.5, 3.0)));
  }
}`,...S.parameters?.docs?.source},description:{story:"Records section visible with no events — shows empty state.",...S.parameters?.docs?.description}}};k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  name: "Extended Range (7 days)",
  render: () => html\`<hass-datapoints-sensor-card></hass-datapoints-sensor-card>\`,
  play: async ({
    canvasElement
  }) => {
    await setupCard(canvasElement, {
      entity: "sensor.temperature",
      hours_to_show: 168,
      annotation_style: "circle"
    }, makeMockHass(temperatureState, makeHistory("sensor.temperature", 168, 20.0, 4.5), makeEvents("sensor.temperature", 168)));
  }
}`,...k.parameters?.docs?.source},description:{story:"Extended time window — 7 days.",...k.parameters?.docs?.description}}};H.parameters={...H.parameters,docs:{...H.parameters?.docs,source:{originalSource:`{
  name: "Width: Narrow (320px)",
  decorators: [withCardWrapper({
    width: 320,
    rows: 3
  })],
  render: () => html\`<hass-datapoints-sensor-card></hass-datapoints-sensor-card>\`,
  play: async ({
    canvasElement
  }) => {
    await setupCard(canvasElement, {
      entity: "sensor.temperature",
      hours_to_show: 24
    }, makeMockHass(temperatureState, makeHistory("sensor.temperature", 24, 21.5, 3.0)));
  }
}`,...H.parameters?.docs?.source},description:{story:`The card at three common HA dashboard widths side by side.
Overrides the default decorator to render a multi-column layout.
Narrow column — 320 px wide (e.g. single-column mobile or sidebar).`,...H.parameters?.docs?.description}}};C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: "Width: Medium (400px)",
  decorators: [withCardWrapper({
    width: 400,
    rows: 3
  })],
  render: () => html\`<hass-datapoints-sensor-card></hass-datapoints-sensor-card>\`,
  play: async ({
    canvasElement
  }) => {
    await setupCard(canvasElement, {
      entity: "sensor.temperature",
      hours_to_show: 24
    }, makeMockHass(temperatureState, makeHistory("sensor.temperature", 24, 21.5, 3.0)));
  }
}`,...C.parameters?.docs?.source},description:{story:"Standard column — 400 px wide (typical HA dashboard column).",...C.parameters?.docs?.description}}};x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "Width: Wide (560px)",
  decorators: [withCardWrapper({
    width: 550,
    rows: 3
  })],
  render: () => html\`<hass-datapoints-sensor-card></hass-datapoints-sensor-card>\`,
  play: async ({
    canvasElement
  }) => {
    await setupCard(canvasElement, {
      entity: "sensor.temperature",
      hours_to_show: 24
    }, makeMockHass(temperatureState, makeHistory("sensor.temperature", 24, 21.5, 3.0)));
  }
}`,...x.parameters?.docs?.source},description:{story:"Wide column — 560 px wide (two-column span or wide layout).",...x.parameters?.docs?.description}}};W.parameters={...W.parameters,docs:{...W.parameters?.docs,source:{originalSource:`{
  name: "Height: 2 rows",
  decorators: [withCardWrapper({
    width: 320,
    rows: 2
  })],
  render: () => html\`<hass-datapoints-sensor-card></hass-datapoints-sensor-card>\`,
  play: async ({
    canvasElement
  }) => {
    await setupCard(canvasElement, {
      entity: "sensor.temperature",
      hours_to_show: 24
    }, makeMockHass(temperatureState, makeHistory("sensor.temperature", 24, 21.5, 3.0)));
  }
}`,...W.parameters?.docs?.source}}};R.parameters={...R.parameters,docs:{...R.parameters?.docs,source:{originalSource:`{
  name: "Height: 4 rows",
  decorators: [withCardWrapper({
    width: 320,
    rows: 4
  })],
  render: () => html\`<hass-datapoints-sensor-card></hass-datapoints-sensor-card>\`,
  play: async ({
    canvasElement
  }) => {
    await setupCard(canvasElement, {
      entity: "sensor.temperature",
      hours_to_show: 24
    }, makeMockHass(temperatureState, makeHistory("sensor.temperature", 24, 21.5, 3.0)));
  }
}`,...R.parameters?.docs?.source}}};T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  name: "Height: 8 rows",
  decorators: [withCardWrapper({
    width: 320,
    rows: 8
  })],
  render: () => html\`<hass-datapoints-sensor-card></hass-datapoints-sensor-card>\`,
  play: async ({
    canvasElement
  }) => {
    await setupCard(canvasElement, {
      entity: "sensor.temperature",
      hours_to_show: 24
    }, makeMockHass(temperatureState, makeHistory("sensor.temperature", 24, 21.5, 3.0)));
  }
}`,...T.parameters?.docs?.source}}};const de=["Loading","Default","PowerSensor","Unavailable","WithAnnotations","WithAnnotationLines","WithAnnotationsAndRecords","WithRecordsEmpty","ExtendedRange","NarrowWidth","MediumWidth","WideWidth","NarrowHeight","MediumHeight","LargeHeight"];export{y as Default,k as ExtendedRange,T as LargeHeight,w as Loading,R as MediumHeight,C as MediumWidth,W as NarrowHeight,H as NarrowWidth,g as PowerSensor,v as Unavailable,x as WideWidth,b as WithAnnotationLines,f as WithAnnotations,E as WithAnnotationsAndRecords,S as WithRecordsEmpty,de as __namedExportsOrder,ie as default};
