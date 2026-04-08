import{i as Z,b as f,g as ee}from"./iframe-maWesKjk.js";import{n as _}from"./property-DyW-YDBW.js";import"./preload-helper-PPVm8Dsz.js";const te=Z`
  :host {
    display: grid;
    overflow: hidden;
    height: 100%;
    width: 100%;
    box-sizing: border-box;
  }

  /* ── Vertical (top / bottom) layout ─────────────────────────────────────── */

  :host([direction="vertical"]),
  :host(:not([direction])) {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows:
      minmax(var(--dp-panes-min-first, 0px), var(--dp-panes-top-size, 50%))
      var(--dp-panes-splitter-size, 24px)
      minmax(var(--dp-panes-min-second, 0px), 1fr);
  }

  /* When second pane is hidden, first pane fills all space */
  :host([second-hidden]) {
    grid-template-rows: minmax(0, 1fr) !important;
    grid-template-columns: minmax(0, 1fr) !important;
  }

  /* ── Horizontal (left / right) layout ───────────────────────────────────── */

  :host([direction="horizontal"]) {
    grid-template-rows: minmax(0, 1fr);
    grid-template-columns:
      minmax(var(--dp-panes-min-first, 0px), var(--dp-panes-top-size, 50%))
      var(--dp-panes-splitter-size, 24px)
      minmax(var(--dp-panes-min-second, 0px), 1fr);
  }

  /* ── Slots ───────────────────────────────────────────────────────────────── */

  .pane-first {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
  }

  .pane-second {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
  }

  /* Slotted content must fill the pane — the pane's grid height is definite
     so height:100% resolves correctly for slotted elements. */
  ::slotted(*) {
    flex: 1 1 auto;
    min-height: 0;
    min-width: 0;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
  }

  /* ── Splitter handle ─────────────────────────────────────────────────────── */

  .pane-splitter {
    position: relative;
    margin: 0;
    padding: 0;
    border: 0;
    background: transparent;
    touch-action: none;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  :host([direction="vertical"]) .pane-splitter,
  :host(:not([direction])) .pane-splitter {
    cursor: row-resize;
    width: 100%;
  }

  :host([direction="horizontal"]) .pane-splitter {
    cursor: col-resize;
    height: 100%;
  }

  /* Drag indicator pill */
  .pane-splitter::after {
    content: "";
    position: absolute;
    border-radius: 999px;
    background: color-mix(
      in srgb,
      var(--primary-text-color, #111) 18%,
      transparent
    );
    transition: background 120ms ease;
  }

  :host([direction="vertical"]) .pane-splitter::after,
  :host(:not([direction])) .pane-splitter::after {
    width: 60px;
    height: 6px;
  }

  :host([direction="horizontal"]) .pane-splitter::after {
    width: 6px;
    height: 60px;
  }

  .pane-splitter:hover::after,
  .pane-splitter:focus-visible::after,
  .pane-splitter.dragging::after {
    background: color-mix(
      in srgb,
      var(--primary-color, #03a9f4) 62%,
      transparent
    );
  }

  .pane-splitter:focus-visible {
    outline: none;
  }
`;var ie=Object.create,F=Object.defineProperty,re=Object.getOwnPropertyDescriptor,W=(t,e)=>(e=Symbol[t])?e:Symbol.for("Symbol."+t),b=t=>{throw TypeError(t)},U=(t,e,i)=>e in t?F(t,e,{enumerable:!0,configurable:!0,writable:!0,value:i}):t[e]=i,ne=t=>[,,,ie(t?.[W("metadata")]??null)],N=["class","method","getter","setter","accessor","field","value","get","set"],g=t=>t!==void 0&&typeof t!="function"?b("Function expected"):t,se=(t,e,i,s,n)=>({kind:N[t],name:e,metadata:s,addInitializer:a=>i._?b("Already initialized"):n.push(g(a||null))}),ae=(t,e)=>U(e,W("metadata"),t[3]),o=(t,e,i,s)=>{for(var n=0,a=t[e>>1],d=a&&a.length;n<d;n++)e&1?a[n].call(i):s=a[n].call(i,s);return s},x=(t,e,i,s,n,a)=>{for(var d,l,D,u,k,O=e&7,V=!1,X=!1,E=t.length+1,Y=N[O+5],J=t[E-1]=[],K=t[E]||(t[E]=[]),h=(n=n.prototype,re({get[i](){return oe(this,a)},set[i](v){return le(this,a,v)}},i)),P=s.length-1;P>=0;P--)u=se(O,i,D={},t[3],K),u.static=V,u.private=X,k=u.access={has:v=>i in v},k.get=v=>v[i],k.set=(v,Q)=>v[i]=Q,l=(0,s[P])({get:h.get,set:h.set},u),D._=1,l===void 0?g(l)&&(h[Y]=l):typeof l!="object"||l===null?b("Object expected"):(g(d=l.get)&&(h.get=d),g(d=l.set)&&(h.set=d),g(d=l.init)&&J.unshift(d));return h&&F(n,i,h),n},m=(t,e,i)=>U(t,typeof e!="symbol"?e+"":e,i),A=(t,e,i)=>e.has(t)||b("Cannot "+i),oe=(t,e,i)=>(A(t,e,"read from private field"),e.get(t)),y=(t,e,i)=>e.has(t)?b("Cannot add the same private member more than once"):e instanceof WeakSet?e.add(t):e.set(t,i),le=(t,e,i,s)=>(A(t,e,"write to private field"),e.set(t,i),i),j,B,q,G,T,H,r,I,R,M,L,C;class c extends(H=ee,T=[_({type:String,reflect:!0})],G=[_({type:Number})],q=[_({type:Number})],B=[_({type:Number})],j=[_({type:Boolean,attribute:"second-hidden",reflect:!0})],H){constructor(){super(...arguments),y(this,I,o(r,8,this,"vertical")),o(r,11,this),y(this,R,o(r,12,this,.5)),o(r,15,this),y(this,M,o(r,16,this,.25)),o(r,19,this),y(this,L,o(r,20,this,.75)),o(r,23,this),y(this,C,o(r,24,this,!1)),o(r,27,this),m(this,"_pointerId",null),m(this,"_splitterEl",null),m(this,"_onPointerDown",e=>{e.button===0&&(e.preventDefault(),this._pointerId=e.pointerId,this._splitterEl?.classList.add("dragging"),window.addEventListener("pointermove",this._onPointerMove),window.addEventListener("pointerup",this._onPointerUp),window.addEventListener("pointercancel",this._onPointerUp))}),m(this,"_onPointerMove",e=>{if(this._pointerId==null||e.pointerId!==this._pointerId)return;e.preventDefault();const i=this.getBoundingClientRect(),s=this.direction==="horizontal"?i.width:i.height;if(!s)return;const n=this.direction==="horizontal"?e.clientX-i.left:e.clientY-i.top,a=Math.min(Math.max(this.min,n/s),this.max);this.ratio=a,this._applyRatio(),this.dispatchEvent(new CustomEvent("dp-panes-resize",{detail:{ratio:a},bubbles:!0,composed:!0}))}),m(this,"_onPointerUp",e=>{this._pointerId==null||e.pointerId!==this._pointerId||(this._pointerId=null,this._splitterEl?.classList.remove("dragging"),window.removeEventListener("pointermove",this._onPointerMove),window.removeEventListener("pointerup",this._onPointerUp),window.removeEventListener("pointercancel",this._onPointerUp),this.dispatchEvent(new CustomEvent("dp-panes-resize",{detail:{ratio:this.ratio,committed:!0},bubbles:!0,composed:!0})))})}firstUpdated(){this._splitterEl=this.shadowRoot?.querySelector(".pane-splitter")??null,this._applyRatio()}updated(e){(e.has("ratio")||e.has("direction")||e.has("secondHidden"))&&this._applyRatio()}_applyRatio(){this.style.setProperty("--dp-panes-top-size",`${Math.round(this.ratio*1e3)/10}%`)}render(){return f`
      <div class="pane-first"><slot name="first"></slot></div>
      ${this.secondHidden?null:f`
            <button
              class="pane-splitter"
              type="button"
              aria-label="Resize panes"
              @pointerdown=${this._onPointerDown}
            ></button>
            <div class="pane-second"><slot name="second"></slot></div>
          `}
    `}}r=ne(H);I=new WeakMap;R=new WeakMap;M=new WeakMap;L=new WeakMap;C=new WeakMap;x(r,4,"direction",T,c,I);x(r,4,"ratio",G,c,R);x(r,4,"min",q,c,M);x(r,4,"max",B,c,L);x(r,4,"secondHidden",j,c,C);ae(r,c);m(c,"styles",te);customElements.define("resizable-panes",c);const he={title:"Atoms/Interactive/Resizable Panes",component:"resizable-panes",parameters:{actions:{handles:["dp-panes-resize"]}}},p=t=>`display:flex;align-items:center;justify-content:center;height:100%;background:${t};color:#fff;font-size:0.85rem;border-radius:4px;`,z={render:()=>f`
    <resizable-panes style="display:block;height:300px;">
      <div slot="first" style=${p("var(--primary-color, #03a9f4)")}>
        First pane
      </div>
      <div slot="second" style=${p("var(--accent-color, #ff9800)")}>
        Second pane
      </div>
    </resizable-panes>
  `},w={render:()=>f`
    <resizable-panes
      .direction=${"horizontal"}
      style="display:block;height:300px;"
    >
      <div slot="first" style=${p("var(--primary-color, #03a9f4)")}>
        Left pane
      </div>
      <div slot="second" style=${p("var(--accent-color, #ff9800)")}>
        Right pane
      </div>
    </resizable-panes>
  `},S={render:()=>f`
    <resizable-panes .ratio=${.3} style="display:block;height:300px;">
      <div slot="first" style=${p("var(--primary-color, #03a9f4)")}>
        30% pane
      </div>
      <div slot="second" style=${p("var(--accent-color, #ff9800)")}>
        70% pane
      </div>
    </resizable-panes>
  `},$={render:()=>f`
    <resizable-panes .secondHidden=${!0} style="display:block;height:300px;">
      <div slot="first" style=${p("var(--primary-color, #03a9f4)")}>
        Full-width pane
      </div>
      <div slot="second" style=${p("var(--accent-color, #ff9800)")}>
        Hidden pane
      </div>
    </resizable-panes>
  `};z.parameters={...z.parameters,docs:{...z.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <resizable-panes style="display:block;height:300px;">
      <div slot="first" style=\${paneStyle("var(--primary-color, #03a9f4)")}>
        First pane
      </div>
      <div slot="second" style=\${paneStyle("var(--accent-color, #ff9800)")}>
        Second pane
      </div>
    </resizable-panes>
  \`
}`,...z.parameters?.docs?.source}}};w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <resizable-panes
      .direction=\${"horizontal"}
      style="display:block;height:300px;"
    >
      <div slot="first" style=\${paneStyle("var(--primary-color, #03a9f4)")}>
        Left pane
      </div>
      <div slot="second" style=\${paneStyle("var(--accent-color, #ff9800)")}>
        Right pane
      </div>
    </resizable-panes>
  \`
}`,...w.parameters?.docs?.source}}};S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <resizable-panes .ratio=\${0.3} style="display:block;height:300px;">
      <div slot="first" style=\${paneStyle("var(--primary-color, #03a9f4)")}>
        30% pane
      </div>
      <div slot="second" style=\${paneStyle("var(--accent-color, #ff9800)")}>
        70% pane
      </div>
    </resizable-panes>
  \`
}`,...S.parameters?.docs?.source}}};$.parameters={...$.parameters,docs:{...$.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <resizable-panes .secondHidden=\${true} style="display:block;height:300px;">
      <div slot="first" style=\${paneStyle("var(--primary-color, #03a9f4)")}>
        Full-width pane
      </div>
      <div slot="second" style=\${paneStyle("var(--accent-color, #ff9800)")}>
        Hidden pane
      </div>
    </resizable-panes>
  \`
}`,...$.parameters?.docs?.source}}};const ve=["Default","Horizontal","CustomRatio","SecondHidden"];export{S as CustomRatio,z as Default,w as Horizontal,$ as SecondHidden,ve as __namedExportsOrder,he as default};
