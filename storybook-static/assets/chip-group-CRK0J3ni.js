import{i as J,b as x,g as K}from"./iframe-maWesKjk.js";import{n as m}from"./property-DyW-YDBW.js";import"./entity-chip-B-eFJyDu.js";const L=J`
  :host {
    display: block;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .label {
    font-size: 0.78rem;
    color: var(--secondary-text-color);
    margin-bottom: 4px;
  }
`;var Q=Object.create,I=Object.defineProperty,U=Object.getOwnPropertyDescriptor,M=(e,t)=>(t=Symbol[e])?t:Symbol.for("Symbol."+e),u=e=>{throw TypeError(e)},P=(e,t,r)=>t in e?I(e,t,{enumerable:!0,configurable:!0,writable:!0,value:r}):e[t]=r,V=e=>[,,,Q(e?.[M("metadata")]??null)],W=["class","method","getter","setter","accessor","field","value","get","set"],v=e=>e!==void 0&&typeof e!="function"?u("Function expected"):e,X=(e,t,r,o,a)=>({kind:W[e],name:t,metadata:o,addInitializer:s=>r._?u("Already initialized"):a.push(v(s||null))}),Y=(e,t)=>P(t,M("metadata"),e[3]),n=(e,t,r,o)=>{for(var a=0,s=e[t>>1],c=s&&s.length;a<c;a++)t&1?s[a].call(r):o=s[a].call(r,o);return o},y=(e,t,r,o,a,s)=>{for(var c,l,C,h,b,E=t&7,j=!1,B=!1,g=e.length+1,N=W[E+5],T=e[g-1]=[],q=e[g]||(e[g]=[]),p=(a=a.prototype,U({get[r](){return ee(this,s)},set[r](d){return te(this,s,d)}},r)),w=o.length-1;w>=0;w--)h=X(E,r,C={},e[3],q),h.static=j,h.private=B,b=h.access={has:d=>r in d},b.get=d=>d[r],b.set=(d,H)=>d[r]=H,l=(0,o[w])({get:p.get,set:p.set},h),C._=1,l===void 0?v(l)&&(p[N]=l):typeof l!="object"||l===null?u("Object expected"):(v(c=l.get)&&(p.get=c),v(c=l.set)&&(p.set=c),v(c=l.init)&&T.unshift(c));return p&&I(a,r,p),a},Z=(e,t,r)=>P(e,t+"",r),A=(e,t,r)=>t.has(e)||u("Cannot "+r),ee=(e,t,r)=>(A(e,t,"read from private field"),t.get(e)),f=(e,t,r)=>t.has(e)?u("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(e):t.set(e,r),te=(e,t,r,o)=>(A(e,t,"write to private field"),t.set(e,r),r),F,D,G,R,k,i,S,$,O,z;class _ extends(k=K,R=[m({type:Array})],G=[m({type:Object})],D=[m({type:Boolean})],F=[m({type:String})],k){constructor(){super(...arguments),f(this,S,n(i,8,this,[])),n(i,11,this),f(this,$,n(i,12,this,null)),n(i,15,this),f(this,O,n(i,16,this,!1)),n(i,19,this),f(this,z,n(i,20,this,"")),n(i,23,this)}_onRemove(t){const{type:r,itemId:o}=t.detail,a=this.items.filter(s=>!(s.type===r&&s.id===o));this.dispatchEvent(new CustomEvent("dp-chips-change",{detail:{items:a},bubbles:!0,composed:!0}))}render(){return x`
      ${this.label?x`<div class="label">${this.label}</div>`:""}
      <div class="chips">
        ${this.items.map(t=>x`
            <entity-chip
              .type=${t.type}
              .itemId=${t.id}
              .hass=${this.hass}
              .removable=${this.removable}
              @dp-chip-remove=${this._onRemove}
            ></entity-chip>
          `)}
      </div>
    `}}i=V(k);S=new WeakMap;$=new WeakMap;O=new WeakMap;z=new WeakMap;y(i,4,"items",R,_,S);y(i,4,"hass",G,_,$);y(i,4,"removable",D,_,O);y(i,4,"label",F,_,z);Y(i,_);Z(_,"styles",L);customElements.define("chip-group",_);
