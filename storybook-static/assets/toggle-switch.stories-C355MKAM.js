import{i as J,b,g as K}from"./iframe-maWesKjk.js";import{n as x}from"./property-DyW-YDBW.js";import"./preload-helper-PPVm8Dsz.js";const L=J`
  :host {
    display: inline-flex;
  }
  label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 0.85rem;
    color: var(--primary-text-color);
    font-family: inherit;
  }
  .track {
    position: relative;
    width: 36px;
    height: 20px;
    border-radius: 10px;
    background: var(--disabled-color, #bdbdbd);
    transition: background 0.2s ease;
    flex: 0 0 auto;
  }
  .track.on {
    background: var(--primary-color, #03a9f4);
  }
  .thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #fff;
    transition: transform 0.2s ease;
  }
  .track.on .thumb {
    transform: translateX(16px);
  }
  input {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }
`;var Q=Object.create,P=Object.defineProperty,R=Object.getOwnPropertyDescriptor,T=(e,t)=>(t=Symbol[e])?t:Symbol.for("Symbol."+e),_=e=>{throw TypeError(e)},M=(e,t,r)=>t in e?P(e,t,{enumerable:!0,configurable:!0,writable:!0,value:r}):e[t]=r,V=e=>[,,,Q(e?.[T("metadata")]??null)],A=["class","method","getter","setter","accessor","field","value","get","set"],u=e=>e!==void 0&&typeof e!="function"?_("Function expected"):e,Y=(e,t,r,i,a)=>({kind:A[e],name:t,metadata:i,addInitializer:o=>r._?_("Already initialized"):a.push(u(o||null))}),Z=(e,t)=>M(t,T("metadata"),e[3]),h=(e,t,r,i)=>{for(var a=0,o=e[t>>1],n=o&&o.length;a<n;a++)t&1?o[a].call(r):i=o[a].call(r,i);return i},I=(e,t,r,i,a,o)=>{for(var n,c,z,g,f,W=t&7,G=!1,N=!1,k=e.length+1,X=A[W+5],j=e[k-1]=[],q=e[k]||(e[k]=[]),l=(a=a.prototype,R({get[r](){return te(this,o)},set[r](d){return re(this,o,d)}},r)),y=i.length-1;y>=0;y--)g=Y(W,r,z={},e[3],q),g.static=G,g.private=N,f=g.access={has:d=>r in d},f.get=d=>d[r],f.set=(d,H)=>d[r]=H,c=(0,i[y])({get:l.get,set:l.set},g),z._=1,c===void 0?u(c)&&(l[X]=c):typeof c!="object"||c===null?_("Object expected"):(u(n=c.get)&&(l.get=n),u(n=c.set)&&(l.set=n),u(n=c.init)&&j.unshift(n));return l&&P(a,r,l),a},ee=(e,t,r)=>M(e,t+"",r),F=(e,t,r)=>t.has(e)||_("Cannot "+r),te=(e,t,r)=>(F(e,t,"read from private field"),t.get(e)),S=(e,t,r)=>t.has(e)?_("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(e):t.set(e,r),re=(e,t,r,i)=>(F(e,t,"write to private field"),t.set(e,r),r),D,U,B,$,s,C,E,O;class p extends($=K,B=[x({type:Boolean})],U=[x({type:String})],D=[x({type:String,attribute:"entity-id"})],$){constructor(){super(...arguments),S(this,C,h(s,8,this,!1)),h(s,11,this),S(this,E,h(s,12,this,"")),h(s,15,this),S(this,O,h(s,16,this)),h(s,19,this)}_onChange(){this.dispatchEvent(new CustomEvent("dp-toggle-change",{detail:{checked:!this.checked,entityId:this.entityId},bubbles:!0,composed:!0}))}render(){return b`
      <label>
        <input
          type="checkbox"
          .checked=${this.checked}
          @change=${this._onChange}
        />
        <div class="track ${this.checked?"on":""}">
          <div class="thumb"></div>
        </div>
        ${this.label}
      </label>
    `}}s=V($);C=new WeakMap;E=new WeakMap;O=new WeakMap;I(s,4,"checked",B,p,C);I(s,4,"label",U,p,E);I(s,4,"entityId",D,p,O);Z(s,p);ee(p,"styles",L);customElements.define("toggle-switch",p);const oe={title:"Atoms/Interactive/Toggle Switch",component:"toggle-switch"},v={render:()=>b`
    <toggle-switch .checked=${!1} .label=${"Show targets"}></toggle-switch>
  `},m={render:()=>b`
    <toggle-switch .checked=${!0} .label=${"Show targets"}></toggle-switch>
  `},w={render:()=>b`
    <toggle-switch
      .checked=${!0}
      .label=${"Temperature"}
      .entityId=${"sensor.temperature"}
    ></toggle-switch>
  `};v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:'{\n  render: () => html`\n    <toggle-switch .checked=${false} .label=${"Show targets"}></toggle-switch>\n  `\n}',...v.parameters?.docs?.source}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:'{\n  render: () => html`\n    <toggle-switch .checked=${true} .label=${"Show targets"}></toggle-switch>\n  `\n}',...m.parameters?.docs?.source}}};w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <toggle-switch
      .checked=\${true}
      .label=\${"Temperature"}
      .entityId=\${"sensor.temperature"}
    ></toggle-switch>
  \`
}`,...w.parameters?.docs?.source}}};const ce=["Unchecked","Checked","WithEntityId"];export{m as Checked,v as Unchecked,w as WithEntityId,ce as __namedExportsOrder,oe as default};
