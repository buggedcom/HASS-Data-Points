import{i as U,A as V,b as h,g as X}from"./iframe-maWesKjk.js";import{n as v}from"./property-DyW-YDBW.js";import"./preload-helper-PPVm8Dsz.js";const Y=U`
  :host {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  input {
    font: inherit;
    font-size: 0.85rem;
    padding: 2px 6px;
    border-radius: 6px;
    border: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
    background: var(--card-background-color, #fff);
    color: var(--primary-text-color);
    width: 5em;
  }
  .suffix {
    font-size: 0.85rem;
    color: var(--secondary-text-color, #666);
  }
`;var Z=Object.create,A=Object.defineProperty,ee=Object.getOwnPropertyDescriptor,D=(e,t)=>(t=Symbol[e])?t:Symbol.for("Symbol."+e),f=e=>{throw TypeError(e)},F=(e,t,r)=>t in e?A(e,t,{enumerable:!0,configurable:!0,writable:!0,value:r}):e[t]=r,te=e=>[,,,Z(e?.[D("metadata")]??null)],N=["class","method","getter","setter","accessor","field","value","get","set"],_=e=>e!==void 0&&typeof e!="function"?f("Function expected"):e,re=(e,t,r,s,a)=>({kind:N[e],name:t,metadata:s,addInitializer:i=>r._?f("Already initialized"):a.push(_(i||null))}),ne=(e,t)=>F(t,D("metadata"),e[3]),p=(e,t,r,s)=>{for(var a=0,i=e[t>>1],u=i&&i.length;a<u;a++)t&1?i[a].call(r):s=i[a].call(r,s);return s},y=(e,t,r,s,a,i)=>{for(var u,o,M,m,w,P=t&7,H=!1,J=!1,E=e.length+1,K=N[P+5],L=e[E-1]=[],Q=e[E]||(e[E]=[]),c=(a=a.prototype,ee({get[r](){return se(this,i)},set[r](l){return ie(this,i,l)}},r)),k=s.length-1;k>=0;k--)m=re(P,r,M={},e[3],Q),m.static=H,m.private=J,w=m.access={has:l=>r in l},w.get=l=>l[r],w.set=(l,R)=>l[r]=R,o=(0,s[k])({get:c.get,set:c.set},m),M._=1,o===void 0?_(o)&&(c[K]=o):typeof o!="object"||o===null?f("Object expected"):(_(u=o.get)&&(c.get=u),_(u=o.set)&&(c.set=u),_(u=o.init)&&L.unshift(u));return c&&A(a,r,c),a},ae=(e,t,r)=>F(e,t+"",r),T=(e,t,r)=>t.has(e)||f("Cannot "+r),se=(e,t,r)=>(T(e,t,"read from private field"),t.get(e)),b=(e,t,r)=>t.has(e)?f("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(e):t.set(e,r),ie=(e,t,r,s)=>(T(e,t,"write to private field"),t.set(e,r),r),G,j,q,B,W,n,I,z,O,C;class d extends(W=X,B=[v({type:String})],q=[v({type:String})],j=[v({type:String})],G=[v({type:String})],W){constructor(){super(...arguments),b(this,I,p(n,8,this,"")),p(n,11,this),b(this,z,p(n,12,this,"")),p(n,15,this),b(this,O,p(n,16,this,"")),p(n,19,this),b(this,C,p(n,20,this,"any")),p(n,23,this)}_onInput(t){const r=t.target;this.dispatchEvent(new CustomEvent("dp-number-change",{detail:{value:r.value},bubbles:!0,composed:!0}))}render(){return h`
      <input
        type="number"
        .value=${this.value}
        placeholder=${this.placeholder}
        step=${this.step}
        @input=${this._onInput}
      />
      ${this.suffix?h`<span class="suffix">${this.suffix}</span>`:V}
    `}}n=te(W);I=new WeakMap;z=new WeakMap;O=new WeakMap;C=new WeakMap;y(n,4,"value",B,d,I);y(n,4,"placeholder",q,d,z);y(n,4,"suffix",j,d,O);y(n,4,"step",G,d,C);ne(n,d);ae(d,"styles",Y);customElements.define("number-input",d);const ce={title:"Atoms/Form/Number Input",component:"number-input"},g={render:()=>h`
    <number-input .value=${"10"} .placeholder=${"Enter value"}></number-input>
  `},x={render:()=>h`
    <number-input .value=${"75"} .suffix=${"%"}></number-input>
  `},$={render:()=>h`
    <number-input
      .value=${"1.5"}
      .step=${"0.1"}
      .suffix=${"units"}
    ></number-input>
  `},S={render:()=>h`
    <number-input .placeholder=${"Threshold..."}></number-input>
  `};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:'{\n  render: () => html`\n    <number-input .value=${"10"} .placeholder=${"Enter value"}></number-input>\n  `\n}',...g.parameters?.docs?.source}}};x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:'{\n  render: () => html`\n    <number-input .value=${"75"} .suffix=${"%"}></number-input>\n  `\n}',...x.parameters?.docs?.source}}};$.parameters={...$.parameters,docs:{...$.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <number-input
      .value=\${"1.5"}
      .step=\${"0.1"}
      .suffix=\${"units"}
    ></number-input>
  \`
}`,...$.parameters?.docs?.source}}};S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <number-input .placeholder=\${"Threshold..."}></number-input>
  \`
}`,...S.parameters?.docs?.source}}};const le=["Default","WithSuffix","WithStep","Empty"];export{g as Default,S as Empty,$ as WithStep,x as WithSuffix,le as __namedExportsOrder,ce as default};
