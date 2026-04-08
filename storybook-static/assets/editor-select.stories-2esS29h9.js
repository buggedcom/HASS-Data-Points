import{i as J,b,g as K}from"./iframe-maWesKjk.js";import{n as $}from"./property-DyW-YDBW.js";import"./preload-helper-PPVm8Dsz.js";const L=J`
  :host {
    display: block;
  }
  ha-selector {
    display: block;
    width: 100%;
  }
`;var Q=Object.create,W=Object.defineProperty,X=Object.getOwnPropertyDescriptor,z=(e,t)=>(t=Symbol[e])?t:Symbol.for("Symbol."+e),v=e=>{throw TypeError(e)},R=(e,t,r)=>t in e?W(e,t,{enumerable:!0,configurable:!0,writable:!0,value:r}):e[t]=r,Y=e=>[,,,Q(e?.[z("metadata")]??null)],A=["class","method","getter","setter","accessor","field","value","get","set"],_=e=>e!==void 0&&typeof e!="function"?v("Function expected"):e,Z=(e,t,r,o,a)=>({kind:A[e],name:t,metadata:o,addInitializer:l=>r._?v("Already initialized"):a.push(_(l||null))}),ee=(e,t)=>R(t,z("metadata"),e[3]),p=(e,t,r,o)=>{for(var a=0,l=e[t>>1],n=l&&l.length;a<n;a++)t&1?l[a].call(r):o=l[a].call(r,o);return o},w=(e,t,r,o,a,l)=>{for(var n,i,x,h,y,D=t&7,q=!1,G=!1,S=e.length+1,U=A[D+5],j=e[S-1]=[],B=e[S]||(e[S]=[]),c=(a=a.prototype,X({get[r](){return re(this,l)},set[r](d){return ae(this,l,d)}},r)),O=o.length-1;O>=0;O--)h=Z(D,r,x={},e[3],B),h.static=q,h.private=G,y=h.access={has:d=>r in d},y.get=d=>d[r],y.set=(d,H)=>d[r]=H,i=(0,o[O])({get:c.get,set:c.set},h),x._=1,i===void 0?_(i)&&(c[U]=i):typeof i!="object"||i===null?v("Object expected"):(_(n=i.get)&&(c.get=n),_(n=i.set)&&(c.set=n),_(n=i.init)&&j.unshift(n));return c&&W(a,r,c),a},te=(e,t,r)=>R(e,t+"",r),F=(e,t,r)=>t.has(e)||v("Cannot "+r),re=(e,t,r)=>(F(e,t,"read from private field"),t.get(e)),E=(e,t,r)=>t.has(e)?v("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(e):t.set(e,r),ae=(e,t,r,o)=>(F(e,t,"write to private field"),t.set(e,r),r),M,N,T,P,s,k,C,I;class u extends(P=K,T=[$({type:String})],N=[$({type:String})],M=[$({type:Array})],P){constructor(){super(...arguments),E(this,k,p(s,8,this,"")),p(s,11,this),E(this,C,p(s,12,this,"")),p(s,15,this),E(this,I,p(s,16,this,[])),p(s,19,this)}firstUpdated(){const t=this.shadowRoot.querySelector("ha-selector");t&&(t.label=this.label,t.selector={select:{options:this.options}},t.value=this.value)}updated(t){const r=this.shadowRoot.querySelector("ha-selector");r&&(t.has("value")&&(r.value=this.value),t.has("options")&&(r.selector={select:{options:this.options}}))}_onValueChanged(t){this.dispatchEvent(new CustomEvent("dp-select-change",{detail:{value:t.detail.value},bubbles:!0,composed:!0}))}render(){return b`<ha-selector
      @value-changed=${this._onValueChanged}
    ></ha-selector>`}}s=Y(P);k=new WeakMap;C=new WeakMap;I=new WeakMap;w(s,4,"label",T,u,k);w(s,4,"value",N,u,C);w(s,4,"options",M,u,I);ee(s,u);te(u,"styles",L);customElements.define("editor-select",u);const ie={title:"Atoms/Form/Editor Select",component:"editor-select",parameters:{actions:{handles:["dp-select-change"]}}},V=[{value:"5m",label:"5 minutes"},{value:"1h",label:"1 hour"},{value:"24h",label:"24 hours"},{value:"7d",label:"7 days"}],m={render:()=>b`
    <editor-select
      .label=${"Period"}
      .options=${V}
    ></editor-select>
  `},g={render:()=>b`
    <editor-select
      .label=${"Period"}
      .value=${"1h"}
      .options=${V}
    ></editor-select>
  `},f={render:()=>b`
    <editor-select .label=${"Category"} .options=${[]}></editor-select>
  `};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <editor-select
      .label=\${"Period"}
      .options=\${PERIOD_OPTIONS}
    ></editor-select>
  \`
}`,...m.parameters?.docs?.source}}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <editor-select
      .label=\${"Period"}
      .value=\${"1h"}
      .options=\${PERIOD_OPTIONS}
    ></editor-select>
  \`
}`,...g.parameters?.docs?.source}}};f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:'{\n  render: () => html`\n    <editor-select .label=${"Category"} .options=${[]}></editor-select>\n  `\n}',...f.parameters?.docs?.source}}};const ne=["Default","WithValue","Empty"];export{m as Default,f as Empty,g as WithValue,ne as __namedExportsOrder,ie as default};
