import{i as Pe,b as M,g as qe}from"./iframe-maWesKjk.js";import{e as f}from"./index-BVN6m9Ti.js";import{n as u}from"./property-DyW-YDBW.js";import{r as L}from"./state-D8ZE3MQ0.js";import{m as b,s as ce}from"./localize-Cz1ya3ms.js";import{R as ie,a as re}from"./range-timeline-kmNm3Bww.js";import"./floating-menu-CtbQd94M.js";import"./panel-timeline-DIdy8ac-.js";import"./date-time-input-Ct788ihS.js";import{l as We}from"./localized-decorator-CXjGGqe_.js";import"./preload-helper-PPVm8Dsz.js";import"./range-handle-B7j9y8oM.js";const Ae=Pe`
  :host {
    display: block;
    position: relative;
    min-height: 58px;
    overflow: visible;
    --dp-spacing-xs: calc(var(--spacing, 8px) * 0.5);
    --dp-spacing-sm: var(--spacing, 8px);
    --dp-spacing-md: calc(var(--spacing, 8px) * 1.5);
    --dp-spacing-lg: calc(var(--spacing, 8px) * 2);
  }

  .range-toolbar {
    display: flex;
    align-items: stretch;
    flex-wrap: nowrap;
    min-height: 58px;
    overflow: visible;
  }

  .range-toolbar > * {
    min-width: 0;
  }

  .range-toolbar > * + * {
    position: relative;
    margin-left: var(--dp-spacing-xs);
    padding-left: var(--dp-spacing-lg);
  }

  .range-toolbar > * + *::before {
    content: "";
    position: absolute;
    left: 0;
    top: 4px;
    bottom: 4px;
    width: 1px;
    background: color-mix(
      in srgb,
      var(--divider-color, rgba(0, 0, 0, 0.12)) 88%,
      transparent
    );
  }

  .range-sidebar-toggle {
    display: none;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    padding: 0;
    margin: 0;
    --mdc-icon-size: 20px;
    --icon-primary-color: var(--secondary-text-color);
  }

  .range-sidebar-toggle:hover,
  .range-sidebar-toggle:focus-visible {
    --icon-primary-color: var(--primary-text-color);
  }

  /* Mobile date inputs — hidden by default, shown at <=720px */
  .range-mobile-dates {
    display: none;
    align-items: center;
    gap: var(--dp-spacing-sm);
    flex: 1 1 auto;
    min-width: 0;
  }

  .range-mobile-dates date-time-input {
    flex: 1 1 0;
    min-width: 0;
  }

  .range-timeline-wrap {
    position: relative;
    flex: 1 1 auto;
    min-width: 0;
  }

  .range-picker-wrap,
  .range-options-wrap {
    position: relative;
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    align-self: stretch;
  }

  .range-picker-button,
  .range-options-button {
    display: block;
    padding: 0;
    min-width: 40px;
    --mdc-icon-size: 24px;
    --icon-primary-color: var(--secondary-text-color);
  }

  .range-picker-button:hover,
  .range-picker-button:focus-visible,
  .range-options-button:hover,
  .range-options-button:focus-visible {
    --icon-primary-color: var(--primary-text-color);
  }

  .range-options-view[hidden] {
    display: none;
  }

  .range-options-header {
    display: block;
    min-height: 36px;
    margin-bottom: var(--dp-spacing-xs);
  }

  .range-options-header-trigger {
    width: 100%;
    min-height: 38px;
    padding: var(--dp-spacing-sm) var(--dp-spacing-sm);
    display: flex;
    align-items: center;
    gap: var(--dp-spacing-sm);
    border: none;
    border-radius: 10px;
    background: transparent;
    color: var(--primary-text-color);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .range-options-header-trigger:hover,
  .range-options-header-trigger:focus-visible {
    background: color-mix(
      in srgb,
      var(--primary-text-color, #111) 6%,
      transparent
    );
    outline: none;
  }

  .range-options-title {
    margin: 0;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--secondary-text-color);
  }

  .range-options-list {
    display: grid;
    gap: var(--dp-spacing-xs);
    padding: 0;
  }

  .range-option,
  .range-submenu-trigger,
  .range-options-back {
    width: 100%;
    min-height: 38px;
    padding: var(--dp-spacing-sm) var(--dp-spacing-sm);
    display: flex;
    align-items: center;
    gap: var(--dp-spacing-sm);
    border: none;
    border-radius: 10px;
    background: transparent;
    color: var(--primary-text-color);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .range-submenu-trigger,
  .range-options-back {
    justify-content: space-between;
  }

  .range-options-back {
    width: auto;
    min-width: 0;
    padding-inline: 8px;
    flex: 0 0 auto;
  }

  .range-submenu-meta {
    color: var(--secondary-text-color);
    font-size: 0.84rem;
    margin-left: auto;
    padding-left: var(--dp-spacing-md);
  }

  .range-option:hover,
  .range-option:focus-visible,
  .range-submenu-trigger:hover,
  .range-submenu-trigger:focus-visible,
  .range-options-back:hover,
  .range-options-back:focus-visible {
    background: color-mix(
      in srgb,
      var(--primary-text-color, #111) 6%,
      transparent
    );
    outline: none;
  }

  .range-option::before {
    content: "";
    width: 16px;
    height: 16px;
    border-radius: 50%;
    box-sizing: border-box;
    border: 2px solid
      color-mix(in srgb, var(--primary-text-color, #111) 42%, transparent);
    flex: 0 0 auto;
  }

  .range-option.selected::before {
    border-color: var(--primary-color, #03a9f4);
    box-shadow: inset 0 0 0 4px var(--card-background-color, #fff);
    background: var(--primary-color, #03a9f4);
  }

  .range-submenu-trigger::after {
    content: "›";
    color: var(--secondary-text-color);
    font-size: 1rem;
    line-height: 1;
    margin-left: var(--dp-spacing-sm);
  }

  .range-option-label {
    flex: 1;
    min-width: 0;
  }

  @media (max-width: 900px) {
    .range-toolbar {
      flex-wrap: nowrap;
    }

    .range-toolbar > * + * {
      margin-left: 0;
      padding-left: 0;
    }

    .range-toolbar > * + *::before {
      display: none;
    }

    .range-sidebar-toggle {
      display: none;
    }
  }

  @media (max-width: 720px) {
    .range-toolbar > * + * {
      margin-left: 2px;
      padding-left: 8px;
    }

    .range-toolbar > * + *::before {
      top: 8px;
      bottom: 8px;
    }

    .range-toolbar .range-sidebar-toggle,
    .range-toolbar .range-picker-button,
    .range-toolbar .range-options-button {
      align-self: flex-end;
    }

    .range-picker-button,
    .range-options-button {
      min-width: 32px;
      --mdc-icon-size: 20px;
    }

    panel-timeline {
      display: none;
    }

    .range-mobile-dates {
      display: flex;
    }

    .range-sidebar-toggle {
      display: inline-flex;
    }
  }
`;var He=Object.create,q=Object.defineProperty,Ne=Object.getOwnPropertyDescriptor,ge=(o,e)=>(e=Symbol[o])?e:Symbol.for("Symbol."+o),w=o=>{throw TypeError(o)},me=(o,e,t)=>e in o?q(o,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):o[e]=t,se=(o,e)=>q(o,"name",{value:e,configurable:!0}),Ve=o=>[,,,He(o?.[ge("metadata")]??null)],ue=["class","method","getter","setter","accessor","field","value","get","set"],$=o=>o!==void 0&&typeof o!="function"?w("Function expected"):o,Ie=(o,e,t,r,a)=>({kind:ue[o],name:e,metadata:r,addInitializer:i=>t._?w("Already initialized"):a.push($(i||null))}),Ue=(o,e)=>me(e,ge("metadata"),o[3]),s=(o,e,t,r)=>{for(var a=0,i=o[e>>1],l=i&&i.length;a<l;a++)e&1?i[a].call(t):r=i[a].call(t,r);return r},c=(o,e,t,r,a,i)=>{var l,g,O,y,R,p=e&7,E=!!(e&8),_=!!(e&16),B=p>3?o.length+1:p?E?1:2:0,ne=ue[p+5],ae=p>3&&(o[B-1]=[]),Le=o[B]||(o[B]=[]),v=p&&(!_&&!E&&(a=a.prototype),p<5&&(p>3||!_)&&Ne(p<4?a:{get[t](){return le(this,i)},set[t](h){return pe(this,i,h)}},t));p?_&&p<4&&se(i,(p>2?"set ":p>1?"get ":"")+t):se(a,t);for(var C=r.length-1;C>=0;C--)y=Ie(p,t,O={},o[3],Le),p&&(y.static=E,y.private=_,R=y.access={has:_?h=>Fe(a,h):h=>t in h},p^3&&(R.get=_?h=>(p^1?le:je)(h,a,p^4?i:v.get):h=>h[t]),p>2&&(R.set=_?(h,D)=>pe(h,a,D,p^4?i:v.set):(h,D)=>h[t]=D)),g=(0,r[C])(p?p<4?_?i:v[ne]:p>4?void 0:{get:v.get,set:v.set}:a,y),O._=1,p^4||g===void 0?$(g)&&(p>4?ae.unshift(g):p?_?i=g:v[ne]=g:a=g):typeof g!="object"||g===null?w("Object expected"):($(l=g.get)&&(v.get=l),$(l=g.set)&&(v.set=l),$(l=g.init)&&ae.unshift(l));return p||Ue(o,a),v&&q(a,t,v),_?p^4?i:v:a},Ze=(o,e,t)=>me(o,e+"",t),W=(o,e,t)=>e.has(o)||w("Cannot "+t),Fe=(o,e)=>Object(e)!==e?w('Cannot use the "in" operator on this value'):o.has(e),le=(o,e,t)=>(W(o,e,"read from private field"),t?t.call(o):e.get(o)),m=(o,e,t)=>e.has(o)?w("Cannot add the same private member more than once"):e instanceof WeakSet?e.add(o):e.set(o,t),pe=(o,e,t,r)=>(W(o,e,"write to private field"),r?r.call(o,t):e.set(o,t),t),je=(o,e,t)=>(W(o,e,"access private method"),t),he,be,ve,_e,fe,we,ye,ke,xe,Te,Se,$e,Me,Oe,ze,Re,Ee,P,Be,n,A,H,N,V,I,U,Z,F,j,G,Y,J,K,Q,X,ee,te;Be=[We()];class d extends(P=qe,Ee=[u({attribute:!1})],Re=[u({type:Object})],ze=[u({type:Object})],Oe=[u({type:Object})],Me=[u({type:String,attribute:"zoom-level"})],$e=[u({type:String,attribute:"date-snapping"})],Se=[u({type:Boolean,attribute:"sidebar-collapsed"})],Te=[u({type:Boolean,attribute:"is-live-edge"})],xe=[u({type:Array,attribute:!1})],ke=[u({type:Object,attribute:!1})],ye=[u({type:Object,attribute:!1})],we=[u({type:Object,attribute:!1})],fe=[u({type:Number,attribute:!1})],_e=[u({type:Number,attribute:!1})],ve=[L()],be=[L()],he=[L()],P){constructor(){super(...arguments),m(this,A,s(n,8,this,null)),s(n,11,this),m(this,H,s(n,12,this,null)),s(n,15,this),m(this,N,s(n,16,this,null)),s(n,19,this),m(this,V,s(n,20,this,null)),s(n,23,this),m(this,I,s(n,24,this,"auto")),s(n,27,this),m(this,U,s(n,28,this,"hour")),s(n,31,this),m(this,Z,s(n,32,this,!1)),s(n,35,this),m(this,F,s(n,36,this,!1)),s(n,39,this),m(this,j,s(n,40,this,[])),s(n,43,this),m(this,G,s(n,44,this,null)),s(n,47,this),m(this,Y,s(n,48,this,null)),s(n,51,this),m(this,J,s(n,52,this,null)),s(n,55,this),m(this,K,s(n,56,this,null)),s(n,59,this),m(this,Q,s(n,60,this,null)),s(n,63,this),m(this,X,s(n,64,this,"root")),s(n,67,this),m(this,ee,s(n,68,this,!1)),s(n,71,this),m(this,te,s(n,72,this,!1)),s(n,75,this)}syncMobileDates(e,t){const r=l=>{if(!l)return"";const g=O=>String(O).padStart(2,"0");return`${l.getFullYear()}-${g(l.getMonth()+1)}-${g(l.getDate())}T${g(l.getHours())}:${g(l.getMinutes())}`},a=this.shadowRoot?.querySelector("#range-mobile-start"),i=this.shadowRoot?.querySelector("#range-mobile-end");a&&(a.value=r(e)),i&&(i.value=r(t))}syncOptionsLabels(){const e=ie.find(i=>i.value===this.zoomLevel)?.label??"Auto",t=re.find(i=>i.value===this.dateSnapping)?.label??"Hour",r=this.shadowRoot?.querySelector("[data-options-current='zoom']"),a=this.shadowRoot?.querySelector("[data-options-current='snap']");r&&(r.textContent=b(e)),a&&(a.textContent=b(t)),this.shadowRoot?.querySelectorAll("[data-option-group='zoom']").forEach(i=>{i.classList.toggle("selected",i.dataset.optionValue===this.zoomLevel)}),this.shadowRoot?.querySelectorAll("[data-option-group='snap']").forEach(i=>{i.classList.toggle("selected",i.dataset.optionValue===this.dateSnapping)})}closeMenus(){this._pickerOpen&&(this._pickerOpen=!1),this._optionsOpen&&(this._optionsOpen=!1,this._optionsView="root")}revealSelection(){const e=this.shadowRoot?.querySelector("#range-panel-timeline");e&&e.revealSelection?.()}_emit(e,t={}){this.dispatchEvent(new CustomEvent(e,{detail:t,bubbles:!0,composed:!0}))}_computeMenuPosition(e,t){const a=e.getBoundingClientRect(),i=Math.max(8,Math.min(a.right-t,window.innerWidth-t-8)),l=Math.max(8,a.bottom+8);return{left:i,top:l}}_toggleOptions(e){const t=e!==void 0?e:!this._optionsOpen;if(t&&(this._pickerOpen=!1),this._optionsOpen=t,t||(this._optionsView="root"),t){const r=this.shadowRoot?.querySelector("#range-options-menu"),a=this.shadowRoot?.querySelector("#range-options-button");if(r&&a){const{left:i,top:l}=this._computeMenuPosition(a,Math.max(280,r.offsetWidth||280));r.style.setProperty("--floating-menu-left",`${i}px`),r.style.setProperty("--floating-menu-top",`${l}px`)}}this.updateComplete.then(()=>this.syncOptionsLabels())}_togglePicker(e){const t=e!==void 0?e:!this._pickerOpen;if(t&&(this._optionsOpen=!1),this._pickerOpen=t,t){const r=this.shadowRoot?.querySelector("#range-picker-menu"),a=this.shadowRoot?.querySelector("#range-picker-button");if(r&&a){const{left:i,top:l}=this._computeMenuPosition(a,Math.max(320,r.offsetWidth||320));r.style.setProperty("--floating-menu-left",`${i}px`),r.style.setProperty("--floating-menu-top",`${l}px`)}}}_onSidebarToggle(){this._emit("dp-toolbar-sidebar-toggle")}_onTimelineRangeCommit(e){e.stopPropagation(),this._emit("dp-range-commit",{start:e.detail.start,end:e.detail.end,push:e.detail.push??!1})}_onTimelineRangeDraft(e){e.stopPropagation(),this._emit("dp-range-draft",{start:e.detail.start,end:e.detail.end})}_onPickerButtonClick(){this._togglePicker()}_onPickerMenuClose(){this._togglePicker(!1)}_onDatePickerChange(e){const t=e.detail?.value??e.detail;if(!t)return;const r=(t.start instanceof Date,t.start),a=(t.end instanceof Date,t.end);r&&a&&(this._emit("dp-date-picker-change",{start:r,end:a}),this._togglePicker(!1))}_onOptionsButtonClick(){this._toggleOptions()}_onOptionsMenuClose(){this._toggleOptions(!1)}_onOptionsBack(){this._optionsView="root"}_onOptionsSubmenu(e){this._optionsView=e}_onOptionSelect(e,t){e==="zoom"?this._emit("dp-zoom-level-change",{value:t}):e==="snap"&&this._emit("dp-snap-change",{value:t}),this._toggleOptions(!1)}_onMobileStartChange(e){const t=this.shadowRoot?.querySelector("#range-mobile-start");t&&(t.value=e.detail.value),this._commitMobileDates()}_onMobileEndChange(e){const t=this.shadowRoot?.querySelector("#range-mobile-end");t&&(t.value=e.detail.value),this._commitMobileDates()}_commitMobileDates(){const e=this.shadowRoot?.querySelector("#range-mobile-start"),t=this.shadowRoot?.querySelector("#range-mobile-end"),r=e?.value,a=t?.value;if(!r||!a)return;const i=new Date(r),l=new Date(a);Number.isNaN(i.getTime())||Number.isNaN(l.getTime())||i>=l||this._emit("dp-range-commit",{start:i,end:l,push:!0})}_renderZoomOptions(){return ie.map(e=>M`
        <button
          type="button"
          class="range-option"
          data-option-group="zoom"
          data-option-value=${e.value}
          @click=${()=>this._onOptionSelect("zoom",e.value)}
        >
          <span class="range-option-label">${b(e.label)}</span>
        </button>
      `)}_renderSnapOptions(){return re.map(e=>M`
        <button
          type="button"
          class="range-option"
          data-option-group="snap"
          data-option-value=${e.value}
          @click=${()=>this._onOptionSelect("snap",e.value)}
        >
          <span class="range-option-label">${b(e.label)}</span>
        </button>
      `)}render(){const e=this.sidebarCollapsed?"mdi:chevron-right":"mdi:chevron-left";return M`
      <div class="range-toolbar">
        <ha-icon-button
          id="range-sidebar-toggle"
          class="range-sidebar-toggle"
          label=${b("Toggle sidebar")}
          @click=${this._onSidebarToggle}
        >
          <ha-icon icon=${e}></ha-icon>
        </ha-icon-button>

        <div class="range-mobile-dates">
          <date-time-input
            id="range-mobile-start"
            label=${b("Start")}
            @dp-datetime-change=${this._onMobileStartChange}
          ></date-time-input>
          <date-time-input
            id="range-mobile-end"
            label=${b("End")}
            @dp-datetime-change=${this._onMobileEndChange}
          ></date-time-input>
        </div>

        <div class="range-timeline-wrap">
          <panel-timeline
            id="range-panel-timeline"
            .startTime=${this.startTime}
            .endTime=${this.endTime}
            .rangeBounds=${this.rangeBounds}
            .zoomLevel=${this.zoomLevel}
            .dateSnapping=${this.dateSnapping}
            .isLiveEdge=${this.isLiveEdge}
            .locale=${this.hass?.locale?.language??this.hass?.language??""}
            .events=${this.timelineEvents}
            .comparisonPreview=${this.comparisonPreview}
            .zoomRange=${this.zoomRange}
            .zoomWindowRange=${this.zoomWindowRange}
            .chartHoverTimeMs=${this.chartHoverTimeMs}
            .chartHoverWindowTimeMs=${this.chartHoverWindowTimeMs}
            @dp-range-commit=${this._onTimelineRangeCommit}
            @dp-range-draft=${this._onTimelineRangeDraft}
          ></panel-timeline>
        </div>

        <div class="range-picker-wrap">
          <ha-icon-button
            id="range-picker-button"
            class="range-picker-button"
            label=${b("Select date range")}
            aria-haspopup="dialog"
            aria-expanded=${this._pickerOpen?"true":"false"}
            @click=${this._onPickerButtonClick}
          >
            <ha-icon icon="mdi:calendar-range"></ha-icon>
          </ha-icon-button>
          <floating-menu
            id="range-picker-menu"
            .open=${this._pickerOpen}
            @dp-menu-close=${this._onPickerMenuClose}
          >
            <ha-date-range-picker
              id="range-picker"
              class="range-picker"
              .hass=${this.hass}
              .startDate=${this.startTime}
              .endDate=${this.endTime}
              .value=${{startDate:this.startTime,endDate:this.endTime}}
              @change=${this._onDatePickerChange}
              @value-changed=${this._onDatePickerChange}
            ></ha-date-range-picker>
          </floating-menu>
        </div>

        <div class="range-options-wrap">
          <ha-icon-button
            id="range-options-button"
            class="range-options-button"
            label=${b("Timeline options")}
            aria-haspopup="menu"
            aria-expanded=${this._optionsOpen?"true":"false"}
            @click=${this._onOptionsButtonClick}
          >
            <ha-icon icon="mdi:dots-vertical"></ha-icon>
          </ha-icon-button>
          <floating-menu
            id="range-options-menu"
            .open=${this._optionsOpen}
            @dp-menu-close=${this._onOptionsMenuClose}
          >
            <div
              class="range-options-view"
              ?hidden=${this._optionsView!=="root"}
            >
              <div class="range-options-list">
                <button
                  type="button"
                  class="range-submenu-trigger"
                  @click=${()=>this._onOptionsSubmenu("zoom")}
                >
                  <span class="range-option-label">${b("Zoom level")}</span>
                  <span
                    class="range-submenu-meta"
                    data-options-current="zoom"
                  ></span>
                </button>
                <button
                  type="button"
                  class="range-submenu-trigger"
                  @click=${()=>this._onOptionsSubmenu("snap")}
                >
                  <span class="range-option-label"
                    >${b("Date snapping")}</span
                  >
                  <span
                    class="range-submenu-meta"
                    data-options-current="snap"
                  ></span>
                </button>
              </div>
            </div>

            <div
              class="range-options-view"
              ?hidden=${this._optionsView!=="zoom"}
            >
              <div class="range-options-header">
                <button
                  type="button"
                  class="range-options-header-trigger"
                  @click=${this._onOptionsBack}
                >
                  <span class="range-options-back" aria-hidden="true"
                    ><span>‹</span></span
                  >
                  <div class="range-options-title">${b("Zoom level")}</div>
                </button>
              </div>
              <div class="range-options-list">${this._renderZoomOptions()}</div>
            </div>

            <div
              class="range-options-view"
              ?hidden=${this._optionsView!=="snap"}
            >
              <div class="range-options-header">
                <button
                  type="button"
                  class="range-options-header-trigger"
                  @click=${this._onOptionsBack}
                >
                  <span class="range-options-back" aria-hidden="true"
                    ><span>‹</span></span
                  >
                  <div class="range-options-title">${b("Date snapping")}</div>
                </button>
              </div>
              <div class="range-options-list">${this._renderSnapOptions()}</div>
            </div>
          </floating-menu>
        </div>
      </div>
    `}updated(){this.syncOptionsLabels()}}n=Ve(P);A=new WeakMap;H=new WeakMap;N=new WeakMap;V=new WeakMap;I=new WeakMap;U=new WeakMap;Z=new WeakMap;F=new WeakMap;j=new WeakMap;G=new WeakMap;Y=new WeakMap;J=new WeakMap;K=new WeakMap;Q=new WeakMap;X=new WeakMap;ee=new WeakMap;te=new WeakMap;c(n,4,"hass",Ee,d,A);c(n,4,"startTime",Re,d,H);c(n,4,"endTime",ze,d,N);c(n,4,"rangeBounds",Oe,d,V);c(n,4,"zoomLevel",Me,d,I);c(n,4,"dateSnapping",$e,d,U);c(n,4,"sidebarCollapsed",Se,d,Z);c(n,4,"isLiveEdge",Te,d,F);c(n,4,"timelineEvents",xe,d,j);c(n,4,"comparisonPreview",ke,d,G);c(n,4,"zoomRange",ye,d,Y);c(n,4,"zoomWindowRange",we,d,J);c(n,4,"chartHoverTimeMs",fe,d,K);c(n,4,"chartHoverWindowTimeMs",_e,d,Q);c(n,4,"_optionsView",ve,d,X);c(n,4,"_optionsOpen",be,d,ee);c(n,4,"_pickerOpen",he,d,te);d=c(n,0,"RangeToolbar",Be,d);Ze(d,"styles",Ae);s(n,1,d);customElements.define("range-toolbar",d);const Ce=new Date("2025-01-01T00:00:00"),De=new Date("2025-03-01T00:00:00"),oe={min:new Date("2020-01-01").getTime(),max:new Date("2026-01-01").getTime(),config:{baselineMs:60*864e5,boundsUnit:"month",contextUnit:"year",majorUnit:"month",labelUnit:"month",minorUnit:"week",pixelsPerUnit:30}};function de(){return new Promise(o=>{window.setTimeout(o,0)})}const rt={title:"Panels/Datapoints/Range Toolbar",component:"range-toolbar",parameters:{layout:"fullscreen",actions:{handles:["dp-range-commit","dp-range-draft","dp-toolbar-sidebar-toggle","dp-zoom-level-change","dp-snap-change","dp-date-picker-change"]},docs:{description:{component:"`range-toolbar` renders the date-range selection toolbar for the Datapoints panel.\nIt includes the timeline slider, date picker button, and timeline options (zoom, snap).\nAt ≤720 px the timeline is replaced by mobile date inputs."}}},argTypes:{zoomLevel:{control:{type:"select"},options:["auto","quarterly","month_compressed","month_short","month_expanded","week_compressed","week_expanded","day"],description:"Timeline zoom level."},dateSnapping:{control:{type:"select"},options:["auto","month","week","day","hour","minute","second"],description:"Date snapping mode."},sidebarCollapsed:{control:"boolean",description:"Sidebar collapse state — sets icon direction of the mobile sidebar toggle."}},args:{zoomLevel:"auto",dateSnapping:"hour",sidebarCollapsed:!1},loaders:[async()=>(await ce("en"),{})],render:o=>M`
    <div
      style="background: var(--card-background-color, #fff); padding: 12px 0; border-bottom: 1px solid var(--divider-color);"
    >
      <range-toolbar
        .startTime=${Ce}
        .endTime=${De}
        .rangeBounds=${oe}
        .zoomLevel=${o.zoomLevel}
        .dateSnapping=${o.dateSnapping}
        .sidebarCollapsed=${o.sidebarCollapsed}
      ></range-toolbar>
    </div>
  `},k={play:async({canvasElement:o})=>{const t=o.querySelector("range-toolbar").shadowRoot.querySelector("#range-panel-timeline");f(t).toBeTruthy(),f(t.startTime?.getTime()).toBe(Ce.getTime()),f(t.endTime?.getTime()).toBe(De.getTime()),f(t.rangeBounds).toEqual(oe),f(t.zoomLevel).toBe("auto"),f(t.dateSnapping).toBe("hour")}},x={args:{zoomLevel:"week_expanded",dateSnapping:"day"},play:async({canvasElement:o})=>{const e=o.querySelector("range-toolbar");e.shadowRoot.querySelector("#range-options-button").click(),await de();const r=e.shadowRoot.querySelector("#range-options-menu");f(r.open).toBe(!0),e.shadowRoot.querySelector(".range-submenu-trigger").click(),await de();const i=Array.from(e.shadowRoot.querySelectorAll(".range-options-view")).find(l=>!l.hasAttribute("hidden"));f(i?.textContent).toContain("Zoom level")}},T={args:{sidebarCollapsed:!0}},S={render:()=>M`
    <div
      style="background: var(--card-background-color, #fff); padding: 12px 0; border-bottom: 1px solid var(--divider-color);"
    >
      <range-toolbar
        .startTime=${new Date("2025-01-01")}
        .endTime=${new Date("2025-01-08")}
        .rangeBounds=${oe}
        .zoomLevel=${"day"}
        .dateSnapping=${"hour"}
      ></range-toolbar>
    </div>
  `},z={loaders:[async()=>(await ce("fi"),{})],play:async({canvasElement:o})=>{const e=o.querySelector("range-toolbar"),t=e.shadowRoot.querySelector("#range-sidebar-toggle"),r=e.shadowRoot.querySelector("#range-picker-button");f(t?.getAttribute("label")).toBe("Vaihda sivupalkki"),f(r?.getAttribute("label")).toBe("Valitse aikaväli")}};k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const toolbar = canvasElement.querySelector("range-toolbar") as HTMLElement & {
      shadowRoot: ShadowRoot;
    };
    const panelTimeline = toolbar.shadowRoot.querySelector("#range-panel-timeline") as HTMLElement & {
      startTime: Nullable<Date>;
      endTime: Nullable<Date>;
      rangeBounds: Nullable<RangeBounds>;
      zoomLevel: string;
      dateSnapping: string;
    };
    expect(panelTimeline).toBeTruthy();
    expect(panelTimeline.startTime?.getTime()).toBe(START.getTime());
    expect(panelTimeline.endTime?.getTime()).toBe(END.getTime());
    expect(panelTimeline.rangeBounds).toEqual(BOUNDS);
    expect(panelTimeline.zoomLevel).toBe("auto");
    expect(panelTimeline.dateSnapping).toBe("hour");
  }
}`,...k.parameters?.docs?.source},description:{story:"Default toolbar with a 2-month range in auto zoom.",...k.parameters?.docs?.description}}};x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  args: {
    zoomLevel: "week_expanded",
    dateSnapping: "day"
  },
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const toolbar = canvasElement.querySelector("range-toolbar") as HTMLElement & {
      shadowRoot: ShadowRoot;
    };
    const optionsButton = toolbar.shadowRoot.querySelector("#range-options-button") as HTMLButtonElement;
    optionsButton.click();
    await nextTick();
    const optionsMenu = toolbar.shadowRoot.querySelector("#range-options-menu") as HTMLElement & {
      open?: boolean;
    };
    expect(optionsMenu.open).toBe(true);
    const zoomTrigger = toolbar.shadowRoot.querySelector(".range-submenu-trigger") as HTMLButtonElement;
    zoomTrigger.click();
    await nextTick();
    const zoomView = Array.from(toolbar.shadowRoot.querySelectorAll(".range-options-view")).find(view => !view.hasAttribute("hidden"));
    expect(zoomView?.textContent).toContain("Zoom level");
  }
}`,...x.parameters?.docs?.source},description:{story:"Weekly zoom level.",...x.parameters?.docs?.description}}};T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  args: {
    sidebarCollapsed: true
  }
}`,...T.parameters?.docs?.source},description:{story:"Sidebar collapsed — the mobile sidebar toggle chevron points right.",...T.parameters?.docs?.description}}};S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <div
      style="background: var(--card-background-color, #fff); padding: 12px 0; border-bottom: 1px solid var(--divider-color);"
    >
      <range-toolbar
        .startTime=\${new Date("2025-01-01")}
        .endTime=\${new Date("2025-01-08")}
        .rangeBounds=\${BOUNDS}
        .zoomLevel=\${"day"}
        .dateSnapping=\${"hour"}
      ></range-toolbar>
    </div>
  \`
}`,...S.parameters?.docs?.source},description:{story:"Short date range (1 week) using day zoom.",...S.parameters?.docs?.description}}};z.parameters={...z.parameters,docs:{...z.parameters?.docs,source:{originalSource:`{
  loaders: [async () => {
    await setFrontendLocale("fi");
    return {};
  }],
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const toolbar = canvasElement.querySelector("range-toolbar") as HTMLElement & {
      shadowRoot: ShadowRoot;
    };
    const sidebarToggle = toolbar.shadowRoot.querySelector("#range-sidebar-toggle");
    const pickerButton = toolbar.shadowRoot.querySelector("#range-picker-button");
    expect(sidebarToggle?.getAttribute("label")).toBe("Vaihda sivupalkki");
    expect(pickerButton?.getAttribute("label")).toBe("Valitse aikaväli");
  }
}`,...z.parameters?.docs?.source}}};const st=["Default","WeekZoom","SidebarCollapsed","ShortRange","Finnish"];export{k as Default,z as Finnish,S as ShortRange,T as SidebarCollapsed,x as WeekZoom,st as __namedExportsOrder,rt as default};
