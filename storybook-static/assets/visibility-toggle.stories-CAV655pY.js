import{i as J,b as S,g as K}from"./iframe-maWesKjk.js";import{n as $}from"./property-DyW-YDBW.js";import"./preload-helper-PPVm8Dsz.js";const L=J`
  :host {
    display: inline-block;
  }
  button {
    display: flex;
    align-items: center;
    gap: 4px;
    background: none;
    border: 1px solid var(--divider-color, #444);
    border-radius: 6px;
    cursor: pointer;
    padding: 4px 8px;
    font-size: 0.75rem;
    color: var(--secondary-text-color);
    font-family: inherit;
  }
  button:hover {
    background: color-mix(in srgb, var(--primary-text-color) 8%, transparent);
  }
  button[aria-pressed="false"] {
    opacity: 0.5;
  }
`;var Q=Object.create,I=Object.defineProperty,R=Object.getOwnPropertyDescriptor,M=(e,t)=>(t=Symbol[e])?t:Symbol.for("Symbol."+e),u=e=>{throw TypeError(e)},T=(e,t,i)=>t in e?I(e,t,{enumerable:!0,configurable:!0,writable:!0,value:i}):e[t]=i,U=e=>[,,,Q(e?.[M("metadata")]??null)],V=["class","method","getter","setter","accessor","field","value","get","set"],g=e=>e!==void 0&&typeof e!="function"?u("Function expected"):e,X=(e,t,i,o,r)=>({kind:V[e],name:t,metadata:o,addInitializer:a=>i._?u("Already initialized"):r.push(g(a||null))}),Y=(e,t)=>T(t,M("metadata"),e[3]),p=(e,t,i,o)=>{for(var r=0,a=e[t>>1],l=a&&a.length;r<l;r++)t&1?a[r].call(i):o=a[r].call(i,o);return o},w=(e,t,i,o,r,a)=>{for(var l,n,z,_,y,P=t&7,D=!1,B=!1,f=e.length+1,G=V[P+5],N=e[f-1]=[],j=e[f]||(e[f]=[]),d=(r=r.prototype,R({get[i](){return ee(this,a)},set[i](c){return te(this,a,c)}},i)),m=o.length-1;m>=0;m--)_=X(P,i,z={},e[3],j),_.static=D,_.private=B,y=_.access={has:c=>i in c},y.get=c=>c[i],y.set=(c,q)=>c[i]=q,n=(0,o[m])({get:d.get,set:d.set},_),z._=1,n===void 0?g(n)&&(d[G]=n):typeof n!="object"||n===null?u("Object expected"):(g(l=n.get)&&(d.get=l),g(l=n.set)&&(d.set=l),g(l=n.init)&&N.unshift(l));return d&&I(r,i,d),r},Z=(e,t,i)=>T(e,t+"",i),W=(e,t,i)=>t.has(e)||u("Cannot "+i),ee=(e,t,i)=>(W(e,t,"read from private field"),t.get(e)),x=(e,t,i)=>t.has(e)?u("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(e):t.set(e,i),te=(e,t,i,o)=>(W(e,t,"write to private field"),t.set(e,i),i),A,F,H,k,s,E,C,O;class v extends(k=K,H=[$({type:Boolean})],F=[$({type:String})],A=[$({type:String})],k){constructor(){super(...arguments),x(this,E,p(s,8,this,!0)),p(s,11,this),x(this,C,p(s,12,this,"")),p(s,15,this),x(this,O,p(s,16,this,"mdi:eye")),p(s,19,this)}_onClick(){this.dispatchEvent(new CustomEvent("dp-visibility-change",{detail:{pressed:!this.pressed},bubbles:!0,composed:!0}))}render(){return S`
      <button
        type="button"
        aria-pressed="${this.pressed}"
        title="${this.pressed?"Hide":"Show"} ${this.label}"
        @click=${this._onClick}
      >
        ${this.label}
      </button>
    `}}s=U(k);E=new WeakMap;C=new WeakMap;O=new WeakMap;w(s,4,"pressed",H,v,E);w(s,4,"label",F,v,C);w(s,4,"icon",A,v,O);Y(s,v);Z(v,"styles",L);customElements.define("visibility-toggle",v);const oe={title:"Atoms/Interactive/Visibility Toggle",component:"visibility-toggle"},b={render:()=>S`
    <visibility-toggle
      .pressed=${!0}
      .label=${"Events"}
      .icon=${"mdi:eye"}
    ></visibility-toggle>
  `},h={render:()=>S`
    <visibility-toggle
      .pressed=${!1}
      .label=${"Events"}
      .icon=${"mdi:eye-off"}
    ></visibility-toggle>
  `};b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <visibility-toggle
      .pressed=\${true}
      .label=\${"Events"}
      .icon=\${"mdi:eye"}
    ></visibility-toggle>
  \`
}`,...b.parameters?.docs?.source}}};h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <visibility-toggle
      .pressed=\${false}
      .label=\${"Events"}
      .icon=\${"mdi:eye-off"}
    ></visibility-toggle>
  \`
}`,...h.parameters?.docs?.source}}};const ae=["Visible","Hidden"];export{h as Hidden,b as Visible,ae as __namedExportsOrder,oe as default};
