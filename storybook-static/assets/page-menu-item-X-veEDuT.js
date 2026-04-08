import{i as q,b as H,g as J}from"./iframe-maWesKjk.js";import{n as x}from"./property-DyW-YDBW.js";const K=q`
  :host {
    display: block;
  }
  button {
    width: 100%;
    min-height: 38px;
    padding: var(--dp-spacing-sm, 8px) var(--dp-spacing-sm, 8px);
    display: flex;
    align-items: center;
    gap: var(--dp-spacing-sm, 8px);
    border: none;
    border-radius: 10px;
    background: transparent;
    color: var(--primary-text-color);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  button:hover,
  button:focus-visible {
    background: color-mix(
      in srgb,
      var(--primary-text-color, #111) 6%,
      transparent
    );
    outline: none;
  }
  button[disabled] {
    opacity: 0.5;
    cursor: not-allowed;
  }
  button[disabled]:hover {
    background: transparent;
  }
  ha-icon {
    --mdc-icon-size: 18px;
    color: var(--secondary-text-color);
    flex: 0 0 auto;
  }
`;var L=Object.create,O=Object.defineProperty,Q=Object.getOwnPropertyDescriptor,P=(t,e)=>(e=Symbol[t])?e:Symbol.for("Symbol."+t),h=t=>{throw TypeError(t)},M=(t,e,r)=>e in t?O(t,e,{enumerable:!0,configurable:!0,writable:!0,value:r}):t[e]=r,R=t=>[,,,L(t?.[P("metadata")]??null)],$=["class","method","getter","setter","accessor","field","value","get","set"],v=t=>t!==void 0&&typeof t!="function"?h("Function expected"):t,U=(t,e,r,o,a)=>({kind:$[t],name:e,metadata:o,addInitializer:n=>r._?h("Already initialized"):a.push(v(n||null))}),V=(t,e)=>M(e,P("metadata"),t[3]),p=(t,e,r,o)=>{for(var a=0,n=t[e>>1],c=n&&n.length;a<c;a++)e&1?n[a].call(r):o=n[a].call(r,o);return o},k=(t,e,r,o,a,n)=>{for(var c,s,z,u,b,E=e&7,D=!1,B=!1,g=t.length+1,G=$[E+5],N=t[g-1]=[],T=t[g]||(t[g]=[]),l=(a=a.prototype,Q({get[r](){return Y(this,n)},set[r](d){return Z(this,n,d)}},r)),f=o.length-1;f>=0;f--)u=U(E,r,z={},t[3],T),u.static=D,u.private=B,b=u.access={has:d=>r in d},b.get=d=>d[r],b.set=(d,j)=>d[r]=j,s=(0,o[f])({get:l.get,set:l.set},u),z._=1,s===void 0?v(s)&&(l[G]=s):typeof s!="object"||s===null?h("Object expected"):(v(c=s.get)&&(l.get=c),v(c=s.set)&&(l.set=c),v(c=s.init)&&N.unshift(c));return l&&O(a,r,l),a},X=(t,e,r)=>M(t,e+"",r),I=(t,e,r)=>e.has(t)||h("Cannot "+r),Y=(t,e,r)=>(I(t,e,"read from private field"),e.get(t)),m=(t,e,r)=>e.has(t)?h("Cannot add the same private member more than once"):e instanceof WeakSet?e.add(t):e.set(t,r),Z=(t,e,r,o)=>(I(t,e,"write to private field"),e.set(t,r),r),W,F,A,y,i,w,S,C;class _ extends(y=J,A=[x({type:String})],F=[x({type:String})],W=[x({type:Boolean})],y){constructor(){super(...arguments),m(this,w,p(i,8,this,"")),p(i,11,this),m(this,S,p(i,12,this,"")),p(i,15,this),m(this,C,p(i,16,this,!1)),p(i,19,this)}_onClick(){this.disabled||this.dispatchEvent(new CustomEvent("dp-menu-action",{bubbles:!0,composed:!0}))}render(){return H`
      <button type="button" ?disabled=${this.disabled} @click=${this._onClick}>
        <ha-icon icon="${this.icon}"></ha-icon>
        ${this.label}
      </button>
    `}}i=R(y);w=new WeakMap;S=new WeakMap;C=new WeakMap;k(i,4,"icon",A,_,w);k(i,4,"label",F,_,S);k(i,4,"disabled",W,_,C);V(i,_);X(_,"styles",K);customElements.define("page-menu-item",_);
