import{i as J,b as v,g as K}from"./iframe-maWesKjk.js";import{n as w}from"./property-DyW-YDBW.js";import"./preload-helper-PPVm8Dsz.js";const Q=J`
  :host {
    display: block;
  }
  .list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .entity-row {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .entity-row ha-selector {
    flex: 1;
    min-width: 0;
  }
  .remove-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    font-size: 1.1rem;
    color: var(--secondary-text-color);
    line-height: 1;
  }
  .remove-btn:hover {
    color: var(--error-color, #f44336);
  }
  .add-wrap {
    margin-top: 4px;
  }
`;var U=Object.create,W=Object.defineProperty,V=Object.getOwnPropertyDescriptor,P=(t,e)=>(e=Symbol[t])?e:Symbol.for("Symbol."+t),m=t=>{throw TypeError(t)},F=(t,e,r)=>e in t?W(t,e,{enumerable:!0,configurable:!0,writable:!0,value:r}):t[e]=r,X=t=>[,,,U(t?.[P("metadata")]??null)],M=["class","method","getter","setter","accessor","field","value","get","set"],h=t=>t!==void 0&&typeof t!="function"?m("Function expected"):t,Y=(t,e,r,i,s)=>({kind:M[t],name:e,metadata:i,addInitializer:o=>r._?m("Already initialized"):s.push(h(o||null))}),Z=(t,e)=>F(e,P("metadata"),t[3]),p=(t,e,r,i)=>{for(var s=0,o=t[e>>1],d=o&&o.length;s<d;s++)e&1?o[s].call(r):i=o[s].call(r,i);return i},k=(t,e,r,i,s,o)=>{for(var d,a,O,_,f,z=e&7,j=!1,G=!1,E=t.length+1,N=M[z+5],T=t[E-1]=[],q=t[E]||(t[E]=[]),l=(s=s.prototype,V({get[r](){return et(this,o)},set[r](c){return rt(this,o,c)}},r)),x=i.length-1;x>=0;x--)_=Y(z,r,O={},t[3],q),_.static=j,_.private=G,f=_.access={has:c=>r in c},f.get=c=>c[r],f.set=(c,H)=>c[r]=H,a=(0,i[x])({get:l.get,set:l.set},_),O._=1,a===void 0?h(a)&&(l[N]=a):typeof a!="object"||a===null?m("Object expected"):(h(d=a.get)&&(l.get=d),h(d=a.set)&&(l.set=d),h(d=a.init)&&T.unshift(d));return l&&W(s,r,l),s},tt=(t,e,r)=>F(t,e+"",r),I=(t,e,r)=>e.has(t)||m("Cannot "+r),et=(t,e,r)=>(I(t,e,"read from private field"),e.get(t)),$=(t,e,r)=>e.has(t)?m("Cannot add the same private member more than once"):e instanceof WeakSet?e.add(t):e.set(t,r),rt=(t,e,r,i)=>(I(t,e,"write to private field"),e.set(t,r),r),R,B,D,S,n,C,L,A;class u extends(S=K,D=[w({type:Array})],B=[w({type:Object})],R=[w({type:String,attribute:"button-label"})],S){constructor(){super(...arguments),$(this,C,p(n,8,this,[])),p(n,11,this),$(this,L,p(n,12,this,null)),p(n,15,this),$(this,A,p(n,16,this,"Add entity")),p(n,19,this)}_onRemove(e){const r=[...this.entities];r.splice(e,1),this.dispatchEvent(new CustomEvent("dp-entity-list-change",{detail:{entities:r},bubbles:!0,composed:!0}))}_onAdd(){this.dispatchEvent(new CustomEvent("dp-entity-list-change",{detail:{entities:[...this.entities,""]},bubbles:!0,composed:!0}))}_onEntityChange(e,r){const i=[...this.entities];i[e]=r.detail.value,this.dispatchEvent(new CustomEvent("dp-entity-list-change",{detail:{entities:i},bubbles:!0,composed:!0}))}render(){return v`
      <div class="list">
        ${this.entities.map((e,r)=>v`
            <div class="entity-row">
              <ha-selector
                .selector=${{entity:{}}}
                .value=${e}
                .hass=${this.hass}
                @value-changed=${i=>this._onEntityChange(r,i)}
              ></ha-selector>
              <button
                class="remove-btn"
                data-action="remove"
                @click=${()=>this._onRemove(r)}
                aria-label="Remove entity"
              ></button>
            </div>
          `)}
      </div>
      <div class="add-wrap">
        <ha-button outlined data-action="add" @click=${this._onAdd}>
          ${this.buttonLabel}
        </ha-button>
      </div>
    `}}n=X(S);C=new WeakMap;L=new WeakMap;A=new WeakMap;k(n,4,"entities",D,u,C);k(n,4,"hass",B,u,L);k(n,4,"buttonLabel",R,u,A);Z(n,u);tt(u,"styles",Q);customElements.define("editor-entity-list",u);const ot={title:"Atoms/Form/Editor Entity List",component:"editor-entity-list",parameters:{actions:{handles:["dp-entity-list-change"]}}},y={render:()=>v`
    <editor-entity-list .entities=${[]}></editor-entity-list>
  `},b={render:()=>v`
    <editor-entity-list
      .entities=${["sensor.living_room_temperature","sensor.bedroom_humidity","binary_sensor.front_door"]}
    ></editor-entity-list>
  `},g={render:()=>v`
    <editor-entity-list
      .entities=${["sensor.outdoor_temperature"]}
      .buttonLabel=${"Add sensor"}
    ></editor-entity-list>
  `};y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <editor-entity-list .entities=\${[]}></editor-entity-list>
  \`
}`,...y.parameters?.docs?.source}}};b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <editor-entity-list
      .entities=\${["sensor.living_room_temperature", "sensor.bedroom_humidity", "binary_sensor.front_door"]}
    ></editor-entity-list>
  \`
}`,...b.parameters?.docs?.source}}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <editor-entity-list
      .entities=\${["sensor.outdoor_temperature"]}
      .buttonLabel=\${"Add sensor"}
    ></editor-entity-list>
  \`
}`,...g.parameters?.docs?.source}}};const at=["Empty","WithEntities","CustomButtonLabel"];export{g as CustomButtonLabel,y as Empty,b as WithEntities,at as __namedExportsOrder,ot as default};
