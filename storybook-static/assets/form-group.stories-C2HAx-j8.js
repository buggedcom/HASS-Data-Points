import{i as J,A as z,b as d,g as K}from"./iframe-maWesKjk.js";import{n as D}from"./property-DyW-YDBW.js";import"./preload-helper-PPVm8Dsz.js";const Q=J`
  :host {
    display: block;
    min-width: 0;
  }
  .form-group {
    display: grid;
    gap: 6px;
    min-width: 0;
  }
  .form-label {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--primary-text-color);
  }
  .form-help {
    font-size: 0.8rem;
    color: var(--secondary-text-color);
    line-height: 1.45;
  }
`;var R=Object.create,F=Object.defineProperty,U=Object.getOwnPropertyDescriptor,P=(e,t)=>(t=Symbol[e])?t:Symbol.for("Symbol."+e),_=e=>{throw TypeError(e)},C=(e,t,r)=>t in e?F(e,t,{enumerable:!0,configurable:!0,writable:!0,value:r}):e[t]=r,V=e=>[,,,R(e?.[P("metadata")]??null)],G=["class","method","getter","setter","accessor","field","value","get","set"],m=e=>e!==void 0&&typeof e!="function"?_("Function expected"):e,X=(e,t,r,a,o)=>({kind:G[e],name:t,metadata:a,addInitializer:i=>r._?_("Already initialized"):o.push(m(i||null))}),Y=(e,t)=>C(t,P("metadata"),e[3]),f=(e,t,r,a)=>{for(var o=0,i=e[t>>1],n=i&&i.length;o<n;o++)t&1?i[o].call(r):a=i[o].call(r,a);return a},I=(e,t,r,a,o,i)=>{for(var n,s,k,u,x,E=t&7,L=!1,T=!1,b=e.length+1,j=G[E+5],q=e[b-1]=[],B=e[b]||(e[b]=[]),p=(o=o.prototype,U({get[r](){return ee(this,i)},set[r](c){return te(this,i,c)}},r)),S=a.length-1;S>=0;S--)u=X(E,r,k={},e[3],B),u.static=L,u.private=T,x=u.access={has:c=>r in c},x.get=c=>c[r],x.set=(c,H)=>c[r]=H,s=(0,a[S])({get:p.get,set:p.set},u),k._=1,s===void 0?m(s)&&(p[j]=s):typeof s!="object"||s===null?_("Object expected"):(m(n=s.get)&&(p.get=n),m(n=s.set)&&(p.set=n),m(n=s.init)&&q.unshift(n));return p&&F(o,r,p),o},Z=(e,t,r)=>C(e,t+"",r),M=(e,t,r)=>t.has(e)||_("Cannot "+r),ee=(e,t,r)=>(M(e,t,"read from private field"),t.get(e)),A=(e,t,r)=>t.has(e)?_("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(e):t.set(e,r),te=(e,t,r,a)=>(M(e,t,"write to private field"),t.set(e,r),r),N,W,O,l,$,w;class h extends(O=K,W=[D({type:String})],N=[D({type:String})],O){constructor(){super(...arguments),A(this,$,f(l,8,this,"")),f(l,11,this),A(this,w,f(l,12,this,"")),f(l,15,this)}render(){return d`
      <div class="form-group">
        ${this.label?d`<div class="form-label">${this.label}</div>`:z}
        ${this.description?d`<div class="form-help">${this.description}</div>`:z}
        <slot></slot>
      </div>
    `}}l=V(O);$=new WeakMap;w=new WeakMap;I(l,4,"label",W,h,$);I(l,4,"description",N,h,w);Y(l,h);Z(h,"styles",Q);customElements.define("form-group",h);const ie={title:"Atoms/Display/Form Group",component:"form-group",argTypes:{label:{control:"text"},description:{control:"text"}}},g={render:()=>d`
    <form-group
      .label=${"Entity"}
      .description=${"Select the entity to track for this data point"}
    >
      <input type="text" placeholder="sensor.temperature" />
    </form-group>
  `},v={render:()=>d`
    <form-group .label=${"Name"}>
      <input type="text" placeholder="Enter a name" />
    </form-group>
  `},y={render:()=>d`
    <form-group .description=${"Optional context about this data point"}>
      <textarea placeholder="Add notes..."></textarea>
    </form-group>
  `};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <form-group
      .label=\${"Entity"}
      .description=\${"Select the entity to track for this data point"}
    >
      <input type="text" placeholder="sensor.temperature" />
    </form-group>
  \`
}`,...g.parameters?.docs?.source}}};v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <form-group .label=\${"Name"}>
      <input type="text" placeholder="Enter a name" />
    </form-group>
  \`
}`,...v.parameters?.docs?.source}}};y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <form-group .description=\${"Optional context about this data point"}>
      <textarea placeholder="Add notes..."></textarea>
    </form-group>
  \`
}`,...y.parameters?.docs?.source}}};const se=["Default","LabelOnly","DescriptionOnly"];export{g as Default,y as DescriptionOnly,v as LabelOnly,se as __namedExportsOrder,ie as default};
