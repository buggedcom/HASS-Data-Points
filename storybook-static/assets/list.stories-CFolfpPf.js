import{e as v}from"./index-BVN6m9Ti.js";import{i as L,g as H,b as m}from"./iframe-maWesKjk.js";import{c as P}from"./mock-hass-fqpCrfSc.js";import{m as c}from"./localize-Cz1ya3ms.js";import{D as M}from"./constants-B5c5KCbY.js";import{r as O}from"./target-selection-BHyMPCgW.js";import{f as F,n as q,u as A,d as N}from"./events-api-hvJ4BhpZ.js";import{c as Q}from"./ha-components-CKxdFIwL.js";import"./search-bar-B1P0kLN7.js";import"./pagination-CjLcFMPQ.js";import"./list-event-item-3Sed5e7m.js";import{l as E}from"./logger-CXy2rxCm.js";import{l as B}from"./localized-decorator-CXjGGqe_.js";import"./preload-helper-PPVm8Dsz.js";import"./format-DAmR8eHG.js";import"./property-DyW-YDBW.js";import"./state-D8ZE3MQ0.js";import"./color-BkgFqjP8.js";import"./entity-name-TOInf1r0.js";import"./list-edit-form-CEN9a3dg.js";const K=L`
  :host {
    display: block;
    height: 100%;
  }
  ha-card {
    overflow: hidden;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  .card-header {
    padding: 16px 16px 0;
    font-size: 1.1em;
    font-weight: 500;
    color: var(--primary-text-color);
    flex: 0 0 auto;
  }
  .search-wrap {
    padding: var(--dp-spacing-md);
    flex: 0 0 auto;
    border-bottom: 1px solid var(--divider-color, #eee);
    background: color-mix(
      in srgb,
      var(--card-background-color, #fff) 92%,
      var(--primary-background-color, #f7f7f7)
    );
  }
  .search-wrap input {
    width: 100%;
  }
  .list-scroll {
    flex: 1 1 0;
    min-height: 0;
    overflow-y: auto;
  }
  .event-list {
    padding: 0 12px 12px;
    box-sizing: border-box;
  }
  .pagination-wrap {
    flex: 0 0 auto;
    border-top: 1px solid var(--divider-color, #eee);
    background: color-mix(
      in srgb,
      var(--card-background-color, #fff) 92%,
      var(--primary-background-color, #f7f7f7)
    );
  }
  .empty {
    text-align: center;
    padding: 32px 16px;
    color: var(--secondary-text-color);
    font-size: 0.9em;
  }
  .empty ha-icon {
    --mdc-icon-size: 32px;
    display: block;
    margin: 0 auto 8px;
    opacity: 0.5;
  }
`;var W=Object.create,b=Object.defineProperty,j=Object.getOwnPropertyDescriptor,x=(s,t)=>(t=Symbol[s])?t:Symbol.for("Symbol."+s),S=s=>{throw TypeError(s)},R=(s,t,e)=>t in s?b(s,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):s[t]=e,V=(s,t)=>b(s,"name",{value:t,configurable:!0}),Z=s=>[,,,W(s?.[x("metadata")]??null)],G=["class","method","getter","setter","accessor","field","value","get","set"],z=s=>s!==void 0&&typeof s!="function"?S("Function expected"):s,J=(s,t,e,i,a)=>({kind:G[s],name:t,metadata:i,addInitializer:o=>e._?S("Already initialized"):a.push(z(o||null))}),U=(s,t)=>R(t,x("metadata"),s[3]),X=(s,t,e,i)=>{for(var a=0,o=s[t>>1],n=o&&o.length;a<n;a++)o[a].call(e);return i},Y=(s,t,e,i,a,o)=>{var n,d,r,h=t&7,l=!1,_=0,T=s[_]||(s[_]=[]),w=h&&(a=a.prototype,h<5&&(h>3||!l)&&j(a,e));V(a,e);for(var y=i.length-1;y>=0;y--)r=J(h,e,d={},s[3],T),n=(0,i[y])(a,r),d._=1,z(n)&&(a=n);return U(s,a),w&&b(a,e,w),l?h^4?o:w:a},p=(s,t,e)=>R(s,typeof t!="symbol"?t+"":t,e),k,C,$;k=[B()];class u extends($=H){constructor(){super(),p(this,"_pageSize",15),p(this,"_configKey",""),p(this,"_unsubscribe",null),p(this,"_windowListener",null),p(this,"_initialized",!1),this._config={},this._hass=null,this._allEvents=[],this._searchQuery="",this._page=0,this._editingId=null,this._editColor="#03a9f4"}setConfig(t){const e=JSON.stringify(t);this._configKey!==e&&(this._configKey=e,this._config=t||{},t.page_size&&(this._pageSize=t.page_size),this._hass&&this._load())}set hass(t){const e=!this._hass;this._hass=t,e&&(this._load(),this._setupAutoRefresh())}get hass(){return this._hass}connectedCallback(){super.connectedCallback(),this._windowListener=()=>this._load(),window.addEventListener("hass-datapoints-event-recorded",this._windowListener)}disconnectedCallback(){super.disconnectedCallback(),this._unsubscribe&&(this._unsubscribe(),this._unsubscribe=null),this._windowListener&&(window.removeEventListener("hass-datapoints-event-recorded",this._windowListener),this._windowListener=null)}_setupAutoRefresh(){this._hass&&this._hass.connection.subscribeEvents(()=>this._load(),`${M}_event_recorded`).then(t=>{this._unsubscribe=t}).catch(()=>{})}async _load(){if(!this._hass||!this._config)return;const t=this._config,e=t.zoom_end_time||t.end_time||void 0;let i=t.zoom_start_time||t.start_time||void 0;if(!i&&t.hours_to_show){const r=e?new Date(e):new Date;i=new Date(r.getTime()-t.hours_to_show*3600*1e3).toISOString()}i||(i=new Date(0).toISOString());const a=e||new Date().toISOString();let o;if(t.target){const r=O(this._hass,t.target);o=r.length?r:void 0}else t.entity?o=[t.entity]:t.entities?o=t.entities.map(r=>typeof r=="string"?r:r.entity):o=void 0;const n=this._hass;if(!n){this._allEvents=[];return}const d=await F(n,i,a,t.datapoint_scope==="all"?void 0:o);this._allEvents=[...d].reverse()}_filtered(){const t=(this._config.message_filter||"").toLowerCase().trim(),e=this._searchQuery.toLowerCase().trim();return this._allEvents.filter(i=>{const a=[i.message.toLowerCase(),(i.annotation||"").toLowerCase(),...(i.entity_ids||[]).map(o=>o.toLowerCase())];return!(t&&!a.some(o=>o.includes(t))||e&&!a.some(o=>o.includes(e)))})}_onSearch(t){this._searchQuery=t.detail.query,this._page=0}_onPageChange(t){this._page=t.detail.page,this.shadowRoot?.querySelector(".list-scroll")?.scrollTo(0,0)}_navigateToEventHistory(t){const e=this._getNavigationContextForEvent(t);q(this,{entity_id:t?.entity_ids||[],device_id:t?.device_ids||[],area_id:t?.area_ids||[],label_id:t?.label_ids||[]},{start_time:e?.start_time,end_time:e?.end_time,zoom_start_time:e?.zoom_start_time,zoom_end_time:e?.zoom_end_time,datapoint_scope:typeof this._config?.datapoint_scope=="string"?this._config.datapoint_scope:void 0})}_getNavigationContextForEvent(t){const e=this._config||{},i=e.start_time||null,a=e.end_time||null,o=e.zoom_start_time||null,n=e.zoom_end_time||null;if(i&&a)return{start_time:i,end_time:a,zoom_start_time:o,zoom_end_time:n};const d=t?.timestamp?new Date(t.timestamp):null;if(!d||!Number.isFinite(d.getTime()))return null;const r=new Date(d.getTime()-12*3600*1e3),h=new Date(d.getTime()+12*3600*1e3);return{start_time:r.toISOString(),end_time:h.toISOString()}}_openEdit(t){this._editingId=t.id,this._editColor=t.color||"#03a9f4"}_closeEdit(){this._editingId=null}async _saveEdit(t,e){const i=e.message.trim(),a=e.annotation.trim(),o=e.icon||"mdi:bookmark",n=e.color||this._editColor;if(!i)return;const d=this._hass;if(d)try{await A(d,t.id,{message:i,annotation:a||i,icon:o,color:n}),this._closeEdit(),await this._load()}catch(r){E.error("[hass-datapoints list-card] update failed",r)}}async _deleteEvent(t){const e=t.message||"this record";if(!await Q(this,{title:c("Delete record"),message:`${c("Delete")} ${e}?`,confirmLabel:c("Delete record")}))return;const a=this._hass;if(a)try{await N(a,t.id),await this._load()}catch(o){E.error("[hass-datapoints list-card] delete failed",o)}}_toggleVisibility(t){this.dispatchEvent(new CustomEvent("hass-datapoints-toggle-event-visibility",{bubbles:!0,composed:!0,detail:{eventId:t.id}}))}_fireMoreInfo(t){this.dispatchEvent(new CustomEvent("hass-more-info",{bubbles:!0,composed:!0,detail:{entityId:t}}))}_handleHoverEventRecord(t){this.dispatchEvent(new CustomEvent("hass-datapoints-hover-event-record",{bubbles:!0,composed:!0,detail:{eventId:t.detail.eventId,hovered:t.detail.hovered===!0,eventRecord:t.detail.eventRecord}}))}_itemContext(t){const e=this._config,i=(e.hidden_event_ids||[]).includes(t.id);return i!==t._lastHidden&&(t._lastHidden=i),{hass:this._hass,showActions:e.show_actions!==!1,showEntities:e.show_entities!==!1,showFullMessage:e.show_full_message!==!1,hidden:i,editing:this._editingId===t.id,editColor:this._editColor,language:{showAnnotation:c("Show annotation"),openHistory:c("Open related data point history"),editRecord:c("Edit record"),deleteRecord:c("Delete record"),showChartMarker:c("Show chart marker"),hideChartMarker:c("Hide chart marker"),chooseColor:c("Choose colour"),save:c("Save"),cancel:c("Cancel"),message:c("Message"),annotationFullMessage:c("Annotation / full message")}}}render(){const t=this._config,e=t.show_search!==!1,i=this._filtered(),a=i.length,o=this._pageSize,n=Math.max(1,Math.ceil(a/o)),d=Math.min(this._page,n-1),r=i.slice(d*o,(d+1)*o),h=n>1;return m`
      <ha-card>
        ${t.title?m`<div class="card-header">${t.title}</div>`:""}
        ${e?m`
              <div class="search-wrap">
                <search-bar
                  .query=${this._searchQuery}
                  .placeholder=${c("Search datapoints…")}
                  @dp-search=${this._onSearch}
                ></search-bar>
              </div>
            `:""}
        <div class="list-scroll">
          <div class="event-list">
            ${a===0?m`
                  <div class="empty">
                    <ha-icon icon="mdi:bookmark-off-outline"></ha-icon>
                    ${this._searchQuery?"No matching datapoints.":"No datapoints yet."}
                  </div>
                `:r.map(l=>m`
                    <list-event-item
                      .eventRecord=${l}
                      .context=${this._itemContext(l)}
                      @dp-open-history=${()=>{this._navigateToEventHistory(l)}}
                      @dp-edit-event=${()=>{this._openEdit(l)}}
                      @dp-delete-event=${()=>{this._deleteEvent(l)}}
                      @dp-toggle-visibility=${()=>{this._toggleVisibility(l)}}
                      @dp-hover-event-record=${_=>{this._handleHoverEventRecord(_)}}
                      @dp-more-info=${_=>{this._fireMoreInfo(_.detail.entityId)}}
                      @dp-save-edit=${_=>{this._saveEdit(l,_.detail.values)}}
                      @dp-cancel-edit=${()=>{this._closeEdit()}}
                    ></list-event-item>
                  `)}
          </div>
        </div>
        ${h?m`
              <div class="pagination-wrap">
                <pagination-nav
                  .page=${d}
                  .totalPages=${n}
                  .totalItems=${a}
                  label="records"
                  @dp-page-change=${this._onPageChange}
                ></pagination-nav>
              </div>
            `:""}
      </ha-card>
    `}static getConfigElement(){return document.createElement("hass-datapoints-list-card-editor")}static getStubConfig(){return{}}getGridOptions(){const t=this._config?.show_search!==!1?4:3;return{rows:t,min_rows:t}}}C=Z($);u=Y(C,0,"HassRecordsListCard",k,u);p(u,"properties",{_config:{state:!0},_hass:{state:!0},_allEvents:{state:!0},_searchQuery:{state:!0},_page:{state:!0},_editingId:{state:!0},_editColor:{state:!0}});p(u,"styles",K);X(C,1,u);customElements.get("hass-datapoints-list-card")||customElements.define("hass-datapoints-list-card",u);const yt={title:"Cards/List Card",component:"hass-datapoints-list-card"};function D(s){return s.querySelector("hass-datapoints-list-card")}function I(){return P({states:{"sensor.temperature":{state:"21.5",attributes:{friendly_name:"Temperature",unit_of_measurement:"°C"}}},connection:{subscribeEvents:()=>Promise.resolve(()=>{}),sendMessagePromise:s=>s.type==="hass_datapoints/events"?Promise.resolve({events:[{id:"evt-1",message:"Window opened",annotation:"Opened while heating was on",icon:"mdi:window-open",color:"#2196f3",timestamp:"2026-03-31T10:00:00Z",entity_id:null,entity_ids:["sensor.temperature"],device_id:null,area_id:null,label_id:null,dev:!1},{id:"evt-2",message:"Heating started",annotation:null,icon:"mdi:radiator",color:"#ff9800",timestamp:"2026-03-31T09:00:00Z",entity_id:null,entity_ids:["sensor.temperature"],device_id:null,area_id:null,label_id:null,dev:!1}]}):Promise.resolve({})}})}const g={render:()=>m`<hass-datapoints-list-card></hass-datapoints-list-card>`,play:async({canvasElement:s})=>{const t=D(s);t.setConfig({title:"Recent Datapoints"}),t.hass=I(),await t._load(),await t.updateComplete,v(t.shadowRoot?.querySelector("search-bar")).toBeTruthy(),v(t.shadowRoot?.querySelectorAll("list-event-item").length).toBe(2)}},f={render:()=>m`<hass-datapoints-list-card></hass-datapoints-list-card>`,play:async({canvasElement:s})=>{const t=D(s);t.setConfig({title:"Recent Datapoints",show_search:!1}),t.hass=I(),await t._load(),await t.updateComplete,v(t.shadowRoot?.querySelector("search-bar")).toBeNull(),v(t.shadowRoot?.textContent).toContain("Recent Datapoints")}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  render: () => html\`<hass-datapoints-list-card></hass-datapoints-list-card>\`,
  play: async ({
    canvasElement
  }) => {
    const card = getCard(canvasElement) as HassRecordsListCard & {
      updateComplete: Promise<void>;
      _load: () => Promise<void>;
    };
    card.setConfig({
      title: "Recent Datapoints"
    });
    card.hass = makeMockHass() as never;
    await card._load();
    await card.updateComplete;
    expect(card.shadowRoot?.querySelector("search-bar")).toBeTruthy();
    expect(card.shadowRoot?.querySelectorAll("list-event-item").length).toBe(2);
  }
}`,...g.parameters?.docs?.source}}};f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  render: () => html\`<hass-datapoints-list-card></hass-datapoints-list-card>\`,
  play: async ({
    canvasElement
  }) => {
    const card = getCard(canvasElement) as HassRecordsListCard & {
      updateComplete: Promise<void>;
      _load: () => Promise<void>;
    };
    card.setConfig({
      title: "Recent Datapoints",
      show_search: false
    });
    card.hass = makeMockHass() as never;
    await card._load();
    await card.updateComplete;
    expect(card.shadowRoot?.querySelector("search-bar")).toBeNull();
    expect(card.shadowRoot?.textContent).toContain("Recent Datapoints");
  }
}`,...f.parameters?.docs?.source}}};const bt=["Default","WithoutSearch"];export{g as Default,f as WithoutSearch,bt as __namedExportsOrder,yt as default};
