import{i as j,b as B,g as H}from"./iframe-maWesKjk.js";import{n as x}from"./property-DyW-YDBW.js";const J=j`
  :host {
    display: block;
  }

  .annotation-row {
    display: grid;
    gap: 6px;
  }

  .annotation-label {
    font-size: 0.82rem;
    font-weight: 500;
    color: var(--secondary-text-color);
  }

  textarea {
    width: 100%;
    min-height: 92px;
    resize: vertical;
    box-sizing: border-box;
    padding: 10px 12px;
    border: 1px solid
      var(--input-outlined-idle-border-color, var(--divider-color, #9e9e9e));
    border-radius: 12px;
    background: var(
      --card-background-color,
      var(--primary-background-color, #fff)
    );
    color: var(--primary-text-color);
    font: inherit;
    line-height: 1.45;
  }
`;var K=Object.create,O=Object.defineProperty,L=Object.getOwnPropertyDescriptor,I=(e,t)=>(t=Symbol[e])?t:Symbol.for("Symbol."+e),u=e=>{throw TypeError(e)},P=(e,t,r)=>t in e?O(e,t,{enumerable:!0,configurable:!0,writable:!0,value:r}):e[t]=r,R=e=>[,,,K(e?.[I("metadata")]??null)],$=["class","method","getter","setter","accessor","field","value","get","set"],h=e=>e!==void 0&&typeof e!="function"?u("Function expected"):e,U=(e,t,r,o,a)=>({kind:$[e],name:t,metadata:o,addInitializer:n=>r._?u("Already initialized"):a.push(h(n||null))}),V=(e,t)=>P(t,I("metadata"),e[3]),p=(e,t,r,o)=>{for(var a=0,n=e[t>>1],s=n&&n.length;a<s;a++)t&1?n[a].call(r):o=n[a].call(r,o);return o},k=(e,t,r,o,a,n)=>{for(var s,l,C,_,g,E=t&7,F=!1,T=!1,b=e.length+1,q=$[E+5],G=e[b-1]=[],N=e[b]||(e[b]=[]),d=(a=a.prototype,L({get[r](){return Y(this,n)},set[r](c){return Z(this,n,c)}},r)),f=o.length-1;f>=0;f--)_=U(E,r,C={},e[3],N),_.static=F,_.private=T,g=_.access={has:c=>r in c},g.get=c=>c[r],g.set=(c,Q)=>c[r]=Q,l=(0,o[f])({get:d.get,set:d.set},_),C._=1,l===void 0?h(l)&&(d[q]=l):typeof l!="object"||l===null?u("Object expected"):(h(s=l.get)&&(d.get=s),h(s=l.set)&&(d.set=s),h(s=l.init)&&G.unshift(s));return d&&O(a,r,d),a},X=(e,t,r)=>P(e,t+"",r),A=(e,t,r)=>t.has(e)||u("Cannot "+r),Y=(e,t,r)=>(A(e,t,"read from private field"),t.get(e)),y=(e,t,r)=>t.has(e)?u("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(e):t.set(e,r),Z=(e,t,r,o)=>(A(e,t,"write to private field"),t.set(e,r),r),M,W,D,w,i,S,m,z;class v extends(w=H,D=[x({type:String})],W=[x({type:String})],M=[x({type:String})],w){constructor(){super(...arguments),y(this,S,p(i,8,this,"Annotation")),p(i,11,this),y(this,m,p(i,12,this,"Detailed note shown on chart hover…")),p(i,15,this),y(this,z,p(i,16,this,"")),p(i,19,this)}_onInput(t){this.value=t.currentTarget.value,this.dispatchEvent(new CustomEvent("dp-annotation-input",{detail:{value:this.value},bubbles:!0,composed:!0}))}render(){return B`
      <div class="annotation-row">
        <label class="annotation-label" for="ann">${this.label}</label>
        <textarea
          id="ann"
          .value=${this.value}
          placeholder=${this.placeholder}
          @input=${this._onInput}
        ></textarea>
      </div>
    `}}i=R(w);S=new WeakMap;m=new WeakMap;z=new WeakMap;k(i,4,"label",D,v,S);k(i,4,"placeholder",W,v,m);k(i,4,"value",M,v,z);V(i,v);X(v,"styles",J);customElements.define("quick-annotation",v);
