import{i as J,b as u,g as K}from"./iframe-maWesKjk.js";import{n as O}from"./property-DyW-YDBW.js";import"./preload-helper-PPVm8Dsz.js";const L=J`
  :host {
    display: block;
  }
  .color-field {
    position: relative;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    overflow: hidden;
    border: 2px solid var(--divider-color, #ccc);
    cursor: pointer;
  }
  input[type="color"] {
    position: absolute;
    top: -4px;
    left: -4px;
    width: calc(100% + 8px);
    height: calc(100% + 8px);
    border: none;
    cursor: pointer;
    padding: 0;
    background: none;
  }
  .icon-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    z-index: 1;
  }
  .icon-overlay ha-state-icon {
    --mdc-icon-size: 20px;
    color: var(--text-primary-color, #fff);
  }
`;var Q=Object.create,P=Object.defineProperty,R=Object.getOwnPropertyDescriptor,z=(e,t)=>(t=Symbol[e])?t:Symbol.for("Symbol."+e),_=e=>{throw TypeError(e)},F=(e,t,r)=>t in e?P(e,t,{enumerable:!0,configurable:!0,writable:!0,value:r}):e[t]=r,U=e=>[,,,Q(e?.[z("metadata")]??null)],W=["class","method","getter","setter","accessor","field","value","get","set"],f=e=>e!==void 0&&typeof e!="function"?_("Function expected"):e,V=(e,t,r,i,o)=>({kind:W[e],name:t,metadata:i,addInitializer:c=>r._?_("Already initialized"):o.push(f(c||null))}),X=(e,t)=>F(t,z("metadata"),e[3]),v=(e,t,r,i)=>{for(var o=0,c=e[t>>1],a=c&&c.length;o<a;o++)t&1?c[o].call(r):i=c[o].call(r,i);return i},D=(e,t,r,i,o,c)=>{for(var a,n,S,p,k,E=t&7,j=!1,G=!1,x=e.length+1,N=W[E+5],q=e[x-1]=[],B=e[x]||(e[x]=[]),l=(o=o.prototype,R({get[r](){return Z(this,c)},set[r](d){return ee(this,c,d)}},r)),I=i.length-1;I>=0;I--)p=V(E,r,S={},e[3],B),p.static=j,p.private=G,k=p.access={has:d=>r in d},k.get=d=>d[r],k.set=(d,H)=>d[r]=H,n=(0,i[I])({get:l.get,set:l.set},p),S._=1,n===void 0?f(n)&&(l[N]=n):typeof n!="object"||n===null?_("Object expected"):(f(a=n.get)&&(l.get=a),f(a=n.set)&&(l.set=a),f(a=n.init)&&q.unshift(a));return l&&P(o,r,l),o},Y=(e,t,r)=>F(e,t+"",r),A=(e,t,r)=>t.has(e)||_("Cannot "+r),Z=(e,t,r)=>(A(e,t,"read from private field"),t.get(e)),C=(e,t,r)=>t.has(e)?_("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(e):t.set(e,r),ee=(e,t,r,i)=>(A(e,t,"write to private field"),t.set(e,r),r),M,T,b,s,w,$;class h extends(b=K,T=[O({type:String})],M=[O({type:String,attribute:"entity-id"})],b){constructor(){super(...arguments),C(this,w,v(s,8,this,"#ff9800")),v(s,11,this),C(this,$,v(s,12,this)),v(s,15,this)}_onInput(t){const r=t.target.value;this.dispatchEvent(new CustomEvent("dp-color-change",{detail:{color:r},bubbles:!0,composed:!0}))}render(){return u`
      <div class="color-field" style="background-color: ${this.color}">
        <input type="color" .value=${this.color} @input=${this._onInput} />
        ${this.entityId?u`
              <div class="icon-overlay">
                <ha-state-icon .entityId=${this.entityId}></ha-state-icon>
              </div>
            `:""}
      </div>
    `}}s=U(b);w=new WeakMap;$=new WeakMap;D(s,4,"color",T,h,w);D(s,4,"entityId",M,h,$);X(s,h);Y(h,"styles",L);customElements.define("color-picker-field",h);const ie={title:"Atoms/Form/Color Picker Field",component:"color-picker-field",argTypes:{color:{control:"color"},entityId:{control:"text"}}},y={render:()=>u`
    <color-picker-field .color=${"#4caf50"}></color-picker-field>
  `},g={render:()=>u`
    <color-picker-field
      .color=${"#2196f3"}
      .entityId=${"sensor.temperature"}
    ></color-picker-field>
  `},m={render:()=>u`
    <color-picker-field .color=${"#ff9800"}></color-picker-field>
  `};y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <color-picker-field .color=\${"#4caf50"}></color-picker-field>
  \`
}`,...y.parameters?.docs?.source}}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <color-picker-field
      .color=\${"#2196f3"}
      .entityId=\${"sensor.temperature"}
    ></color-picker-field>
  \`
}`,...g.parameters?.docs?.source}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <color-picker-field .color=\${"#ff9800"}></color-picker-field>
  \`
}`,...m.parameters?.docs?.source}}};const ce=["Default","WithEntityIcon","Orange"];export{y as Default,m as Orange,g as WithEntityIcon,ce as __namedExportsOrder,ie as default};
