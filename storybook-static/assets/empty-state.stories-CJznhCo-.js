import{i as W,b as u,g as j}from"./iframe-maWesKjk.js";import{n as G}from"./property-DyW-YDBW.js";import"./preload-helper-PPVm8Dsz.js";const q=W`
  :host {
    display: block;
  }
  .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: var(--dp-spacing-lg);
    color: var(--secondary-text-color);
    font-size: 0.9rem;
  }
`;var B=Object.create,b=Object.defineProperty,J=Object.getOwnPropertyDescriptor,k=(e,t)=>(t=Symbol[e])?t:Symbol.for("Symbol."+e),_=e=>{throw TypeError(e)},z=(e,t,r)=>t in e?b(e,t,{enumerable:!0,configurable:!0,writable:!0,value:r}):e[t]=r,K=e=>[,,,B(e?.[k("metadata")]??null)],D=["class","method","getter","setter","accessor","field","value","get","set"],l=e=>e!==void 0&&typeof e!="function"?_("Function expected"):e,L=(e,t,r,a,s)=>({kind:D[e],name:t,metadata:a,addInitializer:o=>r._?_("Already initialized"):s.push(l(o||null))}),Q=(e,t)=>z(t,k("metadata"),e[3]),O=(e,t,r,a)=>{for(var s=0,o=e[t>>1],n=o&&o.length;s<n;s++)t&1?o[s].call(r):a=o[s].call(r,a);return a},R=(e,t,r,a,s,o)=>{for(var n,i,$,d,f,w=t&7,A=!1,F=!1,S=e.length+1,I=D[w+5],H=e[S-1]=[],M=e[S]||(e[S]=[]),c=(s=s.prototype,J({get[r](){return V(this,o)},set[r](p){return Y(this,o,p)}},r)),x=a.length-1;x>=0;x--)d=L(w,r,$={},e[3],M),d.static=A,d.private=F,f=d.access={has:p=>r in p},f.get=p=>p[r],f.set=(p,T)=>p[r]=T,i=(0,a[x])({get:c.get,set:c.set},d),$._=1,i===void 0?l(i)&&(c[I]=i):typeof i!="object"||i===null?_("Object expected"):(l(n=i.get)&&(c.get=n),l(n=i.set)&&(c.set=n),l(n=i.init)&&H.unshift(n));return c&&b(s,r,c),s},U=(e,t,r)=>z(e,t+"",r),P=(e,t,r)=>t.has(e)||_("Cannot "+r),V=(e,t,r)=>(P(e,t,"read from private field"),t.get(e)),X=(e,t,r)=>t.has(e)?_("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(e):t.set(e,r),Y=(e,t,r,a)=>(P(e,t,"write to private field"),t.set(e,r),r),C,E,m,N;class h extends(E=j,C=[G({type:String})],E){constructor(){super(...arguments),X(this,N,O(m,8,this,"")),O(m,11,this)}render(){return u`<div class="empty-state">${this.message}</div>`}}m=K(E);N=new WeakMap;R(m,4,"message",C,h,N);Q(m,h);U(h,"styles",q);customElements.define("empty-state",h);const re={title:"Atoms/Display/Empty State",component:"empty-state",argTypes:{message:{control:"text"}}},y={render:()=>u`<empty-state .message=${"No data points recorded yet"}></empty-state>`},v={render:()=>u`<empty-state
      .message=${"No entities match the current filter"}
    ></empty-state>`},g={render:()=>u`<empty-state
      .message=${"No history available for this period"}
    ></empty-state>`};y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:'{\n  render: () => html`<empty-state .message=${"No data points recorded yet"}></empty-state>`\n}',...y.parameters?.docs?.source}}};v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  render: () => html\`<empty-state
      .message=\${"No entities match the current filter"}
    ></empty-state>\`
}`,...v.parameters?.docs?.source}}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  render: () => html\`<empty-state
      .message=\${"No history available for this period"}
    ></empty-state>\`
}`,...g.parameters?.docs?.source}}};const se=["Default","NoEntities","EmptyHistory"];export{y as Default,g as EmptyHistory,v as NoEntities,se as __namedExportsOrder,re as default};
