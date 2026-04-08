import{i as vt,A as k,b as _,g as xt}from"./iframe-maWesKjk.js";import{n as h}from"./property-DyW-YDBW.js";import{m as f}from"./localize-Cz1ya3ms.js";import"./analysis-sample-group-B6DXKU1N.js";import"./analysis-trend-group-C_jadOVq.js";import"./analysis-summary-group-18mMfsol.js";import"./analysis-rate-group-ClWjzN4_.js";import"./analysis-threshold-group-CvkzLvvQ.js";import"./analysis-anomaly-group-COJBbfcf.js";import"./analysis-delta-group-COrtQ8Ee.js";import{l as ft}from"./localized-decorator-CXjGGqe_.js";const wt=vt`
  :host {
    display: block;
    --dp-spacing-xs: calc(var(--spacing, 8px) * 0.5);
    --dp-spacing-sm: var(--spacing, 8px);
    --dp-spacing-md: calc(var(--spacing, 8px) * 1.5);
    --dp-spacing-lg: calc(var(--spacing, 8px) * 2);
    --dp-spacing-xl: calc(var(--spacing, 8px) * 2.5);
  }

  .history-target-row {
    display: grid;
    position: relative;
    grid-template-columns: auto minmax(0, 1fr) auto;
    grid-template-areas:
      "handle name actions"
      ". analysis analysis";
    gap: var(--dp-spacing-sm);
    align-items: center;
    margin: 0;
    padding: calc(var(--spacing, 8px) * 1.125) calc(var(--spacing, 8px) * 1.25);
    border-radius: 16px;
    background: var(--card-background-color, #fff);
    border: 1px solid
      color-mix(
        in srgb,
        var(--divider-color, rgba(0, 0, 0, 0.12)) 88%,
        transparent
      );
    transition:
      border-color 140ms ease,
      background-color 140ms ease;
    padding-bottom: 0;
    padding-left: 3px;
  }

  .history-target-row.analysis-open {
    padding-bottom: calc(var(--spacing, 8px) * 1.125);
  }

  .history-target-row.is-hidden {
    opacity: 0.62;
  }

  .history-target-row:hover {
    border-color: color-mix(
      in srgb,
      var(--primary-color, #03a9f4) 24%,
      var(--divider-color, rgba(0, 0, 0, 0.12))
    );
    background: color-mix(
      in srgb,
      var(--primary-color, #03a9f4) 2%,
      var(--card-background-color, #fff)
    );
  }

  .history-target-row.is-dragging {
    opacity: 0.35;
  }

  .history-target-row.is-drag-over-before {
    box-shadow: inset 0 3px 0 -1px var(--primary-color, #03a9f4);
  }

  .history-target-row.is-drag-over-after {
    box-shadow: inset 0 -3px 0 -1px var(--primary-color, #03a9f4);
  }

  .history-target-drag-handle {
    grid-area: handle;
    align-self: center;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 28px;
    padding: 0;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: var(--secondary-text-color);
    opacity: 0;
    transition:
      opacity 140ms ease,
      background-color 120ms ease;
    touch-action: none;
    margin-right: calc(var(--dp-spacing-xs) * -0.5);
    margin-left: -8px;
    position: absolute;
  }

  .history-target-drag-handle ha-icon {
    --mdc-icon-size: 16px;
    display: block;
    pointer-events: none;
  }

  .history-target-row:hover .history-target-drag-handle {
    opacity: 0.45;
  }

  .history-target-drag-handle:hover,
  .history-target-drag-handle:focus-visible {
    opacity: 1;
    outline: none;
  }

  .history-target-name {
    grid-area: name;
    min-width: 0;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: var(--dp-spacing-sm);
    align-items: center;
  }

  .history-target-name-text {
    min-width: 0;
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.2;
    color: var(--primary-text-color);
    white-space: normal;
    overflow-wrap: anywhere;
  }

  .history-target-entity-id {
    margin-top: 4px;
    font-size: 0.74rem;
    font-weight: 400;
    color: var(--secondary-text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .history-target-color-field {
    position: relative;
    display: inline-grid;
    place-items: center;
    flex: 0 0 auto;
    width: 32px;
    height: 32px;
    border-radius: 10px;
    overflow: hidden;
  }

  .history-target-controls {
    display: contents;
  }

  .history-target-color-icon {
    position: absolute;
    inset: 0;
    display: inline-grid;
    place-items: center;
    width: 100%;
    height: 100%;
    color: var(--row-icon-color, var(--text-primary-color, #fff));
    pointer-events: none;
    z-index: 1;
  }

  .history-target-color-icon ha-state-icon {
    width: 16px;
    height: 16px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin: 0;
  }

  .history-target-color {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border: 0;
    border-radius: 10px;
    padding: 0;
    background: none;
    cursor: pointer;
    appearance: none;
    -webkit-appearance: none;
    opacity: 0;
    z-index: 2;
  }

  .history-target-color::-webkit-color-swatch-wrapper {
    padding: 0;
  }

  .history-target-color::-webkit-color-swatch {
    border: none;
    border-radius: 10px;
  }

  .history-target-color::-moz-color-swatch {
    border: none;
    border-radius: 10px;
  }

  .history-target-color-field::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: var(--row-color, transparent);
    box-shadow: inset 0 0 0 1px
      color-mix(in srgb, rgba(0, 0, 0, 0.18) 70%, transparent);
  }

  .history-target-color:focus-visible + .history-target-color-icon {
    outline: 2px solid
      color-mix(in srgb, var(--primary-color, #03a9f4) 55%, transparent);
    outline-offset: 2px;
    border-radius: inherit;
  }

  .history-target-actions {
    grid-area: actions;
    justify-self: end;
    align-self: center;
    display: inline-flex;
    align-items: center;
    gap: calc(var(--spacing, 8px) * 0.75);
  }

  .history-target-analysis-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    min-width: 24px;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: var(--secondary-text-color);
    cursor: pointer;
    transition:
      background-color 120ms ease,
      color 120ms ease;
  }

  .history-target-analysis-toggle ha-icon {
    --mdc-icon-size: 16px;
    display: block;
    transition: transform 120ms ease;
  }

  .history-target-analysis-toggle.is-open ha-icon {
    transform: rotate(180deg);
  }

  .history-target-analysis-toggle:hover,
  .history-target-analysis-toggle:focus-visible {
    background: color-mix(
      in srgb,
      var(--primary-text-color, #111) 8%,
      transparent
    );
    color: var(--primary-text-color);
    outline: none;
  }

  .history-target-visible-toggle {
    position: relative;
    display: inline-flex;
    width: 34px;
    height: 20px;
    flex: 0 0 auto;
    cursor: pointer;
  }

  .history-target-visible-toggle input {
    position: absolute;
    inset: 0;
    opacity: 0;
    margin: 0;
    cursor: pointer;
  }

  .history-target-visible-toggle-track {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 999px;
    background: color-mix(
      in srgb,
      var(--secondary-text-color, #6b7280) 45%,
      transparent
    );
    transition: background-color 120ms ease;
  }

  .history-target-visible-toggle-track::after {
    content: "";
    position: absolute;
    top: 2px;
    left: 2px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--card-background-color, #fff);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.24);
    transition: transform 120ms ease;
  }

  .history-target-visible-toggle
    input:checked
    + .history-target-visible-toggle-track {
    background: var(--primary-color);
  }

  .history-target-visible-toggle
    input:checked
    + .history-target-visible-toggle-track::after {
    transform: translateX(14px);
  }

  .history-target-visible-toggle
    input:focus-visible
    + .history-target-visible-toggle-track {
    outline: 2px solid color-mix(in srgb, var(--primary-color) 55%, transparent);
    outline-offset: 2px;
  }

  .history-target-remove {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    min-width: 16px;
    line-height: 16px;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: color-mix(
      in srgb,
      var(--primary-text-color, #111) 7%,
      transparent
    );
    color: var(--secondary-text-color);
    cursor: pointer;
    flex: 0 0 auto;
  }

  .history-target-remove ha-icon {
    --mdc-icon-size: 12px;
    display: block;
  }

  .history-target-remove:hover,
  .history-target-remove:focus-visible {
    background: color-mix(
      in srgb,
      var(--error-color, #db4437) 14%,
      transparent
    );
    color: var(--error-color, #db4437);
    outline: none;
  }

  /* ── Analysis panel ─────────────────────────────────────── */

  .history-target-analysis {
    grid-area: analysis;
    display: grid;
    gap: var(--dp-spacing-sm);
    padding-top: calc(var(--spacing, 8px) * 0.25);
    border-top: 1px solid
      color-mix(
        in srgb,
        var(--divider-color, rgba(0, 0, 0, 0.12)) 78%,
        transparent
      );
  }

  .history-target-analysis-bottom-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--dp-spacing-sm);
  }

  .history-target-analysis-copy-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    border: none;
    border-radius: 6px;
    background: color-mix(
      in srgb,
      var(--primary-color, #03a9f4) 12%,
      transparent
    );
    color: var(--primary-color, #03a9f4);
    font: inherit;
    font-size: 0.78rem;
    cursor: pointer;
    transition: background-color 120ms ease;
  }

  .history-target-analysis-copy-btn:disabled {
    background: color-mix(
      in srgb,
      var(--disabled-color, #bdbdbd) 12%,
      transparent
    );
    color: var(--disabled-color, #bdbdbd);
  }

  .history-target-analysis-copy-btn:not(:disabled):hover,
  .history-target-analysis-copy-btn:not(:disabled):focus-visible {
    background: color-mix(
      in srgb,
      var(--primary-color, #03a9f4) 20%,
      transparent
    );
  }

  .history-target-analysis-copy-btn ha-icon {
    --mdc-icon-size: 14px;
  }

  .history-target-analysis-grid {
    display: grid;
    gap: var(--dp-spacing-sm);
    padding-top: var(--dp-spacing-sm);
  }

  .history-target-analysis-option {
    display: flex;
    align-items: center;
    gap: calc(var(--spacing, 8px) * 0.75);
    color: var(--primary-text-color);
    font-size: 0.84rem;
    cursor: pointer;
  }

  .history-target-analysis-option.is-disabled {
    opacity: 0.4;
    pointer-events: none;
  }

  .history-target-analysis-option input[type="checkbox"] {
    margin: 0;
    accent-color: var(--primary-color, #03a9f4);
    cursor: pointer;
  }

  /* Skeleton loading state shown while HA entity data is unavailable */
  @keyframes dp-skeleton-shimmer {
    0%,
    100% {
      opacity: 0.35;
    }
    50% {
      opacity: 0.7;
    }
  }

  .skeleton {
    background: var(--divider-color, rgba(0, 0, 0, 0.12));
    border-radius: 4px;
    animation: dp-skeleton-shimmer 1.4s ease-in-out infinite;
    display: inline-block;
  }

  .skeleton-icon {
    width: 24px;
    height: 24px;
    border-radius: 50%;
  }

  .skeleton-name {
    height: 0.9em;
    width: 120px;
    margin-bottom: -3px;
    border-radius: 4px;
  }

  .skeleton-entity-id {
    height: 0.7em;
    width: 80px;
    border-radius: 4px;
  }
`;var kt=Object.create,O=Object.defineProperty,$t=Object.getOwnPropertyDescriptor,Z=(t,e)=>(e=Symbol[t])?e:Symbol.for("Symbol."+t),w=t=>{throw TypeError(t)},tt=(t,e,a)=>e in t?O(t,e,{enumerable:!0,configurable:!0,writable:!0,value:a}):t[e]=a,Q=(t,e)=>O(t,"name",{value:e,configurable:!0}),At=t=>[,,,kt(t?.[Z("metadata")]??null)],et=["class","method","getter","setter","accessor","field","value","get","set"],$=t=>t!==void 0&&typeof t!="function"?w("Function expected"):t,It=(t,e,a,c,o)=>({kind:et[t],name:e,metadata:c,addInitializer:n=>a._?w("Already initialized"):o.push($(n||null))}),Ct=(t,e)=>tt(e,Z("metadata"),t[3]),r=(t,e,a,c)=>{for(var o=0,n=t[e>>1],u=n&&n.length;o<u;o++)e&1?n[o].call(a):c=n[o].call(a,c);return c},p=(t,e,a,c,o,n)=>{var u,d,A,v,x,s=e&7,I=!!(e&8),b=!!(e&16),C=s>3?t.length+1:s?I?1:2:0,J=et[s+5],K=s>3&&(t[C-1]=[]),_t=t[C]||(t[C]=[]),m=s&&(!b&&!I&&(o=o.prototype),s<5&&(s>3||!b)&&$t(s<4?o:{get[a](){return U(this,n)},set[a](y){return Y(this,n,y)}},a));s?b&&s<4&&Q(n,(s>2?"set ":s>1?"get ":"")+a):Q(o,a);for(var S=c.length-1;S>=0;S--)v=It(s,a,A={},t[3],_t),s&&(v.static=I,v.private=b,x=v.access={has:b?y=>Mt(o,y):y=>a in y},s^3&&(x.get=b?y=>(s^1?U:Wt)(y,o,s^4?n:m.get):y=>y[a]),s>2&&(x.set=b?(y,M)=>Y(y,o,M,s^4?n:m.set):(y,M)=>y[a]=M)),d=(0,c[S])(s?s<4?b?n:m[J]:s>4?void 0:{get:m.get,set:m.set}:o,v),A._=1,s^4||d===void 0?$(d)&&(s>4?K.unshift(d):s?b?n=d:m[J]=d:o=d):typeof d!="object"||d===null?w("Object expected"):($(u=d.get)&&(m.get=u),$(u=d.set)&&(m.set=u),$(u=d.init)&&K.unshift(u));return s||Ct(t,o),m&&O(o,a,m),b?s^4?n:m:o},St=(t,e,a)=>tt(t,e+"",a),j=(t,e,a)=>e.has(t)||w("Cannot "+a),Mt=(t,e)=>Object(e)!==e?w('Cannot use the "in" operator on this value'):t.has(e),U=(t,e,a)=>(j(t,e,"read from private field"),a?a.call(t):e.get(t)),g=(t,e,a)=>e.has(t)?w("Cannot add the same private member more than once"):e instanceof WeakSet?e.add(t):e.set(t,a),Y=(t,e,a,c)=>(j(t,e,"write to private field"),c?c.call(t,a):e.set(t,a),a),Wt=(t,e,a)=>(j(t,e,"access private method"),a),it,at,st,rt,ot,nt,lt,ct,dt,pt,ht,gt,yt,ut,mt,W,bt,i,z,D,N,P,T,G,H,B,E,R,F,V,L,X,q;function Ot(t){const e=String(t||"").trim(),a=/^#([0-9a-f]{6})$/i.test(e)?e:null;if(!a)return"#ffffff";const c=a.slice(1).match(/.{2}/g)?.map(s=>parseInt(s,16));if(!c||c.length!==3)return"#ffffff";const[o,n,u]=c,d=(.299*o+.587*n+.114*u)/255,A=d>.62?0:255,v=d>.62?Math.min(.82,.35+(d-.62)*1.6):Math.min(.78,.4+(.62-d)*.9),x=[o,n,u].map(s=>Math.max(0,Math.min(255,Math.round(s*(1-v)+A*v))));return`rgb(${x[0]}, ${x[1]}, ${x[2]})`}function jt(t){return t.show_trend_lines||t.show_summary_stats||t.show_rate_of_change||t.show_threshold_analysis||t.show_anomalies||t.show_delta_analysis||t.stepped_series||t.hide_source_series}function zt(t,e){return t.show_trend_lines||t.show_summary_stats||t.show_rate_of_change||t.show_threshold_analysis||t.show_anomalies||t.show_delta_analysis&&e}bt=[ft()];class l extends(W=xt,mt=[h({type:String})],ut=[h({type:Boolean})],yt=[h({type:Object})],gt=[h({type:Number})],ht=[h({type:String,attribute:"entity-id"})],pt=[h({type:Boolean,attribute:"can-show-delta-analysis"})],dt=[h({type:Object,attribute:!1})],ct=[h({type:Object,attribute:!1})],lt=[h({type:Array,attribute:"comparison-windows"})],nt=[h({type:Boolean,attribute:!1})],ot=[h({type:Number,attribute:!1})],rt=[h({type:Object,attribute:!1})],st=[h({type:Number,attribute:!1})],at=[h({type:Boolean,attribute:!1})],it=[h({type:Boolean,attribute:"hide-drag-handle"})],W){constructor(){super(...arguments),g(this,z,r(i,8,this,"#03a9f4")),r(i,11,this),g(this,D,r(i,12,this,!0)),r(i,15,this),g(this,N,r(i,16,this,{})),r(i,19,this),g(this,P,r(i,20,this,0)),r(i,23,this),g(this,T,r(i,24,this,"")),r(i,27,this),g(this,G,r(i,28,this,!1)),r(i,31,this),g(this,H,r(i,32,this,null)),r(i,35,this),g(this,B,r(i,36,this,null)),r(i,39,this),g(this,E,r(i,40,this,[])),r(i,43,this),g(this,R,r(i,44,this,!1)),r(i,47,this),g(this,F,r(i,48,this,0)),r(i,51,this),g(this,V,r(i,52,this,new Set)),r(i,55,this),g(this,L,r(i,56,this,1)),r(i,59,this),g(this,X,r(i,60,this,!1)),r(i,63,this),g(this,q,r(i,64,this,!1)),r(i,67,this)}get _entityId(){return this.stateObj?.entity_id??this.entityId??""}get _entityName(){return this.stateObj?.attributes?.friendly_name??this._entityId}get _unit(){return this.stateObj?.attributes?.unit_of_measurement??""}get _supportsAnalysis(){return!!this._entityId&&!this._entityId.startsWith("binary_sensor.")}_emit(e,a){this.dispatchEvent(new CustomEvent(e,{detail:a,bubbles:!0,composed:!0}))}_onColorChange(e){this._emit("dp-row-color-change",{index:this.index,color:e.target.value})}_onVisibilityChange(e){this._emit("dp-row-visibility-change",{entityId:this._entityId,visible:e.target.checked})}_onAnalysisToggle(){this._emit("dp-row-toggle-analysis",{entityId:this._entityId})}_onRemove(){this._emit("dp-row-remove",{index:this.index})}_onCheckbox(e,a){this._emit("dp-row-analysis-change",{entityId:this._entityId,key:e,value:a.target.checked})}_onCopyAnalysisToAll(){this._emit("dp-row-copy-analysis-to-all",{entityId:this._entityId,analysis:this.analysis})}_onGroupAnalysisChange(e){this._emit("dp-row-analysis-change",e.detail)}render(){const e=this.analysis||{},a=jt(e),c=zt(e,this.canShowDeltaAnalysis),o=["history-target-row",this.visible===!1?"is-hidden":"",this.analysis?.expanded?"analysis-open":""].filter(Boolean).join(" ");return _`
      <div class=${o} role="row">
        ${this.hideDragHandle?k:_` <button
              type="button"
              class="history-target-drag-handle"
              draggable="true"
              aria-label="Drag to reorder ${this._entityName}"
              title="Drag to reorder"
            >
              <ha-icon icon="mdi:drag-vertical"></ha-icon>
            </button>`}

        <div
          class="history-target-name"
          role="cell"
          title=${this._entityName}
          @click=${this._supportsAnalysis?this._onAnalysisToggle:k}
          style=${this._supportsAnalysis?"cursor:pointer":""}
        >
          <div class="history-target-controls">
            <label
              class="history-target-color-field"
              style="--row-color:${this.color};--row-icon-color:${Ot(this.color)}"
              @click=${n=>n.stopPropagation()}
            >
              <input
                type="color"
                class="history-target-color"
                .value=${this.color}
                aria-label="Line color for ${this._entityId}"
                @change=${this._onColorChange}
              />
              <span class="history-target-color-icon" aria-hidden="true">
                ${this.stateObj?_`<ha-state-icon
                      .stateObj=${this.stateObj}
                      .hass=${this.hass??null}
                    ></ha-state-icon>`:_`<span class="skeleton skeleton-icon"></span>`}
              </span>
            </label>
          </div>
          <div class="history-target-name-text">
            ${this.stateObj?_`${this._entityName}
                  <div class="history-target-entity-id">${this._entityId}</div>`:_`<span class="skeleton skeleton-name"></span>
                  <div class="history-target-entity-id">
                    <span class="skeleton skeleton-entity-id"></span>
                  </div>`}
          </div>
        </div>

        <div class="history-target-actions" role="cell">
          ${this._supportsAnalysis?_`
                <button
                  type="button"
                  class="history-target-analysis-toggle ${this.analysis?.expanded?"is-open":""} ${a?"configured":""}"
                  aria-label="${this.analysis?.expanded?"Collapse":"Expand"} analysis options for ${this._entityName}"
                  aria-expanded=${this.analysis?.expanded}
                  title=${a?f("Analysis configured"):f("Configure analysis")}
                  @click=${this._onAnalysisToggle}
                >
                  <ha-icon icon="mdi:chevron-down"></ha-icon>
                </button>
              `:k}

          <label
            class="history-target-visible-toggle"
            title="${this.visible===!1?"Show":"Hide"} ${this._entityName}"
          >
            <input
              type="checkbox"
              aria-label="Show ${this._entityName} on chart"
              .checked=${this.visible!==!1}
              @change=${this._onVisibilityChange}
            />
            <span class="history-target-visible-toggle-track"></span>
          </label>

          <button
            type="button"
            class="history-target-remove"
            aria-label="Remove ${this._entityId}"
            @click=${this._onRemove}
          >
            <ha-icon icon="mdi:close"></ha-icon>
          </button>
        </div>

        ${this._supportsAnalysis&&this.analysis?.expanded?_`
              <div class="history-target-analysis" role="cell">
                <div class="history-target-analysis-grid">
                  <analysis-sample-group
                    .analysis=${e}
                    .entityId=${this._entityId}
                    @dp-group-analysis-change=${this._onGroupAnalysisChange}
                  ></analysis-sample-group>
                  <label class="history-target-analysis-option">
                    <input
                      type="checkbox"
                      .checked=${e.stepped_series===!0}
                      @change=${n=>this._onCheckbox("stepped_series",n)}
                    />
                    <span>${f("Stepped series")}</span>
                  </label>
                  <analysis-trend-group
                    .analysis=${e}
                    .entityId=${this._entityId}
                    @dp-group-analysis-change=${this._onGroupAnalysisChange}
                  ></analysis-trend-group>
                  <analysis-summary-group
                    .analysis=${e}
                    .entityId=${this._entityId}
                    @dp-group-analysis-change=${this._onGroupAnalysisChange}
                  ></analysis-summary-group>
                  <analysis-rate-group
                    .analysis=${e}
                    .entityId=${this._entityId}
                    @dp-group-analysis-change=${this._onGroupAnalysisChange}
                  ></analysis-rate-group>
                  <analysis-threshold-group
                    .analysis=${e}
                    .entityId=${this._entityId}
                    .unit=${this._unit}
                    @dp-group-analysis-change=${this._onGroupAnalysisChange}
                  ></analysis-threshold-group>
                  <analysis-anomaly-group
                    .analysis=${e}
                    .entityId=${this._entityId}
                    .comparisonWindows=${this.comparisonWindows}
                    .computing=${this.computing}
                    .computingProgress=${this.computingProgress}
                    .computingMethods=${this.computingMethods}
                    @dp-group-analysis-change=${this._onGroupAnalysisChange}
                  ></analysis-anomaly-group>
                  <analysis-delta-group
                    .analysis=${e}
                    .entityId=${this._entityId}
                    .canShowDeltaAnalysis=${this.canShowDeltaAnalysis}
                    @dp-group-analysis-change=${this._onGroupAnalysisChange}
                  ></analysis-delta-group>
                  <div class="history-target-analysis-bottom-row">
                    <label
                      class="history-target-analysis-option ${c?"":"is-disabled"}"
                    >
                      <input
                        type="checkbox"
                        .checked=${e.hide_source_series&&c}
                        ?disabled=${!c}
                        @change=${n=>this._onCheckbox("hide_source_series",n)}
                      />
                      <span>${f("Hide source series")}</span>
                    </label>
                    ${this.rowCount>1?_`
                          <button
                            type="button"
                            class="history-target-analysis-copy-btn"
                            title=${this.allAnalysisSame?f("All targets already have the same settings"):f("Copy these analysis settings to all targets")}
                            ?disabled=${this.allAnalysisSame}
                            @click=${this._onCopyAnalysisToAll}
                          >
                            <ha-icon icon="mdi:content-copy"></ha-icon>
                            ${f("Copy to all targets")}
                          </button>
                        `:k}
                  </div>
                </div>
              </div>
            `:k}
      </div>
    `}}i=At(W);z=new WeakMap;D=new WeakMap;N=new WeakMap;P=new WeakMap;T=new WeakMap;G=new WeakMap;H=new WeakMap;B=new WeakMap;E=new WeakMap;R=new WeakMap;F=new WeakMap;V=new WeakMap;L=new WeakMap;X=new WeakMap;q=new WeakMap;p(i,4,"color",mt,l,z);p(i,4,"visible",ut,l,D);p(i,4,"analysis",yt,l,N);p(i,4,"index",gt,l,P);p(i,4,"entityId",ht,l,T);p(i,4,"canShowDeltaAnalysis",pt,l,G);p(i,4,"stateObj",dt,l,H);p(i,4,"hass",ct,l,B);p(i,4,"comparisonWindows",lt,l,E);p(i,4,"computing",nt,l,R);p(i,4,"computingProgress",ot,l,F);p(i,4,"computingMethods",rt,l,V);p(i,4,"rowCount",st,l,L);p(i,4,"allAnalysisSame",at,l,X);p(i,4,"hideDragHandle",it,l,q);l=p(i,0,"TargetRow",bt,l);St(l,"styles",wt);r(i,1,l);customElements.define("target-row",l);
