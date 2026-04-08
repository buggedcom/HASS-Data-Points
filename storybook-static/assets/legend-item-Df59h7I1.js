import{i as K,b as Q,g as R}from"./iframe-maWesKjk.js";import{n as u}from"./property-DyW-YDBW.js";const U=K`
  :host {
    display: inline-block;
  }
  button {
    display: flex;
    align-items: center;
    gap: calc(var(--spacing, 8px) * 0.625);
    font-size: 0.72rem;
    color: var(--secondary-text-color);
    flex: 0 0 auto;
    background: none;
    border: none;
    cursor: pointer;
    padding: 2px 4px;
    border-radius: 4px;
    white-space: nowrap;
    font-family: inherit;
  }
  button:hover {
    background: color-mix(in srgb, var(--primary-text-color) 8%, transparent);
  }
  .legend-line {
    width: calc(var(--spacing, 8px) * 2);
    height: 3px;
    border-radius: 2px;
    flex-shrink: 0;
  }
`;var V=Object.create,O=Object.defineProperty,X=Object.getOwnPropertyDescriptor,W=(e,t)=>(t=Symbol[e])?t:Symbol.for("Symbol."+e),b=e=>{throw TypeError(e)},P=(e,t,r)=>t in e?O(e,t,{enumerable:!0,configurable:!0,writable:!0,value:r}):e[t]=r,Y=e=>[,,,V(e?.[W("metadata")]??null)],I=["class","method","getter","setter","accessor","field","value","get","set"],g=e=>e!==void 0&&typeof e!="function"?b("Function expected"):e,Z=(e,t,r,o,s)=>({kind:I[e],name:t,metadata:o,addInitializer:n=>r._?b("Already initialized"):s.push(g(n||null))}),ee=(e,t)=>P(t,W("metadata"),e[3]),a=(e,t,r,o)=>{for(var s=0,n=e[t>>1],c=n&&n.length;s<c;s++)t&1?n[s].call(r):o=n[s].call(r,o);return o},y=(e,t,r,o,s,n)=>{for(var c,l,E,h,f,M=t&7,G=!1,H=!1,x=e.length+1,L=I[M+5],j=e[x-1]=[],q=e[x]||(e[x]=[]),p=(s=s.prototype,X({get[r](){return re(this,n)},set[r](_){return ie(this,n,_)}},r)),k=o.length-1;k>=0;k--)h=Z(M,r,E={},e[3],q),h.static=G,h.private=H,f=h.access={has:_=>r in _},f.get=_=>_[r],f.set=(_,J)=>_[r]=J,l=(0,o[k])({get:p.get,set:p.set},h),E._=1,l===void 0?g(l)&&(p[L]=l):typeof l!="object"||l===null?b("Object expected"):(g(c=l.get)&&(p.get=c),g(c=l.set)&&(p.set=c),g(c=l.init)&&j.unshift(c));return p&&O(s,r,p),s},te=(e,t,r)=>P(e,t+"",r),F=(e,t,r)=>t.has(e)||b("Cannot "+r),re=(e,t,r)=>(F(e,t,"read from private field"),t.get(e)),v=(e,t,r)=>t.has(e)?b("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(e):t.set(e,r),ie=(e,t,r,o)=>(F(e,t,"write to private field"),t.set(e,r),r),A,D,N,T,B,w,i,m,S,$,C,z;class d extends(w=R,B=[u({type:String})],T=[u({type:String})],N=[u({type:String})],D=[u({type:Boolean})],A=[u({type:Number})],w){constructor(){super(...arguments),v(this,m,a(i,8,this,"")),a(i,11,this),v(this,S,a(i,12,this,"#888")),a(i,15,this),v(this,$,a(i,16,this,"")),a(i,19,this),v(this,C,a(i,20,this,!0)),a(i,23,this),v(this,z,a(i,24,this,1)),a(i,27,this)}_onClick(){this.dispatchEvent(new CustomEvent("dp-legend-toggle",{detail:{pressed:!this.pressed},bubbles:!0,composed:!0}))}render(){const t=this.unit?`${this.label} (${this.unit})`:this.label;return Q`
      <button
        type="button"
        aria-pressed="${this.pressed}"
        title="${this.pressed?"Hide":"Show"} ${this.label}"
        @click=${this._onClick}
      >
        <div
          class="legend-line"
          style="background-color: ${this.color}; opacity: ${this.opacity}"
        ></div>
        ${t}
      </button>
    `}}i=Y(w);m=new WeakMap;S=new WeakMap;$=new WeakMap;C=new WeakMap;z=new WeakMap;y(i,4,"label",B,d,m);y(i,4,"color",T,d,S);y(i,4,"unit",N,d,$);y(i,4,"pressed",D,d,C);y(i,4,"opacity",A,d,z);ee(i,d);te(d,"styles",U);customElements.define("legend-item",d);
