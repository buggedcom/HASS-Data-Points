import{i as Z,A as ee,b as u,g as te}from"./iframe-maWesKjk.js";import{e as A,u as ae}from"./index-BVN6m9Ti.js";import{n as k}from"./property-DyW-YDBW.js";import"./preload-helper-PPVm8Dsz.js";const se=Z`
  :host {
    display: inline-block;
  }
  label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.85rem;
    cursor: pointer;
    color: var(--primary-text-color);
  }
  label.disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
  input[type="checkbox"] {
    cursor: pointer;
    margin: 0;
  }
  input[type="checkbox"]:disabled {
    cursor: not-allowed;
  }
`;var re=Object.create,B=Object.defineProperty,ne=Object.getOwnPropertyDescriptor,D=(e,t)=>(t=Symbol[e])?t:Symbol.for("Symbol."+e),x=e=>{throw TypeError(e)},R=(e,t,a)=>t in e?B(e,t,{enumerable:!0,configurable:!0,writable:!0,value:a}):e[t]=a,oe=e=>[,,,re(e?.[D("metadata")]??null)],P=["class","method","getter","setter","accessor","field","value","get","set"],y=e=>e!==void 0&&typeof e!="function"?x("Function expected"):e,ce=(e,t,a,r,n)=>({kind:P[e],name:t,metadata:r,addInitializer:c=>a._?x("Already initialized"):n.push(y(c||null))}),le=(e,t)=>R(t,D("metadata"),e[3]),o=(e,t,a,r)=>{for(var n=0,c=e[t>>1],i=c&&c.length;n<i;n++)t&1?c[n].call(a):r=c[n].call(a,r);return r},v=(e,t,a,r,n,c)=>{for(var i,l,O,b,f,q=t&7,J=!1,K=!1,T=e.length+1,Q=P[q+5],V=e[T-1]=[],X=e[T]||(e[T]=[]),h=(n=n.prototype,ne({get[a](){return de(this,c)},set[a](p){return he(this,c,p)}},a)),E=r.length-1;E>=0;E--)b=ce(q,a,O={},e[3],X),b.static=J,b.private=K,f=b.access={has:p=>a in p},f.get=p=>p[a],f.set=(p,Y)=>p[a]=Y,l=(0,r[E])({get:h.get,set:h.set},b),O._=1,l===void 0?y(l)&&(h[Q]=l):typeof l!="object"||l===null?x("Object expected"):(y(i=l.get)&&(h.get=i),y(i=l.set)&&(h.set=i),y(i=l.init)&&V.unshift(i));return h&&B(n,a,h),n},ie=(e,t,a)=>R(e,t+"",a),F=(e,t,a)=>t.has(e)||x("Cannot "+a),de=(e,t,a)=>(F(e,t,"read from private field"),t.get(e)),_=(e,t,a)=>t.has(e)?x("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(e):t.set(e,a),he=(e,t,a,r)=>(F(e,t,"write to private field"),t.set(e,a),a),L,U,G,N,j,C,s,I,M,W,z,H;class d extends(C=te,j=[k({type:Boolean})],N=[k({type:String})],G=[k({type:Boolean})],U=[k({type:String,attribute:"help-text"})],L=[k({type:String,attribute:"help-id"})],C){constructor(){super(...arguments),_(this,I,o(s,8,this,!1)),o(s,11,this),_(this,M,o(s,12,this,"")),o(s,15,this),_(this,W,o(s,16,this,!1)),o(s,19,this),_(this,z,o(s,20,this,"")),o(s,23,this),_(this,H,o(s,24,this,"")),o(s,27,this)}_onChange(t){const a=t.target;this.dispatchEvent(new CustomEvent("dp-check-change",{detail:{checked:a.checked},bubbles:!0,composed:!0}))}render(){const t=this.disabled?"disabled":"";return u`
      <label class=${t}>
        <input
          type="checkbox"
          .checked=${this.checked}
          ?disabled=${this.disabled}
          @change=${this._onChange}
        />
        <span>${this.label}</span>
        ${this.helpText?u`<ha-tooltip
              .id=${this.helpId}
              .content=${this.helpText}
            ></ha-tooltip>`:ee}
      </label>
    `}}s=oe(C);I=new WeakMap;M=new WeakMap;W=new WeakMap;z=new WeakMap;H=new WeakMap;v(s,4,"checked",j,d,I);v(s,4,"label",N,d,M);v(s,4,"disabled",G,d,W);v(s,4,"helpText",U,d,z);v(s,4,"helpId",L,d,H);le(s,d);ie(d,"styles",se);customElements.define("analysis-checkbox",d);const _e={title:"Atoms/Form/Analysis Checkbox",component:"analysis-checkbox"},m={render:()=>u`
    <analysis-checkbox .label=${"Enable threshold"}></analysis-checkbox>
  `},g={render:()=>u`
    <analysis-checkbox
      .checked=${!0}
      .label=${"Show trend line"}
    ></analysis-checkbox>
  `},$={render:()=>u`
    <analysis-checkbox
      .label=${"Moving average"}
      .disabled=${!0}
    ></analysis-checkbox>
  `},S={render:()=>u`
    <analysis-checkbox
      .label=${"Threshold"}
      .helpText=${"Draws a horizontal reference line at the specified value"}
      .helpId=${"threshold-help"}
    ></analysis-checkbox>
  `,play:async({canvasElement:e})=>{const t=e.querySelector("analysis-checkbox"),a=t.shadowRoot.querySelector("input"),r=t.shadowRoot.querySelector("ha-tooltip");A(r).toBeTruthy(),await ae.click(a),A(a.checked).toBe(!0)}},w={render:()=>u`
    <analysis-checkbox
      .checked=${!0}
      .label=${"Standard deviation"}
      .helpText=${"Shows the standard deviation band around the mean"}
      .helpId=${"stddev-help"}
    ></analysis-checkbox>
  `};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <analysis-checkbox .label=\${"Enable threshold"}></analysis-checkbox>
  \`
}`,...m.parameters?.docs?.source}}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <analysis-checkbox
      .checked=\${true}
      .label=\${"Show trend line"}
    ></analysis-checkbox>
  \`
}`,...g.parameters?.docs?.source}}};$.parameters={...$.parameters,docs:{...$.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <analysis-checkbox
      .label=\${"Moving average"}
      .disabled=\${true}
    ></analysis-checkbox>
  \`
}`,...$.parameters?.docs?.source}}};S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <analysis-checkbox
      .label=\${"Threshold"}
      .helpText=\${"Draws a horizontal reference line at the specified value"}
      .helpId=\${"threshold-help"}
    ></analysis-checkbox>
  \`,
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const el = canvasElement.querySelector("analysis-checkbox") as HTMLElement & {
      shadowRoot: ShadowRoot;
    };
    const input = el.shadowRoot.querySelector("input") as HTMLInputElement;
    const tooltip = el.shadowRoot.querySelector("ha-tooltip");
    expect(tooltip).toBeTruthy();
    await userEvent.click(input);
    expect(input.checked).toBe(true);
  }
}`,...S.parameters?.docs?.source}}};w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <analysis-checkbox
      .checked=\${true}
      .label=\${"Standard deviation"}
      .helpText=\${"Shows the standard deviation band around the mean"}
      .helpId=\${"stddev-help"}
    ></analysis-checkbox>
  \`
}`,...w.parameters?.docs?.source}}};const ye=["Unchecked","Checked","Disabled","WithHelpText","CheckedWithHelp"];export{g as Checked,w as CheckedWithHelp,$ as Disabled,m as Unchecked,S as WithHelpText,ye as __namedExportsOrder,_e as default};
