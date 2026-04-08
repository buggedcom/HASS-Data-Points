import{e as p}from"./index-BVN6m9Ti.js";import{i as _,g as y,b as c}from"./iframe-maWesKjk.js";import{c as x}from"./mock-hass-fqpCrfSc.js";import{A as f,D as w}from"./constants-B5c5KCbY.js";import{l as C}from"./logger-CXy2rxCm.js";import{r as v}from"./target-selection-BHyMPCgW.js";import"./feedback-banner-DFx7uwUC.js";import"./quick-annotation-DYEd2znA.js";import"./preload-helper-PPVm8Dsz.js";import"./property-DyW-YDBW.js";const q=_`
  :host {
    display: block;
    height: 100%;
  }
  ha-card {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    overflow: hidden;
    box-sizing: border-box;
    position: relative;
    gap: 12px;
  }
  feedback-banner {
    position: absolute;
    left: 12px;
    right: 12px;
    bottom: 2px;
    --dp-feedback-margin-top: 0;
    --dp-feedback-padding: 2px 8px;
    --dp-feedback-radius: 4px;
  }
  .card-header {
    padding: 16px 16px 0;
    font-size: 1rem;
    font-weight: 500;
    line-height: 1.5;
    color: var(--primary-text-color);
  }
  .card-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    flex: 1 1 auto;
    min-height: 0;
  }
  .card-content.with-header {
    padding-top: 12px;
  }
  .input-row {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .input-row ha-textfield {
    flex: 1;
  }
`;var R=Object.defineProperty,E=(s,t,a)=>t in s?R(s,t,{enumerable:!0,configurable:!0,writable:!0,value:a}):s[t]=a,m=(s,t,a)=>E(s,typeof t!="symbol"?t+"":t,a);class u extends y{constructor(){super(),this._config={},this._hass=null,this._feedbackClass="",this._feedbackText="",this._feedbackVisible=!1,this._annotation=""}setConfig(t){this._config=t||{}}set hass(t){this._hass=t}get hass(){return this._hass}firstUpdated(){const t=this.shadowRoot?.querySelector("#msg");t&&t.addEventListener("keydown",a=>{a.key==="Enter"&&(a.preventDefault(),this._record())})}async _record(){const t=this.shadowRoot?.querySelector("#msg"),a=(t?.value||"").trim();if(!a){t?.focus();return}const o=this.shadowRoot?.querySelector("#btn");o&&(o.disabled=!0);const e=this._config,n={message:a,icon:e.icon||"mdi:bookmark",color:e.color||f},d=this._annotation.trim();d&&(n.annotation=d);let i;e.target?i=v(this._hass,e.target):e.entity?i=[e.entity]:e.entities?i=Array.isArray(e.entities)?e.entities:[e.entities]:i=[],i.length&&(n.entity_ids=i);try{const r=this._hass;if(!r)return;await r.callService(w,"record",n),window.dispatchEvent(new CustomEvent("hass-datapoints-event-recorded")),t&&(t.value=""),this._annotation="",this._feedbackClass="ok",this._feedbackText="Recorded!",this._feedbackVisible=!0,setTimeout(()=>{this&&(this._feedbackVisible=!1)},2500)}catch(r){const b=r;this._feedbackClass="err",this._feedbackText=`Error: ${b.message||"unknown error"}`,this._feedbackVisible=!0,C.error("[hass-datapoints quick-card]",r)}o&&(o.disabled=!1)}render(){const t=this._config,a=t.icon||"mdi:bookmark",o=t.color||f,e=!!t.title,n=!!t.show_annotation;return c`
      <ha-card>
        ${e?c` <div class="card-header">${t.title}</div> `:""}
        <div class="card-content ${e?"with-header":""}">
          <div class="input-row">
            <ha-textfield
              id="msg"
              .placeholder=${t.placeholder||"Note something…"}
            ></ha-textfield>
            <ha-button
              id="btn"
              raised
              style=${`--mdc-theme-primary: ${o}`}
              @click=${this._record}
            >
              <ha-icon .icon=${a} slot="icon"></ha-icon>
              Record
            </ha-button>
          </div>
          ${n?c`
                <quick-annotation
                  .value=${this._annotation}
                  @dp-annotation-input=${d=>{this._annotation=d.detail.value}}
                ></quick-annotation>
              `:""}
        </div>
        <feedback-banner
          .kind=${this._feedbackClass}
          .text=${this._feedbackText}
          .visible=${this._feedbackVisible}
          variant="quick"
        ></feedback-banner>
      </ha-card>
    `}static getConfigElement(){return document.createElement("hass-datapoints-quick-card-editor")}static getStubConfig(){return{title:"Quick Record"}}getGridOptions(){const t=!!this._config?.show_annotation,a=!!this._config?.title,o=t?3:1,e=a?o+1:o;return{rows:e,min_rows:e,max_rows:e}}getCardSize(){const t=this._config?.show_annotation?3:1;return this._config?.title?t+1:t}}m(u,"properties",{_config:{type:Object,state:!0},_hass:{type:Object,state:!0},_feedbackClass:{type:String,state:!0},_feedbackText:{type:String,state:!0},_feedbackVisible:{type:Boolean,state:!0},_annotation:{type:String,state:!0}});m(u,"styles",q);customElements.get("hass-datapoints-quick-card")||customElements.define("hass-datapoints-quick-card",u);const P={title:"Cards/Quick Card",component:"hass-datapoints-quick-card"};function g(s){return s.querySelector("hass-datapoints-quick-card")}const k=x(),l={render:()=>c`<hass-datapoints-quick-card></hass-datapoints-quick-card>`,play:async({canvasElement:s})=>{const t=g(s);t.setConfig({title:"Quick Record"}),t.hass=k,await t.updateComplete,p(t.shadowRoot?.querySelector("ha-textfield#msg")).toBeTruthy(),p(t.shadowRoot?.textContent).toContain("Quick Record")}},h={render:()=>c`<hass-datapoints-quick-card></hass-datapoints-quick-card>`,play:async({canvasElement:s})=>{const t=g(s);t.setConfig({title:"Quick Record",show_annotation:!0}),t.hass=k,await t.updateComplete,p(t.shadowRoot?.querySelector("quick-annotation")).toBeTruthy()}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => html\`<hass-datapoints-quick-card></hass-datapoints-quick-card>\`,
  play: async ({
    canvasElement
  }) => {
    const card = getCard(canvasElement) as HassRecordsQuickCard & {
      updateComplete: Promise<void>;
    };
    card.setConfig({
      title: "Quick Record"
    });
    card.hass = mockHass as never;
    await card.updateComplete;
    expect(card.shadowRoot?.querySelector("ha-textfield#msg")).toBeTruthy();
    expect(card.shadowRoot?.textContent).toContain("Quick Record");
  }
}`,...l.parameters?.docs?.source}}};h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  render: () => html\`<hass-datapoints-quick-card></hass-datapoints-quick-card>\`,
  play: async ({
    canvasElement
  }) => {
    const card = getCard(canvasElement) as HassRecordsQuickCard & {
      updateComplete: Promise<void>;
    };
    card.setConfig({
      title: "Quick Record",
      show_annotation: true
    });
    card.hass = mockHass as never;
    await card.updateComplete;
    expect(card.shadowRoot?.querySelector("quick-annotation")).toBeTruthy();
  }
}`,...h.parameters?.docs?.source}}};const I=["Default","WithAnnotation"];export{l as Default,h as WithAnnotation,I as __namedExportsOrder,P as default};
