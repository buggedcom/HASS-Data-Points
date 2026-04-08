import{i as Oe,b as K,g as fe}from"./iframe-maWesKjk.js";import{n as p}from"./property-DyW-YDBW.js";import{r as Ae}from"./state-D8ZE3MQ0.js";import"./sidebar-datapoints-section-DeEokyBI.js";import"./sidebar-datapoint-display-section-BVNCUvw8.js";import"./sidebar-analysis-section-1WlU2LBc.js";import"./sidebar-chart-display-section-Csv-EgI1.js";import"./preload-helper-PPVm8Dsz.js";import"./localize-Cz1ya3ms.js";import"./sidebar-options-section-XIovhKDU.js";import"./sidebar-section-header-CDFFctyZ.js";import"./radio-group-CFoLmpSs.js";import"./localized-decorator-CXjGGqe_.js";import"./checkbox-list-Z254-hxP.js";const Me=Oe`
  :host {
    display: block;
    --dp-spacing-lg: calc(var(--spacing, 8px) * 2);
  }

  .sidebar-options-card {
    display: grid;
    gap: var(--dp-spacing-lg);
  }
`;var Ge=Object.create,Q=Object.defineProperty,Te=Object.getOwnPropertyDescriptor,R=(e,s)=>(s=Symbol[e])?s:Symbol.for("Symbol."+e),M=e=>{throw TypeError(e)},V=(e,s,a)=>s in e?Q(e,s,{enumerable:!0,configurable:!0,writable:!0,value:a}):e[s]=a,xe=e=>[,,,Ge(e?.[R("metadata")]??null)],X=["class","method","getter","setter","accessor","field","value","get","set"],A=e=>e!==void 0&&typeof e!="function"?M("Function expected"):e,$e=(e,s,a,h,d)=>({kind:X[e],name:s,metadata:h,addInitializer:l=>a._?M("Already initialized"):d.push(A(l||null))}),De=(e,s)=>V(s,R("metadata"),e[3]),o=(e,s,a,h)=>{for(var d=0,l=e[s>>1],u=l&&l.length;d<u;d++)s&1?l[d].call(a):h=l[d].call(a,h);return h},n=(e,s,a,h,d,l)=>{for(var u,c,j,g,G,J=s&7,ge=!1,me=!1,T=e.length+1,ye=X[J+5],ve=e[T-1]=[],be=e[T]||(e[T]=[]),w=(d=d.prototype,Te({get[a](){return We(this,l)},set[a](_){return Ce(this,l,_)}},a)),x=h.length-1;x>=0;x--)g=$e(J,a,j={},e[3],be),g.static=ge,g.private=me,G=g.access={has:_=>a in _},G.get=_=>_[a],G.set=(_,Se)=>_[a]=Se,c=(0,h[x])({get:w.get,set:w.set},g),j._=1,c===void 0?A(c)&&(w[ye]=c):typeof c!="object"||c===null?M("Object expected"):(A(u=c.get)&&(w.get=u),A(u=c.set)&&(w.set=u),A(u=c.init)&&ve.unshift(u));return w&&Q(d,a,w),d},ke=(e,s,a)=>V(e,s+"",a),Z=(e,s,a)=>s.has(e)||M("Cannot "+a),We=(e,s,a)=>(Z(e,s,"read from private field"),s.get(e)),r=(e,s,a)=>s.has(e)?M("Cannot add the same private member more than once"):s instanceof WeakSet?s.add(e):s.set(e,a),Ce=(e,s,a,h)=>(Z(e,s,"write to private field"),s.set(e,a),a),ee,te,se,oe,ae,ie,re,ne,pe,de,he,le,ce,ue,we,_e,$,t,D,k,W,C,I,H,E,L,B,q,Y,z,P,F,U,N;class i extends($=fe,_e=[p({type:String,attribute:"datapoint-scope"})],we=[p({type:Boolean,attribute:"show-icons"})],ue=[p({type:Boolean,attribute:"show-lines"})],ce=[p({type:Boolean,attribute:"show-tooltips"})],le=[p({type:Boolean,attribute:"show-hover-guides"})],he=[p({type:Boolean,attribute:"show-correlated-anomalies"})],de=[p({type:Boolean,attribute:"show-data-gaps"})],pe=[p({type:String,attribute:"data-gap-threshold"})],ne=[p({type:String,attribute:"y-axis-mode"})],re=[p({type:String,attribute:"hover-snap-mode"})],ie=[p({type:String,attribute:"anomaly-overlap-mode"})],ae=[p({type:Boolean,attribute:!1})],oe=[Ae()],se=[p({type:Boolean,attribute:"datapoints-open"})],te=[p({type:Boolean,attribute:"analysis-open"})],ee=[p({type:Boolean,attribute:"chart-open"})],$){constructor(){super(...arguments),r(this,D,o(t,8,this,"linked")),o(t,11,this),r(this,k,o(t,12,this,!0)),o(t,15,this),r(this,W,o(t,16,this,!0)),o(t,19,this),r(this,C,o(t,20,this,!0)),o(t,23,this),r(this,I,o(t,24,this,!1)),o(t,27,this),r(this,H,o(t,28,this,!1)),o(t,31,this),r(this,E,o(t,32,this,!0)),o(t,35,this),r(this,L,o(t,36,this,"2h")),o(t,39,this),r(this,B,o(t,40,this,"combined")),o(t,43,this),r(this,q,o(t,44,this,"follow_series")),o(t,47,this),r(this,Y,o(t,48,this,"all")),o(t,51,this),r(this,z,o(t,52,this,!1)),o(t,55,this),r(this,P,o(t,56,this,!0)),o(t,59,this),r(this,F,o(t,60,this,!0)),o(t,63,this),r(this,U,o(t,64,this,!0)),o(t,67,this),r(this,N,o(t,68,this,!0)),o(t,71,this)}_onTargetsToggle(s){this.targetsOpen=s.detail.open,this._emitAccordionChange()}_onDatapointsToggle(s){this.datapointsOpen=s.detail.open,this._emitAccordionChange()}_onAnalysisToggle(s){this.analysisOpen=s.detail.open,this._emitAccordionChange()}_onChartToggle(s){this.chartOpen=s.detail.open,this._emitAccordionChange()}_emitAccordionChange(){this.dispatchEvent(new CustomEvent("dp-accordion-change",{detail:{targetsOpen:this.targetsOpen,datapointsOpen:this.datapointsOpen,analysisOpen:this.analysisOpen,chartOpen:this.chartOpen},bubbles:!0,composed:!0}))}render(){return K`
      <div class="sidebar-options-card">
        <sidebar-datapoints-section
          .datapointScope=${this.datapointScope}
          collapsible
          .open=${this.targetsOpen}
          @dp-section-toggle=${this._onTargetsToggle}
        ></sidebar-datapoints-section>
        <sidebar-datapoint-display-section
          .showIcons=${this.showIcons}
          .showLines=${this.showLines}
          collapsible
          .open=${this.datapointsOpen}
          @dp-section-toggle=${this._onDatapointsToggle}
        ></sidebar-datapoint-display-section>
        <sidebar-analysis-section
          .anomalyOverlapMode=${this.anomalyOverlapMode}
          .showCorrelatedAnomalies=${this.showCorrelatedAnomalies}
          .anyAnomaliesEnabled=${this.anyAnomaliesEnabled}
          collapsible
          .open=${this.analysisOpen}
          @dp-section-toggle=${this._onAnalysisToggle}
        ></sidebar-analysis-section>
        <sidebar-chart-display-section
          .showTooltips=${this.showTooltips}
          .showHoverGuides=${this.showHoverGuides}
          .showDataGaps=${this.showDataGaps}
          .dataGapThreshold=${this.dataGapThreshold}
          .yAxisMode=${this.yAxisMode}
          .hoverSnapMode=${this.hoverSnapMode}
          collapsible
          .open=${this.chartOpen}
          @dp-section-toggle=${this._onChartToggle}
        ></sidebar-chart-display-section>
      </div>
    `}}t=xe($);D=new WeakMap;k=new WeakMap;W=new WeakMap;C=new WeakMap;I=new WeakMap;H=new WeakMap;E=new WeakMap;L=new WeakMap;B=new WeakMap;q=new WeakMap;Y=new WeakMap;z=new WeakMap;P=new WeakMap;F=new WeakMap;U=new WeakMap;N=new WeakMap;n(t,4,"datapointScope",_e,i,D);n(t,4,"showIcons",we,i,k);n(t,4,"showLines",ue,i,W);n(t,4,"showTooltips",ce,i,C);n(t,4,"showHoverGuides",le,i,I);n(t,4,"showCorrelatedAnomalies",he,i,H);n(t,4,"showDataGaps",de,i,E);n(t,4,"dataGapThreshold",pe,i,L);n(t,4,"yAxisMode",ne,i,B);n(t,4,"hoverSnapMode",re,i,q);n(t,4,"anomalyOverlapMode",ie,i,Y);n(t,4,"anyAnomaliesEnabled",ae,i,z);n(t,4,"targetsOpen",oe,i,P);n(t,4,"datapointsOpen",se,i,F);n(t,4,"analysisOpen",te,i,U);n(t,4,"chartOpen",ee,i,N);De(t,i);ke(i,"styles",Me);customElements.define("sidebar-options",i);const Ke={title:"Molecules/Sidebar Options",component:"sidebar-options",parameters:{actions:{handles:["dp-scope-change","dp-display-change","dp-radio-change","dp-item-change"]},docs:{description:{component:"`sidebar-options` renders the sidebar panel for the history chart, containing controls\nfor datapoint scope, display options, and chart layout. All options are purely presentational —\nstate changes are communicated upward via custom events.\n\n@fires dp-scope-change - `{ value: string }` fired when the datapoint scope radio selection changes\n@fires dp-display-change - `{ kind: string, value: boolean | string }` fired when any display option changes"}}},argTypes:{datapointScope:{control:"select",options:["linked","all","hidden"],description:'Which annotation datapoints appear on the chart. One of "linked", "all", or "hidden".'},showIcons:{control:"boolean",description:"Whether datapoint icons are shown on the chart."},showLines:{control:"boolean",description:"Whether dotted lines are drawn for each datapoint."},showTooltips:{control:"boolean",description:"Whether chart tooltips are shown on hover."},showHoverGuides:{control:"boolean",description:"Whether hover guide lines are emphasized on the chart."},hoverSnapMode:{control:"select",options:["follow_series","snap_to_data_points"],description:"Whether hover follows the interpolated series or snaps to datapoints."},showCorrelatedAnomalies:{control:"boolean",description:"Whether correlated anomalies across series are highlighted."},showDataGaps:{control:"boolean",description:"Whether data gaps are visually indicated on the chart."},dataGapThreshold:{control:"select",options:["auto","5m","15m","1h","2h","3h","6h","12h","24h"],description:"Minimum gap duration to treat as a data gap. Only active when showDataGaps is true."},yAxisMode:{control:"select",options:["combined","unique","split"],description:'Y-axis layout mode. "combined" groups by unit, "unique" gives each series its own axis, "split" renders each series in its own row.'}},args:{datapointScope:"linked",showIcons:!0,showLines:!0,showTooltips:!0,showHoverGuides:!1,hoverSnapMode:"follow_series",showCorrelatedAnomalies:!1,showDataGaps:!0,dataGapThreshold:"2h",yAxisMode:"combined"},render:e=>K`
    <sidebar-options
      .datapointScope=${e.datapointScope}
      .showIcons=${e.showIcons}
      .showLines=${e.showLines}
      .showTooltips=${e.showTooltips}
      .showHoverGuides=${e.showHoverGuides}
      .hoverSnapMode=${e.hoverSnapMode}
      .showCorrelatedAnomalies=${e.showCorrelatedAnomalies}
      .showDataGaps=${e.showDataGaps}
      .dataGapThreshold=${e.dataGapThreshold}
      .yAxisMode=${e.yAxisMode}
    ></sidebar-options>
  `},m={},y={args:{datapointScope:"all"}},v={args:{datapointScope:"hidden"}},b={args:{showDataGaps:!1}},S={args:{showIcons:!0,showLines:!0,showTooltips:!0,showHoverGuides:!0,hoverSnapMode:"snap_to_data_points",showCorrelatedAnomalies:!0,showDataGaps:!0,dataGapThreshold:"1h"}},O={args:{yAxisMode:"unique"}},f={args:{yAxisMode:"split"}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:"{}",...m.parameters?.docs?.source},description:{story:"All options at their default values.",...m.parameters?.docs?.description}}};y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  args: {
    datapointScope: "all"
  }
}`,...y.parameters?.docs?.source},description:{story:"Datapoint scope set to show all datapoints regardless of selected targets.",...y.parameters?.docs?.description}}};v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  args: {
    datapointScope: "hidden"
  }
}`,...v.parameters?.docs?.source},description:{story:"Datapoint scope set to hide all datapoints.",...v.parameters?.docs?.description}}};b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  args: {
    showDataGaps: false
  }
}`,...b.parameters?.docs?.source},description:{story:"Data gaps turned off — the gap threshold select should be disabled and dimmed.",...b.parameters?.docs?.description}}};S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  args: {
    showIcons: true,
    showLines: true,
    showTooltips: true,
    showHoverGuides: true,
    hoverSnapMode: "snap_to_data_points",
    showCorrelatedAnomalies: true,
    showDataGaps: true,
    dataGapThreshold: "1h"
  }
}`,...S.parameters?.docs?.source},description:{story:"All chart display options turned on.",...S.parameters?.docs?.description}}};O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  args: {
    yAxisMode: "unique"
  }
}`,...O.parameters?.docs?.source},description:{story:"Y-axis mode set to unique — each series gets its own y-axis.",...O.parameters?.docs?.description}}};f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  args: {
    yAxisMode: "split"
  }
}`,...f.parameters?.docs?.source},description:{story:"Y-axis mode set to split — each series rendered in its own chart row.",...f.parameters?.docs?.description}}};const Qe=["Default","ScopeAll","ScopeHidden","DataGapsOff","AllDisplayOptionsOn","YAxisUnique","YAxisSplit"];export{S as AllDisplayOptionsOn,b as DataGapsOff,m as Default,y as ScopeAll,v as ScopeHidden,f as YAxisSplit,O as YAxisUnique,Qe as __namedExportsOrder,Ke as default};
