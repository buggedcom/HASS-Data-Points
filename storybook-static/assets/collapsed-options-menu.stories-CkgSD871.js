import{i as we,A as j,b as c,g as ve}from"./iframe-maWesKjk.js";import{n as d}from"./property-DyW-YDBW.js";import{r as ye}from"./state-D8ZE3MQ0.js";import"./sidebar-datapoints-section-DeEokyBI.js";import"./sidebar-datapoint-display-section-BVNCUvw8.js";import"./sidebar-analysis-section-1WlU2LBc.js";import"./sidebar-chart-display-section-Csv-EgI1.js";import"./preload-helper-PPVm8Dsz.js";import"./localize-Cz1ya3ms.js";import"./sidebar-options-section-XIovhKDU.js";import"./sidebar-section-header-CDFFctyZ.js";import"./radio-group-CFoLmpSs.js";import"./localized-decorator-CXjGGqe_.js";import"./checkbox-list-Z254-hxP.js";const _e=we`
  :host {
    display: block;
  }

  .nested-menu {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
  }

  .menu-level1 {
    min-width: 172px;
    padding: 6px;
    flex: 0 0 auto;
  }

  .menu-level2 {
    min-width: 260px;
    max-width: 300px;
    padding: 8px 4px;
    border-left: 1px solid
      color-mix(
        in srgb,
        var(--divider-color, rgba(0, 0, 0, 0.12)) 88%,
        transparent
      );
    flex: 0 0 auto;
  }

  .menu-level2 > * {
    padding: var(--dp-spacing-sm);
    display: block;
  }

  .menu-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    min-height: 36px;
    padding: 0 8px 0 10px;
    border: none;
    border-radius: 10px;
    background: transparent;
    color: var(--primary-text-color);
    font: inherit;
    font-size: 0.875rem;
    text-align: left;
    cursor: pointer;
    gap: 4px;
    box-sizing: border-box;
    transition: background 100ms ease;
  }

  .menu-item:hover,
  .menu-item:focus-visible {
    background: color-mix(
      in srgb,
      var(--primary-text-color, #111) 6%,
      transparent
    );
    outline: none;
  }

  .menu-item.is-active {
    background: color-mix(
      in srgb,
      var(--primary-color, #6200ee) 10%,
      transparent
    );
    color: var(--primary-color, #6200ee);
  }

  .menu-item-label {
    flex: 1 1 auto;
  }

  .menu-item-chevron {
    --mdc-icon-size: 16px;
    color: var(--secondary-text-color);
    flex: 0 0 auto;
    opacity: 0.5;
  }

  .menu-item.is-active .menu-item-chevron {
    color: var(--primary-color, #6200ee);
    opacity: 0.7;
  }
`;var $e=Object.create,q=Object.defineProperty,fe=Object.getOwnPropertyDescriptor,J=(e,a)=>(a=Symbol[e])?a:Symbol.for("Symbol."+e),f=e=>{throw TypeError(e)},K=(e,a,t)=>a in e?q(e,a,{enumerable:!0,configurable:!0,writable:!0,value:t}):e[a]=t,be=e=>[,,,$e(e?.[J("metadata")]??null)],Q=["class","method","getter","setter","accessor","field","value","get","set"],$=e=>e!==void 0&&typeof e!="function"?f("Function expected"):e,Se=(e,a,t,h,p)=>({kind:Q[e],name:a,metadata:h,addInitializer:u=>t._?f("Already initialized"):p.push($(u||null))}),Ae=(e,a)=>K(a,J("metadata"),e[3]),i=(e,a,t,h)=>{for(var p=0,u=e[a>>1],w=u&&u.length;p<w;p++)a&1?u[p].call(t):h=u[p].call(t,h);return h},l=(e,a,t,h,p,u)=>{for(var w,m,F,_,M,N=a&7,de=!1,pe=!1,x=e.length+1,ce=Q[N+5],he=e[x-1]=[],ue=e[x]||(e[x]=[]),v=(p=p.prototype,fe({get[t](){return Me(this,u)},set[t](y){return xe(this,u,y)}},t)),T=h.length-1;T>=0;T--)_=Se(N,t,F={},e[3],ue),_.static=de,_.private=pe,M=_.access={has:y=>t in y},M.get=y=>y[t],M.set=(y,me)=>y[t]=me,m=(0,h[T])({get:v.get,set:v.set},_),F._=1,m===void 0?$(m)&&(v[ce]=m):typeof m!="object"||m===null?f("Object expected"):($(w=m.get)&&(v.get=w),$(w=m.set)&&(v.set=w),$(w=m.init)&&he.unshift(w));return v&&q(p,t,v),p},R=(e,a,t)=>K(e,typeof a!="symbol"?a+"":a,t),U=(e,a,t)=>a.has(e)||f("Cannot "+t),Me=(e,a,t)=>(U(e,a,"read from private field"),a.get(e)),r=(e,a,t)=>a.has(e)?f("Cannot add the same private member more than once"):a instanceof WeakSet?a.add(e):a.set(e,t),xe=(e,a,t,h)=>(U(e,a,"write to private field"),a.set(e,t),t),V,X,Y,Z,ee,oe,ae,se,te,ie,ne,re,le,G,o,g,P,k,C,O,D,E,I,H,L,W,z,B;const Te=[{key:"datapoints",label:"Datapoints"},{key:"datapoint-display",label:"Datapoint Display"},{key:"analysis",label:"Analysis"},{key:"chart-display",label:"Chart Display"}];class n extends(G=ve,le=[d({type:String})],re=[d({type:Boolean})],ne=[d({type:Boolean})],ie=[d({type:Boolean})],te=[d({type:Boolean})],se=[d({type:Boolean})],ae=[d({type:Boolean})],oe=[d({type:String})],ee=[d({type:String})],Z=[d({type:String})],Y=[d({type:String})],X=[d({type:Boolean})],V=[ye()],G){constructor(){super(...arguments),r(this,g,i(o,8,this,"linked")),i(o,11,this),r(this,P,i(o,12,this,!0)),i(o,15,this),r(this,k,i(o,16,this,!0)),i(o,19,this),r(this,C,i(o,20,this,!0)),i(o,23,this),r(this,O,i(o,24,this,!1)),i(o,27,this),r(this,D,i(o,28,this,!1)),i(o,31,this),r(this,E,i(o,32,this,!0)),i(o,35,this),r(this,I,i(o,36,this,"2h")),i(o,39,this),r(this,H,i(o,40,this,"combined")),i(o,43,this),r(this,L,i(o,44,this,"follow_series")),i(o,47,this),r(this,W,i(o,48,this,"all")),i(o,51,this),r(this,z,i(o,52,this,!1)),i(o,55,this),r(this,B,i(o,56,this,null)),i(o,59,this),R(this,"_closeTimer",null)}disconnectedCallback(){super.disconnectedCallback(),this._closeTimer!==null&&(clearTimeout(this._closeTimer),this._closeTimer=null)}_activateSection(a){this._closeTimer!==null&&(clearTimeout(this._closeTimer),this._closeTimer=null),this.activeSection=a}_scheduleClose(){this._closeTimer!==null&&clearTimeout(this._closeTimer),this._closeTimer=setTimeout(()=>{this.activeSection=null,this._closeTimer=null},200)}_cancelClose(){this._closeTimer!==null&&(clearTimeout(this._closeTimer),this._closeTimer=null)}_renderSection(){switch(this.activeSection){case"datapoints":return c`
          <sidebar-datapoints-section
            .datapointScope=${this.datapointScope}
            .open=${!0}
          ></sidebar-datapoints-section>
        `;case"datapoint-display":return c`
          <sidebar-datapoint-display-section
            .showIcons=${this.showIcons}
            .showLines=${this.showLines}
            .open=${!0}
          ></sidebar-datapoint-display-section>
        `;case"analysis":return c`
          <sidebar-analysis-section
            .anomalyOverlapMode=${this.anomalyOverlapMode}
            .anyAnomaliesEnabled=${this.anyAnomaliesEnabled}
            .open=${!0}
          ></sidebar-analysis-section>
        `;case"chart-display":return c`
          <sidebar-chart-display-section
            .showTooltips=${this.showTooltips}
            .showHoverGuides=${this.showHoverGuides}
            .showCorrelatedAnomalies=${this.showCorrelatedAnomalies}
            .showDataGaps=${this.showDataGaps}
            .dataGapThreshold=${this.dataGapThreshold}
            .yAxisMode=${this.yAxisMode}
            .hoverSnapMode=${this.hoverSnapMode}
            .open=${!0}
          ></sidebar-chart-display-section>
        `;default:return j}}render(){return c`
      <div class="nested-menu">
        <div class="menu-level1" @mouseleave=${this._scheduleClose}>
          ${Te.map(a=>c`
              <button
                type="button"
                class="menu-item ${this.activeSection===a.key?"is-active":""}"
                @mouseenter=${()=>this._activateSection(a.key)}
                @click=${()=>this._activateSection(a.key)}
              >
                <span class="menu-item-label">${a.label}</span>
                <ha-icon
                  class="menu-item-chevron"
                  icon="mdi:chevron-right"
                ></ha-icon>
              </button>
            `)}
        </div>
        ${this.activeSection?c`
              <div
                class="menu-level2"
                @mouseenter=${this._cancelClose}
                @mouseleave=${this._scheduleClose}
              >
                ${this._renderSection()}
              </div>
            `:j}
      </div>
    `}}o=be(G);g=new WeakMap;P=new WeakMap;k=new WeakMap;C=new WeakMap;O=new WeakMap;D=new WeakMap;E=new WeakMap;I=new WeakMap;H=new WeakMap;L=new WeakMap;W=new WeakMap;z=new WeakMap;B=new WeakMap;l(o,4,"datapointScope",le,n,g);l(o,4,"showIcons",re,n,P);l(o,4,"showLines",ne,n,k);l(o,4,"showTooltips",ie,n,C);l(o,4,"showHoverGuides",te,n,O);l(o,4,"showCorrelatedAnomalies",se,n,D);l(o,4,"showDataGaps",ae,n,E);l(o,4,"dataGapThreshold",oe,n,I);l(o,4,"yAxisMode",ee,n,H);l(o,4,"hoverSnapMode",Z,n,L);l(o,4,"anomalyOverlapMode",Y,n,W);l(o,4,"anyAnomaliesEnabled",X,n,z);l(o,4,"activeSection",V,n,B);Ae(o,n);R(n,"styles",_e);customElements.define("collapsed-options-menu",n);const Fe={title:"Molecules/Collapsed Options Menu",component:"collapsed-options-menu",parameters:{actions:{handles:["dp-scope-change","dp-display-change","dp-analysis-change"]}}},s={datapointScope:"linked",showIcons:!0,showLines:!0,showTooltips:!0,showHoverGuides:!1,showCorrelatedAnomalies:!1,showDataGaps:!0,dataGapThreshold:"2h",yAxisMode:"combined",anomalyOverlapMode:"all",anyAnomaliesEnabled:!1},b={render:()=>c`
    <collapsed-options-menu
      .datapointScope=${s.datapointScope}
      .showIcons=${s.showIcons}
      .showLines=${s.showLines}
      .showTooltips=${s.showTooltips}
      .showHoverGuides=${s.showHoverGuides}
      .showCorrelatedAnomalies=${s.showCorrelatedAnomalies}
      .showDataGaps=${s.showDataGaps}
      .dataGapThreshold=${s.dataGapThreshold}
      .yAxisMode=${s.yAxisMode}
      .anomalyOverlapMode=${s.anomalyOverlapMode}
      .anyAnomaliesEnabled=${s.anyAnomaliesEnabled}
    ></collapsed-options-menu>
  `},S={render:()=>c`
    <collapsed-options-menu
      .datapointScope=${s.datapointScope}
      .showIcons=${s.showIcons}
      .showLines=${s.showLines}
      .showTooltips=${s.showTooltips}
      .showHoverGuides=${s.showHoverGuides}
      .showCorrelatedAnomalies=${s.showCorrelatedAnomalies}
      .showDataGaps=${s.showDataGaps}
      .dataGapThreshold=${s.dataGapThreshold}
      .yAxisMode=${s.yAxisMode}
      .anomalyOverlapMode=${s.anomalyOverlapMode}
      .anyAnomaliesEnabled=${s.anyAnomaliesEnabled}
      .activeSection=${"datapoints"}
    ></collapsed-options-menu>
  `},A={render:()=>c`
    <collapsed-options-menu
      .datapointScope=${s.datapointScope}
      .showIcons=${s.showIcons}
      .showLines=${s.showLines}
      .showTooltips=${s.showTooltips}
      .showHoverGuides=${s.showHoverGuides}
      .showCorrelatedAnomalies=${s.showCorrelatedAnomalies}
      .showDataGaps=${s.showDataGaps}
      .dataGapThreshold=${s.dataGapThreshold}
      .yAxisMode=${s.yAxisMode}
      .anomalyOverlapMode=${s.anomalyOverlapMode}
      .anyAnomaliesEnabled=${s.anyAnomaliesEnabled}
      .activeSection=${"analysis"}
    ></collapsed-options-menu>
  `};b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <collapsed-options-menu
      .datapointScope=\${defaultProps.datapointScope}
      .showIcons=\${defaultProps.showIcons}
      .showLines=\${defaultProps.showLines}
      .showTooltips=\${defaultProps.showTooltips}
      .showHoverGuides=\${defaultProps.showHoverGuides}
      .showCorrelatedAnomalies=\${defaultProps.showCorrelatedAnomalies}
      .showDataGaps=\${defaultProps.showDataGaps}
      .dataGapThreshold=\${defaultProps.dataGapThreshold}
      .yAxisMode=\${defaultProps.yAxisMode}
      .anomalyOverlapMode=\${defaultProps.anomalyOverlapMode}
      .anyAnomaliesEnabled=\${defaultProps.anyAnomaliesEnabled}
    ></collapsed-options-menu>
  \`
}`,...b.parameters?.docs?.source}}};S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <collapsed-options-menu
      .datapointScope=\${defaultProps.datapointScope}
      .showIcons=\${defaultProps.showIcons}
      .showLines=\${defaultProps.showLines}
      .showTooltips=\${defaultProps.showTooltips}
      .showHoverGuides=\${defaultProps.showHoverGuides}
      .showCorrelatedAnomalies=\${defaultProps.showCorrelatedAnomalies}
      .showDataGaps=\${defaultProps.showDataGaps}
      .dataGapThreshold=\${defaultProps.dataGapThreshold}
      .yAxisMode=\${defaultProps.yAxisMode}
      .anomalyOverlapMode=\${defaultProps.anomalyOverlapMode}
      .anyAnomaliesEnabled=\${defaultProps.anyAnomaliesEnabled}
      .activeSection=\${"datapoints"}
    ></collapsed-options-menu>
  \`
}`,...S.parameters?.docs?.source}}};A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <collapsed-options-menu
      .datapointScope=\${defaultProps.datapointScope}
      .showIcons=\${defaultProps.showIcons}
      .showLines=\${defaultProps.showLines}
      .showTooltips=\${defaultProps.showTooltips}
      .showHoverGuides=\${defaultProps.showHoverGuides}
      .showCorrelatedAnomalies=\${defaultProps.showCorrelatedAnomalies}
      .showDataGaps=\${defaultProps.showDataGaps}
      .dataGapThreshold=\${defaultProps.dataGapThreshold}
      .yAxisMode=\${defaultProps.yAxisMode}
      .anomalyOverlapMode=\${defaultProps.anomalyOverlapMode}
      .anyAnomaliesEnabled=\${defaultProps.anyAnomaliesEnabled}
      .activeSection=\${"analysis"}
    ></collapsed-options-menu>
  \`
}`,...A.parameters?.docs?.source}}};const Ne=["Default","DatapointsSectionOpen","AnalysisSectionOpen"];export{A as AnalysisSectionOpen,S as DatapointsSectionOpen,b as Default,Ne as __namedExportsOrder,Fe as default};
