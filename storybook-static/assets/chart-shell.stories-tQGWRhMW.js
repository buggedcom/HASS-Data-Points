import{i as K,b as m,g as Q}from"./iframe-maWesKjk.js";import{n as S}from"./property-DyW-YDBW.js";import"./loading-indicator-DTdjhKni.js";import"./chart-message-CcELwwzA.js";import"./preload-helper-PPVm8Dsz.js";const R=K`
  :host {
    display: block;
    height: 100%;
    min-height: 0;
  }
  ha-card {
    padding: 0;
    overflow: visible;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  .card-header {
    padding: var(--dp-spacing-lg, 16px) var(--dp-spacing-lg, 16px) 0;
    font-size: 1.1em;
    font-weight: 500;
    color: var(--primary-text-color);
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .card-header-title {
    min-width: 0;
  }
  .card-header-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
  }
  .chart-wrap {
    position: relative;
    flex: 1 1 0;
    min-height: 0;
  }
  loading-indicator {
    position: absolute;
    top: var(--dp-spacing-sm, 8px);
    left: var(--dp-spacing-md, 12px);
    z-index: 6;
  }
  chart-message {
    position: absolute;
    inset: 0;
    z-index: 2;
  }
  ::slotted(*) {
    width: 100%;
    height: 100%;
  }
`;var U=Object.create,E=Object.defineProperty,V=Object.getOwnPropertyDescriptor,P=(e,t)=>(t=Symbol[e])?t:Symbol.for("Symbol."+e),_=e=>{throw TypeError(e)},j=(e,t,a)=>t in e?E(e,t,{enumerable:!0,configurable:!0,writable:!0,value:a}):e[t]=a,X=e=>[,,,U(e?.[P("metadata")]??null)],H=["class","method","getter","setter","accessor","field","value","get","set"],v=e=>e!==void 0&&typeof e!="function"?_("Function expected"):e,Y=(e,t,a,s,r)=>({kind:H[e],name:t,metadata:s,addInitializer:l=>a._?_("Already initialized"):r.push(v(l||null))}),Z=(e,t)=>j(t,P("metadata"),e[3]),h=(e,t,a,s)=>{for(var r=0,l=e[t>>1],o=l&&l.length;r<o;r++)t&1?l[r].call(a):s=l[r].call(a,s);return s},$=(e,t,a,s,r,l)=>{for(var o,n,M,g,x,O=t&7,A=!1,D=!1,b=e.length+1,B=H[O+5],G=e[b-1]=[],q=e[b]||(e[b]=[]),c=(r=r.prototype,V({get[a](){return te(this,l)},set[a](d){return ae(this,l,d)}},a)),w=s.length-1;w>=0;w--)g=Y(O,a,M={},e[3],q),g.static=A,g.private=D,x=g.access={has:d=>a in d},x.get=d=>d[a],x.set=(d,J)=>d[a]=J,n=(0,s[w])({get:c.get,set:c.set},g),M._=1,n===void 0?v(n)&&(c[B]=n):typeof n!="object"||n===null?_("Object expected"):(v(o=n.get)&&(c.get=o),v(o=n.set)&&(c.set=o),v(o=n.init)&&G.unshift(o));return c&&E(r,a,c),r},ee=(e,t,a)=>j(e,t+"",a),L=(e,t,a)=>t.has(e)||_("Cannot "+a),te=(e,t,a)=>(L(e,t,"read from private field"),t.get(e)),k=(e,t,a)=>t.has(e)?_("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(e):t.set(e,a),ae=(e,t,a,s)=>(L(e,t,"write to private field"),t.set(e,a),a),F,I,N,T,i,z,C,W;class p extends(T=Q,N=[S({type:String,attribute:"card-title"})],I=[S({type:Boolean})],F=[S({type:String})],T){constructor(){super(...arguments),k(this,z,h(i,8,this,"")),h(i,11,this),k(this,C,h(i,12,this,!1)),h(i,15,this),k(this,W,h(i,16,this,"")),h(i,19,this)}render(){return m`
      <ha-card>
        ${this.cardTitle?m`
              <div class="card-header">
                <span class="card-header-title">${this.cardTitle}</span>
                <span class="card-header-action">
                  <slot name="header-action"></slot>
                </span>
              </div>
            `:""}
        <slot name="top"></slot>
        <div class="chart-wrap">
          <loading-indicator .active=${this.loading}></loading-indicator>
          <chart-message .message=${this.message}></chart-message>
          <slot></slot>
        </div>
        <slot name="legend"></slot>
        <slot name="bottom"></slot>
      </ha-card>
    `}}i=X(T);z=new WeakMap;C=new WeakMap;W=new WeakMap;$(i,4,"cardTitle",N,p,z);$(i,4,"loading",I,p,C);$(i,4,"message",F,p,W);Z(i,p);ee(p,"styles",R);customElements.define("chart-shell",p);const oe={title:"Molecules/Chart Shell",component:"chart-shell"},u={render:()=>m`
    <chart-shell card-title="Temperature History">
      <div
        style="height: 200px; background: #333; display: flex; align-items: center; justify-content: center; color: #888;"
      >
        Canvas area
      </div>
    </chart-shell>
  `},f={render:()=>m`
    <chart-shell card-title="Loading..." .loading=${!0}>
      <div style="height: 200px; background: #333;"></div>
    </chart-shell>
  `},y={render:()=>m`
    <chart-shell card-title="History" .message=${"No data available"}>
      <div style="height: 200px; background: #333;"></div>
    </chart-shell>
  `};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <chart-shell card-title="Temperature History">
      <div
        style="height: 200px; background: #333; display: flex; align-items: center; justify-content: center; color: #888;"
      >
        Canvas area
      </div>
    </chart-shell>
  \`
}`,...u.parameters?.docs?.source}}};f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <chart-shell card-title="Loading..." .loading=\${true}>
      <div style="height: 200px; background: #333;"></div>
    </chart-shell>
  \`
}`,...f.parameters?.docs?.source}}};y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <chart-shell card-title="History" .message=\${"No data available"}>
      <div style="height: 200px; background: #333;"></div>
    </chart-shell>
  \`
}`,...y.parameters?.docs?.source}}};const ce=["WithTitle","Loading","WithMessage"];export{f as Loading,y as WithMessage,u as WithTitle,ce as __namedExportsOrder,oe as default};
