import{i as K,b as c,g as Q}from"./iframe-maWesKjk.js";import{e as D}from"./index-BVN6m9Ti.js";import{n as w}from"./property-DyW-YDBW.js";import"./preload-helper-PPVm8Dsz.js";const U=K`
  :host {
    display: block;
  }
  .item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 8px 12px;
    border-bottom: 1px solid var(--divider-color, #333);
  }
  .icon-wrap {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 0.75rem;
  }
  .content {
    flex: 1;
    min-width: 0;
  }
  .message {
    font-size: 0.85rem;
    color: var(--primary-text-color);
    word-break: break-word;
  }
  .annotation {
    font-size: 0.78rem;
    color: var(--secondary-text-color);
    margin-top: 2px;
    font-style: italic;
  }
  .time {
    font-size: 0.72rem;
    color: var(--secondary-text-color);
    margin-top: 2px;
  }
  .actions {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
  }
  .action-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 2px 6px;
    font-size: 0.75rem;
    color: var(--secondary-text-color);
    border-radius: 4px;
  }
  .action-btn:hover {
    background: color-mix(in srgb, var(--primary-text-color) 10%, transparent);
  }
  .action-btn.delete:hover {
    color: var(--error-color, #f44336);
  }
`;var V=Object.create,I=Object.defineProperty,X=Object.getOwnPropertyDescriptor,L=(t,e)=>(e=Symbol[t])?e:Symbol.for("Symbol."+t),_=t=>{throw TypeError(t)},P=(t,e,n)=>e in t?I(t,e,{enumerable:!0,configurable:!0,writable:!0,value:n}):t[e]=n,Y=t=>[,,,V(t?.[L("metadata")]??null)],q=["class","method","getter","setter","accessor","field","value","get","set"],h=t=>t!==void 0&&typeof t!="function"?_("Function expected"):t,ee=(t,e,n,i,r)=>({kind:q[t],name:e,metadata:i,addInitializer:a=>n._?_("Already initialized"):r.push(h(a||null))}),te=(t,e)=>P(e,L("metadata"),t[3]),p=(t,e,n,i)=>{for(var r=0,a=t[e>>1],l=a&&a.length;r<l;r++)e&1?a[r].call(n):i=a[r].call(n,i);return i},S=(t,e,n,i,r,a)=>{for(var l,s,M,u,x,R=e&7,F=!1,N=!1,y=t.length+1,H=q[R+5],G=t[y-1]=[],Z=t[y]||(t[y]=[]),d=(r=r.prototype,X({get[n](){return re(this,a)},set[n](v){return oe(this,a,v)}},n)),E=i.length-1;E>=0;E--)u=ee(R,n,M={},t[3],Z),u.static=F,u.private=N,x=u.access={has:v=>n in v},x.get=v=>v[n],x.set=(v,J)=>v[n]=J,s=(0,i[E])({get:d.get,set:d.set},u),M._=1,s===void 0?h(s)&&(d[H]=s):typeof s!="object"||s===null?_("Object expected"):(h(l=s.get)&&(d.get=l),h(l=s.set)&&(d.set=l),h(l=s.init)&&G.unshift(l));return d&&I(r,n,d),r},ne=(t,e,n)=>P(t,e+"",n),A=(t,e,n)=>e.has(t)||_("Cannot "+n),re=(t,e,n)=>(A(t,e,"read from private field"),e.get(t)),$=(t,e,n)=>e.has(t)?_("Cannot add the same private member more than once"):e instanceof WeakSet?e.add(t):e.set(t,n),oe=(t,e,n,i)=>(A(t,e,"write to private field"),e.set(t,n),n),W,j,B,k,o,z,O,T;class m extends(k=Q,B=[w({type:Object})],j=[w({type:Object})],W=[w({type:Boolean})],k){constructor(){super(...arguments),$(this,z,p(o,8,this,null)),p(o,11,this),$(this,O,p(o,12,this,null)),p(o,15,this),$(this,T,p(o,16,this,!1)),p(o,19,this)}_formatTime(e){if(!e)return"";try{return new Date(e).toLocaleString()}catch{return e}}_onDelete(){this.dispatchEvent(new CustomEvent("dp-event-delete",{detail:{id:this.event?.id},bubbles:!0,composed:!0}))}_onEdit(){this.dispatchEvent(new CustomEvent("dp-event-edit",{detail:{id:this.event?.id},bubbles:!0,composed:!0}))}render(){if(!this.event)return c``;const e=this.event;return c`
      <div class="item">
        <div class="icon-wrap" style="background-color: ${e.color||"#888"}">
          ${e.icon?c`<ha-icon
                .icon=${e.icon}
                style="--mdc-icon-size: 16px; color: #fff;"
              ></ha-icon>`:""}
        </div>
        <div class="content">
          <div class="message">${e.message||""}</div>
          ${e.annotation?c`<div class="annotation">${e.annotation}</div>`:""}
          <div class="time">${this._formatTime(e.timestamp)}</div>
        </div>
        ${this.editable?c`
              <div class="actions">
                <button
                  class="action-btn"
                  data-action="edit"
                  @click=${this._onEdit}
                >
                  Edit
                </button>
                <button
                  class="action-btn delete"
                  data-action="delete"
                  @click=${this._onDelete}
                >
                  Delete
                </button>
              </div>
            `:""}
      </div>
    `}}o=Y(k);z=new WeakMap;O=new WeakMap;T=new WeakMap;S(o,4,"event",B,m,z);S(o,4,"hass",j,m,O);S(o,4,"editable",W,m,T);te(o,m);ne(m,"styles",U);customElements.define("event-list-item",m);const ce={title:"Molecules/Event List Item",component:"event-list-item"},C={id:"evt-001",message:"Turned on lights",annotation:"Manual override due to guests arriving",icon:"mdi:lightbulb",color:"#ff9800",timestamp:"2026-03-31T08:15:00Z"},b={render:()=>c`
    <event-list-item .event=${C} .editable=${!0}></event-list-item>
  `,play:async({canvasElement:t})=>{const e=t.querySelector("event-list-item");D(e.shadowRoot.textContent).toContain("Turned on lights"),D(e.shadowRoot.querySelector("[data-action='delete']")).toBeTruthy()}},f={render:()=>c`
    <event-list-item .event=${C} .editable=${!1}></event-list-item>
  `},g={render:()=>c`
    <event-list-item
      .event=${{...C,annotation:null}}
      .editable=${!0}
    ></event-list-item>
  `};b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <event-list-item .event=\${sampleEvent} .editable=\${true}></event-list-item>
  \`,
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const el = canvasElement.querySelector("event-list-item") as HTMLElement & {
      shadowRoot: ShadowRoot;
    };
    expect(el.shadowRoot.textContent).toContain("Turned on lights");
    expect(el.shadowRoot.querySelector("[data-action='delete']")).toBeTruthy();
  }
}`,...b.parameters?.docs?.source}}};f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:"{\n  render: () => html`\n    <event-list-item .event=${sampleEvent} .editable=${false}></event-list-item>\n  `\n}",...f.parameters?.docs?.source}}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <event-list-item
      .event=\${{
    ...sampleEvent,
    annotation: null
  }}
      .editable=\${true}
    ></event-list-item>
  \`
}`,...g.parameters?.docs?.source}}};const de=["Editable","ReadOnly","NoAnnotation"];export{b as Editable,g as NoAnnotation,f as ReadOnly,de as __namedExportsOrder,ce as default};
