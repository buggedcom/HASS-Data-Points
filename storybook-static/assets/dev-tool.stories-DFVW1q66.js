import{e as T}from"./index-BVN6m9Ti.js";import{i as se,g as oe,b as B}from"./iframe-maWesKjk.js";import{c as ne}from"./mock-hass-fqpCrfSc.js";import{D as I}from"./constants-B5c5KCbY.js";import{c as ae}from"./ha-components-CKxdFIwL.js";import{e as re}from"./format-DAmR8eHG.js";import{l as q}from"./logger-CXy2rxCm.js";import{m as ie}from"./localize-Cz1ya3ms.js";import{n as de}from"./property-DyW-YDBW.js";import{r as le}from"./state-D8ZE3MQ0.js";import{l as ce}from"./localized-decorator-CXjGGqe_.js";import"./feedback-banner-DFx7uwUC.js";import"./dev-tool-results-7zrzigGW.js";import"./dev-tool-windows-Cqz0ff1a.js";import"./preload-helper-PPVm8Dsz.js";const ue=`
  :host { display: block; }
  ha-card { padding: 16px; }
  .card-header {
    font-size: 1.1em;
    font-weight: 500;
    margin-bottom: 16px;
    color: var(--primary-text-color);
  }
  .section-title {
    font-size: 0.8em;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--secondary-text-color);
    letter-spacing: 0.06em;
    margin: 0 0 10px;
  }
  ha-selector {
    display: block;
    width: 100%;
  }
  .form-group {
    margin-bottom: 12px;
  }
  .analyze-row {
    margin-top: 14px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .divider {
    border: none;
    border-top: 1px solid var(--divider-color, #e0e0e0);
    margin: 20px 0;
  }
  .dev-summary {
    display: flex;
    align-items: center;
    padding: 10px 14px;
    background: var(--secondary-background-color, rgba(0,0,0,0.04));
    border-radius: 8px;
    margin-bottom: 10px;
  }
  .dev-count-label {
    font-size: 0.88em;
    color: var(--primary-text-color);
  }
  .dev-count-num {
    font-weight: 600;
    color: var(--primary-color);
  }
  .delete-btn {
    --mdc-theme-primary: var(--error-color, #f44336);
  }
`,he=se`
  :host {
    display: block;
  }
  .ed {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 4px 0 8px;
  }
`;var pe=Object.create,F=Object.defineProperty,me=Object.getOwnPropertyDescriptor,U=(s,e)=>(e=Symbol[s])?e:Symbol.for("Symbol."+s),k=s=>{throw TypeError(s)},J=(s,e,t)=>e in s?F(s,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):s[e]=t,L=(s,e)=>F(s,"name",{value:e,configurable:!0}),fe=s=>[,,,pe(s?.[U("metadata")]??null)],Q=["class","method","getter","setter","accessor","field","value","get","set"],C=s=>s!==void 0&&typeof s!="function"?k("Function expected"):s,_e=(s,e,t,n,o)=>({kind:Q[s],name:e,metadata:n,addInitializer:a=>t._?k("Already initialized"):o.push(C(a||null))}),ve=(s,e)=>J(e,U("metadata"),s[3]),R=(s,e,t,n)=>{for(var o=0,a=s[e>>1],d=a&&a.length;o<d;o++)e&1?a[o].call(t):n=a[o].call(t,n);return n},O=(s,e,t,n,o,a)=>{var d,u,w,h,v,r=e&7,b=!!(e&8),p=!!(e&16),i=r>3?s.length+1:r?b?1:2:0,_=Q[r+5],D=r>3&&(s[i-1]=[]),z=s[i]||(s[i]=[]),c=r&&(!p&&!b&&(o=o.prototype),r<5&&(r>3||!p)&&me(r<4?o:{get[t](){return V(this,a)},set[t](l){return G(this,a,l)}},t));r?p&&r<4&&L(a,(r>2?"set ":r>1?"get ":"")+t):L(o,t);for(var m=n.length-1;m>=0;m--)h=_e(r,t,w={},s[3],z),r&&(h.static=b,h.private=p,v=h.access={has:p?l=>ye(o,l):l=>t in l},r^3&&(v.get=p?l=>(r^1?V:be)(l,o,r^4?a:c.get):l=>l[t]),r>2&&(v.set=p?(l,f)=>G(l,o,f,r^4?a:c.set):(l,f)=>l[t]=f)),u=(0,n[m])(r?r<4?p?a:c[_]:r>4?void 0:{get:c.get,set:c.set}:o,h),w._=1,r^4||u===void 0?C(u)&&(r>4?D.unshift(u):r?p?a=u:c[_]=u:o=u):typeof u!="object"||u===null?k("Object expected"):(C(d=u.get)&&(c.get=d),C(d=u.set)&&(c.set=d),C(d=u.init)&&D.unshift(d));return r||ve(s,o),c&&F(o,t,c),p?r^4?a:c:o},ge=(s,e,t)=>J(s,e+"",t),H=(s,e,t)=>e.has(s)||k("Cannot "+t),ye=(s,e)=>Object(e)!==e?k('Cannot use the "in" operator on this value'):s.has(e),V=(s,e,t)=>(H(s,e,"read from private field"),t?t.call(s):e.get(s)),K=(s,e,t)=>e.has(s)?k("Cannot add the same private member more than once"):e instanceof WeakSet?e.add(s):e.set(s,t),G=(s,e,t,n)=>(H(s,e,"write to private field"),n?n.call(s,t):e.set(s,t),t),be=(s,e,t)=>(H(s,e,"access private method"),t),X,Y,P,Z,g,M,A;Z=[ce()];class y extends(P=oe,Y=[le()],X=[de({type:Object})],P){constructor(){super(...arguments),K(this,M,R(g,8,this,{})),R(g,11,this),K(this,A,R(g,12,this,null)),R(g,15,this)}setConfig(e){this._config={...e}}_fire(e){this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:{...e}},bubbles:!0,composed:!0}))}_set(e,t){const n={...this._config};t===""||t===null||t===void 0?delete n[e]:n[e]=t,this._config=n,this._fire(n)}}g=fe(P);M=new WeakMap;A=new WeakMap;O(g,4,"_config",Y,y,M);O(g,4,"hass",X,y,A);y=O(g,0,"EditorBase",Z,y);ge(y,"styles",he);R(g,1,y);customElements.define("editor-base",y);var we=Object.defineProperty,Ee=(s,e,t)=>e in s?we(s,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):s[e]=t,$e=(s,e,t)=>Ee(s,e+"",t);class ke extends y{render(){return B`
      <div class="ed">
        <p>
          ${ie("This card does not currently have configurable editor options.",{id:"This card does not currently have configurable editor options."})}
        </p>
      </div>
    `}}$e(ke,"styles",[y.styles]);var De=Object.defineProperty,Ce=(s,e,t)=>e in s?De(s,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):s[e]=t,$=(s,e,t)=>Ce(s,typeof e!="symbol"?e+"":e,t);class Re extends HTMLElement{constructor(){super(),$(this,"_config",{}),$(this,"_hass",null),$(this,"_rendered",!1),$(this,"_entities",[]),$(this,"_suppressEntityChange",!1),$(this,"_results",[]),this.attachShadow({mode:"open"})}setConfig(e){this._config=e||{}}set hass(e){this._hass=e,this._rendered||(this._render(),this._refreshDevCount()),this._updateHassOnChildren()}_updateHassOnChildren(){if(!this.shadowRoot||!this._hass)return;const e=this.shadowRoot.getElementById("entity-picker");e&&(this._suppressEntityChange=!0,e.hass=this._hass,e.value=this._entities,setTimeout(()=>{this._suppressEntityChange=!1},100))}_render(){this._rendered=!0;const e=this._config;this.shadowRoot.innerHTML=`
      <style>${ue}</style>
      <ha-card>
        ${e.title?`<div class="card-header">${re(e.title)}</div>`:""}

        <div class="section-title">Analyze HA History</div>

        <div class="form-group">
          <ha-selector id="entity-picker" label="Entities to analyze"></ha-selector>
        </div>

        <dev-tool-windows id="windows-editor"></dev-tool-windows>

        <div class="analyze-row">
          <ha-button id="analyze-btn" class="analyze-btn" raised>Analyze all windows</ha-button>
        </div>

        <feedback-banner id="analyze-status"></feedback-banner>

        <dev-tool-results id="results-container"></dev-tool-results>

        <hr class="divider">

        <div class="dev-section">
          <div class="section-title">Dev Datapoints</div>
          <div class="dev-summary">
            <span class="dev-count-label">Currently recorded:&nbsp;<span class="dev-count-num" id="dev-count">—</span>&nbsp;dev data point<span id="dev-count-plural">s</span></span>
          </div>
          <ha-button class="delete-btn" id="delete-dev-btn">Delete all dev datapoints</ha-button>
          <feedback-banner id="delete-status"></feedback-banner>
        </div>
      </ha-card>
    `;const t=this.shadowRoot.getElementById("entity-picker");t&&(t.selector={entity:{multiple:!0}},t.value=[],this._entities=[],this._suppressEntityChange=!1,t.addEventListener("value-changed",n=>{if(this._suppressEntityChange)return;const o=n.detail.value;Array.isArray(o)?this._entities=o:o?this._entities=[o]:this._entities=[]})),this.shadowRoot.getElementById("analyze-btn").addEventListener("click",()=>{this._analyzeHistory()}),this.shadowRoot.getElementById("delete-dev-btn").addEventListener("click",()=>{this._deleteAllDev()}),this.shadowRoot.getElementById("results-container").addEventListener("dp-record-selected-request",n=>{const o=n.detail;this._recordSelected(o.items)})}_readWindowConfigs(){return this.shadowRoot.getElementById("windows-editor").getWindowConfigs().map((t,n)=>({...t,label:t.label.trim()||`Window ${n+1}`}))}async _analyzeHistory(){if(!this._entities.length){this._showFeedback("analyze-status","err","Please select at least one entity.");return}const e=this._readWindowConfigs(),t=this.shadowRoot.getElementById("analyze-btn");t.disabled=!0,this._results=[],this._showFeedback("analyze-status","ok",`Fetching history for ${e.length} window${e.length===1?"":"s"}…`);try{const n=new Date;this._results=await Promise.all(e.map(async o=>{const a=o.startDt?new Date(o.startDt):n,d=o.endDt?new Date(o.endDt):n,u=await this._hass.connection.sendMessagePromise({type:"history/history_during_period",start_time:a.toISOString(),end_time:d.toISOString(),entity_ids:this._entities,include_start_time_state:!1,significant_changes_only:!1,no_attributes:!1}),w=this._detectChanges(u||{});return{id:o.id,label:o.label,startDt:o.startDt,endDt:o.endDt,changes:w,selected:w.map((h,v)=>v)}})),this._renderResults(),this._hideFeedback("analyze-status")}catch(n){this._showFeedback("analyze-status","err",`Error: ${n.message||"Failed to fetch history"}`),q.error("[hass-datapoints dev-tool]",n)}t.disabled=!1}_detectChanges(e){const t=[];for(const[n,o]of Object.entries(e)){const a=o;if(!a?.length)continue;const d=n.split(".")[0],u=this._hass?.states?.[n],w=u?.attributes?.device_class||"",h=u?.attributes?.friendly_name||n,v=u?.attributes?.unit_of_measurement||"";for(let r=0;r<a.length;r+=1){const b=a[r],p=r>0?a[r-1]:null,i=b.s,_=p?.s??null;if(i==="unavailable"||i==="unknown"||p&&_===i&&d!=="climate")continue;const D=b.lc??b.lu,z=D!=null?new Date(D*1e3).toISOString():new Date().toISOString();let c=null,m="mdi:bookmark",l="#03a9f4";if(d==="binary_sensor"||d==="input_boolean")c=`${h}: ${this._binaryLabel(w,i)}`,m=i==="on"?"mdi:toggle-switch":"mdi:toggle-switch-off",l=i==="on"?"#4caf50":"#9e9e9e";else if(d==="switch")c=`${h}: turned ${i==="on"?"on":"off"}`,m=i==="on"?"mdi:power-plug":"mdi:power-plug-off",l=i==="on"?"#ff9800":"#9e9e9e";else if(d==="light")c=`${h}: ${i==="on"?"on":"off"}`,m=i==="on"?"mdi:lightbulb":"mdi:lightbulb-off",l=i==="on"?"#ffee58":"#9e9e9e";else if(d==="cover"){const f={open:"opened",closed:"closed",opening:"opening",closing:"closing"};if(!f[i])continue;c=`${h}: ${f[i]}`,m=i==="open"||i==="opening"?"mdi:garage-open":"mdi:garage",l=i==="open"?"#4caf50":"#795548"}else if(d==="climate"){const f=b.a,E=p?.a,N=f?.temperature,te=E?.temperature;if(N!=null&&N!==te){const W=f?.temperature_unit||v||"°";c=`${h}: setpoint → ${N}${W}`,m="mdi:thermostat",l="#ff5722"}else if(!p||_!==i)c=`${h}: mode → ${{heat:"heating",cool:"cooling",auto:"auto",off:"off",heat_cool:"heat/cool",fan_only:"fan only",dry:"dry"}[i]||i}`,m="mdi:thermostat",l="#ff5722";else continue}else if(d==="sensor"){const f=parseFloat(i),E=_!=null?parseFloat(_):Number.NaN;if(Number.isNaN(f)||!Number.isNaN(E)&&Math.abs(f-E)<.5)continue;c=`${h}: ${i}${v}`,m="mdi:gauge",l="#2196f3"}else if(d==="input_number"||d==="number"){const f=parseFloat(i),E=_!=null?parseFloat(_):Number.NaN;if(Number.isNaN(f)||!Number.isNaN(E)&&f===E)continue;c=`${h}: → ${i}${v}`,m="mdi:numeric",l="#9c27b0"}else if(d==="input_select"||d==="select"){if(!p||_===i)continue;c=`${h}: → ${i}`,m="mdi:form-select",l="#009688"}else{if(!p||_===i)continue;c=`${h}: ${_} → ${i}`,m="mdi:swap-horizontal",l="#607d8b"}c&&t.push({timestamp:z,message:c,entity_id:n,icon:m,color:l})}}return t.sort((n,o)=>n.timestamp<o.timestamp?-1:1),t}_binaryLabel(e,t){const n=t==="on",a={door:["opened","closed"],window:["opened","closed"],garage_door:["opened","closed"],opening:["opened","closed"],lock:["locked","unlocked"],motion:["motion detected","motion cleared"],occupancy:["occupied","vacant"],presence:["home","away"],vibration:["vibrating","still"],plug:["plugged in","unplugged"],outlet:["on","off"],smoke:["smoke detected","smoke cleared"],moisture:["wet","dry"],running:["running","stopped"],connectivity:["connected","disconnected"],power:["on","off"],battery_charging:["charging","not charging"],battery:["low battery","battery normal"],cold:["cold","temperature normal"],heat:["heat","temperature normal"],light:["light detected","dark"],sound:["sound detected","quiet"]}[e];return a?n?a[0]:a[1]:n?"on":"off"}_renderResults(){const e=this.shadowRoot.getElementById("results-container");e.results=[...this._results],e.statusKind="",e.statusText="",e.statusVisible=!1}async _recordSelected(e){if(!e.length){this._showResultsStatus("err","No items selected.");return}this._showResultsStatus("ok",`Recording ${e.length} data point${e.length===1?"":"s"}…`);const t=await Promise.allSettled(e.map(a=>this._hass.callService(I,"record",{message:a.message,entity_ids:[a.entity_id],icon:a.icon,color:a.color,date:a.timestamp,dev:!0}))),n=t.filter(a=>a.status==="fulfilled").length,o=t.filter(a=>a.status==="rejected").length;o?this._showResultsStatus("err",`Recorded ${n}, failed ${o}.`):this._showResultsStatus("ok",`Recorded ${n} dev data point${n===1?"":"s"}!`),await this._refreshDevCount(),window.dispatchEvent(new CustomEvent("hass-datapoints-event-recorded"))}async _deleteAllDev(){const e=this.shadowRoot.getElementById("dev-count"),t=parseInt(e?.textContent??"0",10)||0;if(t===0){this._showFeedback("delete-status","err","No dev datapoints to delete.");return}if(!await ae(this,{title:"Delete dev datapoints",message:`Delete all ${t} dev data point${t===1?"":"s"}?`,confirmLabel:"Delete all"}))return;const o=this.shadowRoot.getElementById("delete-dev-btn");o.disabled=!0;try{const d=(await this._hass.connection.sendMessagePromise({type:`${I}/events/delete_dev`})).deleted;this._showFeedback("delete-status","ok",`Deleted ${d} dev data point${d===1?"":"s"}.`),await this._refreshDevCount(),window.dispatchEvent(new CustomEvent("hass-datapoints-event-recorded"))}catch(a){this._showFeedback("delete-status","err",`Error: ${a.message||"failed"}`)}o.disabled=!1}async _refreshDevCount(){try{const n=((await this._hass.connection.sendMessagePromise({type:`${I}/events`})).events||[]).filter(d=>d.dev).length,o=this.shadowRoot.getElementById("dev-count"),a=this.shadowRoot.getElementById("dev-count-plural");o&&(o.textContent=String(n)),a&&(a.textContent=n===1?"":"s")}catch(e){q.warn("[hass-datapoints dev-tool] refresh dev count failed",e)}}_showFeedback(e,t,n){const o=this.shadowRoot.getElementById(e);o&&(o.kind=t,o.text=n,o.visible=!0)}_hideFeedback(e){const t=this.shadowRoot.getElementById(e);t&&(t.visible=!1)}_showResultsStatus(e,t){const n=this.shadowRoot.getElementById("results-container");n.statusKind=e,n.statusText=t,n.statusVisible=!0}static getStubConfig(){return{title:"Dev Tool"}}static getConfigElement(){return document.createElement("hass-datapoints-dev-tool-card-editor")}}customElements.get("hass-datapoints-dev-tool-card")||customElements.define("hass-datapoints-dev-tool-card",Re);const Le={title:"Cards/Dev Tool Card",component:"hass-datapoints-dev-tool-card"};function j(s){return s.querySelector("hass-datapoints-dev-tool-card")}function ee(){return ne({states:{"sensor.temperature":{state:"21.5",attributes:{friendly_name:"Temperature",unit_of_measurement:"°C"}},"binary_sensor.window":{state:"off",attributes:{friendly_name:"Window",device_class:"window"}}},connection:{subscribeEvents:()=>Promise.resolve(()=>{}),sendMessagePromise:s=>s.type==="hass_datapoints/events"?Promise.resolve({events:[{id:"1",dev:!0},{id:"2",dev:!0}]}):s.type==="history/history_during_period"?Promise.resolve({"binary_sensor.window":[{s:"off",lc:1743408e3},{s:"on",lc:1743411600}]}):Promise.resolve({})}})}const S={render:()=>B`<hass-datapoints-dev-tool-card></hass-datapoints-dev-tool-card>`,play:async({canvasElement:s})=>{const e=j(s);e.setConfig({title:"Dev Tool"}),e.hass=ee(),T(e.shadowRoot?.querySelector("ha-selector#entity-picker")).toBeTruthy(),T(e.shadowRoot?.querySelector("dev-tool-windows")).toBeTruthy()}},x={render:()=>B`<hass-datapoints-dev-tool-card></hass-datapoints-dev-tool-card>`,play:async({canvasElement:s})=>{const e=j(s);e.setConfig({title:"Dev Tool"}),e.hass=ee(),e._entities=["binary_sensor.window"],await e._analyzeHistory(),T(e.shadowRoot?.querySelector("dev-tool-results")).toBeTruthy()}};S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  render: () => html\`<hass-datapoints-dev-tool-card></hass-datapoints-dev-tool-card>\`,
  play: async ({
    canvasElement
  }) => {
    const card = getCard(canvasElement);
    card.setConfig({
      title: "Dev Tool"
    });
    card.hass = makeMockHass() as never;
    expect(card.shadowRoot?.querySelector("ha-selector#entity-picker")).toBeTruthy();
    expect(card.shadowRoot?.querySelector("dev-tool-windows")).toBeTruthy();
  }
}`,...S.parameters?.docs?.source}}};x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  render: () => html\`<hass-datapoints-dev-tool-card></hass-datapoints-dev-tool-card>\`,
  play: async ({
    canvasElement
  }) => {
    const card = getCard(canvasElement) as HassRecordsDevToolCard & {
      _entities: string[];
      _analyzeHistory: () => Promise<void>;
    };
    card.setConfig({
      title: "Dev Tool"
    });
    card.hass = makeMockHass() as never;
    card._entities = ["binary_sensor.window"];
    await card._analyzeHistory();
    expect(card.shadowRoot?.querySelector("dev-tool-results")).toBeTruthy();
  }
}`,...x.parameters?.docs?.source}}};const Ve=["Default","WithResults"];export{S as Default,x as WithResults,Ve as __namedExportsOrder,Le as default};
