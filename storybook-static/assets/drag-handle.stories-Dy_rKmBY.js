import{i as M,b as y,g as R}from"./iframe-maWesKjk.js";import{n as j}from"./property-DyW-YDBW.js";import"./preload-helper-PPVm8Dsz.js";const G=M`
  :host {
    display: inline-flex;
  }
  button {
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    cursor: grab;
    padding: 4px;
    color: var(--secondary-text-color);
    border-radius: 4px;
  }
  button:hover {
    background: color-mix(in srgb, var(--primary-text-color) 8%, transparent);
  }
  button:active {
    cursor: grabbing;
  }
  ha-icon {
    --mdc-icon-size: 18px;
  }
`;var N=Object.create,k=Object.defineProperty,T=Object.getOwnPropertyDescriptor,O=(e,t)=>(t=Symbol[e])?t:Symbol.for("Symbol."+e),g=e=>{throw TypeError(e)},z=(e,t,r)=>t in e?k(e,t,{enumerable:!0,configurable:!0,writable:!0,value:r}):e[t]=r,q=e=>[,,,N(e?.[O("metadata")]??null)],C=["class","method","getter","setter","accessor","field","value","get","set"],p=e=>e!==void 0&&typeof e!="function"?g("Function expected"):e,B=(e,t,r,n,a)=>({kind:C[e],name:t,metadata:n,addInitializer:o=>r._?g("Already initialized"):a.push(p(o||null))}),J=(e,t)=>z(t,O("metadata"),e[3]),w=(e,t,r,n)=>{for(var a=0,o=e[t>>1],d=o&&o.length;a<d;a++)t&1?o[a].call(r):n=o[a].call(r,n);return n},K=(e,t,r,n,a,o)=>{for(var d,s,D,c,b,E=t&7,I=!1,W=!1,m=e.length+1,A=C[E+5],F=e[m-1]=[],H=e[m]||(e[m]=[]),i=(a=a.prototype,T({get[r](){return U(this,o)},set[r](l){return X(this,o,l)}},r)),f=n.length-1;f>=0;f--)c=B(E,r,D={},e[3],H),c.static=I,c.private=W,b=c.access={has:l=>r in l},b.get=l=>l[r],b.set=(l,L)=>l[r]=L,s=(0,n[f])({get:i.get,set:i.set},c),D._=1,s===void 0?p(s)&&(i[A]=s):typeof s!="object"||s===null?g("Object expected"):(p(d=s.get)&&(i.get=d),p(d=s.set)&&(i.set=d),p(d=s.init)&&F.unshift(d));return i&&k(a,r,i),a},Q=(e,t,r)=>z(e,t+"",r),$=(e,t,r)=>t.has(e)||g("Cannot "+r),U=(e,t,r)=>($(e,t,"read from private field"),t.get(e)),V=(e,t,r)=>t.has(e)?g("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(e):t.set(e,r),X=(e,t,r,n)=>($(e,t,"write to private field"),t.set(e,r),r),P,x,u,S;class v extends(x=R,P=[j({type:String})],x){constructor(){super(...arguments),V(this,S,w(u,8,this)),w(u,11,this)}_onDragStart(){this.dispatchEvent(new CustomEvent("dp-drag-start",{bubbles:!0,composed:!0}))}_onDragEnd(){this.dispatchEvent(new CustomEvent("dp-drag-end",{bubbles:!0,composed:!0}))}render(){return y`
      <button
        type="button"
        draggable="true"
        aria-label="${this.label||"Drag to reorder"}"
        @dragstart=${this._onDragStart}
        @dragend=${this._onDragEnd}
      >
        <ha-icon icon="mdi:drag-vertical"></ha-icon>
      </button>
    `}}u=q(x);S=new WeakMap;K(u,4,"label",P,v,S);J(u,v);Q(v,"styles",G);customElements.define("drag-handle",v);const te={title:"Atoms/Interactive/Drag Handle",component:"drag-handle"},_={render:()=>y` <drag-handle></drag-handle> `},h={render:()=>y`
    <drag-handle .label=${"Reorder temperature"}></drag-handle>
  `};_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:"{\n  render: () => html` <drag-handle></drag-handle> `\n}",..._.parameters?.docs?.source}}};h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <drag-handle .label=\${"Reorder temperature"}></drag-handle>
  \`
}`,...h.parameters?.docs?.source}}};const re=["Default","WithLabel"];export{_ as Default,h as WithLabel,re as __namedExportsOrder,te as default};
