import{i as H,b as v,g as J}from"./iframe-maWesKjk.js";import{n as y}from"./property-DyW-YDBW.js";import{r as Q}from"./state-D8ZE3MQ0.js";import{f as U}from"./format-DAmR8eHG.js";import"./feedback-banner-DFx7uwUC.js";const X=H`
  :host {
    display: block;
    margin-top: 18px;
  }

  .results-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    gap: 8px;
    flex-wrap: wrap;
  }

  .selected-summary {
    font-size: 0.84em;
    color: var(--secondary-text-color);
    flex: 1;
  }

  .selected-summary strong {
    color: var(--primary-text-color);
  }

  .window-result {
    margin-bottom: 10px;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid var(--divider-color, #e0e0e0);
  }

  .window-result-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 9px 12px;
    background: var(--secondary-background-color, rgba(0, 0, 0, 0.04));
    cursor: pointer;
    user-select: none;
  }

  .window-result-toggle {
    font-size: 0.7em;
    color: var(--secondary-text-color);
    flex-shrink: 0;
  }

  .window-result.collapsed .window-result-toggle {
    transform: rotate(-90deg);
  }

  .window-result-title {
    flex: 1;
    font-size: 0.88em;
    font-weight: 600;
    color: var(--primary-text-color);
  }

  .window-result-meta {
    font-weight: 400;
    font-size: 0.88em;
    color: var(--secondary-text-color);
  }

  .window-result-links {
    display: flex;
    gap: 10px;
    flex-shrink: 0;
  }

  .window-link {
    font-size: 0.78em;
    color: var(--primary-color);
    cursor: pointer;
    border: none;
    background: none;
    padding: 0;
    font: inherit;
  }

  .window-result-body {
    display: block;
  }

  .window-result.collapsed .window-result-body {
    display: none;
  }

  .changes-list {
    max-height: 260px;
    overflow-y: auto;
  }

  .change-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 7px 12px;
    border-top: 1px solid var(--divider-color, #e0e0e0);
    cursor: pointer;
  }

  .change-info {
    flex: 1;
    min-width: 0;
  }

  .change-msg {
    font-size: 0.88em;
    font-weight: 500;
    color: var(--primary-text-color);
  }

  .change-meta {
    font-size: 0.76em;
    color: var(--secondary-text-color);
    margin-top: 1px;
  }

  .empty-changes {
    padding: 16px 12px;
    font-size: 0.84em;
    color: var(--secondary-text-color);
  }
`;var Y=Object.create,P=Object.defineProperty,Z=Object.getOwnPropertyDescriptor,T=(s,t)=>(t=Symbol[s])?t:Symbol.for("Symbol."+s),b=s=>{throw TypeError(s)},M=(s,t,e)=>t in s?P(s,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):s[t]=e,ee=s=>[,,,Y(s?.[T("metadata")]??null)],O=["class","method","getter","setter","accessor","field","value","get","set"],f=s=>s!==void 0&&typeof s!="function"?b("Function expected"):s,te=(s,t,e,i,r)=>({kind:O[s],name:t,metadata:i,addInitializer:l=>e._?b("Already initialized"):r.push(f(l||null))}),se=(s,t)=>M(t,T("metadata"),s[3]),d=(s,t,e,i)=>{for(var r=0,l=s[t>>1],o=l&&l.length;r<o;r++)t&1?l[r].call(e):i=l[r].call(e,i);return i},x=(s,t,e,i,r,l)=>{for(var o,n,u,g,_,w=t&7,k=!1,F=!1,$=s.length+1,N=O[w+5],j=s[$-1]=[],B=s[$]||(s[$]=[]),p=(r=r.prototype,Z({get[e](){return ae(this,l)},set[e](h){return oe(this,l,h)}},e)),S=i.length-1;S>=0;S--)g=te(w,e,u={},s[3],B),g.static=k,g.private=F,_=g.access={has:h=>e in h},_.get=h=>h[e],_.set=(h,G)=>h[e]=G,n=(0,i[S])({get:p.get,set:p.set},g),u._=1,n===void 0?f(n)&&(p[N]=n):typeof n!="object"||n===null?b("Object expected"):(f(o=n.get)&&(p.get=o),f(o=n.set)&&(p.set=o),f(o=n.init)&&j.unshift(o));return p&&P(r,e,p),r},ie=(s,t,e)=>M(s,t+"",e),R=(s,t,e)=>t.has(s)||b("Cannot "+e),ae=(s,t,e)=>(R(s,t,"read from private field"),t.get(s)),m=(s,t,e)=>t.has(s)?b("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(s):t.set(s,e),oe=(s,t,e,i)=>(R(s,t,"write to private field"),t.set(s,e),e),K,L,V,q,A,W,a,z,E,I,D,C;class c extends(W=J,A=[y({attribute:!1})],q=[y({type:String})],V=[y({type:String})],L=[y({type:Boolean})],K=[Q()],W){constructor(){super(...arguments),m(this,z,d(a,8,this,[])),d(a,11,this),m(this,E,d(a,12,this,"")),d(a,15,this),m(this,I,d(a,16,this,"")),d(a,19,this),m(this,D,d(a,20,this,!1)),d(a,23,this),m(this,C,d(a,24,this,[])),d(a,27,this)}_emitSelection(){this.dispatchEvent(new CustomEvent("dp-results-selection-change",{detail:{results:this.results.map(t=>({...t,selected:[...t.selected]}))},bubbles:!0,composed:!0}))}_updateSelected(t,e){this.results=this.results.map(i=>i.id!==t?i:{...i,selected:e}),this._emitSelection()}_toggleCollapsed(t){if(this._collapsedWindowIds.includes(t)){this._collapsedWindowIds=this._collapsedWindowIds.filter(e=>e!==t);return}this._collapsedWindowIds=[...this._collapsedWindowIds,t]}_emitRecordRequest(){const t=[];this.results.forEach(e=>{[...e.selected].sort((i,r)=>i-r).forEach(i=>{t.push(e.changes[i])})}),this.dispatchEvent(new CustomEvent("dp-record-selected-request",{detail:{items:t},bubbles:!0,composed:!0}))}_summaryParts(){let t=0,e=0;return this.results.forEach(i=>{t+=i.selected.length,e+=i.changes.length}),{selected:t,total:e,windows:this.results.length}}render(){if(this.results.length===0)return v``;const t=this._summaryParts();return v`
      <div class="results-section">
        <div class="results-bar">
          <span class="selected-summary">
            <strong>${t.selected}</strong> of ${t.total} selected
            across ${t.windows} window${t.windows===1?"":"s"}
          </span>
          <ha-button id="record-btn" raised @click=${this._emitRecordRequest}
            >Record selected as dev datapoints</ha-button
          >
        </div>
        <div id="results-list">
          ${this.results.map(e=>{const i=e.startDt?new Date(e.startDt).toLocaleString([],{dateStyle:"short",timeStyle:"short"}):"unknown start",r=e.endDt?`${i} → ${new Date(e.endDt).toLocaleString([],{dateStyle:"short",timeStyle:"short"})}`:`${i} → now`,l=this._collapsedWindowIds.includes(e.id);return v`
              <div
                class="window-result ${l?"collapsed":""}"
                data-wid=${String(e.id)}
              >
                <div
                  class="window-result-header"
                  @click=${()=>this._toggleCollapsed(e.id)}
                >
                  <span class="window-result-toggle">▼</span>
                  <span class="window-result-title">
                    ${e.label}
                    <span class="window-result-meta"
                      >${r} · ${e.changes.length}
                      change${e.changes.length===1?"":"s"}</span
                    >
                  </span>
                  <span class="window-result-links">
                    <button
                      class="window-link"
                      @click=${o=>{o.stopPropagation(),this._updateSelected(e.id,e.changes.map((n,u)=>u))}}
                    >
                      All
                    </button>
                    <button
                      class="window-link"
                      @click=${o=>{o.stopPropagation(),this._updateSelected(e.id,[])}}
                    >
                      None
                    </button>
                  </span>
                </div>
                <div class="window-result-body">
                  <div class="changes-list">
                    ${e.changes.length===0?v`<div class="empty-changes">
                          No state changes detected in this window.
                        </div>`:e.changes.map((o,n)=>v`
                            <label class="change-item">
                              <input
                                type="checkbox"
                                .checked=${e.selected.includes(n)}
                                @change=${u=>{const _=u.currentTarget.checked?[...new Set([...e.selected,n])].sort((w,k)=>w-k):e.selected.filter(w=>w!==n);this._updateSelected(e.id,_)}}
                              />
                              <div class="change-info">
                                <div class="change-msg">${o.message}</div>
                                <div class="change-meta">
                                  ${U(o.timestamp)} ·
                                  ${o.entity_id}
                                </div>
                              </div>
                            </label>
                          `)}
                  </div>
                </div>
              </div>
            `})}
        </div>
        <feedback-banner
          .kind=${this.statusKind}
          .text=${this.statusText}
          .visible=${this.statusVisible}
        ></feedback-banner>
      </div>
    `}}a=ee(W);z=new WeakMap;E=new WeakMap;I=new WeakMap;D=new WeakMap;C=new WeakMap;x(a,4,"results",A,c,z);x(a,4,"statusKind",q,c,E);x(a,4,"statusText",V,c,I);x(a,4,"statusVisible",L,c,D);x(a,4,"_collapsedWindowIds",K,c,C);se(a,c);ie(c,"styles",X);customElements.define("dev-tool-results",c);
