import{i as Y,b as h,g as Z}from"./iframe-maWesKjk.js";import{n as _}from"./property-DyW-YDBW.js";import"./preload-helper-PPVm8Dsz.js";const ee=Y`
  :host {
    display: block;
  }
  ha-textfield {
    display: block;
    width: 100%;
  }
`;var te=Object.create,z=Object.defineProperty,re=Object.getOwnPropertyDescriptor,I=(t,e)=>(e=Symbol[t])?e:Symbol.for("Symbol."+t),m=t=>{throw TypeError(t)},A=(t,e,r)=>e in t?z(t,e,{enumerable:!0,configurable:!0,writable:!0,value:r}):t[e]=r,ie=t=>[,,,te(t?.[I("metadata")]??null)],V=["class","method","getter","setter","accessor","field","value","get","set"],x=t=>t!==void 0&&typeof t!="function"?m("Function expected"):t,ae=(t,e,r,a,l)=>({kind:V[t],name:e,metadata:a,addInitializer:o=>r._?m("Already initialized"):l.push(x(o||null))}),le=(t,e)=>A(e,I("metadata"),t[3]),s=(t,e,r,a)=>{for(var l=0,o=t[e>>1],n=o&&o.length;l<n;l++)e&1?o[l].call(r):a=o[l].call(r,a);return a},b=(t,e,r,a,l,o)=>{for(var n,d,N,f,T,P=e&7,B=!1,J=!1,W=t.length+1,K=V[P+5],L=t[W-1]=[],Q=t[W]||(t[W]=[]),p=(l=l.prototype,re({get[r](){return oe(this,o)},set[r](u){return de(this,o,u)}},r)),k=a.length-1;k>=0;k--)f=ae(P,r,N={},t[3],Q),f.static=B,f.private=J,T=f.access={has:u=>r in u},T.get=u=>u[r],T.set=(u,X)=>u[r]=X,d=(0,a[k])({get:p.get,set:p.set},f),N._=1,d===void 0?x(d)&&(p[K]=d):typeof d!="object"||d===null?m("Object expected"):(x(n=d.get)&&(p.get=n),x(n=d.set)&&(p.set=n),x(n=d.init)&&L.unshift(n));return p&&z(l,r,p),l},se=(t,e,r)=>A(t,e+"",r),q=(t,e,r)=>e.has(t)||m("Cannot "+r),oe=(t,e,r)=>(q(t,e,"read from private field"),e.get(t)),v=(t,e,r)=>e.has(t)?m("Cannot add the same private member more than once"):e instanceof WeakSet?e.add(t):e.set(t,r),de=(t,e,r,a)=>(q(t,e,"write to private field"),e.set(t,r),r),H,R,G,U,j,E,i,F,M,C,O,D;class c extends(E=Z,j=[_({type:String})],U=[_({type:String})],G=[_({type:String})],R=[_({type:String})],H=[_({type:String})],E){constructor(){super(...arguments),v(this,F,s(i,8,this,"")),s(i,11,this),v(this,M,s(i,12,this,"")),s(i,15,this),v(this,C,s(i,16,this,"text")),s(i,19,this),v(this,O,s(i,20,this,"")),s(i,23,this),v(this,D,s(i,24,this,"")),s(i,27,this)}firstUpdated(){const e=this.shadowRoot.querySelector("ha-textfield");e&&(e.label=this.label,e.value=this.value,this.type&&(e.type=this.type),this.placeholder&&(e.placeholder=this.placeholder),this.suffix&&(e.suffix=this.suffix))}updated(e){const r=this.shadowRoot.querySelector("ha-textfield");r&&(e.has("value")&&(r.value=this.value),e.has("label")&&(r.label=this.label))}_onInput(e){const r=e.target.value,a=this.type==="number"?parseFloat(r):r;this.dispatchEvent(new CustomEvent("dp-field-change",{detail:{value:this.type==="number"&&Number.isNaN(a)?void 0:a},bubbles:!0,composed:!0}))}render(){return h`<ha-textfield @input=${this._onInput}></ha-textfield>`}}i=ie(E);F=new WeakMap;M=new WeakMap;C=new WeakMap;O=new WeakMap;D=new WeakMap;b(i,4,"label",j,c,F);b(i,4,"value",U,c,M);b(i,4,"type",G,c,C);b(i,4,"placeholder",R,c,O);b(i,4,"suffix",H,c,D);le(i,c);se(c,"styles",ee);customElements.define("editor-text-field",c);const ue={title:"Atoms/Form/Editor Text Field",component:"editor-text-field",parameters:{actions:{handles:["dp-field-change"]}}},y={render:()=>h`
    <editor-text-field .label=${"Title"}></editor-text-field>
  `},g={render:()=>h`
    <editor-text-field
      .label=${"Title"}
      .value=${"My data points card"}
    ></editor-text-field>
  `},$={render:()=>h`
    <editor-text-field
      .label=${"Description"}
      .placeholder=${"Enter a description…"}
    ></editor-text-field>
  `},S={render:()=>h`
    <editor-text-field
      .label=${"Threshold"}
      .value=${"25"}
      .suffix=${"°C"}
    ></editor-text-field>
  `},w={render:()=>h`
    <editor-text-field
      .label=${"Hours"}
      .type=${"number"}
      .value=${"24"}
    ></editor-text-field>
  `};y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <editor-text-field .label=\${"Title"}></editor-text-field>
  \`
}`,...y.parameters?.docs?.source}}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <editor-text-field
      .label=\${"Title"}
      .value=\${"My data points card"}
    ></editor-text-field>
  \`
}`,...g.parameters?.docs?.source}}};$.parameters={...$.parameters,docs:{...$.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <editor-text-field
      .label=\${"Description"}
      .placeholder=\${"Enter a description…"}
    ></editor-text-field>
  \`
}`,...$.parameters?.docs?.source}}};S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <editor-text-field
      .label=\${"Threshold"}
      .value=\${"25"}
      .suffix=\${"°C"}
    ></editor-text-field>
  \`
}`,...S.parameters?.docs?.source}}};w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <editor-text-field
      .label=\${"Hours"}
      .type=\${"number"}
      .value=\${"24"}
    ></editor-text-field>
  \`
}`,...w.parameters?.docs?.source}}};const he=["Default","WithValue","WithPlaceholder","WithSuffix","NumberType"];export{y as Default,w as NumberType,$ as WithPlaceholder,S as WithSuffix,g as WithValue,he as __namedExportsOrder,ue as default};
