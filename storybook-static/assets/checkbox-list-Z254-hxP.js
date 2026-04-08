import{i as W,b as y,g as G}from"./iframe-maWesKjk.js";import{n as L}from"./property-DyW-YDBW.js";const N=W`
  :host {
    display: block;
  }
  .checkbox-group {
    display: grid;
    gap: var(--dp-spacing-xs, 4px);
  }
  .checkbox-option {
    display: flex;
    align-items: center;
    gap: var(--dp-spacing-xs, 4px);
    font-size: 0.9rem;
    color: var(--primary-text-color);
    cursor: pointer;
  }
  .checkbox-option input[type="checkbox"] {
    cursor: pointer;
  }
`;var T=Object.create,C=Object.defineProperty,j=Object.getOwnPropertyDescriptor,S=(e,t)=>(t=Symbol[e])?t:Symbol.for("Symbol."+e),h=e=>{throw TypeError(e)},z=(e,t,r)=>t in e?C(e,t,{enumerable:!0,configurable:!0,writable:!0,value:r}):e[t]=r,q=e=>[,,,T(e?.[S("metadata")]??null)],E=["class","method","getter","setter","accessor","field","value","get","set"],d=e=>e!==void 0&&typeof e!="function"?h("Function expected"):e,B=(e,t,r,i,a)=>({kind:E[e],name:t,metadata:i,addInitializer:c=>r._?h("Already initialized"):a.push(d(c||null))}),H=(e,t)=>z(t,S("metadata"),e[3]),w=(e,t,r,i)=>{for(var a=0,c=e[t>>1],o=c&&c.length;a<o;a++)t&1?c[a].call(r):i=c[a].call(r,i);return i},J=(e,t,r,i,a,c)=>{for(var o,s,k,l,u,m=t&7,P=!1,A=!1,g=e.length+1,F=E[m+5],I=e[g-1]=[],D=e[g]||(e[g]=[]),n=(a=a.prototype,j({get[r](){return Q(this,c)},set[r](p){return U(this,c,p)}},r)),x=i.length-1;x>=0;x--)l=B(m,r,k={},e[3],D),l.static=P,l.private=A,u=l.access={has:p=>r in p},u.get=p=>p[r],u.set=(p,M)=>p[r]=M,s=(0,i[x])({get:n.get,set:n.set},l),k._=1,s===void 0?d(s)&&(n[F]=s):typeof s!="object"||s===null?h("Object expected"):(d(o=s.get)&&(n.get=o),d(o=s.set)&&(n.set=o),d(o=s.init)&&I.unshift(o));return n&&C(a,r,n),a},K=(e,t,r)=>z(e,t+"",r),O=(e,t,r)=>t.has(e)||h("Cannot "+r),Q=(e,t,r)=>(O(e,t,"read from private field"),t.get(e)),R=(e,t,r)=>t.has(e)?h("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(e):t.set(e,r),U=(e,t,r,i)=>(O(e,t,"write to private field"),t.set(e,r),r),$,b,_,f;class v extends(b=G,$=[L({type:Array})],b){constructor(){super(...arguments),R(this,f,w(_,8,this,[])),w(_,11,this)}_onChange(t){const r=t.target;this.dispatchEvent(new CustomEvent("dp-item-change",{detail:{name:r.name,checked:r.checked},bubbles:!0,composed:!0}))}render(){return y`
      <div class="checkbox-group">
        ${this.items.map(t=>y`
            <label class="checkbox-option">
              <input
                type="checkbox"
                name=${t.name}
                .checked=${t.checked}
                @change=${this._onChange}
              />
              ${t.label}
            </label>
          `)}
      </div>
    `}}_=q(b);f=new WeakMap;J(_,4,"items",$,v,f);H(_,v);K(v,"styles",N);customElements.define("checkbox-list",v);
