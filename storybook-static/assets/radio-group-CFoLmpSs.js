import{i as B,b as E,g as H}from"./iframe-maWesKjk.js";import{n as m}from"./property-DyW-YDBW.js";const J=B`
  :host {
    display: block;
  }
  fieldset {
    border: none;
    margin: 0;
    padding: 0;
  }
  .radio-group {
    display: grid;
    gap: var(--dp-spacing-xs, 4px);
  }
  .radio-option {
    display: flex;
    align-items: center;
    gap: var(--dp-spacing-xs, 4px);
    font-size: 0.9rem;
    color: var(--primary-text-color);
    cursor: pointer;
  }
  .radio-option input[type="radio"] {
    cursor: pointer;
  }
`;var K=Object.create,O=Object.defineProperty,L=Object.getOwnPropertyDescriptor,P=(e,t)=>(t=Symbol[e])?t:Symbol.for("Symbol."+e),h=e=>{throw TypeError(e)},M=(e,t,r)=>t in e?O(e,t,{enumerable:!0,configurable:!0,writable:!0,value:r}):e[t]=r,Q=e=>[,,,K(e?.[P("metadata")]??null)],W=["class","method","getter","setter","accessor","field","value","get","set"],u=e=>e!==void 0&&typeof e!="function"?h("Function expected"):e,U=(e,t,r,o,a)=>({kind:W[e],name:t,metadata:o,addInitializer:s=>r._?h("Already initialized"):a.push(u(s||null))}),V=(e,t)=>M(t,P("metadata"),e[3]),c=(e,t,r,o)=>{for(var a=0,s=e[t>>1],d=s&&s.length;a<d;a++)t&1?s[a].call(r):o=s[a].call(r,o);return o},w=(e,t,r,o,a,s)=>{for(var d,n,$,v,g,z=t&7,G=!1,N=!1,f=e.length+1,R=W[z+5],T=e[f-1]=[],j=e[f]||(e[f]=[]),p=(a=a.prototype,L({get[r](){return Y(this,s)},set[r](l){return Z(this,s,l)}},r)),y=o.length-1;y>=0;y--)v=U(z,r,$={},e[3],j),v.static=G,v.private=N,g=v.access={has:l=>r in l},g.get=l=>l[r],g.set=(l,q)=>l[r]=q,n=(0,o[y])({get:p.get,set:p.set},v),$._=1,n===void 0?u(n)&&(p[R]=n):typeof n!="object"||n===null?h("Object expected"):(u(d=n.get)&&(p.get=d),u(d=n.set)&&(p.set=d),u(d=n.init)&&T.unshift(d));return p&&O(a,r,p),a},X=(e,t,r)=>M(e,t+"",r),A=(e,t,r)=>t.has(e)||h("Cannot "+r),Y=(e,t,r)=>(A(e,t,"read from private field"),t.get(e)),x=(e,t,r)=>t.has(e)?h("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(e):t.set(e,r),Z=(e,t,r,o)=>(A(e,t,"write to private field"),t.set(e,r),r),F,I,D,b,i,S,k,C;class _ extends(b=H,D=[m({type:String})],I=[m({type:String})],F=[m({type:Array})],b){constructor(){super(...arguments),x(this,S,c(i,8,this,"")),c(i,11,this),x(this,k,c(i,12,this,"")),c(i,15,this),x(this,C,c(i,16,this,[])),c(i,19,this)}_onChange(t){const r=t.target;this.dispatchEvent(new CustomEvent("dp-radio-change",{detail:{value:r.value},bubbles:!0,composed:!0}))}render(){return E`
      <fieldset role="radiogroup">
        <div class="radio-group">
          ${this.options.map(t=>E`
              <label class="radio-option">
                <input
                  type="radio"
                  name=${this.name}
                  .value=${t.value}
                  .checked=${this.value===t.value}
                  @change=${this._onChange}
                />
                ${t.label}
              </label>
            `)}
        </div>
      </fieldset>
    `}}i=Q(b);S=new WeakMap;k=new WeakMap;C=new WeakMap;w(i,4,"name",D,_,S);w(i,4,"value",I,_,k);w(i,4,"options",F,_,C);V(i,_);X(_,"styles",J);customElements.define("radio-group",_);
