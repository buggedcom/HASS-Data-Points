import{i as ce,b as ve,g as pe}from"./iframe-maWesKjk.js";import{n as g}from"./property-DyW-YDBW.js";import{r as me}from"./state-D8ZE3MQ0.js";import{c as E}from"./range-timeline-kmNm3Bww.js";const _e=ce`
  :host {
    display: contents;
  }

  /* ---- track overlays (positioned inside range-timeline's .range-track) ---- */

  .range-hover-preview {
    position: absolute;
    top: 14px;
    height: 14px;
    border-radius: 4px;
    background: color-mix(
      in srgb,
      var(--primary-color, #03a9f4) 26%,
      transparent
    );
    opacity: 0;
    pointer-events: none;
    transition: opacity 120ms ease;
  }

  .range-hover-preview.visible {
    opacity: 1;
  }

  .range-comparison-preview {
    position: absolute;
    top: -4px;
    height: 12px;
    z-index: 2;
    border-radius: 999px;
    background: color-mix(
      in srgb,
      var(--primary-color, #03a9f4) 18%,
      transparent
    );
    box-shadow: inset 0 0 0 1px
      color-mix(in srgb, var(--primary-color, #03a9f4) 58%, transparent);
    opacity: 0;
    pointer-events: none;
    transition: opacity 120ms ease;
  }

  .range-comparison-preview.visible {
    opacity: 1;
  }

  .range-zoom-highlight {
    position: absolute;
    top: -6px;
    height: 16px;
    z-index: 2;
    border-radius: 999px;
    background: color-mix(
      in srgb,
      var(--primary-color, #03a9f4) 14%,
      transparent
    );
    box-shadow:
      inset 0 0 0 2px var(--primary-color, #03a9f4),
      0 0 0 1px
        color-mix(in srgb, var(--card-background-color, #fff) 72%, transparent);
    opacity: 0;
    pointer-events: none;
    transition: opacity 120ms ease;
  }

  .range-zoom-highlight.visible {
    opacity: 1;
  }

  .range-zoom-window-highlight {
    position: absolute;
    top: -4px;
    height: 12px;
    z-index: 4;
    border-radius: 999px;
    background: color-mix(
      in srgb,
      var(--primary-color, #03a9f4) 52%,
      transparent
    );
    box-shadow: inset 0 0 0 1px
      color-mix(in srgb, var(--primary-color, #03a9f4) 85%, transparent);
    opacity: 0;
    pointer-events: none;
    transition: opacity 120ms ease;
  }

  .range-zoom-window-highlight.visible {
    opacity: 1;
  }

  /* ---- timeline overlays (positioned inside range-timeline's .range-timeline) ---- */

  .range-event-layer {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .range-event-dot {
    position: absolute;
    bottom: 18px;
    width: 6px;
    height: 6px;
    border-radius: 999px;
    transform: translateX(-50%);
    pointer-events: none;
  }

  .range-chart-hover-line {
    position: absolute;
    top: 2px;
    bottom: 0;
    width: 2px;
    transform: translateX(-50%);
    background: var(--primary-color, #03a9f4);
    border-radius: 999px;
    opacity: 0;
    pointer-events: none;
    transition: opacity 120ms ease;
    z-index: 2;
  }

  .range-chart-hover-line.visible {
    opacity: 1;
  }

  .range-chart-hover-window-line {
    position: absolute;
    top: 2px;
    bottom: 0;
    width: 2px;
    transform: translateX(-50%);
    background: var(--primary-color, #03a9f4);
    border-radius: 999px;
    opacity: 0;
    pointer-events: none;
    transition: opacity 120ms ease;
    z-index: 2;
  }

  .range-chart-hover-window-line.visible {
    opacity: 0.45;
  }
`;var ue=Object.create,Z=Object.defineProperty,ye=Object.getOwnPropertyDescriptor,A=(i,e)=>(e=Symbol[i])?e:Symbol.for("Symbol."+i),w=i=>{throw TypeError(i)},F=(i,e,n)=>e in i?Z(i,e,{enumerable:!0,configurable:!0,writable:!0,value:n}):i[e]=n,we=i=>[,,,ue(i?.[A("metadata")]??null)],D=["class","method","getter","setter","accessor","field","value","get","set"],y=i=>i!==void 0&&typeof i!="function"?w("Function expected"):i,be=(i,e,n,o,a)=>({kind:D[i],name:e,metadata:o,addInitializer:l=>n._?w("Already initialized"):a.push(y(l||null))}),xe=(i,e)=>F(e,A("metadata"),i[3]),r=(i,e,n,o)=>{for(var a=0,l=i[e>>1],c=l&&l.length;a<c;a++)e&1?l[a].call(n):o=l[a].call(n,o);return o},d=(i,e,n,o,a,l)=>{for(var c,v,j,u,b,N=e&7,oe=!1,se=!1,x=i.length+1,le=D[N+5],he=i[x-1]=[],de=i[x]||(i[x]=[]),m=(a=a.prototype,ye({get[n](){return fe(this,l)},set[n](_){return Ee(this,l,_)}},n)),f=o.length-1;f>=0;f--)u=be(N,n,j={},i[3],de),u.static=oe,u.private=se,b=u.access={has:_=>n in _},b.get=_=>_[n],b.set=(_,ge)=>_[n]=ge,v=(0,o[f])({get:m.get,set:m.set},u),j._=1,v===void 0?y(v)&&(m[le]=v):typeof v!="object"||v===null?w("Object expected"):(y(c=v.get)&&(m.get=c),y(c=v.set)&&(m.set=c),y(c=v.init)&&he.unshift(c));return m&&Z(a,n,m),a},p=(i,e,n)=>F(i,typeof e!="symbol"?e+"":e,n),X=(i,e,n)=>e.has(i)||w("Cannot "+n),fe=(i,e,n)=>(X(i,e,"read from private field"),e.get(i)),h=(i,e,n)=>e.has(i)?w("Cannot add the same private member more than once"):e instanceof WeakSet?e.add(i):e.set(i,n),Ee=(i,e,n,o)=>(X(i,e,"write to private field"),e.set(i,n),n),q,G,U,J,K,Q,V,Y,ee,te,ie,ne,re,ae,B,t,k,z,L,P,T,H,W,M,O,R,S,C,I,$;class s extends(B=pe,ae=[g({type:Object})],re=[g({type:Object})],ne=[g({type:Object})],ie=[g({type:String})],te=[g({type:String})],ee=[g({type:Boolean})],Y=[g({type:String})],V=[me()],Q=[g({type:Object})],K=[g({type:Object})],J=[g({type:Object})],U=[g({type:Number})],G=[g({type:Number})],q=[g({type:Array})],B){constructor(){super(...arguments),h(this,k,r(t,8,this,null)),r(t,11,this),h(this,z,r(t,12,this,null)),r(t,15,this),h(this,L,r(t,16,this,null)),r(t,19,this),h(this,P,r(t,20,this,"day")),r(t,23,this),h(this,T,r(t,24,this,"auto")),r(t,27,this),h(this,H,r(t,28,this,!1)),r(t,31,this),h(this,W,r(t,32,this,"")),r(t,35,this),h(this,M,r(t,36,this,null)),r(t,39,this),h(this,O,r(t,40,this,null)),r(t,43,this),h(this,R,r(t,44,this,null)),r(t,47,this),h(this,S,r(t,48,this,null)),r(t,51,this),h(this,C,r(t,52,this,null)),r(t,55,this),h(this,I,r(t,56,this,null)),r(t,59,this),h(this,$,r(t,60,this,[])),r(t,63,this),p(this,"_rangeHoverPreviewEl",null),p(this,"_rangeComparisonPreviewEl",null),p(this,"_rangeZoomHighlightEl",null),p(this,"_rangeZoomWindowHighlightEl",null),p(this,"_rangeChartHoverLineEl",null),p(this,"_rangeChartHoverWindowLineEl",null),p(this,"_rangeEventLayerEl",null)}firstUpdated(){const e=this.shadowRoot;this._rangeHoverPreviewEl=e.getElementById("range-hover-preview"),this._rangeComparisonPreviewEl=e.getElementById("range-comparison-preview"),this._rangeZoomHighlightEl=e.getElementById("range-zoom-highlight"),this._rangeZoomWindowHighlightEl=e.getElementById("range-zoom-window-highlight"),this._rangeChartHoverLineEl=e.getElementById("range-chart-hover-line"),this._rangeChartHoverWindowLineEl=e.getElementById("range-chart-hover-window-line"),this._rangeEventLayerEl=e.getElementById("range-event-layer"),this._syncAllOverlays()}updated(e){const n=["hoveredPeriodRange","comparisonPreview","zoomRange","zoomWindowRange","rangeBounds"],o=["chartHoverTimeMs","chartHoverWindowTimeMs","events","rangeBounds"];n.some(a=>e.has(a))&&this._syncTrackOverlays(),o.some(a=>e.has(a))&&this._syncTimelineOverlays()}render(){return ve`
      <range-timeline
        .startTime=${this.startTime}
        .endTime=${this.endTime}
        .rangeBounds=${this.rangeBounds}
        .zoomLevel=${this.zoomLevel}
        .dateSnapping=${this.dateSnapping}
        .isLiveEdge=${this.isLiveEdge}
        .locale=${this.locale}
        @dp-range-period-hover=${this._onPeriodHoverInternal}
        @dp-range-period-leave=${this._onPeriodLeaveInternal}
      >
        <!-- track overlays: positioned inside .range-track of range-timeline -->
        <div
          slot="track-overlays"
          id="range-hover-preview"
          class="range-hover-preview"
        ></div>
        <div
          slot="track-overlays"
          id="range-comparison-preview"
          class="range-comparison-preview"
        ></div>
        <div
          slot="track-overlays"
          id="range-zoom-highlight"
          class="range-zoom-highlight"
        ></div>
        <div
          slot="track-overlays"
          id="range-zoom-window-highlight"
          class="range-zoom-window-highlight"
        ></div>
        <!-- timeline overlays: positioned inside .range-timeline of range-timeline -->
        <div
          slot="timeline-overlays"
          id="range-chart-hover-line"
          class="range-chart-hover-line"
          aria-hidden="true"
        ></div>
        <div
          slot="timeline-overlays"
          id="range-chart-hover-window-line"
          class="range-chart-hover-window-line"
          aria-hidden="true"
        ></div>
        <div
          slot="timeline-overlays"
          id="range-event-layer"
          class="range-event-layer"
        ></div>
      </range-timeline>
    `}_pct(e){if(!this.rangeBounds)return 0;const n=Math.max(1,this.rangeBounds.max-this.rangeBounds.min);return(e-this.rangeBounds.min)/n*100}revealSelection(){this.shadowRoot?.querySelector("range-timeline")?.revealSelection?.()}_onPeriodHoverInternal(e){const{start:n,end:o}=e.detail;this.hoveredPeriodRange={start:n.getTime(),end:o.getTime()}}_onPeriodLeaveInternal(){this.hoveredPeriodRange=null}_syncAllOverlays(){this._syncTrackOverlays(),this._syncTimelineOverlays()}_setRangeOverlay(e,n){if(!e)return;if(!n||!this.rangeBounds){e.classList.remove("visible");return}const o=Math.max(1,this.rangeBounds.max-this.rangeBounds.min),a=E(n.start,this.rangeBounds.min,this.rangeBounds.max),l=E(n.end,this.rangeBounds.min,this.rangeBounds.max),c=(a-this.rangeBounds.min)/o*100,v=(l-this.rangeBounds.min)/o*100;e.style.left=`${c}%`,e.style.width=`${Math.max(0,v-c)}%`,e.classList.add("visible")}_setHoverLine(e,n){if(!e)return;if(n==null||!this.rangeBounds){e.classList.remove("visible");return}const o=E(n,this.rangeBounds.min,this.rangeBounds.max);e.style.left=`${this._pct(o)}%`,e.classList.add("visible")}_syncTrackOverlays(){this._setRangeOverlay(this._rangeHoverPreviewEl,this.hoveredPeriodRange??null),this._setRangeOverlay(this._rangeComparisonPreviewEl,this.comparisonPreview??null),this._setRangeOverlay(this._rangeZoomHighlightEl,this.zoomRange??null),this._setRangeOverlay(this._rangeZoomWindowHighlightEl,this.zoomWindowRange??null)}_syncTimelineOverlays(){this._setHoverLine(this._rangeChartHoverLineEl,this.chartHoverTimeMs??null),this._setHoverLine(this._rangeChartHoverWindowLineEl,this.chartHoverWindowTimeMs??null),this._syncEventLayer()}_syncEventLayer(){if(!this._rangeEventLayerEl||!this.rangeBounds)return;this._rangeEventLayerEl.innerHTML="";const e=document.createDocumentFragment(),n=Math.max(1,this.rangeBounds.max-this.rangeBounds.min);for(const o of this.events){const a=new Date(o.timestamp).getTime();if(!Number.isFinite(a)||a<this.rangeBounds.min||a>this.rangeBounds.max)continue;const l=document.createElement("span");l.className="range-event-dot",l.style.left=`${(a-this.rangeBounds.min)/n*100}%`,l.style.background=o.color??"#03a9f4",e.appendChild(l)}this._rangeEventLayerEl.appendChild(e)}}t=we(B);k=new WeakMap;z=new WeakMap;L=new WeakMap;P=new WeakMap;T=new WeakMap;H=new WeakMap;W=new WeakMap;M=new WeakMap;O=new WeakMap;R=new WeakMap;S=new WeakMap;C=new WeakMap;I=new WeakMap;$=new WeakMap;d(t,4,"startTime",ae,s,k);d(t,4,"endTime",re,s,z);d(t,4,"rangeBounds",ne,s,L);d(t,4,"zoomLevel",ie,s,P);d(t,4,"dateSnapping",te,s,T);d(t,4,"isLiveEdge",ee,s,H);d(t,4,"locale",Y,s,W);d(t,4,"hoveredPeriodRange",V,s,M);d(t,4,"comparisonPreview",Q,s,O);d(t,4,"zoomRange",K,s,R);d(t,4,"zoomWindowRange",J,s,S);d(t,4,"chartHoverTimeMs",U,s,C);d(t,4,"chartHoverWindowTimeMs",G,s,I);d(t,4,"events",q,s,$);xe(t,s);p(s,"styles",_e);customElements.define("panel-timeline",s);
