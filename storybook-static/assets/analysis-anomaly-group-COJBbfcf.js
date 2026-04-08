import{i as ae,b as c,A as b,g as te}from"./iframe-maWesKjk.js";import{n as f}from"./property-DyW-YDBW.js";import{s as se}from"./analysis-group-shared.styles-Cw1nMqQy.js";import{m as u}from"./localize-Cz1ya3ms.js";import"./analysis-group-ZyfAZWsO.js";import"./analysis-method-subopts-INTT52YI.js";import{l as le}from"./localized-decorator-CXjGGqe_.js";const ie=ae`
  .method-computing-indicator {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-left: 6px;
    vertical-align: middle;
    flex-shrink: 0;
  }

  .method-computing-spinner {
    display: inline-block;
    width: 8px;
    height: 8px;
    border: 1.5px solid var(--divider-color, #ccc);
    border-top-color: var(--primary-color, #03a9f4);
    border-radius: 50%;
    animation: analysis-spin 0.7s linear infinite;
    flex-shrink: 0;
  }

  .method-computing-progress {
    font-size: 0.72rem;
    font-weight: 500;
    color: var(--primary-color, #03a9f4);
    line-height: 1;
  }

  @keyframes analysis-spin {
    to {
      transform: rotate(360deg);
    }
  }

  .method-list {
    display: grid;
    gap: var(--dp-spacing-sm, 8px);
  }

  .method-item {
    display: grid;
    gap: var(--dp-spacing-sm, 8px);
  }

  ha-tooltip {
    --ha-tooltip-padding: var(--dp-spacing-md, calc(var(--spacing, 8px) * 1.5));
  }

  ha-tooltip::part(body) {
    padding: var(--dp-spacing-md, calc(var(--spacing, 8px) * 1.5));
  }

  .method-help {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 10px;
    height: 10px;
    flex: 0 0 auto;
    border-radius: 50%;
    border: 1px solid var(--secondary-text-color, #888);
    background: transparent;
    color: var(--secondary-text-color, #888);
    font-size: 9px;
    font-weight: 700;
    cursor: help;
    padding: 0;
    vertical-align: middle;
    appearance: none;
    -webkit-appearance: none;
  }

  .method-help:focus-visible {
    outline: 2px solid var(--primary-color, #03a9f4);
    outline-offset: 2px;
  }
`;var oe=Object.create,z=Object.defineProperty,ne=Object.getOwnPropertyDescriptor,U=(a,e)=>(e=Symbol[a])?e:Symbol.for("Symbol."+a),$=a=>{throw TypeError(a)},q=(a,e,t)=>e in a?z(a,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):a[e]=t,F=(a,e)=>z(a,"name",{value:e,configurable:!0}),re=a=>[,,,oe(a?.[U("metadata")]??null)],B=["class","method","getter","setter","accessor","field","value","get","set"],O=a=>a!==void 0&&typeof a!="function"?$("Function expected"):a,de=(a,e,t,o,s)=>({kind:B[a],name:e,metadata:o,addInitializer:l=>t._?$("Already initialized"):s.push(O(l||null))}),ce=(a,e)=>q(e,U("metadata"),a[3]),p=(a,e,t,o)=>{for(var s=0,l=a[e>>1],h=l&&l.length;s<h;s++)e&1?l[s].call(t):o=l[s].call(t,o);return o},y=(a,e,t,o,s,l)=>{var h,r,S,g,A,i=e&7,k=!!(e&8),v=!!(e&16),I=i>3?a.length+1:i?k?1:2:0,R=B[i+5],D=i>3&&(a[I-1]=[]),ee=a[I]||(a[I]=[]),_=i&&(!v&&!k&&(s=s.prototype),i<5&&(i>3||!v)&&ne(i<4?s:{get[t](){return G(this,l)},set[t](d){return H(this,l,d)}},t));i?v&&i<4&&F(l,(i>2?"set ":i>1?"get ":"")+t):F(s,t);for(var x=o.length-1;x>=0;x--)g=de(i,t,S={},a[3],ee),i&&(g.static=k,g.private=v,A=g.access={has:v?d=>he(s,d):d=>t in d},i^3&&(A.get=v?d=>(i^1?G:ue)(d,s,i^4?l:_.get):d=>d[t]),i>2&&(A.set=v?(d,N)=>H(d,s,N,i^4?l:_.set):(d,N)=>d[t]=N)),r=(0,o[x])(i?i<4?v?l:_[R]:i>4?void 0:{get:_.get,set:_.set}:s,g),S._=1,i^4||r===void 0?O(r)&&(i>4?D.unshift(r):i?v?l=r:_[R]=r:s=r):typeof r!="object"||r===null?$("Object expected"):(O(h=r.get)&&(_.get=h),O(h=r.set)&&(_.set=h),O(h=r.init)&&D.unshift(h));return i||ce(a,s),_&&z(s,t,_),v?i^4?l:_:s},pe=(a,e,t)=>q(a,e+"",t),C=(a,e,t)=>e.has(a)||$("Cannot "+t),he=(a,e)=>Object(e)!==e?$('Cannot use the "in" operator on this value'):a.has(e),G=(a,e,t)=>(C(a,e,"read from private field"),t?t.call(a):e.get(a)),w=(a,e,t)=>e.has(a)?$("Cannot add the same private member more than once"):e instanceof WeakSet?e.add(a):e.set(a,t),H=(a,e,t,o)=>(C(a,e,"write to private field"),o?o.call(a,t):e.set(a,t),t),ue=(a,e,t)=>(C(a,e,"access private method"),t),V,Z,j,Q,J,K,M,X,n,W,P,E,L,T,Y;const _e=[{value:"low",label:"Low"},{value:"medium",label:"Medium"},{value:"high",label:"High"}],me=[{value:"trend_residual",label:"Trend deviation",help:"Flags points that deviate significantly from a fitted trend line. Good for catching gradual drift or sudden jumps away from a steady baseline."},{value:"rate_of_change",label:"Sudden change",help:"Flags unusually fast rises or drops compared to the typical rate of change. Best for detecting spikes, crashes, or rapid transitions."},{value:"iqr",label:"Statistical outlier (IQR)",help:"Uses the interquartile range to flag values far outside the normal spread of data. Robust against outliers that skew averages."},{value:"rolling_zscore",label:"Rolling Z-score",help:"Compares each value to a rolling mean and standard deviation. Catches unusual readings relative to recent context rather than the whole series."},{value:"persistence",label:"Flat-line / stuck value",help:"Flags when a sensor reports nearly the same value for an unusually long time. Useful for detecting stuck sensors or frozen readings."},{value:"comparison_window",label:"Comparison window deviation",help:"Compares the current period to a reference date window. Highlights differences from an expected historical pattern, such as last week or the same day last year."}],ve=[{value:"1h",label:"1 hour"},{value:"6h",label:"6 hours"},{value:"24h",label:"24 hours"}],ge=[{value:"1h",label:"1 hour"},{value:"6h",label:"6 hours"},{value:"24h",label:"24 hours"},{value:"7d",label:"7 days"}],ye=[{value:"30m",label:"30 minutes"},{value:"1h",label:"1 hour"},{value:"3h",label:"3 hours"},{value:"6h",label:"6 hours"},{value:"12h",label:"12 hours"},{value:"24h",label:"24 hours"}],be=[{value:"all",label:"Show all anomalies"},{value:"only",label:"Overlaps only"}];X=[le()];class m extends(M=te,K=[f({type:Object})],J=[f({type:String,attribute:"entity-id"})],Q=[f({type:Array,attribute:"comparison-windows"})],j=[f({type:Boolean,attribute:!1})],Z=[f({type:Number,attribute:!1})],V=[f({type:Object,attribute:!1})],M){constructor(){super(...arguments),w(this,W,p(n,8,this,{})),p(n,11,this),w(this,P,p(n,12,this,"")),p(n,15,this),w(this,E,p(n,16,this,[])),p(n,19,this),w(this,L,p(n,20,this,!1)),p(n,23,this),w(this,T,p(n,24,this,0)),p(n,27,this),w(this,Y,p(n,28,this,new Set)),p(n,31,this)}_emit(e,t){this.dispatchEvent(new CustomEvent("dp-group-analysis-change",{detail:{entityId:this.entityId,key:e,value:t},bubbles:!0,composed:!0}))}_renderSelect(e,t,o){return c`
      <select
        class="select"
        @change=${s=>this._emit(e,s.target.value)}
      >
        ${t.map(s=>c`<option value=${s.value} ?selected=${s.value===o}>
              ${s.label}
            </option>`)}
      </select>
    `}_onGroupChange(e){this._emit("show_anomalies",e.detail.checked)}_localizedOptions(e){return e.map(t=>({...t,label:u(t.label),help:t.help?u(t.help):void 0}))}_renderMethodSubopts(e,t){return e.value==="rate_of_change"?c`
        <analysis-method-subopts>
          <label class="field">
            <span class="field-label">${u("Rate window")}</span>
            ${this._renderSelect("anomaly_rate_window",this._localizedOptions(ve),t.anomaly_rate_window)}
          </label>
        </analysis-method-subopts>
      `:e.value==="rolling_zscore"?c`
        <analysis-method-subopts>
          <label class="field">
            <span class="field-label">${u("Rolling window")}</span>
            ${this._renderSelect("anomaly_zscore_window",this._localizedOptions(ge),t.anomaly_zscore_window)}
          </label>
        </analysis-method-subopts>
      `:e.value==="persistence"?c`
        <analysis-method-subopts>
          <label class="field">
            <span class="field-label">${u("Min flat duration")}</span>
            ${this._renderSelect("anomaly_persistence_window",this._localizedOptions(ye),t.anomaly_persistence_window)}
          </label>
        </analysis-method-subopts>
      `:e.value==="comparison_window"?c`
        <analysis-method-subopts>
          <label class="field">
            <span class="field-label">${u("Compare to window")}</span>
            <select
              class="select"
              @change=${o=>this._emit("anomaly_comparison_window_id",o.target.value)}
            >
              <option value="" ?selected=${!t.anomaly_comparison_window_id}>
                ${u("— select window —")}
              </option>
              ${this.comparisonWindows.map(o=>c`
                  <option
                    value=${o.id}
                    ?selected=${t.anomaly_comparison_window_id===o.id}
                  >
                    ${o.label||o.id}
                  </option>
                `)}
            </select>
          </label>
        </analysis-method-subopts>
      `:b}render(){const e=this.analysis,t=this._localizedOptions(_e),o=this._localizedOptions(me),s=this._localizedOptions(be);return c`
      <analysis-group
        .label=${u("Show anomalies")}
        .checked=${e.show_anomalies}
        @dp-group-change=${this._onGroupChange}
      >
        <label class="field">
          <span class="field-label">${u("Sensitivity")}</span>
          ${this._renderSelect("anomaly_sensitivity",t,e.anomaly_sensitivity)}
        </label>
        ${e.sample_interval&&e.sample_interval!=="raw"?c`
              <label class="option">
                <input
                  type="checkbox"
                  .checked=${e.anomaly_use_sampled_data!==!1}
                  @change=${l=>this._emit("anomaly_use_sampled_data",l.target.checked)}
                />
                <span>${u("Use downsampled data for detection")}</span>
              </label>
            `:b}
        <div class="method-list">
          ${o.map(l=>{const h=Array.isArray(e.anomaly_methods)&&e.anomaly_methods.includes(l.value),r=h&&(this.computingMethods?.has(l.value)??!1),S=`anomaly-help-${l.value}`;return c`
              <div class="method-item">
                <label class="option">
                  <input
                    type="checkbox"
                    .checked=${h}
                    @change=${g=>this._emit(`anomaly_method_toggle_${l.value}`,g.target.checked)}
                  />
                  <span>${l.label}</span>
                  ${l.help?c`
                        <button
                          id=${S}
                          class="method-help"
                          type="button"
                          aria-label=${`${l.label} explanation`}
                        >
                          ?
                        </button>
                        <ha-tooltip
                          class="method-tooltip"
                          for=${S}
                          placement="right"
                          distance="8"
                          hoist
                          style="--ha-tooltip-padding: var(--dp-spacing-md, calc(var(--spacing, 8px) * 1.5));"
                        >
                          ${l.help}
                        </ha-tooltip>
                      `:b}
                  ${r?c`
                        <span
                          class="method-computing-indicator"
                          aria-label=${u("Computing…")}
                        >
                          <span class="method-computing-spinner"></span>
                          <span class="method-computing-progress"
                            >${this.computingProgress}%</span
                          >
                        </span>
                      `:b}
                </label>
                ${h?this._renderMethodSubopts(l,e):b}
              </div>
            `})}
        </div>
        ${Array.isArray(e.anomaly_methods)&&e.anomaly_methods.length>=2?c`
              <label class="field">
                <span class="field-label">${u("When methods overlap")}</span>
                ${this._renderSelect("anomaly_overlap_mode",s,e.anomaly_overlap_mode)}
              </label>
            `:b}
      </analysis-group>
    `}}n=re(M);W=new WeakMap;P=new WeakMap;E=new WeakMap;L=new WeakMap;T=new WeakMap;Y=new WeakMap;y(n,4,"analysis",K,m,W);y(n,4,"entityId",J,m,P);y(n,4,"comparisonWindows",Q,m,E);y(n,4,"computing",j,m,L);y(n,4,"computingProgress",Z,m,T);y(n,4,"computingMethods",V,m,Y);m=y(n,0,"AnalysisAnomalyGroup",X,m);pe(m,"styles",[se,ie]);p(n,1,m);customElements.define("analysis-anomaly-group",m);
