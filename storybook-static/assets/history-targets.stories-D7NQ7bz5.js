import{i as he,A as Q,b as v,g as ye}from"./iframe-maWesKjk.js";import{e as _}from"./index-BVN6m9Ti.js";import{c as ge}from"./mock-hass-fqpCrfSc.js";import{n as w}from"./property-DyW-YDBW.js";import{r as me}from"./state-D8ZE3MQ0.js";import{m as f}from"./localize-Cz1ya3ms.js";import{e as ue}from"./entity-name-TOInf1r0.js";import{e as U}from"./format-DAmR8eHG.js";import"./target-row-list-BFfSKevV.js";import{l as be}from"./localized-decorator-CXjGGqe_.js";import"./preload-helper-PPVm8Dsz.js";import"./target-row-CqKWU3NH.js";import"./analysis-sample-group-B6DXKU1N.js";import"./analysis-group-shared.styles-Cw1nMqQy.js";import"./analysis-group-ZyfAZWsO.js";import"./analysis-trend-group-C_jadOVq.js";import"./analysis-summary-group-18mMfsol.js";import"./analysis-rate-group-ClWjzN4_.js";import"./analysis-threshold-group-CvkzLvvQ.js";import"./analysis-anomaly-group-COJBbfcf.js";import"./analysis-method-subopts-INTT52YI.js";import"./analysis-delta-group-COrtQ8Ee.js";const ve=he`
  :host {
    display: block;
    height: 100%;
    --dp-spacing-xs: calc(var(--spacing, 8px) * 0.5);
    --dp-spacing-sm: var(--spacing, 8px);
    --dp-spacing-md: calc(var(--spacing, 8px) * 1.5);
    --dp-spacing-lg: calc(var(--spacing, 8px) * 2);
  }

  .history-targets {
    display: grid;
    gap: var(--dp-spacing-md);
  }

  :host([sidebar-collapsed]) .history-targets {
    display: flex;
    min-height: 100%;
    height: 100%;
    flex-direction: column;
    align-content: stretch;
  }

  .history-target-rows {
    width: calc(var(--sidebar-width-expanded) - var(--dp-spacing-lg) * 2);
  }

  .sidebar-section-header {
    display: grid;
    gap: var(--dp-spacing-xs);
  }

  .sidebar-section-title {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--primary-text-color);
  }

  .sidebar-section-subtitle {
    font-size: 0.82rem;
    color: var(--secondary-text-color);
  }

  .history-target-picker-slot {
    min-width: 0;
    margin-top: 0;
    margin-bottom: calc(var(--spacing, 8px) * 2);
  }

  .history-targets-collapsed-summary {
    display: none;
    grid-auto-rows: max-content;
    gap: var(--dp-spacing-sm);
    justify-items: center;
    padding-top: calc(var(--spacing, 8px) * 5);
  }

  .history-targets-collapsed-item {
    position: relative;
    width: 28px;
    height: 28px;
    border-radius: 10px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 0;
    padding: 0;
    margin: 0;
    box-shadow: inset 0 0 0 1px
      color-mix(
        in srgb,
        var(--divider-color, rgba(0, 0, 0, 0.12)) 88%,
        transparent
      );
    background: color-mix(
      in srgb,
      var(--primary-text-color, #111) 4%,
      transparent
    );
    color: var(--secondary-text-color);
    --mdc-icon-size: 18px;
    cursor: pointer;
    appearance: none;
    -webkit-appearance: none;
  }

  .history-targets-collapsed-item:hover,
  .history-targets-collapsed-item:focus-visible {
    background: color-mix(
      in srgb,
      var(--primary-text-color, #111) 8%,
      transparent
    );
    outline: none;
  }

  .history-targets-collapsed-item.is-hidden {
    opacity: 0.55;
  }

  .history-targets-collapsed-item::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    box-shadow: inset 0 0 0 3px var(--row-color, transparent);
    pointer-events: none;
  }

  .history-targets-collapsed-item ha-state-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    margin: 0;
  }

  .history-targets-collapsed-add-container,
  .history-targets-collapsed-preferences-container {
    display: none;
    grid-auto-rows: max-content;
    justify-items: center;
  }

  .history-targets.collapsed .history-targets-collapsed-add-container,
  .history-targets.collapsed .history-targets-collapsed-preferences-container {
    display: grid;
  }

  .history-targets-collapsed-add-container {
    padding-top: calc(var(--spacing, 8px));
  }

  .history-targets-collapsed-preferences-container {
    padding-top: var(--dp-spacing-sm);
  }

  .history-targets-collapsed-add,
  .history-targets-collapsed-preferences {
    display: none;
    width: 28px;
    height: 28px;
    border-radius: 8px;
    border: 0;
    padding: 0;
    margin: 0;
    align-items: center;
    justify-content: center;
    background: color-mix(
      in srgb,
      var(--primary-text-color, #111) 4%,
      transparent
    );
    color: var(--secondary-text-color);
    --mdc-icon-size: 16px;
    cursor: pointer;
    appearance: none;
    -webkit-appearance: none;
    transition: background 120ms ease;
  }

  .history-targets-collapsed-add {
    background: color-mix(
      in srgb,
      var(--primary-color, #3b82f6) 18%,
      transparent
    );
    color: var(--primary-color, #3b82f6);
  }

  .history-targets-collapsed-add:hover,
  .history-targets-collapsed-add:focus-visible {
    background: color-mix(
      in srgb,
      var(--primary-color, #3b82f6) 26%,
      transparent
    );
    outline: none;
  }

  .history-targets-collapsed-preferences:hover,
  .history-targets-collapsed-preferences:focus-visible {
    background: color-mix(
      in srgb,
      var(--primary-text-color, #111) 8%,
      transparent
    );
    outline: none;
  }

  :host([sidebar-collapsed]) .history-targets-collapsed-add,
  :host([sidebar-collapsed]) .history-targets-collapsed-preferences {
    display: inline-flex;
  }

  :host([sidebar-collapsed]) .history-target-rows,
  :host([sidebar-collapsed]) .history-target-picker-slot,
  :host([sidebar-collapsed]) .sidebar-section-header {
    display: none;
  }

  :host([sidebar-collapsed]) .history-targets-collapsed-summary {
    display: grid;
  }

  .history-target-rows {
    display: grid;
    gap: calc(var(--spacing, 8px) * 1.25);
  }
`;var we=Object.create,P=Object.defineProperty,fe=Object.getOwnPropertyDescriptor,Z=(t,e)=>(e=Symbol[t])?e:Symbol.for("Symbol."+t),k=t=>{throw TypeError(t)},ee=(t,e,s)=>e in t?P(t,e,{enumerable:!0,configurable:!0,writable:!0,value:s}):t[e]=s,V=(t,e)=>P(t,"name",{value:e,configurable:!0}),_e=t=>[,,,we(t?.[Z("metadata")]??null)],te=["class","method","getter","setter","accessor","field","value","get","set"],W=t=>t!==void 0&&typeof t!="function"?k("Function expected"):t,ke=(t,e,s,l,o)=>({kind:te[t],name:e,metadata:l,addInitializer:i=>s._?k("Already initialized"):o.push(W(i||null))}),xe=(t,e)=>ee(e,Z("metadata"),t[3]),n=(t,e,s,l)=>{for(var o=0,i=t[e>>1],m=i&&i.length;o<m;o++)e&1?i[o].call(s):l=i[o].call(s,l);return l},u=(t,e,s,l,o,i)=>{var m,d,K,x,R,r=e&7,H=!!(e&8),y=!!(e&16),D=r>3?t.length+1:r?H?1:2:0,G=te[r+5],J=r>3&&(t[D-1]=[]),pe=t[D]||(t[D]=[]),h=r&&(!y&&!H&&(o=o.prototype),r<5&&(r>3||!y)&&fe(r<4?o:{get[s](){return X(this,i)},set[s](c){return Y(this,i,c)}},s));r?y&&r<4&&V(i,(r>2?"set ":r>1?"get ":"")+s):V(o,s);for(var q=l.length-1;q>=0;q--)x=ke(r,s,K={},t[3],pe),r&&(x.static=H,x.private=y,R=x.access={has:y?c=>Se(o,c):c=>s in c},r^3&&(R.get=y?c=>(r^1?X:Ce)(c,o,r^4?i:h.get):c=>c[s]),r>2&&(R.set=y?(c,M)=>Y(c,o,M,r^4?i:h.set):(c,M)=>c[s]=M)),d=(0,l[q])(r?r<4?y?i:h[G]:r>4?void 0:{get:h.get,set:h.set}:o,x),K._=1,r^4||d===void 0?W(d)&&(r>4?J.unshift(d):r?y?i=d:h[G]=d:o=d):typeof d!="object"||d===null?k("Object expected"):(W(m=d.get)&&(h.get=m),W(m=d.set)&&(h.set=m),W(m=d.init)&&J.unshift(m));return r||xe(t,o),h&&P(o,s,h),y?r^4?i:h:o},$e=(t,e,s)=>ee(t,e+"",s),O=(t,e,s)=>e.has(t)||k("Cannot "+s),Se=(t,e)=>Object(e)!==e?k('Cannot use the "in" operator on this value'):t.has(e),X=(t,e,s)=>(O(t,e,"read from private field"),s?s.call(t):e.get(t)),b=(t,e,s)=>e.has(t)?k("Cannot add the same private member more than once"):e instanceof WeakSet?e.add(t):e.set(t,s),Y=(t,e,s,l)=>(O(t,e,"write to private field"),l?l.call(t,s):e.set(t,s),s),Ce=(t,e,s)=>(O(t,e,"access private method"),s),se,re,ae,oe,ie,ne,le,T,ce,a,B,N,z,L,I,j,F;ce=[be()];class p extends(T=ye,le=[w({type:Array})],ne=[w({type:Object})],ie=[w({type:Object})],oe=[w({type:Array})],ae=[w({type:Boolean,attribute:"can-show-delta-analysis"})],re=[w({type:Boolean,attribute:"sidebar-collapsed",reflect:!0})],se=[me()],T){constructor(){super(...arguments),b(this,B,n(a,8,this,[])),n(a,11,this),b(this,N,n(a,12,this,{})),n(a,15,this),b(this,z,n(a,16,this,null)),n(a,19,this),b(this,L,n(a,20,this,[])),n(a,23,this),b(this,I,n(a,24,this,!1)),n(a,27,this),b(this,j,n(a,28,this,!1)),n(a,31,this),b(this,F,n(a,32,this,"")),n(a,35,this)}_emit(e,s={}){this.dispatchEvent(new CustomEvent(e,{detail:s,bubbles:!0,composed:!0}))}getRowListEl(){return this.shadowRoot?.querySelector("target-row-list")??null}getTargetPickerEl(){return this.shadowRoot?.querySelector("ha-target-picker")??null}_onPrefsClick(e){e.stopPropagation(),this._emit("dp-targets-prefs-click")}_onAddTargetClick(e){e.stopPropagation(),this._emit("dp-targets-add-click",{buttonEl:e.currentTarget})}_onCollapsedEntityClick(e,s){e.stopPropagation(),this._emit("dp-collapsed-entity-click",{entityId:s,buttonEl:e.currentTarget})}_renderCollapsedSummary(){return this.rows.length?this.rows.map(e=>{const s=ue(this.hass,e.entity_id)||e.entity_id;return v`
        <button
          type="button"
          class="history-targets-collapsed-item ${e.visible===!1?"is-hidden":""}"
          data-entity-id=${e.entity_id}
          style="--row-color:${U(e.color)}"
          aria-label=${U(s)}
          aria-pressed=${e.visible===!1?"false":"true"}
          @click=${l=>this._onCollapsedEntityClick(l,e.entity_id)}
        >
          <ha-state-icon
            .stateObj=${this.hass?.states?.[e.entity_id]}
            .hass=${this.hass}
            aria-hidden="true"
          ></ha-state-icon>
        </button>
      `}):Q}render(){return v`
      <div class="history-targets${this.sidebarCollapsed&&" collapsed"}">
        <div class="sidebar-section-header history-targets-header">
          <div class="sidebar-section-title">${f("Targets")}</div>
          <div class="sidebar-section-subtitle">
            ${f("Each row controls one chart series.")}
          </div>
        </div>

        <div class="history-target-rows">
          <target-row-list
            .rows=${this.rows}
            .states=${this.states}
            .hass=${this.hass}
            .canShowDeltaAnalysis=${this.canShowDeltaAnalysis}
            .comparisonWindows=${this.comparisonWindows}
          ></target-row-list>
        </div>

        <div class="history-target-picker-slot">
          <slot name="picker"> ${Q} </slot>
        </div>

        <div class="history-targets-collapsed-summary">
          ${this._renderCollapsedSummary()}
        </div>

        <div class="history-targets-collapsed-add-container">
          <button
            class="history-targets-collapsed-add"
            aria-label=${f("Add target")}
            title=${f("Add target")}
            @click=${this._onAddTargetClick}
          >
            <ha-icon icon="mdi:plus"></ha-icon>
          </button>
        </div>

        <div class="history-targets-collapsed-preferences-container">
          <button
            class="history-targets-collapsed-preferences"
            aria-label=${f("Chart preferences")}
            title=${f("Chart preferences")}
            @click=${this._onPrefsClick}
          >
            <ha-icon icon="mdi:tune-variant"></ha-icon>
          </button>
        </div>
      </div>
    `}}a=_e(T);B=new WeakMap;N=new WeakMap;z=new WeakMap;L=new WeakMap;I=new WeakMap;j=new WeakMap;F=new WeakMap;u(a,4,"rows",le,p,B);u(a,4,"states",ne,p,N);u(a,4,"hass",ie,p,z);u(a,4,"comparisonWindows",oe,p,L);u(a,4,"canShowDeltaAnalysis",ae,p,I);u(a,4,"sidebarCollapsed",re,p,j);u(a,4,"_collapsedSummaryKey",se,p,F);p=u(a,0,"HistoryTargets",ce,p);$e(p,"styles",ve);n(a,1,p);customElements.define("history-targets",p);const g=ge(),de=[{entity_id:"sensor.temperature",color:"#e53935",visible:!0,analysis:{}},{entity_id:"sensor.humidity",color:"#1e88e5",visible:!0,analysis:{}}],Ee=[{entity_id:"sensor.temperature",color:"#e53935",visible:!0,analysis:{}},{entity_id:"sensor.humidity",color:"#1e88e5",visible:!1,analysis:{}}],Ve={title:"Panels/Datapoints/History Targets",component:"history-targets",parameters:{actions:{handles:["dp-row-color-change","dp-row-visibility-change","dp-row-remove","dp-row-toggle-analysis","dp-row-analysis-change","dp-rows-reorder","dp-targets-add-click","dp-targets-prefs-click","dp-collapsed-entity-click"]},docs:{description:{component:"`history-targets` renders the sidebar targets section of the Datapoints panel.\nShows the entity target list, entity picker slot, and collapsed sidebar icon summary."}}},argTypes:{sidebarCollapsed:{control:"boolean",description:"When true, show collapsed icon summary instead of full list."},canShowDeltaAnalysis:{control:"boolean",description:"Whether delta analysis option is available in row analysis panels."}},args:{sidebarCollapsed:!1,canShowDeltaAnalysis:!1},render:t=>v`
    <history-targets
      .rows=${de}
      .states=${g.states}
      .hass=${g}
      .comparisonWindows=${[]}
      .canShowDeltaAnalysis=${t.canShowDeltaAnalysis}
      .sidebarCollapsed=${t.sidebarCollapsed}
      style="display: block; width: 340px; padding: 16px; background: var(--card-background-color, #fff);"
    ></history-targets>
  `},$={},S={render:()=>v`
    <history-targets
      .rows=${[]}
      .states=${g.states}
      .hass=${g}
      .comparisonWindows=${[]}
      style="display: block; width: 340px; padding: 16px; background: var(--card-background-color, #fff);"
    ></history-targets>
  `},C={args:{sidebarCollapsed:!0},render:()=>v`
    <history-targets
      .rows=${de}
      .states=${g.states}
      .hass=${g}
      .comparisonWindows=${[]}
      .sidebarCollapsed=${!0}
      style="display: block; width: 52px; padding: 0; background: var(--card-background-color, #fff);"
    ></history-targets>
  `,play:async({canvasElement:t})=>{const e=t.querySelector("history-targets");_(e.shadowRoot.querySelectorAll(".history-targets-collapsed-item").length).toBe(2),_(e.shadowRoot.querySelector(".history-targets-collapsed-add")).not.toBeNull(),_(e.shadowRoot.querySelector(".history-targets-collapsed-preferences")).not.toBeNull()}},E={render:()=>v`
    <history-targets
      .rows=${Ee}
      .states=${g.states}
      .hass=${g}
      .comparisonWindows=${[]}
      .sidebarCollapsed=${!0}
      style="display: block; width: 52px; padding: 0; background: var(--card-background-color, #fff);"
    ></history-targets>
  `},A={render:()=>v`
    <history-targets
      .rows=${[]}
      .states=${g.states}
      .hass=${g}
      .comparisonWindows=${[]}
      .sidebarCollapsed=${!0}
      style="display: block; width: 52px; padding: 0; background: var(--card-background-color, #fff);"
    ></history-targets>
  `,play:async({canvasElement:t})=>{const e=t.querySelector("history-targets");_(e.shadowRoot.querySelectorAll(".history-targets-collapsed-item").length).toBe(0),_(e.shadowRoot.querySelector(".history-targets-collapsed-add")).not.toBeNull(),_(e.shadowRoot.querySelector(".history-targets-collapsed-preferences")).not.toBeNull()}};$.parameters={...$.parameters,docs:{...$.parameters?.docs,source:{originalSource:"{}",...$.parameters?.docs?.source},description:{story:"Default expanded sidebar with two target rows.",...$.parameters?.docs?.description}}};S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <history-targets
      .rows=\${[]}
      .states=\${mockHass.states}
      .hass=\${mockHass}
      .comparisonWindows=\${[]}
      style="display: block; width: 340px; padding: 16px; background: var(--card-background-color, #fff);"
    ></history-targets>
  \`
}`,...S.parameters?.docs?.source},description:{story:"No rows added yet — empty state.",...S.parameters?.docs?.description}}};C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  args: {
    sidebarCollapsed: true
  },
  render: () => html\`
    <history-targets
      .rows=\${SAMPLE_ROWS}
      .states=\${mockHass.states}
      .hass=\${mockHass}
      .comparisonWindows=\${[]}
      .sidebarCollapsed=\${true}
      style="display: block; width: 52px; padding: 0; background: var(--card-background-color, #fff);"
    ></history-targets>
  \`,
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const el = canvasElement.querySelector("history-targets") as HTMLElement & {
      shadowRoot: ShadowRoot;
    };
    expect(el.shadowRoot.querySelectorAll(".history-targets-collapsed-item").length).toBe(2);
    expect(el.shadowRoot.querySelector(".history-targets-collapsed-add")).not.toBeNull();
    expect(el.shadowRoot.querySelector(".history-targets-collapsed-preferences")).not.toBeNull();
  }
}`,...C.parameters?.docs?.source},description:{story:"Collapsed sidebar mode — shows icon summary instead of full list.",...C.parameters?.docs?.description}}};E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <history-targets
      .rows=\${HIDDEN_ROW_SAMPLE}
      .states=\${mockHass.states}
      .hass=\${mockHass}
      .comparisonWindows=\${[]}
      .sidebarCollapsed=\${true}
      style="display: block; width: 52px; padding: 0; background: var(--card-background-color, #fff);"
    ></history-targets>
  \`
}`,...E.parameters?.docs?.source},description:{story:"Collapsed mode with a hidden series — the hidden icon shows at reduced opacity.",...E.parameters?.docs?.description}}};A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <history-targets
      .rows=\${[]}
      .states=\${mockHass.states}
      .hass=\${mockHass}
      .comparisonWindows=\${[]}
      .sidebarCollapsed=\${true}
      style="display: block; width: 52px; padding: 0; background: var(--card-background-color, #fff);"
    ></history-targets>
  \`,
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const el = canvasElement.querySelector("history-targets") as HTMLElement & {
      shadowRoot: ShadowRoot;
    };
    expect(el.shadowRoot.querySelectorAll(".history-targets-collapsed-item").length).toBe(0);
    expect(el.shadowRoot.querySelector(".history-targets-collapsed-add")).not.toBeNull();
    expect(el.shadowRoot.querySelector(".history-targets-collapsed-preferences")).not.toBeNull();
  }
}`,...A.parameters?.docs?.source}}};const Xe=["Default","Empty","Collapsed","CollapsedWithHiddenRow","CollapsedEmpty"];export{C as Collapsed,A as CollapsedEmpty,E as CollapsedWithHiddenRow,$ as Default,S as Empty,Xe as __namedExportsOrder,Ve as default};
