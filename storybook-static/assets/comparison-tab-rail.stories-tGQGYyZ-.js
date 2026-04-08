import{i as ie,b as z,g as se}from"./iframe-maWesKjk.js";import{f as oe,w as ne,u as de,e as ce}from"./index-BVN6m9Ti.js";import{n as A}from"./property-DyW-YDBW.js";import{e as le}from"./class-map-pAsNZYN8.js";import{c as pe}from"./repeat-Dcg3Fkk0.js";import{m as he}from"./localize-Cz1ya3ms.js";import"./comparison-tab-Blh0hT-9.js";import{l as be}from"./localized-decorator-CXjGGqe_.js";import"./preload-helper-PPVm8Dsz.js";import"./directive-jorct-Oe.js";const ve=ie`
  :host {
    display: block;
  }

  .chart-tabs-shell {
    position: relative;
    min-width: 0;
    border-bottom: 1px solid
      color-mix(
        in srgb,
        var(--divider-color, rgba(0, 0, 0, 0.12)) 88%,
        transparent
      );
    z-index: 1;
    display: flex;
    align-items: center;
    gap: calc(var(--dp-spacing-sm, 8px));
  }

  .chart-tabs-rail {
    min-width: 0;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
    padding-right: 10px;
    flex-grow: 1;
  }

  .chart-tabs-rail::-webkit-scrollbar {
    display: none;
  }

  .chart-tabs {
    display: flex;
    align-items: flex-end;
    width: 100%;
    min-width: 0;
    gap: 0;
    padding: 0 var(--dp-spacing-md);
    box-sizing: border-box;
  }

  .chart-tabs-add {
    margin-right: calc(var(--dp-spacing-sm, 16px));
    display: inline-flex;
    align-items: center;
    gap: calc(var(--spacing, 8px) * 0.75);
    padding: calc(var(--dp-spacing-sm, 8px) * 0.625) var(--dp-spacing-sm);
    height: 26px;
    border: 0;
    border-radius: 999px;
    background: color-mix(
      in srgb,
      var(--primary-color, #03a9f4) 12%,
      var(--card-background-color, #fff)
    );
    color: var(--primary-color, #03a9f4);
    font: inherit;
    font-size: 0.82rem;
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
    z-index: 2;
  }

  .chart-tabs-add ha-icon {
    --mdc-icon-size: 16px;
  }

  .chart-tabs-add:hover,
  .chart-tabs-add:focus-visible {
    background: color-mix(
      in srgb,
      var(--primary-color, #03a9f4) 18%,
      var(--card-background-color, #fff)
    );
    outline: none;
  }

  .chart-tabs-shell.overflowing .chart-tabs-add {
    top: var(--dp-spacing-xs);
    transform: none;
    width: 34px;
    min-width: 34px;
    height: 34px;
    padding: 0;
    justify-content: center;
    border-radius: 999px;
  }

  .chart-tabs-shell.overflowing .chart-tabs-add-label {
    display: none;
  }
`;var me=Object.create,B=Object.defineProperty,ge=Object.getOwnPropertyDescriptor,K=(e,a)=>(a=Symbol[e])?a:Symbol.for("Symbol."+e),m=e=>{throw TypeError(e)},Q=(e,a,t)=>a in e?B(e,a,{enumerable:!0,configurable:!0,writable:!0,value:t}):e[a]=t,U=(e,a)=>B(e,"name",{value:a,configurable:!0}),ue=e=>[,,,me(e?.[K("metadata")]??null)],V=["class","method","getter","setter","accessor","field","value","get","set"],x=e=>e!==void 0&&typeof e!="function"?m("Function expected"):e,fe=(e,a,t,n,i)=>({kind:V[e],name:a,metadata:n,addInitializer:s=>t._?m("Already initialized"):i.push(x(s||null))}),we=(e,a)=>Q(a,K("metadata"),e[3]),h=(e,a,t,n)=>{for(var i=0,s=e[a>>1],v=s&&s.length;i<v;i++)a&1?s[i].call(t):n=s[i].call(t,n);return n},S=(e,a,t,n,i,s)=>{var v,c,q,g,O,r=a&7,T=!!(a&8),p=!!(a&16),k=r>3?e.length+1:r?T?1:2:0,F=V[r+5],J=r>3&&(e[k-1]=[]),re=e[k]||(e[k]=[]),l=r&&(!p&&!T&&(i=i.prototype),r<5&&(r>3||!p)&&ge(r<4?i:{get[t](){return G(this,s)},set[t](d){return j(this,s,d)}},t));r?p&&r<4&&U(s,(r>2?"set ":r>1?"get ":"")+t):U(i,t);for(var E=n.length-1;E>=0;E--)g=fe(r,t,q={},e[3],re),r&&(g.static=T,g.private=p,O=g.access={has:p?d=>_e(i,d):d=>t in d},r^3&&(O.get=p?d=>(r^1?G:ye)(d,i,r^4?s:l.get):d=>d[t]),r>2&&(O.set=p?(d,R)=>j(d,i,R,r^4?s:l.set):(d,R)=>d[t]=R)),c=(0,n[E])(r?r<4?p?s:l[F]:r>4?void 0:{get:l.get,set:l.set}:i,g),q._=1,r^4||c===void 0?x(c)&&(r>4?J.unshift(c):r?p?s=c:l[F]=c:i=c):typeof c!="object"||c===null?m("Object expected"):(x(v=c.get)&&(l.get=v),x(v=c.set)&&(l.set=v),x(v=c.init)&&J.unshift(v));return r||we(e,i),l&&B(i,t,l),p?r^4?s:l:i},X=(e,a,t)=>Q(e,typeof a!="symbol"?a+"":a,t),P=(e,a,t)=>a.has(e)||m("Cannot "+t),_e=(e,a)=>Object(a)!==a?m('Cannot use the "in" operator on this value'):e.has(a),G=(e,a,t)=>(P(e,a,"read from private field"),t?t.call(e):a.get(e)),C=(e,a,t)=>a.has(e)?m("Cannot add the same private member more than once"):a instanceof WeakSet?a.add(e):a.set(e,t),j=(e,a,t,n)=>(P(e,a,"write to private field"),n?n.call(e,t):a.set(e,t),t),ye=(e,a,t)=>(P(e,a,"access private method"),t),Y,Z,ee,ae,$,te,o,W,N,L,D;te=[be()];class b extends($=se,ae=[A({type:Array})],ee=[A({type:Array,attribute:!1})],Z=[A({type:String,attribute:"hovered-id"})],Y=[A({type:Boolean})],$){constructor(){super(...arguments),C(this,W,h(o,8,this,[])),h(o,11,this),C(this,N,h(o,12,this,[])),h(o,15,this),C(this,L,h(o,16,this,"")),h(o,19,this),C(this,D,h(o,20,this,!1)),h(o,23,this),X(this,"_resizeObserver")}connectedCallback(){super.connectedCallback(),this._resizeObserver=new ResizeObserver(()=>this._checkOverflow()),this.updateComplete.then(()=>{const a=this.shadowRoot?.querySelector(".chart-tabs-shell");a&&this._resizeObserver.observe(a)})}disconnectedCallback(){super.disconnectedCallback(),this._resizeObserver?.disconnect()}_checkOverflow(){const a=this.shadowRoot?.querySelector(".chart-tabs-shell");if(!a)return;const t=a.querySelector(".chart-tabs-rail");t&&(this.overflowing=t.scrollWidth>t.clientWidth)}_onAddClick(){this.dispatchEvent(new CustomEvent("dp-tab-add",{detail:{},bubbles:!0,composed:!0}))}render(){const a=le({"chart-tabs-shell":!0,overflowing:this.overflowing});return z`
      <div class=${a}>
        <div class="chart-tabs-rail">
          <div class="chart-tabs">
            ${pe(this.tabs,t=>t.id,t=>z`
                <comparison-tab
                  .tabId=${t.id}
                  .label=${t.label}
                  .detail=${t.detail}
                  .active=${t.active}
                  .previewing=${this.hoveredId===t.id}
                  .loading=${this.loadingIds.includes(t.id)}
                  .editable=${t.editable}
                ></comparison-tab>
              `)}
          </div>
        </div>
        <button type="button" class="chart-tabs-add" @click=${this._onAddClick}>
          <ha-icon icon="mdi:plus"></ha-icon>
          <span class="chart-tabs-add-label">${he("Add date window")}</span>
        </button>
      </div>
    `}}o=ue($);W=new WeakMap;N=new WeakMap;L=new WeakMap;D=new WeakMap;S(o,4,"tabs",ae,b,W);S(o,4,"loadingIds",ee,b,N);S(o,4,"hoveredId",Z,b,L);S(o,4,"overflowing",Y,b,D);b=S(o,0,"ComparisonTabRail",te,b);X(b,"styles",ve);h(o,1,b);customElements.define("comparison-tab-rail",b);const H={id:"current-range",label:"Selected range",detail:"1 Jan – 7 Jan 2025",active:!0,editable:!1},M=[{id:"window-1",label:"Heating season",detail:"1 Nov – 31 Mar",active:!1,editable:!0},{id:"window-2",label:"Summer 2024",detail:"1 Jun – 31 Aug 2024",active:!1,editable:!0}],ze={title:"Molecules/Comparison Tab Rail",component:"comparison-tab-rail",parameters:{actions:{handles:["dp-tab-activate","dp-tab-hover","dp-tab-leave","dp-tab-edit","dp-tab-delete","dp-tab-add"]},docs:{description:{component:'`comparison-tab-rail` renders the full comparison tab bar, consisting of a\nscrollable row of `comparison-tab` elements and an "Add date window" button.\n\n@fires dp-tab-activate - `{ tabId: string }` re-dispatched from child tabs\n@fires dp-tab-hover - `{ tabId: string }` re-dispatched from child tabs\n@fires dp-tab-leave - `{ tabId: string }` re-dispatched from child tabs\n@fires dp-tab-edit - `{ tabId: string }` re-dispatched from child tabs\n@fires dp-tab-delete - `{ tabId: string }` re-dispatched from child tabs\n@fires dp-tab-add - `{}` fired when the "Add date window" button is clicked'}}},argTypes:{tabs:{control:"object",description:"Array of tab descriptors. Each item: `{ id, label, detail, active, editable }`."},loadingIds:{control:"object",description:"Array of tab IDs currently loading data. Matching tabs show a spinner."},hoveredId:{control:"text",description:"ID of the tab currently being previewed (hovered). Sets `previewing` on that tab."},overflowing:{control:"boolean",description:"When true, the rail is overflowing and the Add button collapses to an icon."}},args:{tabs:[H,...M],loadingIds:[],hoveredId:"",overflowing:!1},render:e=>z`
    <comparison-tab-rail
      .tabs=${e.tabs}
      .loadingIds=${e.loadingIds}
      .hoveredId=${e.hoveredId}
      .overflowing=${e.overflowing}
    ></comparison-tab-rail>
  `},u={},f={args:{tabs:[H]}},w={args:{loadingIds:["window-1"]}},_={args:{hoveredId:"window-1"}},y={args:{tabs:[{...H,active:!1},{...M[0],active:!0},M[1]]}},I={play:async({canvasElement:e})=>{const a=e.querySelector("comparison-tab-rail"),t=oe();a.addEventListener("dp-tab-add",t);const n=ne(a.shadowRoot);await de.click(n.getByRole("button",{name:/add date window/i})),await ce(t).toHaveBeenCalledOnce()}};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:"{}",...u.parameters?.docs?.source},description:{story:"Current range tab active, two editable comparison tabs.",...u.parameters?.docs?.description}}};f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  args: {
    tabs: [CURRENT_TAB]
  }
}`,...f.parameters?.docs?.source},description:{story:"Only the current-range tab — no comparison windows added yet.",...f.parameters?.docs?.description}}};w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  args: {
    loadingIds: ["window-1"]
  }
}`,...w.parameters?.docs?.source},description:{story:"One comparison tab is loading data (shows spinner).",...w.parameters?.docs?.description}}};_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  args: {
    hoveredId: "window-1"
  }
}`,..._.parameters?.docs?.source},description:{story:"A comparison tab is being previewed (stronger underline).",..._.parameters?.docs?.description}}};y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  args: {
    tabs: [{
      ...CURRENT_TAB,
      active: false
    }, {
      ...COMPARISON_TABS[0],
      active: true
    }, COMPARISON_TABS[1]]
  }
}`,...y.parameters?.docs?.source},description:{story:"A comparison window tab is the active tab.",...y.parameters?.docs?.description}}};I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const host = canvasElement.querySelector("comparison-tab-rail") as HTMLElement;
    const handler = fn();
    host.addEventListener("dp-tab-add", handler);
    const canvas = within(host.shadowRoot as unknown as HTMLElement);
    await userEvent.click(canvas.getByRole("button", {
      name: /add date window/i
    }));
    await expect(handler).toHaveBeenCalledOnce();
  }
}`,...I.parameters?.docs?.source},description:{story:'Fires dp-tab-add when the "Add date window" button is clicked.',...I.parameters?.docs?.description}}};const $e=["Default","SingleTab","OneTabLoading","TabPreviewing","ComparisonWindowActive","EmitsTabAdd"];export{y as ComparisonWindowActive,u as Default,I as EmitsTabAdd,w as OneTabLoading,f as SingleTab,_ as TabPreviewing,$e as __namedExportsOrder,ze as default};
