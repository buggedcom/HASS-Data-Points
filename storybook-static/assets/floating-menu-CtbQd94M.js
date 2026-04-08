import{i as L,b as W,g as $}from"./iframe-maWesKjk.js";import{n as B}from"./property-DyW-YDBW.js";const G=L`
  :host {
    display: contents;
  }

  .floating-menu {
    position: fixed;
    top: var(--floating-menu-top, 64px);
    left: var(--floating-menu-left, 0px);
    z-index: 9999;
    min-width: var(--floating-menu-min-width, 220px);
    width: var(--floating-menu-width, auto);
    max-height: var(--floating-menu-max-height, none);
    overflow: var(--floating-menu-overflow, visible);
    padding: var(--floating-menu-padding, var(--dp-spacing-xs, 4px));
    border-radius: 14px;
    background: var(--card-background-color, #fff);
    box-shadow:
      0 18px 44px rgba(0, 0, 0, 0.18),
      0 2px 8px rgba(0, 0, 0, 0.1);
    border: 1px solid
      color-mix(
        in srgb,
        var(--divider-color, rgba(0, 0, 0, 0.12)) 88%,
        transparent
      );
  }

  .floating-menu[hidden] {
    display: none;
  }
`;var N=Object.create,y=Object.defineProperty,T=Object.getOwnPropertyDescriptor,P=(e,t)=>(t=Symbol[e])?t:Symbol.for("Symbol."+e),u=e=>{throw TypeError(e)},C=(e,t,r)=>t in e?y(e,t,{enumerable:!0,configurable:!0,writable:!0,value:r}):e[t]=r,j=e=>[,,,N(e?.[P("metadata")]??null)],E=["class","method","getter","setter","accessor","field","value","get","set"],p=e=>e!==void 0&&typeof e!="function"?u("Function expected"):e,q=(e,t,r,o,n)=>({kind:E[e],name:t,metadata:o,addInitializer:i=>r._?u("Already initialized"):n.push(p(i||null))}),H=(e,t)=>C(t,P("metadata"),e[3]),k=(e,t,r,o)=>{for(var n=0,i=e[t>>1],s=i&&i.length;n<s;n++)t&1?i[n].call(r):o=i[n].call(r,o);return o},J=(e,t,r,o,n,i)=>{for(var s,a,x,c,h,b=t&7,z=!1,O=!1,f=e.length+1,I=E[b+5],F=e[f-1]=[],M=e[f]||(e[f]=[]),d=(n=n.prototype,T({get[r](){return Q(this,i)},set[r](l){return U(this,i,l)}},r)),g=o.length-1;g>=0;g--)c=q(b,r,x={},e[3],M),c.static=z,c.private=O,h=c.access={has:l=>r in l},h.get=l=>l[r],h.set=(l,A)=>l[r]=A,a=(0,o[g])({get:d.get,set:d.set},c),x._=1,a===void 0?p(a)&&(d[I]=a):typeof a!="object"||a===null?u("Object expected"):(p(s=a.get)&&(d.get=s),p(s=a.set)&&(d.set=s),p(s=a.init)&&F.unshift(s));return d&&y(n,r,d),n},K=(e,t,r)=>C(e,t+"",r),S=(e,t,r)=>t.has(e)||u("Cannot "+r),Q=(e,t,r)=>(S(e,t,"read from private field"),t.get(e)),R=(e,t,r)=>t.has(e)?u("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(e):t.set(e,r),U=(e,t,r,o)=>(S(e,t,"write to private field"),t.set(e,r),r),D,m,v,w;class _ extends(m=$,D=[B({type:Boolean,reflect:!0})],m){constructor(){super(...arguments),R(this,w,k(v,8,this,!1)),k(v,11,this)}connectedCallback(){super.connectedCallback(),this._onPointerDown=this._onPointerDown.bind(this),window.addEventListener("pointerdown",this._onPointerDown,!0)}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("pointerdown",this._onPointerDown,!0)}_onPointerDown(t){if(!this.open)return;t.composedPath().some(n=>n===this)||this.dispatchEvent(new CustomEvent("dp-menu-close",{detail:{},bubbles:!0,composed:!0}))}render(){return W`
      <div class="floating-menu" role="menu" ?hidden=${!this.open}>
        <slot></slot>
      </div>
    `}}v=j(m);w=new WeakMap;J(v,4,"open",D,_,w);H(v,_);K(_,"styles",G);customElements.define("floating-menu",_);
