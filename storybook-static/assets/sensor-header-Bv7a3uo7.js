import{i as L,b as Q,g as R}from"./iframe-maWesKjk.js";import{n as _}from"./property-DyW-YDBW.js";const U=L`
  :host {
    display: block;
  }

  .header {
    padding: 8px 16px 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .name {
    font-size: 1.1rem;
    font-weight: 500;
    color: var(--secondary-text-color);
    line-height: 40px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
    pointer-events: none;
  }

  .icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--state-icon-color, var(--secondary-text-color));
  }

  .icon ha-state-icon {
    --mdc-icon-size: 24px;
  }

  .info {
    display: flex;
    align-items: baseline;
    padding: 0 16px 16px;
    margin-top: -4px;
    line-height: var(--ha-line-height-condensed);
    pointer-events: none;
  }

  .value {
    font-size: var(--ha-font-size-3xl, 2.5rem);
    font-weight: var(--ha-font-weight-normal, 400);
    line-height: 0.95;
    letter-spacing: -0.03em;
    color: var(--primary-text-color);
  }

  .measurement {
    font-size: 1rem;
    color: var(--secondary-text-color);
    font-weight: 400;
    pointer-events: none;
  }

  .first-part {
    order: -1;
    margin-right: 4px;
    margin-inline-end: 4px;
    margin-inline-start: initial;
  }
`;var V=Object.create,E=Object.defineProperty,X=Object.getOwnPropertyDescriptor,M=(e,t)=>(t=Symbol[e])?t:Symbol.for("Symbol."+e),g=e=>{throw TypeError(e)},P=(e,t,i)=>t in e?E(e,t,{enumerable:!0,configurable:!0,writable:!0,value:i}):e[t]=i,Y=e=>[,,,V(e?.[M("metadata")]??null)],W=["class","method","getter","setter","accessor","field","value","get","set"],f=e=>e!==void 0&&typeof e!="function"?g("Function expected"):e,Z=(e,t,i,n,r)=>({kind:W[e],name:t,metadata:n,addInitializer:o=>i._?g("Already initialized"):r.push(f(o||null))}),ee=(e,t)=>P(t,M("metadata"),e[3]),s=(e,t,i,n)=>{for(var r=0,o=e[t>>1],c=o&&o.length;r<c;r++)t&1?o[r].call(i):n=o[r].call(i,n);return n},m=(e,t,i,n,r,o)=>{for(var c,l,C,v,x,$=t&7,N=!1,T=!1,y=e.length+1,q=W[$+5],B=e[y-1]=[],J=e[y]||(e[y]=[]),p=(r=r.prototype,X({get[i](){return ie(this,o)},set[i](h){return ae(this,o,h)}},i)),w=n.length-1;w>=0;w--)v=Z($,i,C={},e[3],J),v.static=N,v.private=T,x=v.access={has:h=>i in h},x.get=h=>h[i],x.set=(h,K)=>h[i]=K,l=(0,n[w])({get:p.get,set:p.set},v),C._=1,l===void 0?f(l)&&(p[q]=l):typeof l!="object"||l===null?g("Object expected"):(f(c=l.get)&&(p.get=c),f(c=l.set)&&(p.set=c),f(c=l.init)&&B.unshift(c));return p&&E(r,i,p),r},te=(e,t,i)=>P(e,t+"",i),H=(e,t,i)=>t.has(e)||g("Cannot "+i),ie=(e,t,i)=>(H(e,t,"read from private field"),t.get(e)),u=(e,t,i)=>t.has(e)?g("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(e):t.set(e,i),ae=(e,t,i,n)=>(H(e,t,"write to private field"),t.set(e,i),i),D,F,I,A,G,b,a,k,O,S,z,j;class d extends(b=R,G=[_({type:String})],A=[_({type:String})],I=[_({type:String})],F=[_({type:Object,attribute:!1})],D=[_({type:Object,attribute:!1})],b){constructor(){super(...arguments),u(this,k,s(a,8,this,"—")),s(a,11,this),u(this,O,s(a,12,this,"—")),s(a,15,this),u(this,S,s(a,16,this,"")),s(a,19,this),u(this,z,s(a,20,this,null)),s(a,23,this),u(this,j,s(a,24,this,null)),s(a,27,this)}_onHeaderClick(t){t.preventDefault(),t.stopPropagation(),this.dispatchEvent(new CustomEvent("dp-sensor-header-click",{bubbles:!0,composed:!0}))}render(){return Q`
      <div class="header" @click=${this._onHeaderClick}>
        <div class="name">${this.name}</div>
        <div class="icon">
          <ha-state-icon
            .stateObj=${this.stateObj}
            .hass=${this.hass}
          ></ha-state-icon>
        </div>
      </div>
      <div class="info" @click=${this._onHeaderClick}>
        <span class="value first-part">${this.value}</span>
        <span class="measurement">${this.unit}</span>
      </div>
    `}}a=Y(b);k=new WeakMap;O=new WeakMap;S=new WeakMap;z=new WeakMap;j=new WeakMap;m(a,4,"name",G,d,k);m(a,4,"value",A,d,O);m(a,4,"unit",I,d,S);m(a,4,"stateObj",F,d,z);m(a,4,"hass",D,d,j);ee(a,d);te(d,"styles",U);customElements.define("sensor-header",d);
