import{i as W,b as $,g as j}from"./iframe-maWesKjk.js";import{n as B}from"./property-DyW-YDBW.js";const G=W`
  :host {
    display: block;
    pointer-events: none;
  }
  .wrapper {
    display: none;
    align-items: center;
    justify-content: center;
    width: calc(var(--spacing, 8px) * 3);
    height: calc(var(--spacing, 8px) * 3);
    border-radius: 999px;
    background: color-mix(
      in srgb,
      var(--card-background-color, #fff) 92%,
      transparent
    );
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  }
  .wrapper.active {
    display: inline-flex;
  }
  .spinner {
    width: calc(var(--spacing, 8px) * 2);
    height: calc(var(--spacing, 8px) * 2);
    border-radius: 50%;
    border: 2px solid
      color-mix(in srgb, var(--primary-color, #03a9f4) 22%, transparent);
    border-top-color: var(--primary-color, #03a9f4);
    animation: spin 0.9s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;var L=Object.create,k=Object.defineProperty,N=Object.getOwnPropertyDescriptor,S=(e,t)=>(t=Symbol[e])?t:Symbol.for("Symbol."+e),_=e=>{throw TypeError(e)},O=(e,t,r)=>t in e?k(e,t,{enumerable:!0,configurable:!0,writable:!0,value:r}):e[t]=r,T=e=>[,,,L(e?.[S("metadata")]??null)],z=["class","method","getter","setter","accessor","field","value","get","set"],p=e=>e!==void 0&&typeof e!="function"?_("Function expected"):e,q=(e,t,r,i,a)=>({kind:z[e],name:t,metadata:i,addInitializer:n=>r._?_("Already initialized"):a.push(p(n||null))}),H=(e,t)=>O(t,S("metadata"),e[3]),m=(e,t,r,i)=>{for(var a=0,n=e[t>>1],s=n&&n.length;a<s;a++)t&1?n[a].call(r):i=n[a].call(r,i);return i},J=(e,t,r,i,a,n)=>{for(var s,o,b,l,f,w=t&7,E=!1,I=!1,h=e.length+1,F=z[w+5],A=e[h-1]=[],D=e[h]||(e[h]=[]),c=(a=a.prototype,N({get[r](){return Q(this,n)},set[r](d){return U(this,n,d)}},r)),u=i.length-1;u>=0;u--)l=q(w,r,b={},e[3],D),l.static=E,l.private=I,f=l.access={has:d=>r in d},f.get=d=>d[r],f.set=(d,M)=>d[r]=M,o=(0,i[u])({get:c.get,set:c.set},l),b._=1,o===void 0?p(o)&&(c[F]=o):typeof o!="object"||o===null?_("Object expected"):(p(s=o.get)&&(c.get=s),p(s=o.set)&&(c.set=s),p(s=o.init)&&A.unshift(s));return c&&k(a,r,c),a},K=(e,t,r)=>O(e,t+"",r),P=(e,t,r)=>t.has(e)||_("Cannot "+r),Q=(e,t,r)=>(P(e,t,"read from private field"),t.get(e)),R=(e,t,r)=>t.has(e)?_("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(e):t.set(e,r),U=(e,t,r,i)=>(P(e,t,"write to private field"),t.set(e,r),r),C,x,v,y;class g extends(x=j,C=[B({type:Boolean,reflect:!0})],x){constructor(){super(...arguments),R(this,y,m(v,8,this,!1)),m(v,11,this)}render(){return $`
      <div class="wrapper ${this.active?"active":""}">
        <div class="spinner"></div>
      </div>
    `}}v=T(x);y=new WeakMap;J(v,4,"active",C,g,y);H(v,g);K(g,"styles",G);customElements.define("loading-indicator",g);
