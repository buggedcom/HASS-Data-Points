import{i as B,b as g,g as H}from"./iframe-maWesKjk.js";import{n as S}from"./property-DyW-YDBW.js";import"./preload-helper-PPVm8Dsz.js";const J=B`
  :host {
    display: block;
  }
  ha-selector {
    display: block;
    width: 100%;
  }
`;var K=Object.create,D=Object.defineProperty,Q=Object.getOwnPropertyDescriptor,F=(e,t)=>(t=Symbol[e])?t:Symbol.for("Symbol."+e),v=e=>{throw TypeError(e)},M=(e,t,r)=>t in e?D(e,t,{enumerable:!0,configurable:!0,writable:!0,value:r}):e[t]=r,X=e=>[,,,K(e?.[F("metadata")]??null)],V=["class","method","getter","setter","accessor","field","value","get","set"],_=e=>e!==void 0&&typeof e!="function"?v("Function expected"):e,Y=(e,t,r,s,a)=>({kind:V[e],name:t,metadata:s,addInitializer:o=>r._?v("Already initialized"):a.push(_(o||null))}),Z=(e,t)=>M(t,F("metadata"),e[3]),p=(e,t,r,s)=>{for(var a=0,o=e[t>>1],l=o&&o.length;a<l;a++)t&1?o[a].call(r):s=o[a].call(r,s);return s},O=(e,t,r,s,a,o)=>{for(var l,n,W,u,k,z=t&7,L=!1,R=!1,b=e.length+1,j=V[z+5],G=e[b-1]=[],T=e[b]||(e[b]=[]),c=(a=a.prototype,Q({get[r](){return te(this,o)},set[r](d){return re(this,o,d)}},r)),E=s.length-1;E>=0;E--)u=Y(z,r,W={},e[3],T),u.static=L,u.private=R,k=u.access={has:d=>r in d},k.get=d=>d[r],k.set=(d,U)=>d[r]=U,n=(0,s[E])({get:c.get,set:c.set},u),W._=1,n===void 0?_(n)&&(c[j]=n):typeof n!="object"||n===null?v("Object expected"):(_(l=n.get)&&(c.get=l),_(l=n.set)&&(c.set=l),_(l=n.init)&&G.unshift(l));return c&&D(a,r,c),a},ee=(e,t,r)=>M(e,t+"",r),A=(e,t,r)=>t.has(e)||v("Cannot "+r),te=(e,t,r)=>(A(e,t,"read from private field"),t.get(e)),w=(e,t,r)=>t.has(e)?v("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(e):t.set(e,r),re=(e,t,r,s)=>(A(e,t,"write to private field"),t.set(e,r),r),I,N,q,x,i,$,C,P;class h extends(x=H,q=[S({type:String})],N=[S({type:String})],I=[S({type:Object})],x){constructor(){super(...arguments),w(this,$,p(i,8,this,"")),p(i,11,this),w(this,C,p(i,12,this,"")),p(i,15,this),w(this,P,p(i,16,this,null)),p(i,19,this)}firstUpdated(){const t=this.shadowRoot.querySelector("ha-selector");t&&(t.label=this.label,t.selector={entity:{}},this.hass&&(t.hass=this.hass),t.value=this.value)}updated(t){const r=this.shadowRoot.querySelector("ha-selector");r&&(t.has("value")&&(r.value=this.value),t.has("hass")&&this.hass&&(r.hass=this.hass))}_onValueChanged(t){this.dispatchEvent(new CustomEvent("dp-entity-change",{detail:{value:t.detail.value},bubbles:!0,composed:!0}))}render(){return g`<ha-selector
      @value-changed=${this._onValueChanged}
    ></ha-selector>`}}i=X(x);$=new WeakMap;C=new WeakMap;P=new WeakMap;O(i,4,"label",q,h,$);O(i,4,"value",N,h,C);O(i,4,"hass",I,h,P);Z(i,h);ee(h,"styles",J);customElements.define("editor-entity-picker",h);const oe={title:"Atoms/Form/Editor Entity Picker",component:"editor-entity-picker",parameters:{actions:{handles:["dp-entity-change"]}}},y={render:()=>g`
    <editor-entity-picker .label=${"Entity"}></editor-entity-picker>
  `},m={render:()=>g`
    <editor-entity-picker
      .label=${"Entity"}
      .value=${"sensor.living_room_temperature"}
    ></editor-entity-picker>
  `},f={render:()=>g` <editor-entity-picker></editor-entity-picker> `};y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <editor-entity-picker .label=\${"Entity"}></editor-entity-picker>
  \`
}`,...y.parameters?.docs?.source}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <editor-entity-picker
      .label=\${"Entity"}
      .value=\${"sensor.living_room_temperature"}
    ></editor-entity-picker>
  \`
}`,...m.parameters?.docs?.source}}};f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:"{\n  render: () => html` <editor-entity-picker></editor-entity-picker> `\n}",...f.parameters?.docs?.source}}};const ne=["Default","WithValue","NoLabel"];export{y as Default,f as NoLabel,m as WithValue,ne as __namedExportsOrder,oe as default};
