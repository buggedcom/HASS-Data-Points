import{i as N,b as T,g as j}from"./iframe-maWesKjk.js";import{n as k}from"./property-DyW-YDBW.js";const H=N`
  :host {
    display: block;
  }
  charts/statistics/card-statistics {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 12px;
  }
  input {
    flex: 1;
    width: 100%;
    box-sizing: border-box;
    background: transparent;
    border: 1px solid var(--divider-color, #444);
    border-radius: 6px;
    padding: 6px 10px;
    font-size: 0.85rem;
    color: var(--primary-text-color);
    outline: none;
    font-family: inherit;
  }
  input:focus {
    border-color: var(--primary-color, #03a9f4);
  }
  input::placeholder {
    color: var(--secondary-text-color);
    opacity: 0.6;
  }
`;var J=Object.create,E=Object.defineProperty,K=Object.getOwnPropertyDescriptor,O=(e,t)=>(t=Symbol[e])?t:Symbol.for("Symbol."+e),u=e=>{throw TypeError(e)},q=(e,t,r)=>t in e?E(e,t,{enumerable:!0,configurable:!0,writable:!0,value:r}):e[t]=r,L=e=>[,,,J(e?.[O("metadata")]??null)],C=["class","method","getter","setter","accessor","field","value","get","set"],_=e=>e!==void 0&&typeof e!="function"?u("Function expected"):e,Q=(e,t,r,i,a)=>({kind:C[e],name:t,metadata:i,addInitializer:o=>r._?u("Already initialized"):a.push(_(o||null))}),R=(e,t)=>q(t,O("metadata"),e[3]),h=(e,t,r,i)=>{for(var a=0,o=e[t>>1],c=o&&o.length;a<c;a++)t&1?o[a].call(r):i=o[a].call(r,i);return i},I=(e,t,r,i,a,o)=>{for(var c,s,w,p,f,m=t&7,M=!1,W=!1,g=e.length+1,A=C[m+5],D=e[g-1]=[],B=e[g]||(e[g]=[]),l=(a=a.prototype,K({get[r](){return V(this,o)},set[r](d){return X(this,o,d)}},r)),y=i.length-1;y>=0;y--)p=Q(m,r,w={},e[3],B),p.static=M,p.private=W,f=p.access={has:d=>r in d},f.get=d=>d[r],f.set=(d,G)=>d[r]=G,s=(0,i[y])({get:l.get,set:l.set},p),w._=1,s===void 0?_(s)&&(l[A]=s):typeof s!="object"||s===null?u("Object expected"):(_(c=s.get)&&(l.get=c),_(c=s.set)&&(l.set=c),_(c=s.init)&&D.unshift(c));return l&&E(a,r,l),a},U=(e,t,r)=>q(e,t+"",r),P=(e,t,r)=>t.has(e)||u("Cannot "+r),V=(e,t,r)=>(P(e,t,"read from private field"),t.get(e)),z=(e,t,r)=>t.has(e)?u("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(e):t.set(e,r),X=(e,t,r,i)=>(P(e,t,"write to private field"),t.set(e,r),r),$,F,x,n,b,S;class v extends(x=j,F=[k({type:String})],$=[k({type:String})],x){constructor(){super(...arguments),z(this,b,h(n,8,this,"")),h(n,11,this),z(this,S,h(n,12,this,"Search...")),h(n,15,this)}_onInput(t){this.dispatchEvent(new CustomEvent("dp-search",{detail:{query:t.target.value},bubbles:!0,composed:!0}))}render(){return T`
      <div class="search-wrap">
        <input
          type="text"
          .value=${this.query}
          placeholder=${this.placeholder}
          @input=${this._onInput}
        />
      </div>
    `}}n=L(x);b=new WeakMap;S=new WeakMap;I(n,4,"query",F,v,b);I(n,4,"placeholder",$,v,S);R(n,v);U(v,"styles",H);customElements.define("search-bar",v);
