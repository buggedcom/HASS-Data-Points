import{i as X,b as w,g as Y}from"./iframe-maWesKjk.js";import{n as b}from"./property-DyW-YDBW.js";import{e as Z}from"./class-map-pAsNZYN8.js";const tt=X`
  :host {
    display: contents;
  }

  .chart-tab {
    display: flex;
    align-items: stretch;
    min-width: 0;
    border-bottom: 2px solid transparent;
    transition:
      border-color 120ms ease,
      color 120ms ease,
      opacity 120ms ease;
  }

  .chart-tab:hover {
    border-bottom-color: color-mix(
      in srgb,
      var(--primary-color, #03a9f4) 44%,
      transparent
    );
  }

  .chart-tab:hover .chart-tab-trigger {
    color: var(--primary-text-color);
  }

  .chart-tab.previewing {
    border-bottom-color: color-mix(
      in srgb,
      var(--primary-color, #03a9f4) 62%,
      transparent
    );
  }

  .chart-tab.previewing .chart-tab-trigger {
    color: var(--primary-text-color);
  }

  .chart-tab.active {
    border-bottom-color: var(--primary-color, #03a9f4);
  }

  .chart-tab.loading .chart-tab-trigger,
  .chart-tab.loading .chart-tab-actions {
    opacity: 0.55;
  }

  .chart-tab.loading .chart-tab-trigger,
  .chart-tab.loading .chart-tab-trigger .chart-tab-detail,
  .chart-tab.loading .chart-tab-action {
    color: var(--secondary-text-color);
  }

  .chart-tab.active .chart-tab-trigger {
    color: var(--primary-text-color);
    font-weight: 600;
    cursor: default;
  }

  .chart-tab-trigger {
    position: relative;
    display: inline-flex;
    align-items: stretch;
    flex: 1 1 auto;
    min-width: 0;
    border: 0;
    border-radius: 0;
    padding: var(--dp-spacing-sm) var(--dp-spacing-md);
    background: transparent;
    color: var(--secondary-text-color);
    font: inherit;
    font-size: 0.86rem;
    line-height: 1.2;
    white-space: nowrap;
    cursor: pointer;
    transition:
      border-color 120ms ease,
      color 120ms ease,
      opacity 120ms ease;
  }

  .chart-tab-trigger:hover,
  .chart-tab-trigger:focus-visible {
    color: var(--primary-text-color);
    outline: none;
  }

  .chart-tab-content {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }

  .chart-tab-main {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .chart-tab-label {
    font-weight: inherit;
  }

  .chart-tab-spinner {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 2px solid
      color-mix(in srgb, var(--secondary-text-color, #6b7280) 28%, transparent);
    border-top-color: currentColor;
    animation: chart-spinner 0.9s linear infinite;
    flex: 0 0 auto;
  }

  @keyframes chart-spinner {
    to {
      transform: rotate(360deg);
    }
  }

  .chart-tab-detail {
    font-size: 0.73rem;
    line-height: 1.2;
    color: var(--secondary-text-color);
    font-weight: 400;
  }

  .chart-tab-detail-row {
    display: flex;
    align-items: center;
    gap: 4px;
    min-width: 0;
    line-height: 1;
  }

  .chart-tab.active .chart-tab-detail,
  .chart-tab.previewing .chart-tab-detail,
  .chart-tab:hover .chart-tab-detail,
  .chart-tab-trigger:hover .chart-tab-detail,
  .chart-tab-trigger:focus-visible .chart-tab-detail {
    color: color-mix(
      in srgb,
      var(--secondary-text-color, #6b7280) 88%,
      var(--primary-text-color, #111)
    );
  }

  .chart-tab-actions {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    margin-left: -2px;
    padding-right: var(--dp-spacing-md);
    padding-bottom: 2px;
    align-self: center;
    flex: 0 0 auto;
  }

  .chart-tab-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: var(--secondary-text-color);
    cursor: pointer;
    flex: 0 0 auto;
  }

  .chart-tab-action ha-icon {
    --mdc-icon-size: 12px;
    display: block;
  }

  .chart-tab-action:hover,
  .chart-tab-action:focus-visible {
    background: color-mix(
      in srgb,
      var(--primary-text-color, #111) 8%,
      transparent
    );
    color: var(--primary-text-color);
    outline: none;
  }

  .chart-tab-action.delete {
    background: color-mix(
      in srgb,
      var(--primary-text-color, #111) 7%,
      transparent
    );
  }

  .chart-tab-action.delete:hover,
  .chart-tab-action.delete:focus-visible {
    background: color-mix(
      in srgb,
      var(--error-color, #db4437) 14%,
      transparent
    );
    color: var(--error-color, #db4437);
  }
`;var at=Object.create,D=Object.defineProperty,et=Object.getOwnPropertyDescriptor,P=(t,a)=>(a=Symbol[t])?a:Symbol.for("Symbol."+t),m=t=>{throw TypeError(t)},B=(t,a,e)=>a in t?D(t,a,{enumerable:!0,configurable:!0,writable:!0,value:e}):t[a]=e,rt=t=>[,,,at(t?.[P("metadata")]??null)],O=["class","method","getter","setter","accessor","field","value","get","set"],u=t=>t!==void 0&&typeof t!="function"?m("Function expected"):t,it=(t,a,e,c,o)=>({kind:O[t],name:a,metadata:c,addInitializer:s=>e._?m("Already initialized"):o.push(u(s||null))}),ot=(t,a)=>B(a,P("metadata"),t[3]),i=(t,a,e,c)=>{for(var o=0,s=t[a>>1],d=s&&s.length;o<d;o++)a&1?s[o].call(e):c=s[o].call(e,c);return c},v=(t,a,e,c,o,s)=>{for(var d,l,T,_,f,W=a&7,J=!1,K=!1,x=t.length+1,Q=O[W+5],R=t[x-1]=[],U=t[x]||(t[x]=[]),h=(o=o.prototype,et({get[e](){return ct(this,s)},set[e](p){return st(this,s,p)}},e)),y=c.length-1;y>=0;y--)_=it(W,e,T={},t[3],U),_.static=J,_.private=K,f=_.access={has:p=>e in p},f.get=p=>p[e],f.set=(p,V)=>p[e]=V,l=(0,c[y])({get:h.get,set:h.set},_),T._=1,l===void 0?u(l)&&(h[Q]=l):typeof l!="object"||l===null?m("Object expected"):(u(d=l.get)&&(h.get=d),u(d=l.set)&&(h.set=d),u(d=l.init)&&R.unshift(d));return h&&D(o,e,h),o},nt=(t,a,e)=>B(t,a+"",e),F=(t,a,e)=>a.has(t)||m("Cannot "+e),ct=(t,a,e)=>(F(t,a,"read from private field"),a.get(t)),g=(t,a,e)=>a.has(t)?m("Cannot add the same private member more than once"):a instanceof WeakSet?a.add(t):a.set(t,e),st=(t,a,e,c)=>(F(t,a,"write to private field"),a.set(t,e),e),A,L,j,G,N,q,H,k,r,$,C,M,E,S,z,I;class n extends(k=Y,H=[b({type:String,attribute:"tab-id"})],q=[b({type:String})],N=[b({type:String})],G=[b({type:Boolean})],j=[b({type:Boolean})],L=[b({type:Boolean})],A=[b({type:Boolean})],k){constructor(){super(...arguments),g(this,$,i(r,8,this,"")),i(r,11,this),g(this,C,i(r,12,this,"")),i(r,15,this),g(this,M,i(r,16,this,"")),i(r,19,this),g(this,E,i(r,20,this,!1)),i(r,23,this),g(this,S,i(r,24,this,!1)),i(r,27,this),g(this,z,i(r,28,this,!1)),i(r,31,this),g(this,I,i(r,32,this,!1)),i(r,35,this)}_emit(a){this.dispatchEvent(new CustomEvent(a,{detail:{tabId:this.tabId},bubbles:!0,composed:!0}))}_onTriggerClick(){this._emit("dp-tab-activate")}_onMouseEnter(){this._emit("dp-tab-hover")}_onMouseLeave(){this._emit("dp-tab-leave")}_onTriggerFocus(){this._emit("dp-tab-hover")}_onTriggerBlur(){this._emit("dp-tab-leave")}_onEditClick(a){a.preventDefault(),a.stopPropagation(),this._emit("dp-tab-edit")}_onDeleteClick(a){a.preventDefault(),a.stopPropagation(),this._emit("dp-tab-delete")}render(){const a=Z({"chart-tab":!0,active:this.active,previewing:this.previewing,loading:this.loading});return w`
      <div
        class=${a}
        @mouseenter=${this._onMouseEnter}
        @mouseleave=${this._onMouseLeave}
      >
        <button
          type="button"
          class="chart-tab-trigger"
          ?aria-current=${this.active}
          @click=${this._onTriggerClick}
          @focus=${this._onTriggerFocus}
          @blur=${this._onTriggerBlur}
        >
          <span class="chart-tab-content">
            <span class="chart-tab-main">
              ${this.loading?w`<span
                    class="chart-tab-spinner"
                    aria-hidden="true"
                  ></span>`:null}
              <span class="chart-tab-label">${this.label}</span>
            </span>
            <span class="chart-tab-detail-row">
              <span class="chart-tab-detail">${this.detail}</span>
            </span>
          </span>
        </button>
        ${this.editable?w`
              <span class="chart-tab-actions">
                <button
                  type="button"
                  class="chart-tab-action edit"
                  aria-label="Edit ${this.label}"
                  @click=${this._onEditClick}
                >
                  <ha-icon icon="mdi:pencil-outline"></ha-icon>
                </button>
                <button
                  type="button"
                  class="chart-tab-action delete"
                  aria-label="Delete ${this.label}"
                  @click=${this._onDeleteClick}
                >
                  <ha-icon icon="mdi:close"></ha-icon>
                </button>
              </span>
            `:null}
      </div>
    `}}r=rt(k);$=new WeakMap;C=new WeakMap;M=new WeakMap;E=new WeakMap;S=new WeakMap;z=new WeakMap;I=new WeakMap;v(r,4,"tabId",H,n,$);v(r,4,"label",q,n,C);v(r,4,"detail",N,n,M);v(r,4,"active",G,n,E);v(r,4,"previewing",j,n,S);v(r,4,"loading",L,n,z);v(r,4,"editable",A,n,I);ot(r,n);nt(n,"styles",tt);customElements.define("comparison-tab",n);
