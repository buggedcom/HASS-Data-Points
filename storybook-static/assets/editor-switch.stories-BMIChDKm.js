import{i as J,b as w,g as K}from"./iframe-maWesKjk.js";import{n as x}from"./property-DyW-YDBW.js";import"./preload-helper-PPVm8Dsz.js";const L=J`
  :host {
    display: block;
  }
  .switch-row {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .switch-row ha-formfield {
    flex: 1;
  }
  .help-icon {
    color: var(--secondary-text-color);
    cursor: default;
    flex-shrink: 0;
    position: relative;
    font-size: 0.85rem;
  }
  .help-icon:hover .help-tooltip {
    display: block;
  }
  .help-tooltip {
    display: none;
    position: absolute;
    right: 0;
    top: calc(100% + 4px);
    background: var(--card-background-color, #fff);
    color: var(--primary-text-color);
    border: 1px solid var(--divider-color, #ccc);
    border-radius: 6px;
    padding: 6px 10px;
    font-size: 0.78rem;
    white-space: nowrap;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    z-index: 10;
    pointer-events: none;
  }
`;var Q=Object.create,D=Object.defineProperty,V=Object.getOwnPropertyDescriptor,F=(e,t)=>(t=Symbol[e])?t:Symbol.for("Symbol."+e),u=e=>{throw TypeError(e)},M=(e,t,r)=>t in e?D(e,t,{enumerable:!0,configurable:!0,writable:!0,value:r}):e[t]=r,X=e=>[,,,Q(e?.[F("metadata")]??null)],P=["class","method","getter","setter","accessor","field","value","get","set"],f=e=>e!==void 0&&typeof e!="function"?u("Function expected"):e,Y=(e,t,r,i,o)=>({kind:P[e],name:t,metadata:i,addInitializer:s=>r._?u("Already initialized"):o.push(f(s||null))}),Z=(e,t)=>M(t,F("metadata"),e[3]),h=(e,t,r,i)=>{for(var o=0,s=e[t>>1],n=s&&s.length;o<n;o++)t&1?s[o].call(r):i=s[o].call(r,i);return i},C=(e,t,r,i,o,s)=>{for(var n,c,W,_,b,q=t&7,T=!1,B=!1,k=e.length+1,G=P[q+5],U=e[k-1]=[],j=e[k]||(e[k]=[]),l=(o=o.prototype,V({get[r](){return te(this,s)},set[r](d){return re(this,s,d)}},r)),S=i.length-1;S>=0;S--)_=Y(q,r,W={},e[3],j),_.static=T,_.private=B,b=_.access={has:d=>r in d},b.get=d=>d[r],b.set=(d,H)=>d[r]=H,c=(0,i[S])({get:l.get,set:l.set},_),W._=1,c===void 0?f(c)&&(l[G]=c):typeof c!="object"||c===null?u("Object expected"):(f(n=c.get)&&(l.get=n),f(n=c.set)&&(l.set=n),f(n=c.init)&&U.unshift(n));return l&&D(o,r,l),o},ee=(e,t,r)=>M(e,t+"",r),R=(e,t,r)=>t.has(e)||u("Cannot "+r),te=(e,t,r)=>(R(e,t,"read from private field"),t.get(e)),y=(e,t,r)=>t.has(e)?u("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(e):t.set(e,r),re=(e,t,r,i)=>(R(e,t,"write to private field"),t.set(e,r),r),A,I,N,$,a,E,z,O;class p extends($=K,N=[x({type:String})],I=[x({type:Boolean})],A=[x({type:String})],$){constructor(){super(...arguments),y(this,E,h(a,8,this,"")),h(a,11,this),y(this,z,h(a,12,this,!1)),h(a,15,this),y(this,O,h(a,16,this,"")),h(a,19,this)}firstUpdated(){const t=this.shadowRoot.querySelector("ha-formfield");t&&(t.label=this.label);const r=this.shadowRoot.querySelector("ha-switch");r&&(r.checked=this.checked)}updated(t){if(t.has("checked")){const r=this.shadowRoot.querySelector("ha-switch");r&&(r.checked=this.checked)}if(t.has("label")){const r=this.shadowRoot.querySelector("ha-formfield");r&&(r.label=this.label)}}_onChange(t){this.dispatchEvent(new CustomEvent("dp-switch-change",{detail:{checked:t.target.checked},bubbles:!0,composed:!0}))}render(){return w`
      <div class="switch-row">
        <ha-formfield>
          <ha-switch @change=${this._onChange}></ha-switch>
        </ha-formfield>
        ${this.tooltip?w`
              <span class="help-icon">
                ?
                <span class="help-tooltip">${this.tooltip}</span>
              </span>
            `:""}
      </div>
    `}}a=X($);E=new WeakMap;z=new WeakMap;O=new WeakMap;C(a,4,"label",N,p,E);C(a,4,"checked",I,p,z);C(a,4,"tooltip",A,p,O);Z(a,p);ee(p,"styles",L);customElements.define("editor-switch",p);const se={title:"Atoms/Form/Editor Switch",component:"editor-switch",parameters:{actions:{handles:["dp-switch-change"]}}},v={render:()=>w`
    <editor-switch .label=${"Show annotations"}></editor-switch>
  `},m={render:()=>w`
    <editor-switch
      .label=${"Show annotations"}
      .checked=${!0}
    ></editor-switch>
  `},g={render:()=>w`
    <editor-switch
      .label=${"Normalise values"}
      .tooltip=${"Scale all series to a 0–100 range for comparison"}
    ></editor-switch>
  `};v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <editor-switch .label=\${"Show annotations"}></editor-switch>
  \`
}`,...v.parameters?.docs?.source}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <editor-switch
      .label=\${"Show annotations"}
      .checked=\${true}
    ></editor-switch>
  \`
}`,...m.parameters?.docs?.source}}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <editor-switch
      .label=\${"Normalise values"}
      .tooltip=\${"Scale all series to a 0–100 range for comparison"}
    ></editor-switch>
  \`
}`,...g.parameters?.docs?.source}}};const ce=["Default","Checked","WithTooltip"];export{m as Checked,v as Default,g as WithTooltip,ce as __namedExportsOrder,se as default};
