import{i as L,b as k,g as N}from"./iframe-maWesKjk.js";import{n as R}from"./property-DyW-YDBW.js";import{r as q}from"./state-D8ZE3MQ0.js";const B=L`
  :host {
    display: block;
  }

  .windows-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .windows-sub {
    font-size: 0.82em;
    color: var(--secondary-text-color);
  }

  .add-window-btn {
    font-size: 0.8em;
    color: var(--primary-color);
    border: 1px solid var(--primary-color);
    border-radius: 14px;
    background: none;
    cursor: pointer;
    padding: 3px 10px;
    font: inherit;
  }

  .window-row {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    background: var(--secondary-background-color, rgba(0, 0, 0, 0.04));
    border-radius: 8px;
    padding: 10px 10px 10px 12px;
    margin-bottom: 6px;
  }

  .window-fields {
    flex: 1;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: flex-end;
  }

  .w-label-wrap {
    flex: 1.2;
    min-width: 90px;
  }

  .w-start-wrap {
    flex: 1.8;
    min-width: 160px;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .w-end-wrap {
    flex: 1.8;
    min-width: 160px;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .w-start-label,
  .w-field-label {
    font-size: 0.72em;
    color: var(--secondary-text-color);
    padding-left: 2px;
    margin-bottom: 3px;
  }

  .w-start,
  .w-end,
  .w-label-native {
    padding: 9px 10px;
    width: 100%;
    box-sizing: border-box;
    height: 40px;
    border: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
    border-radius: 4px;
    background: var(--card-background-color, #fff);
    color: var(--primary-text-color);
    font: inherit;
    font-size: 0.85em;
  }

  .remove-window-btn {
    flex-shrink: 0;
    align-self: center;
    border: none;
    background: none;
    cursor: pointer;
    color: var(--secondary-text-color);
    padding: 6px;
    border-radius: 50%;
    line-height: 0;
  }

  .remove-window-btn:hover {
    color: var(--error-color, #f44336);
    background: rgba(244, 67, 54, 0.1);
  }

  .remove-window-btn[disabled] {
    opacity: 0.25;
    pointer-events: none;
  }

  .remove-window-btn ha-icon {
    --mdc-icon-size: 18px;
  }
`;var H=Object.create,z=Object.defineProperty,J=Object.getOwnPropertyDescriptor,I=(t,e)=>(e=Symbol[t])?e:Symbol.for("Symbol."+t),v=t=>{throw TypeError(t)},S=(t,e,i)=>e in t?z(t,e,{enumerable:!0,configurable:!0,writable:!0,value:i}):t[e]=i,K=t=>[,,,H(t?.[I("metadata")]??null)],D=["class","method","getter","setter","accessor","field","value","get","set"],p=t=>t!==void 0&&typeof t!="function"?v("Function expected"):t,Q=(t,e,i,r,a)=>({kind:D[t],name:e,metadata:r,addInitializer:d=>i._?v("Already initialized"):a.push(p(d||null))}),U=(t,e)=>S(e,I("metadata"),t[3]),u=(t,e,i,r)=>{for(var a=0,d=t[e>>1],o=d&&d.length;a<o;a++)e&1?d[a].call(i):r=d[a].call(i,r);return r},E=(t,e,i,r,a,d)=>{for(var o,n,y,w,_,W=e&7,T=!1,M=!1,b=t.length+1,A=D[W+5],F=t[b-1]=[],j=t[b]||(t[b]=[]),l=(a=a.prototype,J({get[i](){return X(this,d)},set[i](c){return Y(this,d,c)}},i)),x=r.length-1;x>=0;x--)w=Q(W,i,y={},t[3],j),w.static=T,w.private=M,_=w.access={has:c=>i in c},_.get=c=>c[i],_.set=(c,G)=>c[i]=G,n=(0,r[x])({get:l.get,set:l.set},w),y._=1,n===void 0?p(n)&&(l[A]=n):typeof n!="object"||n===null?v("Object expected"):(p(o=n.get)&&(l.get=o),p(o=n.set)&&(l.set=o),p(o=n.init)&&F.unshift(o));return l&&z(a,i,l),a},V=(t,e,i)=>S(t,e+"",i),C=(t,e,i)=>e.has(t)||v("Cannot "+i),X=(t,e,i)=>(C(t,e,"read from private field"),e.get(t)),$=(t,e,i)=>e.has(t)?v("Cannot add the same private member more than once"):e instanceof WeakSet?e.add(t):e.set(t,i),Y=(t,e,i,r)=>(C(t,e,"write to private field"),e.set(t,i),i),O,P,g,s,m,f;class h extends(g=N,P=[R({attribute:!1})],O=[q()],g){constructor(){super(...arguments),$(this,m,u(s,8,this,[])),u(s,11,this),$(this,f,u(s,12,this,1)),u(s,15,this)}connectedCallback(){super.connectedCallback(),this.windows.length===0?this.windows=[this._createWindow()]:this._nextWindowId=Math.max(...this.windows.map(e=>e.id),0)+1}getWindowConfigs(){return this.windows.map(e=>({...e}))}_createWindow(){const e=this._nextWindowId;return this._nextWindowId+=1,{id:e,label:"",startDt:"",endDt:""}}_emitChange(){this.dispatchEvent(new CustomEvent("dp-window-configs-change",{detail:{windows:this.getWindowConfigs()},bubbles:!0,composed:!0}))}_addWindow(){this.windows=[...this.windows,this._createWindow()],this._emitChange()}_removeWindow(e){this.windows.length<=1||(this.windows=this.windows.filter(i=>i.id!==e),this._emitChange())}_updateWindow(e,i){this.windows=this.windows.map(r=>r.id!==e?r:{...r,...i}),this._emitChange()}render(){return k`
      <div class="windows-header">
        <span class="windows-sub">Comparison windows</span>
        <button
          class="add-window-btn"
          id="add-window-btn"
          type="button"
          @click=${this._addWindow}
        >
          + Add window
        </button>
      </div>
      <div id="windows-list">
        ${this.windows.map((e,i)=>k`
            <div class="window-row" data-wid=${String(e.id)}>
              <div class="window-fields">
                <div class="w-label-wrap">
                  <div class="w-field-label">Label (optional)</div>
                  <input
                    class="w-label-native w-label"
                    type="text"
                    .value=${e.label}
                    placeholder=${`Window ${i+1}`}
                    @input=${r=>this._updateWindow(e.id,{label:r.currentTarget.value})}
                  />
                </div>
                <div class="w-start-wrap">
                  <span class="w-start-label">Start date/time</span>
                  <input
                    class="w-start"
                    type="datetime-local"
                    .value=${e.startDt}
                    @input=${r=>this._updateWindow(e.id,{startDt:r.currentTarget.value})}
                  />
                </div>
                <div class="w-end-wrap">
                  <div class="w-field-label">End date/time (optional)</div>
                  <input
                    class="w-end"
                    type="datetime-local"
                    .value=${e.endDt}
                    @input=${r=>this._updateWindow(e.id,{endDt:r.currentTarget.value})}
                  />
                </div>
              </div>
              <button
                class="remove-window-btn"
                type="button"
                title="Remove this window"
                ?disabled=${this.windows.length<=1}
                @click=${()=>this._removeWindow(e.id)}
              >
                <ha-icon icon="mdi:close-circle-outline"></ha-icon>
              </button>
            </div>
          `)}
      </div>
    `}}s=K(g);m=new WeakMap;f=new WeakMap;E(s,4,"windows",P,h,m);E(s,4,"_nextWindowId",O,h,f);U(s,h);V(h,"styles",B);customElements.define("dev-tool-windows",h);
