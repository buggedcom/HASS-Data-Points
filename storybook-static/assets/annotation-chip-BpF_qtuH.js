import{i as X,b as y,g as Y}from"./iframe-maWesKjk.js";import{n as _}from"./property-DyW-YDBW.js";const Z=X`
  :host {
    display: inline-flex;
  }
  .context-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--primary-color) 12%, transparent);
    color: var(--primary-color);
    font-size: 0.82rem;
    font-family: inherit;
  }
  .context-chip ha-icon,
  .context-chip ha-state-icon {
    --mdc-icon-size: 14px;
    flex: 0 0 auto;
  }
  .context-chip-text {
    display: inline-flex;
    flex-direction: column;
    min-width: 0;
    line-height: 1.15;
  }
  .context-chip-primary,
  .context-chip-secondary {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .context-chip-primary {
    font-weight: 600;
  }
  .context-chip-secondary {
    font-size: 0.74rem;
    opacity: 0.8;
  }
  .context-chip-remove {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: transparent;
    color: currentColor;
    cursor: pointer;
    flex: 0 0 auto;
  }
  .context-chip-remove:hover {
    background: color-mix(in srgb, currentColor 12%, transparent);
  }
  .context-chip-remove ha-icon {
    --mdc-icon-size: 12px;
    pointer-events: none;
  }
`;var tt=Object.create,E=Object.defineProperty,et=Object.getOwnPropertyDescriptor,T=(t,e)=>(e=Symbol[t])?e:Symbol.for("Symbol."+t),f=t=>{throw TypeError(t)},P=(t,e,i)=>e in t?E(t,e,{enumerable:!0,configurable:!0,writable:!0,value:i}):t[e]=i,it=t=>[,,,tt(t?.[T("metadata")]??null)],A=["class","method","getter","setter","accessor","field","value","get","set"],m=t=>t!==void 0&&typeof t!="function"?f("Function expected"):t,nt=(t,e,i,o,a)=>({kind:A[t],name:e,metadata:o,addInitializer:c=>i._?f("Already initialized"):a.push(m(c||null))}),rt=(t,e)=>P(e,T("metadata"),t[3]),r=(t,e,i,o)=>{for(var a=0,c=t[e>>1],h=c&&c.length;a<h;a++)e&1?c[a].call(i):o=c[a].call(i,o);return o},v=(t,e,i,o,a,c)=>{for(var h,p,M,u,g,W=e&7,J=!1,K=!1,b=t.length+1,L=A[W+5],Q=t[b-1]=[],U=t[b]||(t[b]=[]),l=(a=a.prototype,et({get[i](){return st(this,c)},set[i](d){return ot(this,c,d)}},i)),w=o.length-1;w>=0;w--)u=nt(W,i,M={},t[3],U),u.static=J,u.private=K,g=u.access={has:d=>i in d},g.get=d=>d[i],g.set=(d,V)=>d[i]=V,p=(0,o[w])({get:l.get,set:l.set},u),M._=1,p===void 0?m(p)&&(l[L]=p):typeof p!="object"||p===null?f("Object expected"):(m(h=p.get)&&(l.get=h),m(h=p.set)&&(l.set=h),m(h=p.init)&&Q.unshift(h));return l&&E(a,i,l),a},at=(t,e,i)=>P(t,e+"",i),F=(t,e,i)=>e.has(t)||f("Cannot "+i),st=(t,e,i)=>(F(t,e,"read from private field"),e.get(t)),x=(t,e,i)=>e.has(t)?f("Cannot add the same private member more than once"):e instanceof WeakSet?e.add(t):e.set(t,i),ot=(t,e,i,o)=>(F(t,e,"write to private field"),e.set(t,i),i),R,D,G,N,q,B,H,k,n,O,S,$,j,z,C,I;class s extends(k=Y,H=[_({type:String})],B=[_({type:String,attribute:"item-id"})],q=[_({type:String})],N=[_({type:String})],G=[_({type:String,attribute:"secondary-text"})],D=[_({type:Object,attribute:!1})],R=[_({type:Object,attribute:!1})],k){constructor(){super(...arguments),x(this,O,r(n,8,this,"")),r(n,11,this),x(this,S,r(n,12,this,"")),r(n,15,this),x(this,$,r(n,16,this,"")),r(n,19,this),x(this,j,r(n,20,this,"")),r(n,23,this),x(this,z,r(n,24,this,"")),r(n,27,this),x(this,C,r(n,28,this,null)),r(n,31,this),x(this,I,r(n,32,this,null)),r(n,35,this)}_onRemove(){this.dispatchEvent(new CustomEvent("dp-chip-remove",{detail:{type:this.type,itemId:this.itemId},bubbles:!0,composed:!0}))}render(){return y`
      <span class="context-chip">
        ${this.stateObj?y`<ha-state-icon
              .stateObj=${this.stateObj}
              .hass=${this.hass??null}
            ></ha-state-icon>`:y`<ha-icon icon="${this.icon}"></ha-icon>`}
        <span class="context-chip-text">
          <span class="context-chip-primary">${this.name}</span>
          ${this.secondaryText?y`<span class="context-chip-secondary"
                >${this.secondaryText}</span
              >`:y``}
        </span>
        <button
          class="context-chip-remove"
          type="button"
          aria-label="Remove ${this.name}"
          @click=${this._onRemove}
        >
          <ha-icon icon="mdi:close"></ha-icon>
        </button>
      </span>
    `}}n=it(k);O=new WeakMap;S=new WeakMap;$=new WeakMap;j=new WeakMap;z=new WeakMap;C=new WeakMap;I=new WeakMap;v(n,4,"type",H,s,O);v(n,4,"itemId",B,s,S);v(n,4,"icon",q,s,$);v(n,4,"name",N,s,j);v(n,4,"secondaryText",G,s,z);v(n,4,"stateObj",D,s,C);v(n,4,"hass",R,s,I);rt(n,s);at(s,"styles",Z);customElements.define("annotation-chip",s);
