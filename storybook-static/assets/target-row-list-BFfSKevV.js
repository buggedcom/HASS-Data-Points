import{i as it,b as $,g as ot}from"./iframe-maWesKjk.js";import{n as f}from"./property-DyW-YDBW.js";import"./localize-Cz1ya3ms.js";import"./target-row-CqKWU3NH.js";import{l as nt}from"./localized-decorator-CXjGGqe_.js";const dt=it`
  :host {
    display: block;
    --dp-spacing-xs: calc(var(--spacing, 8px) * 0.5);
    --dp-spacing-sm: var(--spacing, 8px);
    --dp-spacing-md: calc(var(--spacing, 8px) * 1.5);
    --dp-spacing-lg: calc(var(--spacing, 8px) * 2);
    --dp-spacing-xl: calc(var(--spacing, 8px) * 2.5);
  }

  .history-target-table {
    display: grid;
  }

  .history-target-table-body {
    display: grid;
    gap: calc(var(--spacing, 8px) * 1.25);
    margin: calc(var(--spacing, 8px) * 1.25) 0 0 0;
  }

  .history-target-empty {
    padding: var(--dp-spacing-md) var(--dp-spacing-sm);
    border-radius: 12px;
    background: color-mix(
      in srgb,
      var(--primary-text-color, #111) 4%,
      transparent
    );
    color: var(--secondary-text-color, #9e9e9e);
    font-size: 0.84rem;
  }

  /* Cursor — dragging is a list concern; cursor inherits into the row's shadow DOM */
  target-row {
    cursor: grab;
  }

  target-row.is-dragging {
    cursor: grabbing;
  }

  /* Drag states applied to the target-row host element */

  target-row {
    border-radius: 16px;
    border-top: 1px solid transparent;
    border-bottom: 1px solid transparent;
  }

  target-row.is-dragging {
    opacity: 0.35;
    pointer-events: none;
  }

  target-row.is-drag-over-before,
  target-row.is-drag-over-after {
    position: relative;
    overflow: visible;
  }

  target-row.is-drag-over-before {
    border-top: 1px solid var(--primary-color, #03a9f4);
  }

  target-row.is-drag-over-after {
    border-bottom: 1px solid var(--primary-color, #03a9f4);
  }

  target-row .history-target-row {
    cursor: grab;
  }
`;var ct=Object.create,T=Object.defineProperty,lt=Object.getOwnPropertyDescriptor,q=(r,t)=>(t=Symbol[r])?t:Symbol.for("Symbol."+r),b=r=>{throw TypeError(r)},G=(r,t,e)=>t in r?T(r,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):r[t]=e,Y=(r,t)=>T(r,"name",{value:t,configurable:!0}),gt=r=>[,,,ct(r?.[q("metadata")]??null)],X=["class","method","getter","setter","accessor","field","value","get","set"],x=r=>r!==void 0&&typeof r!="function"?b("Function expected"):r,ht=(r,t,e,a,s)=>({kind:X[r],name:t,metadata:a,addInitializer:i=>e._?b("Already initialized"):s.push(x(i||null))}),pt=(r,t)=>G(t,q("metadata"),r[3]),l=(r,t,e,a)=>{for(var s=0,i=r[t>>1],g=i&&i.length;s<g;s++)t&1?i[s].call(e):a=i[s].call(e,a);return a},w=(r,t,e,a,s,i)=>{var g,d,h,c,y,o=t&7,S=!!(t&8),v=!!(t&16),I=o>3?r.length+1:o?S?1:2:0,z=X[o+5],j=o>3&&(r[I-1]=[]),at=r[I]||(r[I]=[]),u=o&&(!v&&!S&&(s=s.prototype),o<5&&(o>3||!v)&&lt(o<4?s:{get[e](){return J(this,i)},set[e](p){return U(this,i,p)}},e));o?v&&o<4&&Y(i,(o>2?"set ":o>1?"get ":"")+e):Y(s,e);for(var E=a.length-1;E>=0;E--)c=ht(o,e,h={},r[3],at),o&&(c.static=S,c.private=v,y=c.access={has:v?p=>_t(s,p):p=>e in p},o^3&&(y.get=v?p=>(o^1?J:ut)(p,s,o^4?i:u.get):p=>p[e]),o>2&&(y.set=v?(p,A)=>U(p,s,A,o^4?i:u.set):(p,A)=>p[e]=A)),d=(0,a[E])(o?o<4?v?i:u[z]:o>4?void 0:{get:u.get,set:u.set}:s,c),h._=1,o^4||d===void 0?x(d)&&(o>4?j.unshift(d):o?v?i=d:u[z]=d:s=d):typeof d!="object"||d===null?b("Object expected"):(x(g=d.get)&&(u.get=g),x(g=d.set)&&(u.set=g),x(g=d.init)&&j.unshift(g));return o||pt(r,s),u&&T(s,e,u),v?o^4?i:u:s},D=(r,t,e)=>G(r,typeof t!="symbol"?t+"":t,e),M=(r,t,e)=>t.has(r)||b("Cannot "+e),_t=(r,t)=>Object(t)!==t?b('Cannot use the "in" operator on this value'):r.has(t),J=(r,t,e)=>(M(r,t,"read from private field"),e?e.call(r):t.get(r)),m=(r,t,e)=>t.has(r)?b("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(r):t.set(r,e),U=(r,t,e,a)=>(M(r,t,"write to private field"),a?a.call(r,e):t.set(r,e),e),ut=(r,t,e)=>(M(r,t,"access private method"),e),H,K,Q,V,Z,tt,et,rt,C,st,n,W,k,F,L,P,R,B,N;const O={raw:0,"5s":5,"10s":10,"15s":15,"30s":30,"1m":60,"2m":120,"5m":300,"10m":600,"15m":900,"30m":1800,"1h":3600,"2h":7200,"3h":10800,"4h":14400,"6h":21600,"12h":43200,"24h":86400,"7d":604800,"14d":1209600,"21d":1814400,"28d":2419200},yt={trend_window:["1h","6h","24h","7d","14d","21d","28d"],rate_window:["1h","6h","24h"],anomaly_rate_window:["1h","6h","24h"],anomaly_zscore_window:["1h","6h","24h","7d"],anomaly_persistence_window:["30m","1h","3h","6h","12h","24h"]};function vt(r,t){const e=O[t]??0;if(e===0)return{};const a={};for(const[s,i]of Object.entries(yt)){const g=r[s];if(!g||g==="point_to_point")continue;if((O[g]??0)<e){const h=i.find(c=>(O[c]??0)>=e);h&&(a[s]=h)}}return a}st=[nt()];class _ extends(C=ot,rt=[f({type:Array})],et=[f({type:Object,attribute:!1})],tt=[f({type:Object,attribute:!1})],Z=[f({type:Boolean,attribute:"can-show-delta-analysis"})],V=[f({type:Array,attribute:!1})],Q=[f({type:Object,attribute:!1})],K=[f({type:Number,attribute:!1})],H=[f({type:Object,attribute:!1})],C){constructor(){super(...arguments),m(this,W,l(n,8,this,[])),l(n,11,this),m(this,k,l(n,12,this,{})),l(n,15,this),m(this,F,l(n,16,this,null)),l(n,19,this),m(this,L,l(n,20,this,!1)),l(n,23,this),m(this,P,l(n,24,this,[])),l(n,27,this),m(this,R,l(n,28,this,new Set)),l(n,31,this),m(this,B,l(n,32,this,0)),l(n,35,this),m(this,N,l(n,36,this,new Map)),l(n,39,this),D(this,"_dragSourceIndex",null),D(this,"_onToggleAnalysisFast",t=>{const e=String(t?.detail?.entityId||"").trim();if(!e)return;const a=this.rows?.findIndex(s=>s.entity_id===e)??-1;a!==-1&&(this.rows=this.rows.map((s,i)=>i!==a?s:{...s,analysis:{...s.analysis,expanded:!s.analysis?.expanded}}))}),D(this,"_onRowAnalysisChangeFast",t=>{const{entityId:e,key:a,value:s}=t.detail||{};if(!e||!a)return;const i=this.rows?.findIndex(c=>c.entity_id===e)??-1;if(i===-1)return;const d=this.rows[i].analysis||{};let h;if(a.startsWith("anomaly_method_toggle_")){const c=a.slice(22),y=Array.isArray(d.anomaly_methods)?d.anomaly_methods:[],o=s===!0?[...new Set([...y,c])]:y.filter(S=>S!==c);h={...d,anomaly_methods:o}}else if(a==="sample_interval"&&typeof s=="string"){const c=vt(d,s);h={...d,[a]:s,...c}}else h={...d,[a]:s};this.rows=this.rows.map((c,y)=>y===i?{...c,analysis:h}:c)}),D(this,"_onDragEnd",t=>{this._dragSourceIndex=null,t.currentTarget.classList.remove("is-dragging"),this._clearDropIndicators(),this._removeDragCursorStyle()})}render(){if(!this.rows.length)return $``;const t=JSON.stringify(this.rows[0]?.analysis??{}),e=this.rows.every(a=>JSON.stringify(a.analysis??{})===t);return $`
      <div class="history-target-table">
        <div
          class="history-target-table-body"
          @dragover=${this._onDragOver}
          @dragleave=${this._onDragLeave}
          @drop=${this._onDrop}
          @dp-row-toggle-analysis=${this._onToggleAnalysisFast}
          @dp-row-analysis-change=${this._onRowAnalysisChangeFast}
        >
          ${this.rows.map((a,s)=>$`
              <target-row
                draggable="true"
                .color=${a.color}
                .visible=${a.visible}
                .analysis=${a.analysis}
                .index=${s}
                entity-id=${a.entity_id}
                .canShowDeltaAnalysis=${this.canShowDeltaAnalysis}
                .stateObj=${this.states?.[a.entity_id]??null}
                .hass=${this.hass??null}
                .comparisonWindows=${this.comparisonWindows}
                .computing=${this.computingEntityIds?.has(a.entity_id)??!1}
                .computingProgress=${this.analysisProgress??0}
                .computingMethods=${this.computingMethodsByEntity?.get(a.entity_id)??new Set}
                .rowCount=${this.rows.length}
                .allAnalysisSame=${e}
                data-row-index=${s}
                @dragstart=${i=>this._onDragStart(i,s)}
                @dragend=${this._onDragEnd}
              ></target-row>
            `)}
        </div>
      </div>
    `}_onDragStart(t,e){if(this._dragSourceIndex=e,t.dataTransfer){t.dataTransfer.effectAllowed="move",t.dataTransfer.setData("text/plain",String(e));const s=t.currentTarget,i=s.getBoundingClientRect();t.dataTransfer.setDragImage(s,t.clientX-i.left,t.clientY-i.top)}const a=t.currentTarget;setTimeout(()=>a.classList.add("is-dragging"),0),this._ensureDragCursorStyle()}_ensureDragCursorStyle(){const t=this.ownerDocument;if(!t.getElementById("dp-drag-cursor-style")){const e=t.createElement("style");e.id="dp-drag-cursor-style",e.textContent="*, *::before, *::after { cursor: grabbing !important; }",t.head.appendChild(e)}}_removeDragCursorStyle(){this.ownerDocument.getElementById("dp-drag-cursor-style")?.remove()}_onDragOver(t){if(this._dragSourceIndex===null)return;t.preventDefault(),t.dataTransfer&&(t.dataTransfer.dropEffect="move");const e=this._rowFromEvent(t);if(!e)return;const a=e.getBoundingClientRect(),s=t.clientY<a.top+a.height/2;this._clearDropIndicators(),e.classList.add(s?"is-drag-over-before":"is-drag-over-after")}_onDragLeave(t){const e=this._rowFromEvent(t);e&&!e.contains(t.relatedTarget)&&e.classList.remove("is-drag-over-before","is-drag-over-after")}_onDrop(t){t.preventDefault();const e=this._dragSourceIndex??parseInt(t.dataTransfer?.getData("text/plain")??"",10),a=this._rowFromEvent(t);if(!a||!Number.isFinite(e))return;const s=parseInt(a.dataset.rowIndex??"",10);if(!Number.isFinite(s))return;const i=a.getBoundingClientRect(),d=t.clientY<i.top+i.height/2?s:s+1,h=e<d?d-1:d;if(a.classList.remove("is-drag-over-before","is-drag-over-after"),e!==h){const c=[...this.rows],[y]=c.splice(e,1);c.splice(h,0,y),this.dispatchEvent(new CustomEvent("dp-rows-reorder",{detail:{rows:c},bubbles:!0,composed:!0}))}}_rowFromEvent(t){for(const e of t.composedPath())if(e instanceof Element&&e.tagName?.toLowerCase()==="target-row")return e;return null}_clearDropIndicators(){this.shadowRoot?.querySelectorAll("target-row").forEach(t=>{t.classList.remove("is-drag-over-before","is-drag-over-after")})}}n=gt(C);W=new WeakMap;k=new WeakMap;F=new WeakMap;L=new WeakMap;P=new WeakMap;R=new WeakMap;B=new WeakMap;N=new WeakMap;w(n,4,"rows",rt,_,W);w(n,4,"states",et,_,k);w(n,4,"hass",tt,_,F);w(n,4,"canShowDeltaAnalysis",Z,_,L);w(n,4,"comparisonWindows",V,_,P);w(n,4,"computingEntityIds",Q,_,R);w(n,4,"analysisProgress",K,_,B);w(n,4,"computingMethodsByEntity",H,_,N);_=w(n,0,"TargetRowList",st,_);D(_,"styles",dt);l(n,1,_);customElements.define("target-row-list",_);
