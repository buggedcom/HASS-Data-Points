import{i as se,b as F,g as oe}from"./iframe-maWesKjk.js";import{n as b}from"./property-DyW-YDBW.js";import{m}from"./localize-Cz1ya3ms.js";import"./sidebar-options-section-XIovhKDU.js";import"./checkbox-list-Z254-hxP.js";import"./radio-group-CFoLmpSs.js";import{l as re}from"./localized-decorator-CXjGGqe_.js";const le=se`
  :host {
    display: block;
    --dp-spacing-sm: var(--spacing, 8px);
  }

  .y-axis-group {
    margin-top: var(--dp-spacing-sm);
  }

  .is-subopt {
    display: flex;
    align-items: center;
    gap: var(--dp-spacing-sm);
    font-size: 0.9rem;
    color: var(--primary-text-color);
    padding-left: 22px;
  }

  .is-disabled {
    opacity: 0.5;
  }

  .gap-select {
    width: auto;
    max-width: 100%;
    min-width: 0;
    box-sizing: border-box;
    padding: calc(var(--spacing, 8px) * 0.5) calc(var(--spacing, 8px) * 0.75);
    border-radius: 8px;
    border: 1px solid
      color-mix(
        in srgb,
        var(--divider-color, rgba(0, 0, 0, 0.12)) 88%,
        transparent
      );
    background: var(--card-background-color, #fff);
    color: var(--primary-text-color);
    font: inherit;
    font-size: 0.84rem;
  }
`;var ne=Object.create,D=Object.defineProperty,pe=Object.getOwnPropertyDescriptor,L=(a,e)=>(e=Symbol[a])?e:Symbol.for("Symbol."+a),y=a=>{throw TypeError(a)},U=(a,e,t)=>e in a?D(a,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):a[e]=t,Y=(a,e)=>D(a,"name",{value:e,configurable:!0}),he=a=>[,,,ne(a?.[L("metadata")]??null)],V=["class","method","getter","setter","accessor","field","value","get","set"],f=a=>a!==void 0&&typeof a!="function"?y("Function expected"):a,de=(a,e,t,n,o)=>({kind:V[a],name:e,metadata:n,addInitializer:l=>t._?y("Already initialized"):o.push(f(l||null))}),ce=(a,e)=>U(e,L("metadata"),a[3]),r=(a,e,t,n)=>{for(var o=0,l=a[e>>1],v=l&&l.length;o<v;o++)e&1?l[o].call(t):n=l[o].call(t,n);return n},u=(a,e,t,n,o,l)=>{var v,d,I,w,S,i=e&7,x=!!(e&8),_=!!(e&16),M=i>3?a.length+1:i?x?1:2:0,B=V[i+5],N=i>3&&(a[M-1]=[]),ie=a[M]||(a[M]=[]),c=i&&(!_&&!x&&(o=o.prototype),i<5&&(i>3||!_)&&pe(i<4?o:{get[t](){return q(this,l)},set[t](p){return R(this,l,p)}},t));i?_&&i<4&&Y(l,(i>2?"set ":i>1?"get ":"")+t):Y(o,t);for(var k=n.length-1;k>=0;k--)w=de(i,t,I={},a[3],ie),i&&(w.static=x,w.private=_,S=w.access={has:_?p=>ue(o,p):p=>t in p},i^3&&(S.get=_?p=>(i^1?q:ve)(p,o,i^4?l:c.get):p=>p[t]),i>2&&(S.set=_?(p,$)=>R(p,o,$,i^4?l:c.set):(p,$)=>p[t]=$)),d=(0,n[k])(i?i<4?_?l:c[B]:i>4?void 0:{get:c.get,set:c.set}:o,w),I._=1,i^4||d===void 0?f(d)&&(i>4?N.unshift(d):i?_?l=d:c[B]=d:o=d):typeof d!="object"||d===null?y("Object expected"):(f(v=d.get)&&(c.get=v),f(v=d.set)&&(c.set=v),f(v=d.init)&&N.unshift(v));return i||ce(a,o),c&&D(o,t,c),_?i^4?l:c:o},_e=(a,e,t)=>U(a,e+"",t),O=(a,e,t)=>e.has(a)||y("Cannot "+t),ue=(a,e)=>Object(e)!==e?y('Cannot use the "in" operator on this value'):a.has(e),q=(a,e,t)=>(O(a,e,"read from private field"),t?t.call(a):e.get(a)),g=(a,e,t)=>e.has(a)?y("Cannot add the same private member more than once"):e instanceof WeakSet?e.add(a):e.set(a,t),R=(a,e,t,n)=>(O(a,e,"write to private field"),n?n.call(a,t):e.set(a,t),t),ve=(a,e,t)=>(O(a,e,"access private method"),t),X,J,K,Q,Z,j,ee,ae,C,te,s,G,T,z,A,E,P,H,W;const be=[{value:"auto",label:"Auto-detect"},{value:"5m",label:"5 minutes"},{value:"15m",label:"15 minutes"},{value:"1h",label:"1 hour"},{value:"2h",label:"2 hours"},{value:"3h",label:"3 hours"},{value:"6h",label:"6 hours"},{value:"12h",label:"12 hours"},{value:"24h",label:"24 hours"}],ge=[{value:"combined",label:"Combine y-axis by unit"},{value:"unique",label:"Unique y-axis per series"},{value:"split",label:"Split series into rows"}],me=[{value:"follow_series",label:"Follow the series"},{value:"snap_to_data_points",label:"Snap to data points"}];te=[re()];class h extends(C=oe,ae=[b({type:Boolean,attribute:"show-tooltips"})],ee=[b({type:Boolean,attribute:"show-hover-guides"})],j=[b({type:Boolean,attribute:"show-data-gaps"})],Z=[b({type:String,attribute:"data-gap-threshold"})],Q=[b({type:String,attribute:"y-axis-mode"})],K=[b({type:String,attribute:"hover-snap-mode"})],J=[b({type:Boolean})],X=[b({type:Boolean})],C){constructor(){super(...arguments),g(this,G,r(s,8,this,!0)),r(s,11,this),g(this,T,r(s,12,this,!1)),r(s,15,this),g(this,z,r(s,16,this,!0)),r(s,19,this),g(this,A,r(s,20,this,"2h")),r(s,23,this),g(this,E,r(s,24,this,"combined")),r(s,27,this),g(this,P,r(s,28,this,"follow_series")),r(s,31,this),g(this,H,r(s,32,this,!1)),r(s,35,this),g(this,W,r(s,36,this,!0)),r(s,39,this)}_localizedOptions(e){return e.map(t=>({...t,label:m(t.label)}))}_emitDisplay(e,t){this.dispatchEvent(new CustomEvent("dp-display-change",{detail:{kind:e,value:t},bubbles:!0,composed:!0}))}_onCheckboxChange(e){const{name:t,checked:n}=e.detail;this._emitDisplay(t,n)}_onGapThresholdChange(e){this._emitDisplay("data_gap_threshold",e.target.value)}_onYAxisModeChange(e){this._emitDisplay("y_axis_mode",e.detail.value)}_onHoverSnapModeChange(e){this._emitDisplay("hover_snap_mode",e.detail.value)}render(){return F`
      <sidebar-options-section
        .title=${m("Chart Display")}
        .subtitle=${m("Configure visual and interaction behaviour for the chart.")}
        .collapsible=${this.collapsible}
        .open=${this.open}
      >
        <checkbox-list
          .items=${[{name:"tooltips",label:m("Show tooltips"),checked:this.showTooltips},{name:"hover_guides",label:m("Emphasize hover guides"),checked:this.showHoverGuides},{name:"data_gaps",label:m("Show data gaps"),checked:this.showDataGaps}]}
          @dp-item-change=${this._onCheckboxChange}
        ></checkbox-list>
        <div class="is-subopt ${this.showDataGaps?"":"is-disabled"}">
          <select
            class="gap-select"
            ?disabled=${!this.showDataGaps}
            @change=${this._onGapThresholdChange}
          >
            ${this._localizedOptions(be).map(e=>F`
                <option
                  value=${e.value}
                  ?selected=${e.value===this.dataGapThreshold}
                >
                  ${e.label}
                </option>
              `)}
          </select>
          <span>${m("Gap threshold")}</span>
        </div>
        <div class="y-axis-group">
          <radio-group
            .name=${"chart-y-axis-mode"}
            .value=${this.yAxisMode}
            .options=${this._localizedOptions(ge)}
            @dp-radio-change=${this._onYAxisModeChange}
          ></radio-group>
        </div>
        <div class="y-axis-group">
          <radio-group
            .name=${"chart-hover-snap-mode"}
            .value=${this.hoverSnapMode}
            .options=${this._localizedOptions(me)}
            @dp-radio-change=${this._onHoverSnapModeChange}
          ></radio-group>
        </div>
      </sidebar-options-section>
    `}}s=he(C);G=new WeakMap;T=new WeakMap;z=new WeakMap;A=new WeakMap;E=new WeakMap;P=new WeakMap;H=new WeakMap;W=new WeakMap;u(s,4,"showTooltips",ae,h,G);u(s,4,"showHoverGuides",ee,h,T);u(s,4,"showDataGaps",j,h,z);u(s,4,"dataGapThreshold",Z,h,A);u(s,4,"yAxisMode",Q,h,E);u(s,4,"hoverSnapMode",K,h,P);u(s,4,"collapsible",J,h,H);u(s,4,"open",X,h,W);h=u(s,0,"SidebarChartDisplaySection",te,h);_e(h,"styles",le);r(s,1,h);customElements.define("sidebar-chart-display-section",h);
