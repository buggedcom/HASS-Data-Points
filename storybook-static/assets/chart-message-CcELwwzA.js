import{i as D,b as W,g as j}from"./iframe-maWesKjk.js";import{n as G}from"./property-DyW-YDBW.js";const N=D`
  :host {
    display: block;
    pointer-events: none;
  }
  .message {
    position: absolute;
    inset: 0;
    display: none;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: var(--secondary-text-color);
    font-size: 0.95rem;
    z-index: 2;
  }
  .message.visible {
    display: flex;
  }
`;var T=Object.create,w=Object.defineProperty,q=Object.getOwnPropertyDescriptor,z=(e,t)=>(t=Symbol[e])?t:Symbol.for("Symbol."+e),p=e=>{throw TypeError(e)},k=(e,t,r)=>t in e?w(e,t,{enumerable:!0,configurable:!0,writable:!0,value:r}):e[t]=r,B=e=>[,,,T(e?.[z("metadata")]??null)],O=["class","method","getter","setter","accessor","field","value","get","set"],_=e=>e!==void 0&&typeof e!="function"?p("Function expected"):e,H=(e,t,r,a,s)=>({kind:O[e],name:t,metadata:a,addInitializer:i=>r._?p("Already initialized"):s.push(_(i||null))}),J=(e,t)=>k(t,z("metadata"),e[3]),b=(e,t,r,a)=>{for(var s=0,i=e[t>>1],o=i&&i.length;s<o;s++)t&1?i[s].call(r):a=i[s].call(r,a);return a},K=(e,t,r,a,s,i)=>{for(var o,n,x,d,h,S=t&7,E=!1,F=!1,u=e.length+1,I=O[S+5],M=e[u-1]=[],$=e[u]||(e[u]=[]),c=(s=s.prototype,q({get[r](){return Q(this,i)},set[r](l){return U(this,i,l)}},r)),f=a.length-1;f>=0;f--)d=H(S,r,x={},e[3],$),d.static=E,d.private=F,h=d.access={has:l=>r in l},h.get=l=>l[r],h.set=(l,A)=>l[r]=A,n=(0,a[f])({get:c.get,set:c.set},d),x._=1,n===void 0?_(n)&&(c[I]=n):typeof n!="object"||n===null?p("Object expected"):(_(o=n.get)&&(c.get=o),_(o=n.set)&&(c.set=o),_(o=n.init)&&M.unshift(o));return c&&w(s,r,c),s},L=(e,t,r)=>k(e,t+"",r),C=(e,t,r)=>t.has(e)||p("Cannot "+r),Q=(e,t,r)=>(C(e,t,"read from private field"),t.get(e)),R=(e,t,r)=>t.has(e)?p("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(e):t.set(e,r),U=(e,t,r,a)=>(C(e,t,"write to private field"),t.set(e,r),r),P,m,v,y;class g extends(m=j,P=[G({type:String})],m){constructor(){super(...arguments),R(this,y,b(v,8,this,"")),b(v,11,this)}render(){return W`
      <div class="message ${this.message?"visible":""}">
        ${this.message}
      </div>
    `}}v=B(m);y=new WeakMap;K(v,4,"message",P,g,y);J(v,g);L(g,"styles",N);customElements.define("chart-message",g);
