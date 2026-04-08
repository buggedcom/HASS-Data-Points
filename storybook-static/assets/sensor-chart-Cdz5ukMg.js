import{i as P,g as D,b as $}from"./iframe-maWesKjk.js";import{C as N}from"./constants-B5c5KCbY.js";import{c as F}from"./color-BkgFqjP8.js";import{s as X,C as Y}from"./chart-dom-bf6ubeYH.js";const B=P`
  :host {
    display: block;
    height: 100%;
  }

  .chart-wrap {
    position: relative;
    height: 100%;
    overflow: hidden;
  }

  .chart-viewport {
    position: relative;
    height: 100%;
    overflow: hidden;
  }

  canvas {
    display: block;
  }

  .chart-loading {
    position: absolute;
    top: 50%;
    left: 50%;
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    min-width: 168px;
    padding: 18px 18px 16px;
    border-radius: 18px;
    transform: translate(-50%, -50%);
    background: color-mix(
      in srgb,
      var(--card-background-color, #fff) 92%,
      transparent
    );
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12);
    color: var(--secondary-text-color);
    z-index: 2;
    text-align: center;
  }

  .chart-loading-spinner {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 2px solid
      color-mix(in srgb, var(--primary-color, #03a9f4) 22%, transparent);
    border-top-color: var(--primary-color, #03a9f4);
    animation: sensor-chart-spinner 0.9s linear infinite;
  }

  .chart-loading-label {
    font-size: 0.85rem;
    font-weight: 500;
  }

  .icon-overlay {
    display: contents;
  }

  .ann-icon {
    position: absolute;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transform: translate(-50%, -50%);
    pointer-events: auto;
    cursor: pointer;
    box-shadow: 0 0 0 2px var(--card-background-color, #fff);
    z-index: 1;
  }

  .ann-hit {
    position: absolute;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    pointer-events: auto;
    cursor: pointer;
    background: transparent;
    z-index: 2;
  }

  .ann-icon ha-icon {
    --mdc-icon-size: 12px;
  }

  .tooltip {
    position: absolute;
    background: var(--card-background-color, #fff);
    border: 1px solid var(--divider-color, #ddd);
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 0.8em;
    line-height: 1.4;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    pointer-events: none;
    display: none;
    max-width: 220px;
    z-index: 10;
    color: var(--primary-text-color);
  }

  .tt-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 4px;
    flex-shrink: 0;
  }

  .tt-time {
    color: var(--secondary-text-color);
    margin-bottom: 3px;
  }

  .tt-value {
    color: var(--secondary-text-color);
    margin-bottom: 4px;
  }

  .tt-message {
    font-weight: 500;
  }

  .tt-annotation {
    color: var(--secondary-text-color);
    margin-top: 4px;
    white-space: pre-wrap;
  }

  .tt-entities {
    color: var(--secondary-text-color);
    margin-top: 6px;
    white-space: pre-wrap;
  }

  @keyframes sensor-chart-spinner {
    to {
      transform: rotate(360deg);
    }
  }
`;var j=Object.defineProperty,I=(y,t,s)=>t in y?j(y,t,{enumerable:!0,configurable:!0,writable:!0,value:s}):y[t]=s,p=(y,t,s)=>I(y,typeof t!="symbol"?t+"":t,s);class R extends D{constructor(){super(),p(this,"_hass",null),p(this,"_canvasClickHandler",null),p(this,"_canvasMoveHandler",null),p(this,"_canvasLeaveHandler",null),p(this,"_previousSeriesEndpoints",new Map),p(this,"_lastDrawArgs",null),p(this,"_resizeObserver",null),this._chartReady=!1,this._loadMessage="Loading…",this.showAnnotationTooltips=!1}get hass(){return this._hass}set hass(t){this._hass=t}firstUpdated(){this._setupResizeObserver()}disconnectedCallback(){super.disconnectedCallback(),this._resizeObserver&&(this._resizeObserver.disconnect(),this._resizeObserver=null);const t=this.shadowRoot?.querySelector("canvas#chart");t&&this._canvasClickHandler&&t.removeEventListener("click",this._canvasClickHandler),t&&this._canvasMoveHandler&&t.removeEventListener("mousemove",this._canvasMoveHandler),t&&this._canvasLeaveHandler&&t.removeEventListener("mouseleave",this._canvasLeaveHandler)}_findHitAtPointer(t,s,r,n){const o=n.getBoundingClientRect(),i=s-o.left,f=r-o.top;return t.reduce((a,h)=>{const v=Math.hypot(h.x-i,h.y-f);return v>18?a:!a||v<a.dist?{hit:h,dist:v}:a},null)?.hit??null}_showAnnotationTooltip(t,s,r,n){const o=this.shadowRoot?.querySelector(".chart-wrap"),i=this.shadowRoot?.querySelector("#tooltip"),f=this.shadowRoot?.querySelector("#tt-time"),a=this.shadowRoot?.querySelector("#tt-value"),h=this.shadowRoot?.querySelector("#tt-dot"),v=this.shadowRoot?.querySelector("#tt-message"),x=this.shadowRoot?.querySelector("#tt-message-row"),c=this.shadowRoot?.querySelector("#tt-annotation"),_=this.shadowRoot?.querySelector("#tt-entities");if(!i||!o||!f||!a||!h||!v||!x||!c||!_)return;const C=new Date(t.event.timestamp);f.textContent=C.toLocaleString(),a.style.display="block",a.textContent=Number.isFinite(t.value)?`${t.value.toFixed(2)}${n?` ${n}`:""}`:"",h.style.background=t.event.color||"#03a9f4",v.textContent=t.event.message||"",x.style.display="flex",t.event.annotation?(c.style.display="block",c.textContent=t.event.annotation):(c.style.display="none",c.textContent=""),_.style.display="none",_.textContent="",i.style.display="block";const m=o.getBoundingClientRect(),L=i.getBoundingClientRect(),w=12,g=Math.max(8,m.width-L.width-8),k=Math.max(8,m.height-L.height-8),E=Math.min(g,Math.max(8,s-m.left+w)),b=Math.min(k,Math.max(8,r-m.top+w));i.style.left=`${E}px`,i.style.top=`${b}px`}_hideAnnotationTooltip(){const t=this.shadowRoot?.querySelector("#tooltip");t&&(t.style.display="none")}_attachTooltipHitTarget(t,s,r){const n=document.createElement("div");n.className="ann-hit",n.style.left=`${s.x}px`,n.style.top=`${s.y}px`,n.dataset.eventId=s.event.id,this._attachTooltipInteractions(n,s,r),t.appendChild(n)}_attachTooltipInteractions(t,s,r){const n=(o,i)=>{this._showAnnotationTooltip(s,o,i,r)};t.addEventListener("mouseenter",o=>{n(o.clientX,o.clientY)}),t.addEventListener("mousemove",o=>{n(o.clientX,o.clientY)}),t.addEventListener("click",o=>{o.preventDefault(),o.stopPropagation(),n(o.clientX,o.clientY)}),t.addEventListener("mouseleave",()=>{this._hideAnnotationTooltip()})}_setupResizeObserver(){window.ResizeObserver&&(this._resizeObserver=new ResizeObserver(()=>{this._lastDrawArgs&&this.draw(...this._lastDrawArgs)}),this._resizeObserver.observe(this))}draw(t,s,r,n,o,i,f){this._lastDrawArgs=[t,s,r,n,o,i,f];const a=this.shadowRoot?.querySelector("canvas#chart"),h=this.shadowRoot?.querySelector(".chart-wrap");if(!a||!h)return;const{w:v,h:x}=X(a,h,null),c=new Y(a,v,x),_=Math.max(6,Math.round(x*.05));c.pad={top:_,right:0,bottom:0,left:0},c.clear();const C=o.entity,m=o.graph_color||N[0],L=this._getHistoryStatesForEntity(C,t),w=[],g=[];for(const e of L){const l=parseFloat(e.s);Number.isNaN(l)||(w.push([Math.round(e.lu*1e3),l]),g.push(l))}if(!g.length){this._loadMessage="No numeric data in the selected time range.",this._chartReady=!1;return}this._loadMessage="",this._chartReady=!0;const k=o.annotation_style??"circle",E=s.filter(e=>!f.has(e.id)),b=[{entityId:C,pts:w,color:m}],S=Math.min(...g),z=Math.max(...g),O=z-S,M=S-(O*.03||.2),H=z+(O*.54||.8);for(const e of b)if(c.drawLine(e.pts,e.color,r,n,M,H,{fillAlpha:.18}),e.pts.length){const l=e.pts[e.pts.length-1],d=this._previousSeriesEndpoints.get(e.entityId);if(d&&(l[0]!==d.t||l[1]!==d.v)){const u=c.xOf(l[0],r,n),q=c.yOf(l[1],M,H);c.drawBlip(u,q,e.color)}this._previousSeriesEndpoints.set(e.entityId,{t:l[0],v:l[1]})}const T=k==="line"?c.drawAnnotationLinesOnLine(E,b,r,n,M,H):c.drawAnnotationsOnLine(E,b,r,n,M,H),A=this.shadowRoot?.querySelector(".icon-overlay");if(A){if(A.innerHTML="",k==="circle")for(const e of T){const l=e.event.color||"#03a9f4",d=document.createElement("div");d.className="ann-icon",d.style.left=`${e.x}px`,d.style.top=`${e.y}px`,d.style.background=l,d.innerHTML=`<ha-icon icon="${e.event.icon||"mdi:bookmark"}" style="--mdc-icon-size:12px;color:${F(l)}"></ha-icon>`,d.dataset.eventId=e.event.id,d.addEventListener("click",u=>{if(this.showAnnotationTooltips){u.preventDefault(),u.stopPropagation(),this._showAnnotationTooltip(e,u.clientX,u.clientY,i);return}u.preventDefault(),u.stopPropagation(),this._emitAnnotationClick(e.event)}),this.showAnnotationTooltips&&this._attachTooltipInteractions(d,e,i),A.appendChild(d),this.showAnnotationTooltips&&this._attachTooltipHitTarget(A,e,i)}else if(this.showAnnotationTooltips)for(const e of T)this._attachTooltipHitTarget(A,e,i)}this._canvasClickHandler&&a.removeEventListener("click",this._canvasClickHandler),this._canvasMoveHandler&&a.removeEventListener("mousemove",this._canvasMoveHandler),this._canvasLeaveHandler&&a.removeEventListener("mouseleave",this._canvasLeaveHandler),this._canvasMoveHandler=e=>{this._hideAnnotationTooltip()},this._canvasLeaveHandler=()=>{this._hideAnnotationTooltip()},this._canvasClickHandler=e=>{const l=this._findHitAtPointer(T,e.clientX,e.clientY,a);if(l){if(this.showAnnotationTooltips){e.preventDefault(),e.stopPropagation(),this._showAnnotationTooltip(l,e.clientX,e.clientY,i);return}e.preventDefault(),e.stopPropagation(),this._emitAnnotationClick(l.event)}},a.addEventListener("mousemove",this._canvasMoveHandler),a.addEventListener("mouseleave",this._canvasLeaveHandler),a.addEventListener("click",this._canvasClickHandler)}_emitAnnotationClick(t){this.dispatchEvent(new CustomEvent("dp-sensor-annotation-click",{detail:{event:t},bubbles:!0,composed:!0}))}_getHistoryStatesForEntity(t,s){if(!s)return[];const r=s;if(Array.isArray(r[t]))return r[t];if(Array.isArray(r)){const o=r;if(Array.isArray(o[0]))return o[0]||[];if(o.every(i=>i&&typeof i=="object"&&!Array.isArray(i)))return o.filter(i=>i.entity_id===t)}const n=s;if(n&&typeof n=="object"){const o=n.result;if(Array.isArray(o?.[t]))return o[t];if(Array.isArray(o?.[0]))return o[0]||[]}return[]}render(){return $`
      <div class="chart-wrap">
        <div class="chart-viewport">
          ${this._chartReady?"":$`
                <div class="chart-loading">
                  <div class="chart-loading-spinner"></div>
                  <div class="chart-loading-label">${this._loadMessage}</div>
                </div>
              `}
          <canvas
            id="chart"
            style=${this._chartReady?"":"display:none"}
          ></canvas>
          <div class="icon-overlay"></div>
        </div>
        <div class="tooltip" id="tooltip">
          <div class="tt-time" id="tt-time"></div>
          <div class="tt-value" id="tt-value" style="display:none"></div>
          <div
            id="tt-message-row"
            style="display:flex;align-items:flex-start;gap:4px"
          >
            <span class="tt-dot" id="tt-dot"></span>
            <span class="tt-message" id="tt-message"></span>
          </div>
          <div
            class="tt-annotation"
            id="tt-annotation"
            style="display:none"
          ></div>
          <div class="tt-entities" id="tt-entities" style="display:none"></div>
        </div>
      </div>
    `}}p(R,"properties",{_chartReady:{state:!0},_loadMessage:{state:!0},showAnnotationTooltips:{type:Boolean,attribute:"show-annotation-tooltips"}});p(R,"styles",B);customElements.define("sensor-chart",R);
