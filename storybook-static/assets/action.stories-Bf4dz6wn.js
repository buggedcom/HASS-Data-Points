import{e as p}from"./index-BVN6m9Ti.js";import{i as x,g as k,b as c}from"./iframe-maWesKjk.js";import{c as C}from"./mock-hass-fqpCrfSc.js";import{D as S}from"./constants-B5c5KCbY.js";import"./color-swatch-vfYtshcF.js";import"./feedback-banner-DFx7uwUC.js";import"./action-targets-DgnUedy-.js";import{l as T}from"./logger-CXy2rxCm.js";import"./preload-helper-PPVm8Dsz.js";import"./property-DyW-YDBW.js";import"./state-D8ZE3MQ0.js";import"./chip-group-CRK0J3ni.js";import"./entity-chip-B-eFJyDu.js";const E=x`
  :host {
    display: block;
  }

  ha-card {
    padding: 16px;
  }

  .card-header {
    font-size: 1.1em;
    font-weight: 500;
    margin-bottom: 16px;
    color: var(--primary-text-color);
  }

  .form-group {
    margin-bottom: 12px;
  }

  .row {
    display: flex;
    gap: 10px;
    align-items: flex-end;
  }

  .row .form-group {
    flex: 1;
    min-width: 0;
  }

  .color-col {
    max-width: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .full-width-field {
    display: block;
    width: 100%;
  }

  .field-label {
    display: block;
    margin-bottom: 6px;
    font-size: 0.84rem;
    font-weight: 500;
    color: var(--secondary-text-color);
  }

  .annotation-input {
    display: block;
    width: 100%;
    min-height: 104px;
    resize: vertical;
    box-sizing: border-box;
    padding: 12px;
    border: 1px solid
      var(--input-outlined-idle-border-color, var(--divider-color, #9e9e9e));
    border-radius: 12px;
    background: var(
      --card-background-color,
      var(--primary-background-color, #fff)
    );
    color: var(--primary-text-color);
    font: inherit;
    line-height: 1.45;
  }

  .annotation-input::placeholder {
    color: var(--secondary-text-color);
  }

  .annotation-input:focus {
    outline: 2px solid
      color-mix(in srgb, var(--primary-color, #03a9f4) 40%, transparent);
    outline-offset: 1px;
  }

  ha-button {
    display: block;
    margin-top: 8px;
    --mdc-theme-primary: var(--primary-color);
  }
`;var $=Object.defineProperty,R=(i,t,e)=>t in i?$(i,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):i[t]=e,u=(i,t,e)=>R(i,typeof t!="symbol"?t+"":t,e);class _ extends k{constructor(){super(),u(this,"_userTarget",{}),this._config={},this._hass=null,this._color="#03a9f4",this._feedbackClass="",this._feedbackText="",this._feedbackVisible=!1}setConfig(t){this._config=t||{},this._color=t?.default_color||"#03a9f4"}set hass(t){this._hass=t}get hass(){return this._hass}_nowStr(){const t=new Date,e=t.getFullYear(),a=String(t.getMonth()+1).padStart(2,"0"),o=String(t.getDate()).padStart(2,"0"),r=String(t.getHours()).padStart(2,"0"),s=String(t.getMinutes()).padStart(2,"0");return`${e}-${a}-${o}T${r}:${s}`}_configTarget(){const t=this._config,e=o=>o?Array.isArray(o)?o:[o]:[];let a;if(t.target)a=t.target;else if(t.entity)a={entity_id:[t.entity]};else if(t.entities?.length)a={entity_id:t.entities};else return{entity_id:[],device_id:[],area_id:[],label_id:[]};return{entity_id:e(a.entity_id),device_id:e(a.device_id),area_id:e(a.area_id),label_id:e(a.label_id)}}_configChipItems(){const t=this._configTarget(),e=[];return t.entity_id.forEach(a=>e.push({type:"entity",id:a})),t.device_id.forEach(a=>e.push({type:"device",id:a})),t.area_id.forEach(a=>e.push({type:"area",id:a})),t.label_id.forEach(a=>e.push({type:"label",id:a})),e}_mergeTargets(t,e){const a=r=>r?Array.isArray(r)?r:[r]:[],o=(r,s)=>[...new Set([...a(r),...a(s)])];return{entity_id:o(t.entity_id,e.entity_id),device_id:o(t.device_id,e.device_id),area_id:o(t.area_id,e.area_id),label_id:o(t.label_id,e.label_id)}}async _record(){const t=this.shadowRoot.querySelector("#msg"),e=(t?.value||"").trim();if(!e){t?.focus();return}const a=this.shadowRoot.querySelector("#btn");a&&(a.disabled=!0);const o={message:e},r=this.shadowRoot.querySelector("#ann"),s=(r?.value||"").trim();s&&(o.annotation=s);const m=this.shadowRoot.querySelector("#icon-picker")?.value;m&&(o.icon=m),o.color=this._color;const f=this.shadowRoot.querySelector("#date"),y=(f?.value||"").trim();y&&(o.date=y);const n=this._mergeTargets(this._configTarget(),this._userTarget);n.entity_id.length&&(o.entity_ids=n.entity_id),n.device_id.length&&(o.device_ids=n.device_id),n.area_id.length&&(o.area_ids=n.area_id),n.label_id.length&&(o.label_ids=n.label_id);try{await this._hass.callService(S,"record",o),window.dispatchEvent(new CustomEvent("hass-datapoints-event-recorded")),this.dispatchEvent(new CustomEvent("hass-datapoints-action-recorded",{bubbles:!0,composed:!0,detail:{...o}})),t&&(t.value=""),r&&(r.value=""),f&&(f.value=this._config.default_date||this._nowStr()),this._userTarget={};const d=this.shadowRoot.querySelector("action-targets");d?.resetSelection&&d.resetSelection(),this._feedbackClass="ok",this._feedbackText="Event recorded!",this._feedbackVisible=!0,setTimeout(()=>{this._feedbackVisible=!1},3e3)}catch(d){const v=d;this._feedbackClass="err",this._feedbackText=`Error: ${v.message||"unknown error"}`,this._feedbackVisible=!0,T.error("[hass-datapoints action-card]",d)}a&&(a.disabled=!1)}_onColorChange(t){this._color=t.detail.color}_onTargetChanged(t){this._userTarget=t.detail.value||{}}_onAnnKeydown(t){t.key==="Enter"&&(t.ctrlKey||t.metaKey)&&(t.preventDefault(),this._record())}render(){const t=this._config,e=!!t.title,a=t.show_date!==!1,o=t.show_annotation!==!1,r=t.show_config_targets!==!1,s=t.show_target_picker!==!1,g=this._configChipItems();return c`
      <ha-card>
        ${e?c`<div class="card-header">${t.title}</div>`:""}

        <div class="form-group">
          <ha-textfield
            id="msg"
            class="full-width-field"
            label="Message *"
            placeholder="What happened?"
          ></ha-textfield>
        </div>

        ${o?c`
              <div class="form-group">
                <label class="field-label" for="ann">Annotation</label>
                <textarea
                  id="ann"
                  class="annotation-input"
                  placeholder="Detailed note shown on chart hover…"
                  @keydown=${this._onAnnKeydown}
                ></textarea>
              </div>
            `:""}
        ${a?c`
              <div class="form-group">
                <ha-textfield
                  id="date"
                  class="full-width-field"
                  label="Date & Time"
                  type="datetime-local"
                  .value=${t.default_date||this._nowStr()}
                ></ha-textfield>
              </div>
            `:""}

        <div class="row">
          <div class="form-group">
            <ha-icon-picker
              id="icon-picker"
              class="full-width-field"
              label="Icon"
              .value=${t.default_icon||"mdi:bookmark"}
              .hass=${this._hass}
            ></ha-icon-picker>
          </div>
          <div class="form-group color-col">
            <color-swatch
              .color=${this._color}
              @dp-color-change=${this._onColorChange}
            ></color-swatch>
          </div>
        </div>

        <div class="form-group" id="target-wrap">
          <action-targets
            .hass=${this._hass}
            .showConfigTargets=${r}
            .showTargetPicker=${s}
            .configChips=${g}
            @dp-target-change=${this._onTargetChanged}
          ></action-targets>
        </div>

        <ha-button id="btn" raised @click=${this._record}>
          ${t.submit_label||"Record Event"}
        </ha-button>

        <feedback-banner
          .kind=${this._feedbackClass}
          .text=${this._feedbackText}
          .visible=${this._feedbackVisible}
        ></feedback-banner>
      </ha-card>
    `}static getConfigElement(){return document.createElement("hass-datapoints-action-card-editor")}static getStubConfig(){return{title:"Record Event"}}getGridOptions(){const t=this._config?.show_annotation!==!1;return{rows:t?10:7,min_rows:t?10:7,max_rows:t?10:7}}getCardSize(){return this._config?.show_annotation!==!1?10:7}}u(_,"properties",{_config:{state:!0},_hass:{state:!0},_color:{state:!0},_feedbackClass:{state:!0},_feedbackText:{state:!0},_feedbackVisible:{state:!0}});u(_,"styles",E);customElements.get("hass-datapoints-action-card")||customElements.define("hass-datapoints-action-card",_);const W={title:"Cards/Action Card",component:"hass-datapoints-action-card"};function b(i){return i.querySelector("hass-datapoints-action-card")}const w=C(),l={render:()=>c`<hass-datapoints-action-card></hass-datapoints-action-card>`,play:async({canvasElement:i})=>{const t=b(i);t.setConfig({title:"Record Event"}),t.hass=w,await t.updateComplete,p(t.shadowRoot?.querySelector("ha-textfield#msg")).toBeTruthy(),p(t.shadowRoot?.textContent).toContain("Record Event")}},h={render:()=>c`<hass-datapoints-action-card></hass-datapoints-action-card>`,play:async({canvasElement:i})=>{const t=b(i);t.setConfig({title:"Bedroom Note",show_annotation:!0,entity:"sensor.temperature",show_target_picker:!0}),t.hass=w,await t.updateComplete,p(t.shadowRoot?.querySelector("action-targets")).toBeTruthy(),p(t.shadowRoot?.querySelector("textarea#ann")).toBeTruthy()}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => html\`<hass-datapoints-action-card></hass-datapoints-action-card>\`,
  play: async ({
    canvasElement
  }) => {
    const card = getCard(canvasElement) as HassRecordsActionCard & {
      updateComplete: Promise<void>;
    };
    card.setConfig({
      title: "Record Event"
    });
    card.hass = mockHass as never;
    await card.updateComplete;
    expect(card.shadowRoot?.querySelector("ha-textfield#msg")).toBeTruthy();
    expect(card.shadowRoot?.textContent).toContain("Record Event");
  }
}`,...l.parameters?.docs?.source}}};h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  render: () => html\`<hass-datapoints-action-card></hass-datapoints-action-card>\`,
  play: async ({
    canvasElement
  }) => {
    const card = getCard(canvasElement) as HassRecordsActionCard & {
      updateComplete: Promise<void>;
    };
    card.setConfig({
      title: "Bedroom Note",
      show_annotation: true,
      entity: "sensor.temperature",
      show_target_picker: true
    });
    card.hass = mockHass as never;
    await card.updateComplete;
    expect(card.shadowRoot?.querySelector("action-targets")).toBeTruthy();
    expect(card.shadowRoot?.querySelector("textarea#ann")).toBeTruthy();
  }
}`,...h.parameters?.docs?.source}}};const F=["Default","WithTargetsAndAnnotation"];export{l as Default,h as WithTargetsAndAnnotation,F as __namedExportsOrder,W as default};
