import{i as q,b as m,g as B}from"./iframe-maWesKjk.js";import{n as C}from"./property-DyW-YDBW.js";const H=q`
  :host {
    display: block;
  }
  .swatch-wrap {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .label {
    font-size: 0.875rem;
    color: var(--primary-text-color);
  }
  .swatch-btn {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    border: 2px solid var(--divider-color, #ccc);
    cursor: pointer;
    padding: 0;
    overflow: hidden;
    position: relative;
    flex-shrink: 0;
    background: transparent;
  }
  .swatch-btn input[type="color"] {
    position: absolute;
    top: -4px;
    left: -4px;
    width: calc(100% + 8px);
    height: calc(100% + 8px);
    border: none;
    cursor: pointer;
    padding: 0;
    background: none;
    opacity: 0;
  }
  .swatch-inner {
    display: block;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    pointer-events: none;
  }
`;var J=Object.create,E=Object.defineProperty,K=Object.getOwnPropertyDescriptor,O=(t,e)=>(e=Symbol[t])?e:Symbol.for("Symbol."+t),_=t=>{throw TypeError(t)},$=(t,e,r)=>e in t?E(t,e,{enumerable:!0,configurable:!0,writable:!0,value:r}):t[e]=r,L=t=>[,,,J(t?.[O("metadata")]??null)],I=["class","method","getter","setter","accessor","field","value","get","set"],h=t=>t!==void 0&&typeof t!="function"?_("Function expected"):t,Q=(t,e,r,o,a)=>({kind:I[t],name:e,metadata:o,addInitializer:i=>r._?_("Already initialized"):a.push(h(i||null))}),R=(t,e)=>$(e,O("metadata"),t[3]),u=(t,e,r,o)=>{for(var a=0,i=t[e>>1],n=i&&i.length;a<n;a++)e&1?i[a].call(r):o=i[a].call(r,o);return o},P=(t,e,r,o,a,i)=>{for(var n,s,k,d,b,S=e&7,A=!1,D=!1,g=t.length+1,G=I[S+5],N=t[g-1]=[],T=t[g]||(t[g]=[]),l=(a=a.prototype,K({get[r](){return V(this,i)},set[r](p){return X(this,i,p)}},r)),w=o.length-1;w>=0;w--)d=Q(S,r,k={},t[3],T),d.static=A,d.private=D,b=d.access={has:p=>r in p},b.get=p=>p[r],b.set=(p,j)=>p[r]=j,s=(0,o[w])({get:l.get,set:l.set},d),k._=1,s===void 0?h(s)&&(l[G]=s):typeof s!="object"||s===null?_("Object expected"):(h(n=s.get)&&(l.get=n),h(n=s.set)&&(l.set=n),h(n=s.init)&&N.unshift(n));return l&&E(a,r,l),a},U=(t,e,r)=>$(t,e+"",r),F=(t,e,r)=>e.has(t)||_("Cannot "+r),V=(t,e,r)=>(F(t,e,"read from private field"),e.get(t)),z=(t,e,r)=>e.has(t)?_("Cannot add the same private member more than once"):e instanceof WeakSet?e.add(t):e.set(t,r),X=(t,e,r,o)=>(F(t,e,"write to private field"),e.set(t,r),r),M,W,f,c,y,x;class v extends(f=B,W=[C({type:String})],M=[C({type:String})],f){constructor(){super(...arguments),z(this,y,u(c,8,this,"#ff9800")),u(c,11,this),z(this,x,u(c,12,this,"")),u(c,15,this)}_onInput(e){const r=e.target.value;this.dispatchEvent(new CustomEvent("dp-color-change",{detail:{color:r},bubbles:!0,composed:!0}))}render(){return m`
      <div class="swatch-wrap">
        ${this.label?m`<span class="label">${this.label}</span>`:""}
        <button class="swatch-btn" type="button">
          <input type="color" .value=${this.color} @input=${this._onInput} />
          <span
            class="swatch-inner"
            style="background-color: ${this.color}"
          ></span>
        </button>
      </div>
    `}}c=L(f);y=new WeakMap;x=new WeakMap;P(c,4,"color",W,v,y);P(c,4,"label",M,v,x);R(c,v);U(v,"styles",H);customElements.define("color-swatch",v);
