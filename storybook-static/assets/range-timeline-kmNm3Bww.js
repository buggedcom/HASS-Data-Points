import{i as Pe,b as Me,g as Le}from"./iframe-maWesKjk.js";import{n as P}from"./property-DyW-YDBW.js";import{m as y}from"./localize-Cz1ya3ms.js";import"./range-handle-B7j9y8oM.js";import{l as ke}from"./localized-decorator-CXjGGqe_.js";const De=Pe`
  :host {
    display: block;
    position: relative;
    flex: 1 1 auto;
    min-width: 0;
  }

  .range-selection-jump {
    position: absolute;
    top: 50%;
    width: 30px;
    height: 30px;
    transform: translateY(-50%);
    border: 0;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    background: color-mix(
      in srgb,
      var(--primary-text-color, #111) 94%,
      transparent
    );
    box-shadow:
      0 8px 18px rgba(0, 0, 0, 0.12),
      inset 0 0 0 1px
        color-mix(
          in srgb,
          var(--divider-color, rgba(0, 0, 0, 0.12)) 82%,
          transparent
        );
    color: var(--text-primary-color, #fff);
    cursor: pointer;
    z-index: 12;
  }

  .range-selection-jump[hidden] {
    display: none;
  }

  .range-selection-jump.left {
    left: 6px;
  }

  .range-selection-jump.right {
    right: 6px;
  }

  .range-selection-jump:hover,
  .range-selection-jump:focus-visible {
    background: color-mix(
      in srgb,
      var(--primary-text-color, #111) 100%,
      transparent
    );
    outline: none;
  }

  .range-scroll-viewport {
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-gutter: stable;
    -webkit-overflow-scrolling: touch;
    cursor: grab;
    touch-action: pan-y;
  }

  .range-scroll-viewport {
    scrollbar-color: transparent transparent;
    transition: scrollbar-color 200ms ease;
  }

  .range-scroll-viewport.scrollbar-visible {
    scrollbar-color: color-mix(
        in srgb,
        var(--primary-text-color, #111) 18%,
        transparent
      )
      transparent;
  }

  .range-scroll-viewport::-webkit-scrollbar {
    height: 8px;
  }

  .range-scroll-viewport::-webkit-scrollbar-thumb {
    border-radius: 999px;
    background: transparent;
    transition: background 200ms ease;
  }

  .range-scroll-viewport.scrollbar-visible::-webkit-scrollbar-thumb {
    background: color-mix(
      in srgb,
      var(--primary-text-color, #111) 18%,
      transparent
    );
  }

  .range-scroll-viewport.dragging {
    cursor: grabbing;
  }

  .range-timeline {
    position: relative;
    height: 58px;
    min-width: 100%;
    touch-action: pan-y;
  }

  .range-context-layer,
  .range-label-layer,
  .range-tick-layer {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .range-scale-label {
    position: absolute;
    bottom: 0;
    opacity: 0.7;
    transform: translateX(-50%);
    font-size: 0.76rem;
    line-height: 1;
    color: var(--secondary-text-color);
    white-space: nowrap;
  }

  .range-period-button {
    padding: calc(var(--spacing, 8px) * 0.25) var(--dp-spacing-sm);
    border: 0;
    border-radius: 999px;
    background: none;
    font: inherit;
    color: inherit;
    pointer-events: auto;
    cursor: pointer;
    appearance: none;
    -webkit-appearance: none;
    user-select: none;
    -webkit-user-select: none;
    transition:
      background-color 120ms ease,
      box-shadow 120ms ease,
      color 120ms ease;
  }

  .range-period-button:hover {
    color: var(--primary-text-color);
    background: color-mix(
      in srgb,
      var(--primary-text-color, #111) 7%,
      var(--card-background-color, #fff)
    );
    box-shadow: inset 0 0 0 1px
      color-mix(
        in srgb,
        var(--divider-color, rgba(0, 0, 0, 0.12)) 88%,
        transparent
      );
  }

  .range-period-button:focus-visible {
    outline: 2px solid
      color-mix(in srgb, var(--primary-color, #03a9f4) 24%, transparent);
    outline-offset: 2px;
    background: color-mix(
      in srgb,
      var(--primary-text-color, #111) 7%,
      var(--card-background-color, #fff)
    );
    box-shadow: inset 0 0 0 1px
      color-mix(
        in srgb,
        var(--divider-color, rgba(0, 0, 0, 0.12)) 88%,
        transparent
      );
  }

  .range-track {
    position: absolute;
    left: 0;
    right: 0;
    top: 26px;
    transform: translateY(-50%);
    height: 4px;
    border-radius: 999px;
    background: transparent;
  }

  .range-selection {
    position: absolute;
    top: 0;
    bottom: 0;
    z-index: 1;
    border-radius: 999px;
    background: color-mix(
      in srgb,
      var(--primary-text-color, #111) 82%,
      transparent
    );
    cursor: grab;
  }

  .range-selection.dragging {
    cursor: grabbing;
  }

  .range-tick {
    position: absolute;
    top: 14px;
    height: 14px;
    width: 1px;
    transform: translateX(-50%);
    background: color-mix(
      in srgb,
      var(--primary-text-color, #111) 16%,
      transparent
    );
  }

  .range-tick.major {
    top: 20px;
    height: 18px;
    background: color-mix(
      in srgb,
      var(--primary-text-color, #111) 24%,
      transparent
    );
  }

  .range-tick.fine {
    top: 18px;
    height: 8px;
    background: color-mix(
      in srgb,
      var(--primary-text-color, #111) 14%,
      transparent
    );
  }

  .range-tick.context {
    top: 2px;
    height: 34px;
    background: color-mix(
      in srgb,
      var(--primary-text-color, #111) 38%,
      transparent
    );
  }

  .range-divider {
    position: absolute;
    top: 8px;
    bottom: 22px;
    width: 2px;
    transform: translateX(-50%);
    background: color-mix(
      in srgb,
      var(--primary-text-color, #111) 42%,
      transparent
    );
  }

  .range-context-label {
    font-weight: bold !important;
    position: absolute;
    top: 0;
    transform: translateX(8px);
    font-size: 0.92rem;
    line-height: 1;
    color: var(--primary-text-color);
    white-space: nowrap;
  }

  .range-tooltip {
    position: absolute;
    top: 43px;
    left: 0;
    transform: translate(-50%, 0);
    padding: calc(var(--dp-spacing-sm) + 2px) calc(var(--dp-spacing-md) + 2px);
    border-radius: 10px;
    background: color-mix(in srgb, #0f1218 96%, transparent);
    color: rgba(255, 255, 255, 0.96);
    border: 1px solid color-mix(in srgb, #ffffff 14%, transparent);
    font-size: 0.86rem;
    line-height: 1.1;
    white-space: nowrap;
    pointer-events: none;
    user-select: none;
    -webkit-user-select: none;
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.28);
    opacity: 0;
    visibility: hidden;
    transition:
      opacity 120ms ease,
      visibility 120ms ease;
    z-index: 8;
  }

  .range-tooltip-live-hint {
    display: block;
    font-size: 0.78rem;
    opacity: 0.72;
    margin-top: 4px;
  }

  .range-tooltip::after {
    content: "";
    position: absolute;
    left: 50%;
    top: 0;
    width: 10px;
    height: 10px;
    background: inherit;
    transform: translate(-50%, -50%) rotate(45deg);
    border-radius: 2px;
  }

  .range-tooltip.visible {
    opacity: 1;
    visibility: visible;
  }

  .range-tooltip.start {
    z-index: 8;
  }

  .range-tooltip.end {
    z-index: 9;
  }
`,b=1e3,Ue=60*b,oe=60*Ue,L=24*oe,He=10,Be=14,D=48,K=28,ot=[{value:"auto",label:"Auto"},{value:"quarterly",label:"Quarterly"},{value:"month_compressed",label:"Month Compressed"},{value:"month_short",label:"Month Short"},{value:"month_expanded",label:"Month Expanded"},{value:"week_compressed",label:"Week Compressed"},{value:"week_expanded",label:"Week Expanded"},{value:"day",label:"Day"}],st=[{value:"auto",label:"Auto"},{value:"month",label:"Month"},{value:"week",label:"Week"},{value:"day",label:"Day"},{value:"hour",label:"Hour"},{value:"minute",label:"Minute"},{value:"second",label:"Second"}],ee={quarterly:{baselineMs:730*L,boundsUnit:"month",contextUnit:"year",detailUnit:"month",majorUnit:"quarter",labelUnit:"quarter",minorUnit:"month",pixelsPerUnit:96},month_compressed:{baselineMs:365*L,boundsUnit:"month",contextUnit:"year",detailUnit:"week",majorUnit:"month",labelUnit:"month",minorUnit:"month",pixelsPerUnit:76},month_short:{baselineMs:180*L,boundsUnit:"week",contextUnit:"month",detailUnit:"day",majorUnit:"week",labelUnit:"week",minorUnit:"week",pixelsPerUnit:54},month_expanded:{baselineMs:90*L,boundsUnit:"week",contextUnit:"month",detailUnit:"day",majorUnit:"week",labelUnit:"week",minorUnit:"week",pixelsPerUnit:72},week_compressed:{baselineMs:56*L,boundsUnit:"week",contextUnit:"month",detailUnit:"day",majorUnit:"week",labelUnit:"week",minorUnit:"week",pixelsPerUnit:120},week_expanded:{baselineMs:28*L,boundsUnit:"day",contextUnit:"month",detailUnit:"hour",detailStep:12,majorUnit:"day",labelUnit:"day",minorUnit:"day",pixelsPerUnit:30},day:{baselineMs:48*oe,boundsUnit:"hour",contextUnit:"day",majorUnit:"hour",labelUnit:"hour",minorUnit:"hour",pixelsPerUnit:9}};function C(n,e){return!(n instanceof Date)||Number.isNaN(n.getTime())?"--":n.toLocaleString(e?[e]:[],{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}function O(n,e){return!(n instanceof Date)||Number.isNaN(n.getTime())?"--":n.toLocaleString(e?[e]:[],{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}function _(n,e,t){return Math.min(t,Math.max(e,n))}function $(n){return new Date(n.getFullYear(),n.getMonth(),n.getDate())}function se(n){return new Date(n.getFullYear(),n.getMonth(),n.getDate(),n.getHours(),0,0,0)}function le(n){return new Date(n.getFullYear(),n.getMonth(),n.getDate(),n.getHours(),n.getMinutes(),0,0)}function de(n){return new Date(n.getFullYear(),n.getMonth(),n.getDate(),n.getHours(),n.getMinutes(),n.getSeconds(),0)}function Ce(n){return new Date(n.getFullYear(),n.getMonth(),1)}function Ie(n){return new Date(n.getFullYear(),n.getMonth()+1,1)}function he(n){return new Date(n.getFullYear(),0,1)}function ce(n){const e=n.getDay(),t=e===0?-6:1-e,i=$(n);return i.setDate(i.getDate()+t),i}function ge(n){return new Date(n.getFullYear(),Math.floor(n.getMonth()/3)*3,1)}function Fe(n){const e=se(n);return e.setHours(e.getHours()+1),e}function We(n){const e=$(n);return e.setDate(e.getDate()+1),e}function Ae(n){const e=ce(n);return e.setDate(e.getDate()+7),e}function Ve(n){const e=ge(n);return e.setMonth(e.getMonth()+3),e}function Oe(n){const e=le(n);return e.setMinutes(e.getMinutes()+1),e}function $e(n){const e=de(n);return e.setSeconds(e.getSeconds()+1),e}function me(n,e){return n.toLocaleString(e?[e]:[],{month:"short"})}function A(n,e){return n.toLocaleString(e?[e]:[],{year:"numeric"})}function Xe(n){const e=new Date(n.getTime());e.setHours(0,0,0,0);const t=e.getDay()||7;e.setDate(e.getDate()+4-t);const i=new Date(e.getFullYear(),0,1);return Math.ceil(((e.getTime()-i.getTime())/L+1)/7)}function Ne(n,e){return n.toLocaleString(e?[e]:[],{month:"short",day:"numeric"})}function je(n,e){return n.toLocaleString(e?[e]:[],{day:"numeric"})}function ze(n,e){return n.toLocaleTimeString(e?[e]:[],{hour:"2-digit"})}function ue(n,e="",t){return e==="quarterly"?`Q${Math.floor(n.getMonth()/3)+1}`:me(n,t)}function te(n,e,t="",i){switch(e){case"quarter":return ue(n,t,i);case"month":return me(n,i);case"week":return t==="month_short"?`${y("Wk")} ${Xe(n)}`:Ne(n,i);case"day":return je(n,i);case"hour":return ze(n,i);default:return O(n,i)}}function ne(n,e,t){switch(e){case"year":return A(n,t);case"month":return n.toLocaleString(t?[t]:[],{month:"short",year:"numeric"});case"day":return n.toLocaleString(t?[t]:[],{month:"short",day:"numeric"});default:return O(n,t)}}function Ye(n,e,t){switch(e){case"year":return A(n,t);case"quarter":return`${ue(n,"",t)} ${A(n,t)}`;case"month":return n.toLocaleString(t?[t]:[],{month:"long",year:"numeric"});case"week":return`${y("Week of")} ${n.toLocaleString(t?[t]:[],{month:"short",day:"numeric",year:"numeric"})}`;case"day":return n.toLocaleString(t?[t]:[],{month:"short",day:"numeric",year:"numeric"});case"hour":return n.toLocaleString(t?[t]:[],{month:"short",day:"numeric",year:"numeric",hour:"2-digit"});default:return O(n,t)}}function E(n,e){switch(e){case"second":return de(n);case"minute":return le(n);case"hour":return se(n);case"day":return $(n);case"week":return ce(n);case"month":return Ce(n);case"quarter":return ge(n);case"year":return he(n);default:return new Date(n)}}function k(n,e){switch(e){case"second":return $e(n);case"minute":return Oe(n);case"hour":return Fe(n);case"day":return We(n);case"week":return Ae(n);case"month":return Ie(n);case"quarter":return Ve(n);case"year":{const t=he(n);return t.setFullYear(t.getFullYear()+1),t}default:return new Date(n)}}function w(n,e,t=1){const i=new Date(n);switch(e){case"second":i.setSeconds(i.getSeconds()+t);break;case"minute":i.setMinutes(i.getMinutes()+t);break;case"hour":i.setHours(i.getHours()+t);break;case"day":i.setDate(i.getDate()+t);break;case"week":i.setDate(i.getDate()+t*7);break;case"month":i.setMonth(i.getMonth()+t);break;case"quarter":i.setMonth(i.getMonth()+t*3);break;case"year":i.setFullYear(i.getFullYear()+t);break}return i}function W(n,e){const t=E(n,e),i=k(n,e);return n.getTime()-t.getTime()<i.getTime()-n.getTime()?t:i}var Je=Object.create,X=Object.defineProperty,Ge=Object.getOwnPropertyDescriptor,_e=(n,e)=>(e=Symbol[n])?e:Symbol.for("Symbol."+n),U=n=>{throw TypeError(n)},pe=(n,e,t)=>e in n?X(n,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):n[e]=t,ie=(n,e)=>X(n,"name",{value:e,configurable:!0}),qe=n=>[,,,Je(n?.[_e("metadata")]??null)],fe=["class","method","getter","setter","accessor","field","value","get","set"],H=n=>n!==void 0&&typeof n!="function"?U("Function expected"):n,Ze=(n,e,t,i,r)=>({kind:fe[n],name:e,metadata:i,addInitializer:a=>t._?U("Already initialized"):r.push(H(a||null))}),Qe=(n,e)=>pe(e,_e("metadata"),n[3]),p=(n,e,t,i)=>{for(var r=0,a=n[e>>1],o=a&&a.length;r<o;r++)e&1?a[r].call(t):i=a[r].call(t,i);return i},R=(n,e,t,i,r,a)=>{var o,s,g,c,u,l=e&7,x=!!(e&8),m=!!(e&16),S=l>3?n.length+1:l?x?1:2:0,B=fe[l+5],Q=l>3&&(n[S-1]=[]),Re=n[S]||(n[S]=[]),v=l&&(!m&&!x&&(r=r.prototype),l<5&&(l>3||!m)&&Ge(l<4?r:{get[t](){return re(this,a)},set[t](f){return ae(this,a,f)}},t));l?m&&l<4&&ie(a,(l>2?"set ":l>1?"get ":"")+t):ie(r,t);for(var I=i.length-1;I>=0;I--)c=Ze(l,t,g={},n[3],Re),l&&(c.static=x,c.private=m,u=c.access={has:m?f=>Ke(r,f):f=>t in f},l^3&&(u.get=m?f=>(l^1?re:et)(f,r,l^4?a:v.get):f=>f[t]),l>2&&(u.set=m?(f,F)=>ae(f,r,F,l^4?a:v.set):(f,F)=>f[t]=F)),s=(0,i[I])(l?l<4?m?a:v[B]:l>4?void 0:{get:v.get,set:v.set}:r,c),g._=1,l^4||s===void 0?H(s)&&(l>4?Q.unshift(s):l?m?a=s:v[B]=s:r=s):typeof s!="object"||s===null?U("Object expected"):(H(o=s.get)&&(v.get=o),H(o=s.set)&&(v.set=o),H(o=s.init)&&Q.unshift(o));return l||Qe(n,r),v&&X(r,t,v),m?l^4?a:v:r},d=(n,e,t)=>pe(n,typeof e!="symbol"?e+"":e,t),N=(n,e,t)=>e.has(n)||U("Cannot "+t),Ke=(n,e)=>Object(e)!==e?U('Cannot use the "in" operator on this value'):n.has(e),re=(n,e,t)=>(N(n,e,"read from private field"),t?t.call(n):e.get(n)),M=(n,e,t)=>e.has(n)?U("Cannot add the same private member more than once"):e instanceof WeakSet?e.add(n):e.set(n,t),ae=(n,e,t,i)=>(N(n,e,"write to private field"),i?i.call(n,t):e.set(n,t),t),et=(n,e,t)=>(N(n,e,"access private method"),t),be,Te,ve,we,Ee,Se,xe,V,ye,h,j,z,Y,J,G,q,Z;ye=[ke()];class T extends(V=Le,xe=[P({type:Object})],Se=[P({type:Object})],Ee=[P({type:Object})],we=[P({type:String})],ve=[P({type:String})],Te=[P({type:Boolean})],be=[P({type:String})],V){constructor(){super(),M(this,j,p(h,8,this,null)),p(h,11,this),M(this,z,p(h,12,this,null)),p(h,15,this),M(this,Y,p(h,16,this,null)),p(h,19,this),M(this,J,p(h,20,this,"day")),p(h,23,this),M(this,G,p(h,24,this,"auto")),p(h,27,this),M(this,q,p(h,28,this,!1)),p(h,31,this),M(this,Z,p(h,32,this,"")),p(h,35,this),d(this,"_draftStartTime",null),d(this,"_draftEndTime",null),d(this,"_activeRangeHandle",null),d(this,"_hoveredRangeHandle",null),d(this,"_focusedRangeHandle",null),d(this,"_hoveredPeriodRange",null),d(this,"_rangePointerId",null),d(this,"_rangeInteractionActive",!1),d(this,"_rangeContentWidth",0),d(this,"_rangeCommitTimer",null),d(this,"_isProgrammaticScroll",!1),d(this,"_scrollbarHideTimer",null),d(this,"_timelinePointerId",null),d(this,"_timelinePointerStartX",0),d(this,"_timelinePointerStartScrollLeft",0),d(this,"_timelinePointerStartTimestamp",null),d(this,"_timelinePointerMode",null),d(this,"_timelineDragStartRangeMs",0),d(this,"_timelineDragEndRangeMs",0),d(this,"_timelineDragStartZoomRange",null),d(this,"_timelinePointerMoved",!1),d(this,"_timelineTrackClickPending",!1),d(this,"_rangeScrollViewportEl",null),d(this,"_rangeTimelineEl",null),d(this,"_rangeTrackEl",null),d(this,"_rangeTickLayerEl",null),d(this,"_rangeLabelLayerEl",null),d(this,"_rangeContextLayerEl",null),d(this,"_rangeSelectionEl",null),d(this,"_rangeStartHandleEl",null),d(this,"_rangeEndHandleEl",null),d(this,"_rangeStartTooltipEl",null),d(this,"_rangeEndTooltipEl",null),d(this,"_rangeJumpLeftEl",null),d(this,"_rangeJumpRightEl",null),d(this,"_onRangePointerMove"),d(this,"_onRangePointerUp"),d(this,"_onTimelinePointerMove"),d(this,"_onTimelinePointerUp"),this._onRangePointerMove=e=>this._handleRangePointerMove(e),this._onRangePointerUp=e=>this._finishRangePointerInteraction(e),this._onTimelinePointerMove=e=>this._handleTimelinePointerMove(e),this._onTimelinePointerUp=e=>this._finishTimelinePointerInteraction(e)}disconnectedCallback(){super.disconnectedCallback(),this._detachRangePointerListeners(),this._detachTimelinePointerListeners()}firstUpdated(){const e=this.shadowRoot;if(this._rangeScrollViewportEl=e.getElementById("range-scroll-viewport"),this._rangeTimelineEl=e.getElementById("range-timeline"),this._rangeTrackEl=e.getElementById("range-track"),this._rangeTickLayerEl=e.getElementById("range-tick-layer"),this._rangeLabelLayerEl=e.getElementById("range-label-layer"),this._rangeContextLayerEl=e.getElementById("range-context-layer"),this._rangeSelectionEl=e.getElementById("range-selection"),this._rangeStartHandleEl=e.getElementById("range-start-handle"),this._rangeEndHandleEl=e.getElementById("range-end-handle"),this._rangeStartTooltipEl=e.getElementById("range-tooltip-start"),this._rangeEndTooltipEl=e.getElementById("range-tooltip-end"),this._rangeJumpLeftEl=e.getElementById("range-jump-left"),this._rangeJumpRightEl=e.getElementById("range-jump-right"),this._rangeScrollViewportEl?.addEventListener("scroll",()=>{this._updateSelectionJumpControls(),this._syncVisibleRangeLabels(),this._updateRangeTooltip(),this.dispatchEvent(new CustomEvent("dp-range-scroll",{bubbles:!0,composed:!0})),this._isProgrammaticScroll||this._showScrollbar()}),typeof ResizeObserver<"u"){const t=new ResizeObserver(()=>{this._syncTimelineWidth(),this._updateSelectionJumpControls(),this._syncVisibleRangeLabels(),this._revealSelectionInTimeline("auto")});this._rangeScrollViewportEl&&t.observe(this._rangeScrollViewportEl)}this._syncRangeControl()}updated(e){["startTime","endTime","rangeBounds","zoomLevel","dateSnapping"].some(i=>e.has(i))&&this._syncRangeControl()}_pctForTime(e){if(!e||!this.rangeBounds)return 0;const{min:t,max:i}=this.rangeBounds;return Math.max(0,Math.min(100,(e.getTime()-t)/(i-t)*100))}render(){return Me`
      <ha-icon-button
        id="range-jump-left"
        class="range-selection-jump left"
        .label=${y("Scroll to selected range")}
        hidden
        @click=${()=>this._revealSelectionInTimeline("smooth")}
      >
        <ha-icon icon="mdi:chevron-left"></ha-icon>
      </ha-icon-button>
      <ha-icon-button
        id="range-jump-right"
        class="range-selection-jump right"
        .label=${y("Scroll to selected range")}
        hidden
        @click=${()=>this._revealSelectionInTimeline("smooth")}
      >
        <ha-icon icon="mdi:chevron-right"></ha-icon>
      </ha-icon-button>
      <div
        id="range-scroll-viewport"
        class="range-scroll-viewport"
        @pointerdown=${this._handleTimelinePointerDown}
        @pointermove=${this._handleRangeViewportPointerMove}
        @pointerleave=${this._handleRangeViewportPointerLeave}
      >
        <div id="range-timeline" class="range-timeline">
          <slot name="timeline-overlays"></slot>
          <div id="range-context-layer" class="range-context-layer"></div>
          <div id="range-tick-layer" class="range-tick-layer"></div>
          <div id="range-track" class="range-track">
            <slot name="track-overlays"></slot>
            <div id="range-selection" class="range-selection"></div>
          </div>
          <div id="range-label-layer" class="range-label-layer"></div>
          <range-handle
            id="range-start-handle"
            .label=${y("Start date and time")}
            .position=${this._pctForTime(this.startTime)}
            @dp-handle-drag-start=${e=>this._beginRangePointerInteraction("start",e.detail.pointerId,e.detail.clientX)}
            @dp-handle-keydown=${e=>this._handleRangeHandleKeyDown("start",e.detail)}
            @dp-handle-hover=${()=>this._setRangeTooltipHoverHandle("start")}
            @dp-handle-leave=${()=>this._clearRangeTooltipHoverHandle("start")}
            @dp-handle-focus=${()=>this._setRangeTooltipFocusHandle("start")}
            @dp-handle-blur=${()=>this._clearRangeTooltipFocusHandle("start")}
          ></range-handle>
          <range-handle
            id="range-end-handle"
            .label=${y("End date and time")}
            .position=${this._pctForTime(this.endTime)}
            .live=${this.isLiveEdge}
            @dp-handle-drag-start=${e=>this._beginRangePointerInteraction("end",e.detail.pointerId,e.detail.clientX)}
            @dp-handle-keydown=${e=>this._handleRangeHandleKeyDown("end",e.detail)}
            @dp-handle-hover=${()=>this._setRangeTooltipHoverHandle("end")}
            @dp-handle-leave=${()=>this._clearRangeTooltipHoverHandle("end")}
            @dp-handle-focus=${()=>this._setRangeTooltipFocusHandle("end")}
            @dp-handle-blur=${()=>this._clearRangeTooltipFocusHandle("end")}
          ></range-handle>
        </div>
      </div>
      <div
        id="range-tooltip-start"
        class="range-tooltip start"
        aria-hidden="true"
      ></div>
      <div
        id="range-tooltip-end"
        class="range-tooltip end"
        aria-hidden="true"
      ></div>
    `}_getZoomConfig(){return ee[this.zoomLevel]||ee.month_short}_getEffectiveSnapUnit(){if(this.dateSnapping!=="auto")return this.dateSnapping;switch(this.zoomLevel){case"quarterly":case"month_compressed":return"month";case"month_short":case"month_expanded":case"week_compressed":return"week";case"week_expanded":return"day";case"day":return"hour";default:return"day"}}_getScaleLabelZoomLevel(){return this.zoomLevel==="quarterly"||this.zoomLevel==="month_short"?this.zoomLevel:""}_getSnapSpanMs(e=new Date){const t=this._getEffectiveSnapUnit(),i=E(e,t),r=k(e,t);return Math.max(b,r.getTime()-i.getTime())}_countUnitsInRange(e,t,i){const r=Math.max(0,t-e),a={second:b,minute:60*b,hour:3600*b,day:1440*60*b,week:10080*60*b};return a[i]?Math.ceil(r/a[i]):i==="month"?Math.ceil(r/(30.44*24*60*60*b)):i==="quarter"?Math.ceil(r/(91.3*24*60*60*b)):i==="year"?Math.ceil(r/(365.25*24*60*60*b)):Math.max(1,Math.ceil(r/(1440*60*b)))}_syncRangeControl(){!this._rangeTrackEl||!this._rangeStartHandleEl||!this._rangeEndHandleEl||this.rangeBounds&&(this._draftStartTime=this.startTime?new Date(this.startTime):null,this._draftEndTime=this.endTime?new Date(this.endTime):null,this._syncTimelineWidth(),this._updateHandleStacking(),this._renderRangeScale(),this._updateRangePreview(),this._updateSelectionJumpControls(),this._revealSelectionInTimeline("auto"))}_syncTimelineWidth(){if(!this.rangeBounds||!this._rangeTimelineEl)return;const{config:e}=this.rangeBounds,t=Math.max(this._rangeScrollViewportEl?.clientWidth||0,320),i=this._countUnitsInRange(this.rangeBounds.min,this.rangeBounds.max,e.majorUnit),r=Math.max(t,i*(e.pixelsPerUnit||60));this._rangeContentWidth=r,this._rangeTimelineEl.style.width=`${r}px`}_renderScaleMarkers(e,t,i,r,a=1){if(!this.rangeBounds)return;let o=w(E(new Date(this.rangeBounds.min),t),t,0);for(o.getTime()<this.rangeBounds.min&&(o=w(o,t,a));o.getTime()<this.rangeBounds.max;){const s=document.createElement("span");s.className=`range-tick ${i}`,s.style.left=`${(o.getTime()-this.rangeBounds.min)/r*100}%`,e.appendChild(s),o=w(o,t,a)}}_buildRangePeriodButton(e,t,i,r,a,o){if(!this.rangeBounds)return document.createElement("button");const s=document.createElement("button");s.type="button",s.className=`range-period-button ${e}`,s.style.left=`${(t-this.rangeBounds.min)/i*100}%`,s.textContent=r;const g=Ye(o,a,this.locale||void 0),c=`${y("Select")} ${g}`;return s.title=c,s.setAttribute("aria-label",c),s.addEventListener("click",u=>this._handleRangePeriodSelect(a,o,u)),s.addEventListener("pointerenter",()=>this._setHoveredPeriodRange(a,o)),s.addEventListener("pointerleave",()=>this._clearHoveredPeriodRange(a,o)),s.addEventListener("focus",()=>this._setHoveredPeriodRange(a,o)),s.addEventListener("blur",()=>this._clearHoveredPeriodRange(a,o)),s}_getRangeUnitAnchorMs(e,t,i="auto"){const r=Math.max(E(new Date(e),t).getTime(),this.rangeBounds?.min??-1/0),a=Math.min(k(new Date(e),t).getTime(),this.rangeBounds?.max??1/0);let o=i;return o==="auto"&&(o=t==="day"||t==="week"?"center":"start"),o==="center"?r+Math.max(0,(a-r)/2):r}_estimateRangeLabelWidth(e,t,i){const r=t==="range-context-label"?20:14,a=t==="range-context-label"?8.2:7.2;return String(e).length*a+r+i}_computeRangeLabelStride(e,t,i,r){if(!this.rangeBounds||!this._rangeContentWidth)return 1;const a=Math.max(1,this.rangeBounds.max-this.rangeBounds.min);let o=E(new Date(this.rangeBounds.min),e),s=null,g=1/0,c=0,u=0;for(;o.getTime()<this.rangeBounds.max&&u<24;){const l=Math.max(o.getTime(),this.rangeBounds.min),x=t(o);if(c=Math.max(c,this._estimateRangeLabelWidth(x,i,r)),s!=null){const m=(l-s)/a*this._rangeContentWidth;m>0&&(g=Math.min(g,m))}s=l,o=w(o,e,1),u+=1}return!Number.isFinite(g)||g<=0?1:Math.max(1,Math.ceil(c/g))}_syncVisibleRangeLabels(){}_renderRangeScale(){if(!this.rangeBounds||!this._rangeTickLayerEl||!this._rangeLabelLayerEl||!this._rangeContextLayerEl)return;this._rangeTickLayerEl.innerHTML="",this._rangeLabelLayerEl.innerHTML="",this._rangeContextLayerEl.innerHTML="";const e=Math.max(1,this.rangeBounds.max-this.rangeBounds.min),{config:t}=this.rangeBounds,i=document.createDocumentFragment(),r=document.createDocumentFragment(),a=document.createDocumentFragment(),o=this._getScaleLabelZoomLevel(),s=t.labelUnit==="month"||t.labelUnit==="day"?1:this._computeRangeLabelStride(t.labelUnit,m=>te(m,t.labelUnit,o,this.locale||void 0),"range-scale-label",He),g=t.contextUnit==="month"||t.contextUnit==="day"?1:this._computeRangeLabelStride(t.contextUnit,m=>ne(m,t.contextUnit,this.locale||void 0),"range-context-label",Be);t.detailUnit&&t.detailUnit!==t.minorUnit&&t.detailUnit!==t.majorUnit&&this._renderScaleMarkers(i,t.detailUnit,"fine",e,t.detailStep||1),t.minorUnit!==t.majorUnit&&this._renderScaleMarkers(i,t.minorUnit,"",e),this._renderScaleMarkers(i,t.majorUnit,"major",e);let c=E(new Date(this.rangeBounds.min),t.labelUnit),u=0;for(;c.getTime()<this.rangeBounds.max;){if(u%s===0){const m=this._getRangeUnitAnchorMs(c,t.labelUnit,"auto"),S=this._buildRangePeriodButton("range-scale-label",m,e,te(c,t.labelUnit,o,this.locale||void 0),t.labelUnit,c);r.appendChild(S)}c=w(c,t.labelUnit,1),u+=1}let l=E(new Date(this.rangeBounds.min),t.contextUnit);l.getTime()<this.rangeBounds.min&&(l=w(l,t.contextUnit,1));let x=0;for(;l.getTime()<this.rangeBounds.max;){const m=`${(l.getTime()-this.rangeBounds.min)/e*100}%`,S=document.createElement("span");if(S.className="range-divider",S.style.left=m,a.appendChild(S),x%g===0){const B=this._buildRangePeriodButton("range-context-label",l.getTime(),e,ne(l,t.contextUnit,this.locale||void 0),t.contextUnit,l);a.appendChild(B)}l=w(l,t.contextUnit,1),x+=1}this._rangeTickLayerEl.appendChild(i),this._rangeLabelLayerEl.appendChild(r),this._rangeContextLayerEl.appendChild(a),this._syncVisibleRangeLabels()}_updateHandleStacking(e=this._activeRangeHandle){!this._rangeStartHandleEl||!this._rangeEndHandleEl||(this._rangeStartHandleEl.style.zIndex=e==="start"?"5":"3",this._rangeEndHandleEl.style.zIndex=e==="end"?"5":"4")}_updateRangePreview(){if(!this.rangeBounds||!this._draftStartTime||!this._draftEndTime)return;const e=Math.max(1,this.rangeBounds.max-this.rangeBounds.min),t=(this._draftStartTime.getTime()-this.rangeBounds.min)/e*100,i=(this._draftEndTime.getTime()-this.rangeBounds.min)/e*100;this._rangeSelectionEl&&(this._rangeSelectionEl.style.left=`${t}%`,this._rangeSelectionEl.style.width=`${Math.max(0,i-t)}%`),this._rangeStartHandleEl&&(this._rangeStartHandleEl.style.left=`${t}%`,this._rangeStartHandleEl.setAttribute("aria-valuetext",C(this._draftStartTime,this.locale||void 0))),this._rangeEndHandleEl&&(this._rangeEndHandleEl.style.left=`${i}%`,this._rangeEndHandleEl.setAttribute("aria-valuetext",C(this._draftEndTime,this.locale||void 0))),this._updateRangeTooltip()}_getVisibleRangeTooltipHandles(){if(this._timelinePointerMode==="selection"||this._timelinePointerMode==="interval_select")return["start","end"];const e=this._activeRangeHandle||this._focusedRangeHandle||this._hoveredRangeHandle||null;return e?[e]:[]}_setRangeTooltipHoverHandle(e){this._hoveredRangeHandle=e,this._updateRangeTooltip()}_clearRangeTooltipHoverHandle(e){this._activeRangeHandle!==e&&(this._hoveredRangeHandle===e&&(this._hoveredRangeHandle=null),this._updateRangeTooltip())}_setRangeTooltipFocusHandle(e){this._focusedRangeHandle=e,this._updateRangeTooltip()}_clearRangeTooltipFocusHandle(e){this._activeRangeHandle!==e&&(this._focusedRangeHandle===e&&(this._focusedRangeHandle=null),this._updateRangeTooltip())}_updateRangeTooltip(){if(!this.rangeBounds||!this._rangeScrollViewportEl)return;const e=new Set(this._getVisibleRangeTooltipHandles());this._updateRangeTooltipForHandle("start",e.has("start")),this._updateRangeTooltipForHandle("end",e.has("end"))}_updateRangeTooltipForHandle(e,t){const i=e==="start"?this._rangeStartTooltipEl:this._rangeEndTooltipEl;if(!i)return;if(!t){i.classList.remove("visible"),i.setAttribute("aria-hidden","true");return}const r=e==="start"?this._draftStartTime:this._draftEndTime;if(!r||!this.rangeBounds||!this._rangeScrollViewportEl){i.classList.remove("visible"),i.setAttribute("aria-hidden","true");return}const a=Math.max(1,this.rangeBounds.max-this.rangeBounds.min),o=Math.max(this._rangeContentWidth||0,this._rangeScrollViewportEl.clientWidth||0,1),g=(r.getTime()-this.rangeBounds.min)/a*o-this._rangeScrollViewportEl.scrollLeft,c=_(g,0,this._rangeScrollViewportEl.clientWidth);if(e==="end"&&this.isLiveEdge){const u=document.createElement("span");u.textContent=C(r,this.locale||void 0);const l=document.createElement("span");l.className="range-tooltip-live-hint",l.textContent=y("Updates with new data"),i.textContent="",i.append(u,l)}else i.textContent=C(r,this.locale||void 0);i.style.left=`${c}px`,i.classList.add("visible"),i.setAttribute("aria-hidden","false")}_handleRangePeriodSelect(e,t,i){i.preventDefault(),i.stopPropagation();const r=E(new Date(t),e),a=k(new Date(t),e);this._rangeCommitTimer&&(window.clearTimeout(this._rangeCommitTimer),this._rangeCommitTimer=null),this._draftStartTime=new Date(r),this._draftEndTime=new Date(a),this._updateRangePreview(),this.dispatchEvent(new CustomEvent("dp-range-period-select",{detail:{unit:e,startTime:r},bubbles:!0,composed:!0})),this._commitRangeSelection({push:!0})}_setHoveredPeriodRange(e,t){const i=E(new Date(t),e),r=k(new Date(t),e);this._hoveredPeriodRange={unit:e,start:i.getTime(),end:r.getTime()},this.dispatchEvent(new CustomEvent("dp-range-period-hover",{detail:{start:i,end:r},bubbles:!0,composed:!0}))}_clearHoveredPeriodRange(e,t){if(!this._hoveredPeriodRange)return;const i=E(new Date(t),e).getTime(),r=k(new Date(t),e).getTime();this._hoveredPeriodRange.start===i&&this._hoveredPeriodRange.end===r&&(this._hoveredPeriodRange=null,this.dispatchEvent(new CustomEvent("dp-range-period-leave",{bubbles:!0,composed:!0})))}_updateSelectionJumpControls(){if(!this._rangeScrollViewportEl||!this.rangeBounds||!this._rangeContentWidth||!this.startTime||!this.endTime){this._rangeJumpLeftEl&&(this._rangeJumpLeftEl.hidden=!0),this._rangeJumpRightEl&&(this._rangeJumpRightEl.hidden=!0);return}const e=Math.max(1,this.rangeBounds.max-this.rangeBounds.min),t=this._rangeScrollViewportEl.clientWidth,i=this._rangeScrollViewportEl.scrollLeft,r=i+t,a=(this.startTime.getTime()-this.rangeBounds.min)/e*this._rangeContentWidth,o=(this.endTime.getTime()-this.rangeBounds.min)/e*this._rangeContentWidth;this._rangeJumpLeftEl&&(this._rangeJumpLeftEl.hidden=!(o<i)),this._rangeJumpRightEl&&(this._rangeJumpRightEl.hidden=!(a>r))}_scrollTimelineToRange(e,t="auto",{center:i=!1}={}){if(!this._rangeScrollViewportEl||!this.rangeBounds||!this._rangeContentWidth||!e)return;const r=this._rangeScrollViewportEl.clientWidth;if(!r||this._rangeContentWidth<=r)return;const a=Math.max(1,this.rangeBounds.max-this.rangeBounds.min),o=a*Math.min(1,r/this._rangeContentWidth),s=Math.max(0,this._rangeContentWidth-r),g=Math.max(0,a-o);if(g<=0)return;const u=((i?_((e.start+e.end)/2-o/2,this.rangeBounds.min,this.rangeBounds.max-o):_(e.start,this.rangeBounds.min,this.rangeBounds.max-o))-this.rangeBounds.min)/g,l=_(u*s,0,s);this._rangeScrollViewportEl.scrollTo({left:l,behavior:t})}revealSelection(){this._revealSelectionInTimeline("smooth")}_revealSelectionInTimeline(e="auto"){!this.startTime||!this.endTime||(this._isProgrammaticScroll=!0,this._scrollTimelineToRange({start:this.startTime.getTime(),end:this.endTime.getTime()},e,{center:!0}),window.setTimeout(()=>{this._isProgrammaticScroll=!1},50))}_showScrollbar(){this._rangeScrollViewportEl&&(this._rangeScrollViewportEl.classList.add("scrollbar-visible"),this._scrollbarHideTimer&&window.clearTimeout(this._scrollbarHideTimer),this._scrollbarHideTimer=window.setTimeout(()=>{this._scrollbarHideTimer=null,this._rangeScrollViewportEl?.classList.remove("scrollbar-visible")},1500))}_timestampFromClientX(e){if(!this.rangeBounds||!this._rangeTrackEl)return null;const t=this._rangeTrackEl.getBoundingClientRect();if(!t.width)return null;const i=_((e-t.left)/t.width,0,1);return this.rangeBounds.min+i*(this.rangeBounds.max-this.rangeBounds.min)}_getTimelineSelectionDragDeltaMs(e){if(e==null||this._timelinePointerStartTimestamp==null)return 0;const t=this._getEffectiveSnapUnit();if(!t)return e-this._timelinePointerStartTimestamp;const i=W(new Date(this._timelinePointerStartTimestamp),t).getTime();return W(new Date(e),t).getTime()-i}_setDraftRangeFromTimestamp(e,t){if(!this.rangeBounds)return;const i=this._getEffectiveSnapUnit();let r=this._draftStartTime?.getTime()??this.startTime?.getTime()??this.rangeBounds.min,a=this._draftEndTime?.getTime()??this.endTime?.getTime()??this.rangeBounds.max;const o=_(W(new Date(t),i).getTime(),this.rangeBounds.min,this.rangeBounds.max),s=Math.max(this._getSnapSpanMs(new Date(o)),b);e==="start"?r=_(o,this.rangeBounds.min,a-s):a=_(o,r+s,this.rangeBounds.max),this._draftStartTime=new Date(r),this._draftEndTime=new Date(a),this._updateHandleStacking(e),this._updateRangePreview(),this._fireDraftEvent(),this._scheduleRangeCommit()}_shiftDraftRangeByDelta(e){if(!this.rangeBounds)return;const t=this._timelineDragStartRangeMs,i=this._timelineDragEndRangeMs,r=this.rangeBounds.min-t,a=this.rangeBounds.max-i,o=_(e,r,a);this._draftStartTime=new Date(t+o),this._draftEndTime=new Date(i+o),this._updateRangePreview(),this._fireDraftEvent(),this._scheduleRangeCommit()}_setDraftRangeFromIntervalSelection(e,t){if(!this.rangeBounds)return;const i=this.rangeBounds.config?.labelUnit||this._getEffectiveSnapUnit(),r=Math.min(e,t),a=Math.max(e,t),o=_(E(new Date(r),i).getTime(),this.rangeBounds.min,this.rangeBounds.max),s=_(k(new Date(a),i).getTime(),this.rangeBounds.min,this.rangeBounds.max);o>=s||(this._draftStartTime=new Date(o),this._draftEndTime=new Date(s),this._updateRangePreview())}_fireDraftEvent(){!this._draftStartTime||!this._draftEndTime||this.dispatchEvent(new CustomEvent("dp-range-draft",{detail:{start:new Date(this._draftStartTime),end:new Date(this._draftEndTime)},bubbles:!0,composed:!0}))}_scheduleRangeCommit(){this._rangeInteractionActive||this._timelinePointerMode==="selection"||this._timelinePointerMode==="interval_select"||(this._rangeCommitTimer&&window.clearTimeout(this._rangeCommitTimer),this._rangeCommitTimer=window.setTimeout(()=>{this._rangeCommitTimer=null,this._commitRangeSelection({push:!1})},240))}_commitRangeSelection({push:e=!1}={}){!this._draftStartTime||!this._draftEndTime||this.dispatchEvent(new CustomEvent("dp-range-commit",{detail:{start:new Date(this._draftStartTime),end:new Date(this._draftEndTime),push:e},bubbles:!0,composed:!0}))}_beginRangePointerInteraction(e,t,i){if(!this._rangeTrackEl)return;this._rangeInteractionActive=!0,this._rangeCommitTimer&&(window.clearTimeout(this._rangeCommitTimer),this._rangeCommitTimer=null),this._activeRangeHandle=e,this._hoveredRangeHandle=e,this._rangePointerId=t,this._updateHandleStacking(e),this._updateRangeTooltip(),this._attachRangePointerListeners(),(e==="start"?this._rangeStartHandleEl:this._rangeEndHandleEl)?.focus?.();const a=this._timestampFromClientX(i);a!=null&&this._setDraftRangeFromTimestamp(e,a)}_maybeAutoScrollTimelineDuringHandleDrag(e){if(!this._rangeScrollViewportEl)return;const t=this._rangeScrollViewportEl,i=t.getBoundingClientRect();if(!i.width)return;const r=Math.max(0,t.scrollWidth-t.clientWidth);if(r<=0)return;let a=0;const o=e-i.left,s=i.right-e;if(o<D){const g=_((D-o)/D,0,1);a=-Math.max(1,Math.round(g*K))}else if(s<D){const g=_((D-s)/D,0,1);a=Math.max(1,Math.round(g*K))}a&&(t.scrollLeft=_(t.scrollLeft+a,0,r))}_attachRangePointerListeners(){window.addEventListener("pointermove",this._onRangePointerMove),window.addEventListener("pointerup",this._onRangePointerUp),window.addEventListener("pointercancel",this._onRangePointerUp)}_detachRangePointerListeners(){window.removeEventListener("pointermove",this._onRangePointerMove),window.removeEventListener("pointerup",this._onRangePointerUp),window.removeEventListener("pointercancel",this._onRangePointerUp),this._rangePointerId=null,this._activeRangeHandle=null,this._rangeInteractionActive=!1,this._updateHandleStacking(),this._updateRangeTooltip()}_handleRangePointerMove(e){if(!this._activeRangeHandle||this._rangePointerId!=null&&e.pointerId!==this._rangePointerId)return;this._maybeAutoScrollTimelineDuringHandleDrag(e.clientX);const t=this._timestampFromClientX(e.clientX);t!=null&&(e.preventDefault(),this._setDraftRangeFromTimestamp(this._activeRangeHandle,t))}_finishRangePointerInteraction(e){this._activeRangeHandle&&(this._rangePointerId!=null&&e.pointerId!==this._rangePointerId||(this._detachRangePointerListeners(),this._focusedRangeHandle=null,this._hoveredRangeHandle=null,this._updateRangeTooltip(),this._commitRangeSelection({push:!0})))}_handleRangeHandleKeyDown(e,t){if(!this.rangeBounds)return;const i=this._getEffectiveSnapUnit(),r=e==="start"?this._draftStartTime?.getTime()??this.startTime?.getTime():this._draftEndTime?.getTime()??this.endTime?.getTime();if(r==null)return;const a=this._getZoomConfig();let o=null;(t.key==="ArrowLeft"||t.key==="ArrowDown")&&(o=w(new Date(r),i,-1).getTime()),(t.key==="ArrowRight"||t.key==="ArrowUp")&&(o=w(new Date(r),i,1).getTime()),t.key==="PageDown"&&(o=w(new Date(r),a.majorUnit,-1).getTime()),t.key==="PageUp"&&(o=w(new Date(r),a.majorUnit,1).getTime()),t.key==="Home"&&(o=this.rangeBounds.min),t.key==="End"&&(o=this.rangeBounds.max),o!=null&&(this._focusedRangeHandle=e,this._setDraftRangeFromTimestamp(e,o))}_handleTimelinePointerDown(e){if(e.button!==0||e.composedPath().some(o=>o instanceof Element&&(o.tagName==="RANGE-HANDLE"||o.closest?.("range-handle")))||e.target?.closest?.(".range-period-button")||!this._rangeScrollViewportEl)return;const t=!!e.target?.closest?.(".range-selection"),i=this._rangeTrackEl?.getBoundingClientRect(),r=!!i&&e.clientY>=i.top-6&&e.clientY<=i.bottom+6,a=!t&&!r;this._detachTimelinePointerListeners(),this._rangeInteractionActive=t||a,(t||a)&&this._rangeCommitTimer&&(window.clearTimeout(this._rangeCommitTimer),this._rangeCommitTimer=null),this._timelinePointerId=e.pointerId,this._timelinePointerStartX=e.clientX,this._timelinePointerStartScrollLeft=this._rangeScrollViewportEl.scrollLeft,this._timelinePointerStartTimestamp=t||a?this._timestampFromClientX(e.clientX):null,t?this._timelinePointerMode="selection":a?this._timelinePointerMode="interval_select":this._timelinePointerMode="pan",this._timelineDragStartRangeMs=this._draftStartTime?.getTime()??this.startTime?.getTime()??0,this._timelineDragEndRangeMs=this._draftEndTime?.getTime()??this.endTime?.getTime()??0,this._timelinePointerMoved=!1,this._timelineTrackClickPending=!t&&!a&&!!e.target?.closest?.(".range-track"),this._rangeScrollViewportEl.classList.remove("dragging"),this._rangeSelectionEl?.classList.toggle("dragging",t),window.addEventListener("pointermove",this._onTimelinePointerMove),window.addEventListener("pointerup",this._onTimelinePointerUp),window.addEventListener("pointercancel",this._onTimelinePointerUp)}_detachTimelinePointerListeners(){window.removeEventListener("pointermove",this._onTimelinePointerMove),window.removeEventListener("pointerup",this._onTimelinePointerUp),window.removeEventListener("pointercancel",this._onTimelinePointerUp),this._rangeScrollViewportEl&&this._rangeScrollViewportEl.classList.remove("dragging"),this._rangeSelectionEl?.classList.remove("dragging"),this._timelinePointerId=null,this._timelinePointerStartTimestamp=null,this._timelinePointerMode=null,this._rangeInteractionActive=!1,this._timelinePointerMoved=!1,this._timelineTrackClickPending=!1}_handleTimelinePointerMove(e){if(this._timelinePointerId==null||e.pointerId!==this._timelinePointerId||!this._rangeScrollViewportEl)return;if(this._timelinePointerMode==="selection"){const r=this._timestampFromClientX(e.clientX);if(r==null||this._timelinePointerStartTimestamp==null)return;const a=e.clientX-this._timelinePointerStartX;if(!this._timelinePointerMoved&&Math.abs(a)<4)return;this._timelinePointerMoved=!0,this._shiftDraftRangeByDelta(this._getTimelineSelectionDragDeltaMs(r)),e.preventDefault();return}if(this._timelinePointerMode==="interval_select"){const r=this._timestampFromClientX(e.clientX);if(r==null||this._timelinePointerStartTimestamp==null)return;const a=e.clientX-this._timelinePointerStartX;if(!this._timelinePointerMoved&&Math.abs(a)<4)return;this._timelinePointerMoved=!0,this._setDraftRangeFromIntervalSelection(this._timelinePointerStartTimestamp,r),e.preventDefault();return}const t=e.clientX-this._timelinePointerStartX;if(!this._timelinePointerMoved&&Math.abs(t)<4)return;this._timelinePointerMoved=!0,this._timelineTrackClickPending=!1,this._rangeScrollViewportEl.classList.add("dragging");const i=Math.max(0,this._rangeScrollViewportEl.scrollWidth-this._rangeScrollViewportEl.clientWidth);this._rangeScrollViewportEl.scrollLeft=_(this._timelinePointerStartScrollLeft-t,0,i),e.preventDefault()}_finishTimelinePointerInteraction(e){if(this._timelinePointerId==null||e.pointerId!==this._timelinePointerId)return;const t=this._timelinePointerMode,i=this._timelinePointerMoved,r=this._timelineTrackClickPending&&!i,a=e.clientX;if(this._detachTimelinePointerListeners(),t==="selection"){this._focusedRangeHandle=null,this._hoveredRangeHandle=null,this._updateRangeTooltip(),i&&this._commitRangeSelection({push:!0});return}if(t==="interval_select"){this._hoveredPeriodRange=null,this._updateRangeTooltip(),i&&this._commitRangeSelection({push:!0});return}r&&this._handleTrackSelectionAtClientX(a)}_handleTrackSelectionAtClientX(e){const t=this._timestampFromClientX(e);if(t==null)return;const i=this._draftStartTime?.getTime()??this.startTime?.getTime()??this.rangeBounds?.min,r=this._draftEndTime?.getTime()??this.endTime?.getTime()??this.rangeBounds?.max;if(i==null||r==null)return;const a=Math.abs(t-i)<=Math.abs(t-r)?"start":"end";this._setDraftRangeFromTimestamp(a,t)}_handleRangeViewportPointerMove(e){if(this._timelinePointerId!=null||this._rangePointerId!=null||e.composedPath().some(r=>r.tagName==="DP-RANGE-HANDLE")||e.target?.closest?.(".range-period-button")||e.target?.closest?.(".range-selection"))return;const t=this._timestampFromClientX(e.clientX);if(t==null||!this.rangeBounds)return;const i=this.rangeBounds.config?.labelUnit||this._getEffectiveSnapUnit();i&&this._setHoveredPeriodRange(i,new Date(t))}_handleRangeViewportPointerLeave(){this._timelinePointerId!=null||this._rangePointerId!=null||this._hoveredPeriodRange&&(this._hoveredPeriodRange=null,this.dispatchEvent(new CustomEvent("dp-range-period-leave",{bubbles:!0,composed:!0})))}}h=qe(V);j=new WeakMap;z=new WeakMap;Y=new WeakMap;J=new WeakMap;G=new WeakMap;q=new WeakMap;Z=new WeakMap;R(h,4,"startTime",xe,T,j);R(h,4,"endTime",Se,T,z);R(h,4,"rangeBounds",Ee,T,Y);R(h,4,"zoomLevel",we,T,J);R(h,4,"dateSnapping",ve,T,G);R(h,4,"isLiveEdge",Te,T,q);R(h,4,"locale",be,T,Z);T=R(h,0,"RangeTimeline",ye,T);d(T,"styles",De);p(h,1,T);customElements.define("range-timeline",T);export{ot as R,st as a,_ as c};
