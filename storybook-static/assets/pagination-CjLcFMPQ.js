import{i as J,b as K,g as L}from"./iframe-maWesKjk.js";import{n as v}from"./property-DyW-YDBW.js";const Q=J`
  :host {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 8px;
    font-size: 0.8rem;
    color: var(--secondary-text-color);
  }
  button {
    background: none;
    border: 1px solid var(--divider-color, #444);
    border-radius: 4px;
    color: var(--primary-text-color);
    cursor: pointer;
    padding: 4px 8px;
    font-family: inherit;
    font-size: 0.8rem;
  }
  button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  button:not(:disabled):hover {
    background: color-mix(in srgb, var(--primary-text-color) 8%, transparent);
  }
  .info {
    min-width: 120px;
    text-align: center;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .sep {
    opacity: 0.55;
  }
`;var R=Object.create,I=Object.defineProperty,U=Object.getOwnPropertyDescriptor,N=(t,e)=>(e=Symbol[t])?e:Symbol.for("Symbol."+t),u=t=>{throw TypeError(t)},C=(t,e,a)=>e in t?I(t,e,{enumerable:!0,configurable:!0,writable:!0,value:a}):t[e]=a,V=t=>[,,,R(t?.[N("metadata")]??null)],O=["class","method","getter","setter","accessor","field","value","get","set"],h=t=>t!==void 0&&typeof t!="function"?u("Function expected"):t,X=(t,e,a,s,i)=>({kind:O[t],name:e,metadata:s,addInitializer:o=>a._?u("Already initialized"):i.push(h(o||null))}),Y=(t,e)=>C(e,N("metadata"),t[3]),l=(t,e,a,s)=>{for(var i=0,o=t[e>>1],p=o&&o.length;i<p;i++)e&1?o[i].call(a):s=o[i].call(a,s);return s},f=(t,e,a,s,i,o)=>{for(var p,n,E,g,x,z=e&7,j=!1,G=!1,m=t.length+1,T=O[z+5],q=t[m-1]=[],B=t[m]||(t[m]=[]),c=(i=i.prototype,U({get[a](){return tt(this,o)},set[a](d){return et(this,o,d)}},a)),y=s.length-1;y>=0;y--)g=X(z,a,E={},t[3],B),g.static=j,g.private=G,x=g.access={has:d=>a in d},x.get=d=>d[a],x.set=(d,H)=>d[a]=H,n=(0,s[y])({get:c.get,set:c.set},g),E._=1,n===void 0?h(n)&&(c[T]=n):typeof n!="object"||n===null?u("Object expected"):(h(p=n.get)&&(c.get=p),h(p=n.set)&&(c.set=p),h(p=n.init)&&q.unshift(p));return c&&I(i,a,c),i},Z=(t,e,a)=>C(t,e+"",a),M=(t,e,a)=>e.has(t)||u("Cannot "+a),tt=(t,e,a)=>(M(t,e,"read from private field"),e.get(t)),b=(t,e,a)=>e.has(t)?u("Cannot add the same private member more than once"):e instanceof WeakSet?e.add(t):e.set(t,a),et=(t,e,a,s)=>(M(t,e,"write to private field"),e.set(t,a),a),W,F,A,D,P,r,w,k,S,$;class _ extends(P=L,D=[v({type:Number})],A=[v({type:Number})],F=[v({type:Number})],W=[v({type:String})],P){constructor(){super(...arguments),b(this,w,l(r,8,this,0)),l(r,11,this),b(this,k,l(r,12,this,1)),l(r,15,this),b(this,S,l(r,16,this,0)),l(r,19,this),b(this,$,l(r,20,this,"records")),l(r,23,this)}_onPrev(){this.page>0&&this.dispatchEvent(new CustomEvent("dp-page-change",{detail:{page:this.page-1},bubbles:!0,composed:!0}))}_onNext(){this.page<this.totalPages-1&&this.dispatchEvent(new CustomEvent("dp-page-change",{detail:{page:this.page+1},bubbles:!0,composed:!0}))}render(){return K`
      <button
        type="button"
        data-action="prev"
        ?disabled=${this.page<=0}
        @click=${this._onPrev}
        aria-label="Previous page"
      >
        ‹
      </button>
      <span class="info">
        <span>Page ${this.page+1} of ${this.totalPages}</span>
        <span class="sep" aria-hidden="true">•</span>
        <span>${this.totalItems} ${this.label}</span>
      </span>
      <button
        type="button"
        data-action="next"
        ?disabled=${this.page>=this.totalPages-1}
        @click=${this._onNext}
        aria-label="Next page"
      >
        ›
      </button>
    `}}r=V(P);w=new WeakMap;k=new WeakMap;S=new WeakMap;$=new WeakMap;f(r,4,"page",D,_,w);f(r,4,"totalPages",A,_,k);f(r,4,"totalItems",F,_,S);f(r,4,"label",W,_,$);Y(r,_);Z(_,"styles",Q);customElements.define("pagination-nav",_);
