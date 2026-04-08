import{e as l}from"./format-DAmR8eHG.js";import{m as c}from"./localize-Cz1ya3ms.js";const p=["ha-form","ha-icon","ha-icon-button","ha-selector","ha-textfield","ha-icon-picker","ha-icon-button","ha-entity-picker","ha-select","ha-dialog","ha-sortable","ha-svg-icon","ha-alert","ha-button","ha-color-picker","ha-badge","ha-sankey-chart","mwc-button"],d=async n=>{const t=n||p;try{if(t.every(r=>customElements.get(r)))return;await Promise.race([customElements.whenDefined("partial-panel-resolver"),new Promise((r,i)=>setTimeout(()=>i(new Error("Timeout waiting for partial-panel-resolver")),1e4))]);const o=document.createElement("partial-panel-resolver");if(!o)throw new Error("Failed to create partial-panel-resolver element");if(o.hass={panels:[{url_path:"tmp",component_name:"config"}]},typeof o._updateRoutes!="function")throw new Error("partial-panel-resolver does not have _updateRoutes method");if(o._updateRoutes(),!o.routerOptions?.routes?.tmp?.load)throw new Error("Failed to create tmp route in partial-panel-resolver");await Promise.race([o.routerOptions.routes.tmp.load(),new Promise((r,i)=>setTimeout(()=>i(new Error("Timeout loading tmp route")),1e4))]),await Promise.race([customElements.whenDefined("ha-panel-config"),new Promise((r,i)=>setTimeout(()=>i(new Error("Timeout waiting for ha-panel-config")),1e4))]);const a=document.createElement("ha-panel-config");if(!a)throw new Error("Failed to create ha-panel-config element");if(!a.routerOptions?.routes?.automation?.load)throw new Error("ha-panel-config does not have automation route");await Promise.race([a.routerOptions.routes.automation.load(),new Promise((r,i)=>setTimeout(()=>i(new Error("Timeout loading automation components")),1e4))]);const e=t.filter(r=>!customElements.get(r));if(e.length>0)throw new Error(`Failed to load components: ${e.join(", ")}`)}catch(o){console.error("Error loading Home Assistant form components:",o);try{if(window.customElements&&window.customElements.get("home-assistant")){console.log("Attempting fallback loading method for HA components");const a=new CustomEvent("ha-request-load-components",{detail:{components:t},bubbles:!0,composed:!0});document.dispatchEvent(a)}}catch(a){console.error("Fallback loading method failed:",a)}}},h=6e3,f=new Set(["ha-form","ha-icon","ha-icon-button","ha-selector","ha-textfield","ha-icon-picker","ha-entity-picker","ha-select","ha-dialog","ha-sortable","ha-svg-icon","ha-alert","ha-button","ha-color-picker","ha-badge","ha-sankey-chart","mwc-button"]),g=new Set(["ha-target-picker","ha-date-range-picker"]);async function w(n=[]){const t=n.filter(o=>g.has(o)&&!customElements.get(o));if(t.length)try{const a=document.querySelector("home-assistant")?.hass?.panels;if(!a?.history){logger.warn("[hass-datapoints ha] history panel not available for preload");return}const e=document.createElement("partial-panel-resolver");if(typeof e._updateRoutes!="function"){logger.warn("[hass-datapoints ha] partial-panel-resolver missing _updateRoutes");return}e.hass={panels:a},e._updateRoutes();const r=e.routerOptions?.routes?.history?.load;if(typeof r!="function"){logger.warn("[hass-datapoints ha] history route loader missing");return}await r()}catch(o){logger.warn("[hass-datapoints ha] history route preload failed",{historyTags:t,message:o instanceof Error?o.message:String(o)})}}function y(n,t=h){return n?customElements.get(n)?Promise.resolve(!0):Promise.race([customElements.whenDefined(n).then(()=>!0),new Promise(o=>{window.setTimeout(()=>{logger.warn("[hass-datapoints ha] component wait timed out",{tag:n,timeoutMs:t}),o(!1)},t)})]):Promise.resolve(!1)}function E(n=[]){const t=[...new Set((n||[]).filter(Boolean))],o=t.filter(e=>f.has(e));return Promise.resolve().then(()=>typeof d=="function"&&o.length?Promise.resolve(d(o)).catch(e=>{logger.warn("[hass-datapoints ha] loader failed",{loaderTags:o,message:e instanceof Error?e.message:String(e)})}):void 0).then(()=>w(t)).then(()=>Promise.all(t.map(e=>y(e)))).then(e=>t.map((r,i)=>({tag:r,ready:!!e[i],defined:!!customElements.get(r)})))}function _(n,t={}){return E(["ha-dialog"]).then(()=>new Promise(o=>{const a=n?.shadowRoot||n;if(!a||!("appendChild"in a)){const s=window.confirm(t.message||t.title||"Are you sure?");o(s);return}const e=document.createElement("ha-dialog");e.setAttribute("hideActions",""),e.scrimClickAction=!0,e.escapeKeyAction=!0,e.open=!1,e.headerTitle=t.title||c("Confirm delete"),n?._hass&&(e.hass=n._hass),e.innerHTML=`
        <style>
          .confirm-dialog-body {
            padding: 0 var(--dp-spacing-lg, 24px) var(--dp-spacing-lg, 24px);
            color: var(--primary-text-color);
          }
          .confirm-dialog-message {
            line-height: 1.5;
            color: var(--secondary-text-color, var(--primary-text-color));
          }
          .confirm-dialog-actions {
            display: flex;
            justify-content: flex-end;
            gap: var(--dp-spacing-sm, 8px);
            margin-top: var(--dp-spacing-lg, 24px);
          }
          .confirm-dialog-button {
            border: 0;
            border-radius: 999px;
            padding: 0 16px;
            height: 36px;
            font: inherit;
            cursor: pointer;
          }
          .confirm-dialog-button.cancel {
            background: transparent;
            color: var(--primary-text-color);
          }
          .confirm-dialog-button.confirm {
            background: var(--error-color, #db4437);
            color: white;
          }
        </style>
        <div class="confirm-dialog-body">
          <div class="confirm-dialog-message">${l(t.message||c("Are you sure you want to delete this item?"))}</div>
          <div class="confirm-dialog-actions">
            <button type="button" class="confirm-dialog-button cancel">${l(t.cancelLabel||c("Cancel"))}</button>
            <button type="button" class="confirm-dialog-button confirm">${l(t.confirmLabel||c("Delete"))}</button>
          </div>
        </div>
      `;let r=!1;const i=s=>{r||(r=!0,e.open=!1,o(s))},u=e.querySelector(".confirm-dialog-button.cancel"),m=e.querySelector(".confirm-dialog-button.confirm");u?.addEventListener("click",()=>{i(!1)}),m?.addEventListener("click",()=>{i(!0)}),e.addEventListener("keydown",s=>{s.key!=="Enter"||s.shiftKey||s.altKey||s.ctrlKey||s.metaKey||(s.preventDefault(),i(!0))}),e.addEventListener("closed",()=>{e.remove(),r||o(!1)},{once:!0}),a.appendChild(e),e.open=!0,window.requestAnimationFrame(()=>{m?.focus()})}))}export{_ as c};
