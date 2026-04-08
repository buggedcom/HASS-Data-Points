import{g as Es,i as Rs,b as de}from"./iframe-maWesKjk.js";import{D as es,C as te}from"./constants-B5c5KCbY.js";import{l as kt}from"./logger-CXy2rxCm.js";import{m as It}from"./localize-Cz1ya3ms.js";import{e as wt,f as ge}from"./format-DAmR8eHG.js";import{r as ss,p as Ls,s as Ee,C as Re,a as Le,b as qe}from"./chart-dom-bf6ubeYH.js";import{e as Bt,a as is,b as ns,d as as,f as os,c as rs,g as ls,l as cs}from"./entity-name-TOInf1r0.js";import{w as Te,a as ke,b as nt,n as ds,i as Is,c as Ms,e as Ds,f as ks}from"./events-api-hvJ4BhpZ.js";import{h as U,c as Ps}from"./color-BkgFqjP8.js";import{n as se,m as Os,a as Ie,r as Ts}from"./target-selection-BHyMPCgW.js";import"./annotation-chip-row-DlfpTpb7.js";import"./preload-helper-PPVm8Dsz.js";import"./property-DyW-YDBW.js";import"./repeat-Dcg3Fkk0.js";import"./directive-jorct-Oe.js";import"./annotation-chip-BpF_qtuH.js";var $s=Object.defineProperty,Vs=(a,t,e)=>t in a?$s(a,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):a[t]=e,Jt=(a,t,e)=>Vs(a,typeof t!="symbol"?t+"":t,e);class zs extends Es{constructor(){super(...arguments),Jt(this,"_hass"),Jt(this,"_config",{}),Jt(this,"_loadRequestId",0),Jt(this,"_lastDrawArgs",[]),Jt(this,"_previousSeriesEndpoints",new Map),Jt(this,"_unsubscribe",null),Jt(this,"_resizeObserver",null),Jt(this,"_loadRaf",null),Jt(this,"_loadInFlight",!1),Jt(this,"_hasStartedInitialLoad",!1),Jt(this,"_windowListener",null),Jt(this,"_initialized",!1)}setConfig(t){this._config=t??{},this.requestUpdate()}set hass(t){this._hass=t,this.requestUpdate(),this._hasStartedInitialLoad&&this._scheduleLoad()}get hass(){return this._hass}connectedCallback(){super.connectedCallback(),this._hass&&!this._hasStartedInitialLoad&&this._scheduleLoad()}updated(){!this._initialized&&this._hass&&(this._initialized=!0,this._setupAutoRefresh(),this._setupResizeObserver(),this._scheduleLoad())}disconnectedCallback(){super.disconnectedCallback(),this._cleanup()}_scheduleLoad(){!this._hass||this._loadRaf!==null||this._loadInFlight||(this._loadRaf=window.requestAnimationFrame(()=>{this._loadRaf=null,!(!this._hass||!this.isConnected||this._loadInFlight)&&(this._hasStartedInitialLoad=!0,this._loadInFlight=!0,Promise.resolve(this._load()).catch(t=>{kt.error("[hass-datapoints chart-base] load failed",t)}).finally(()=>{this._loadInFlight=!1}))}))}_setupAutoRefresh(){this._hass&&(this._hass.connection.subscribeEvents(()=>{this._scheduleLoad()},`${es}_event_recorded`).then(t=>{this._unsubscribe=t}).catch(()=>{}),this._windowListener=()=>{this._scheduleLoad()},window.addEventListener("hass-datapoints-event-recorded",this._windowListener))}_setupResizeObserver(){const t=this.shadowRoot?.querySelector(".chart-wrap")??this.shadowRoot?.querySelector("hass-datapoints-history-chart");!t||!window.ResizeObserver||(this._resizeObserver=new ResizeObserver(()=>{this._lastDrawArgs.length&&this._drawChart(...this._lastDrawArgs)}),this._resizeObserver.observe(t))}_cleanup(){this._loadRaf!==null&&(window.cancelAnimationFrame(this._loadRaf),this._loadRaf=null),this._unsubscribe&&(this._unsubscribe(),this._unsubscribe=null),this._windowListener&&(window.removeEventListener("hass-datapoints-event-recorded",this._windowListener),this._windowListener=null),this._resizeObserver&&(this._resizeObserver.disconnect(),this._resizeObserver=null)}static getStubConfig(){return{title:""}}}const Hs=Rs`
  :host {
    display: block;
    height: 100%;
  }

  ha-card {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .card-header {
    margin: 0;
    padding: 12px 16px 0;
    font-size: 24px;
    font-weight: 400;
    line-height: 48px;
    color: var(--primary-text-color);
    flex: 0 0 auto;
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }

  .card-header-title {
    min-width: 0;
    font: inherit;
    line-height: inherit;
    font-weight: inherit;
  }

  .card-header-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    align-self: center;
  }

  hass-datapoints-history-chart {
    flex: 1 1 auto;
    min-height: 0;
  }
`,ve={"1s":1e3,"5s":5e3,"10s":1e4,"15s":15e3,"30s":3e4,"1m":6e4,"2m":2*6e4,"5m":5*6e4,"10m":10*6e4,"15m":15*6e4,"30m":30*6e4,"1h":60*6e4,"2h":120*6e4,"3h":180*6e4,"4h":240*6e4,"6h":360*6e4,"12h":720*6e4,"24h":1440*6e4};function Ns(a){return{battery:"low",battery_charging:"charging",carbon_monoxide:"detected",cold:"cold",connectivity:"connected",door:"open",garage_door:"open",gas:"detected",heat:"hot",lock:"unlocked",moisture:"wet",motion:"motion",moving:"moving",occupancy:"occupied",opening:"open",plug:"plugged in",power:"power",presence:"present",problem:"problem",running:"running",safety:"unsafe",smoke:"smoke",sound:"sound",tamper:"tampered",update:"update available",vibration:"vibration",window:"open"}[a]||"on"}function Fs(a){return{battery:"normal",battery_charging:"not charging",carbon_monoxide:"clear",cold:"normal",connectivity:"disconnected",door:"closed",garage_door:"closed",gas:"clear",heat:"normal",lock:"locked",moisture:"dry",motion:"clear",moving:"still",occupancy:"clear",opening:"closed",plug:"unplugged",power:"off",presence:"away",problem:"ok",running:"idle",safety:"safe",smoke:"clear",sound:"quiet",tamper:"clear",update:"up to date",vibration:"still",window:"closed"}[a]||"off"}function Ws(a,t){return(Array.isArray(t)?t:[]).map(e=>{const s=parseFloat(e?.s??"");if(Number.isNaN(s))return null;const i=e?.lu??e?.lc??e?.last_changed??e?.last_updated,o=typeof i=="number"?i:new Date(i||0).getTime()/1e3;return Number.isFinite(o)?{lu:Math.round(o*1e3)/1e3,s:String(s)}:null}).filter(e=>e!==null)}function Bs(a,t,e=[]){if(!a)return[];const s=a;if(Array.isArray(s[t]))return s[t];if(Array.isArray(a)){const i=a,o=e.indexOf(t);if(o>=0&&Array.isArray(i[o]))return i[o];if(i.every(n=>n&&typeof n=="object"&&!Array.isArray(n)))return i.filter(n=>n.entity_id===t)}if(a&&typeof a=="object"){const i=a;if(Array.isArray(i.result?.[t]))return i.result[t];if(Array.isArray(i.result)){if(i.result.every(n=>n&&typeof n=="object"&&!Array.isArray(n)))return i.result.filter(n=>n.entity_id===t);const o=e.indexOf(t);if(o>=0&&Array.isArray(i.result[o]))return i.result[o]}}return[]}function je(a,t){const e=t&&typeof t=="object"?t[a]??[]:[];return(Array.isArray(e)?e:[]).map(s=>{const i=Number(s?.mean);if(!Number.isFinite(i))return null;const o=s?.start;let n;return typeof o=="number"?o>1e11?n=o:n=o*1e3:n=new Date(o).getTime(),Number.isFinite(n)?{lu:Math.round(n)/1e3,s:String(i)}:null}).filter(s=>s!==null).sort((s,i)=>s.lu-i.lu)}function qs(a,t){const e=Array.isArray(a)?a:[],s=Array.isArray(t)?t:[];if(!e.length)return[...s];if(!s.length)return[...e];const i=e[0].lu*1e3,o=e[e.length-1].lu*1e3,n=[...s.filter(l=>{const h=l.lu*1e3;return h<i||h>o}),...e];return n.sort((l,h)=>l.lu-h.lu),n}function js(a){let t=1/0,e=-1/0;for(const s of a){const i=Number(s);Number.isFinite(i)&&(i<t&&(t=i),i>e&&(e=i))}return!Number.isFinite(t)||!Number.isFinite(e)?null:{min:t,max:e}}function ie(a,t,e){return Math.min(e,Math.max(t,a))}function Zt(a,t=""){return a==null||a===""||Number.isNaN(Number(a))?"":`${Number(a).toFixed(2).replace(/\.00$/,"")}${t?` ${t}`:""}`}function Ke(a,t=""){return a==null||a===""?"No value":typeof a=="string"?t?`${a} ${t}`:a:Zt(a,t)}function Nt(a){const t=a.shadowRoot??a.getRootNode();return t instanceof ShadowRoot||t instanceof Document?t:document}function Me(a){return a?{left:a.left+8,right:a.right-8,top:a.top+8,bottom:a.bottom-8}:null}function Vt(a){return Number.isFinite(a)?ge(new Date(a).toISOString()):""}function Kt(a,...t){let e=It(a);return t.forEach((s,i)=>{e=e.replace(new RegExp(`\\{${i}\\}`,"g"),s)}),e}function hs(){return{trend_residual:It("Trend deviation"),rate_of_change:It("Sudden change"),iqr:It("Statistical outlier (IQR)"),rolling_zscore:It("Rolling Z-score"),persistence:It("Flat-line / stuck"),comparison_window:It("Comparison window")}}function Ks(a){if(!a?.cluster?.points?.length)return null;const t=a.cluster.points,e=t[0],s=t[t.length-1],i=t.reduce((w,_)=>!w||Math.abs(_.residual)>Math.abs(w.residual)?_:w,null);if(!i)return null;const o=a.label||a.relatedEntityId||"Series",n=a.unit||"",l=a.cluster,h=l.anomalyMethod??"trend_residual",u=hs()[h]||h;let d,c;if(h==="rate_of_change"){const w=n?`${n}/h`:"units/h";d=Kt("{0} shows an unusual rate of change between {1} and {2}.",o,Vt(e.timeMs),Vt(s.timeMs)),c=Kt("Peak rate deviation: {0} from a typical rate of {1} at {2}.",Zt(i.residual,w),Zt(i.baselineValue,w),Vt(i.timeMs))}else if(h==="iqr")d=Kt("{0} contains statistical outliers between {1} and {2}.",o,Vt(e.timeMs),Vt(s.timeMs)),c=Kt("Peak value: {0}, deviating {1} from the median at {2}.",Zt(i.value,n),Zt(Math.abs(i.residual),n),Vt(i.timeMs));else if(h==="rolling_zscore")d=Kt("{0} shows statistically unusual values between {1} and {2}.",o,Vt(e.timeMs),Vt(s.timeMs)),c=Kt("Peak deviation: {0} from a rolling mean of {1} at {2}.",Zt(i.residual,n),Zt(i.baselineValue,n),Vt(i.timeMs));else if(h==="persistence"){const w=typeof l.flatRange=="number"?l.flatRange:null,_=w!==null?Kt(" (range: {0})",Zt(w,n)):"";d=Kt("{0} appears stuck or flat between {1} and {2}{3}.",o,Vt(e.timeMs),Vt(s.timeMs),_),c=Kt("Value remained near {0} for an unusually long period.",Zt(i.baselineValue,n))}else h==="comparison_window"?(d=Kt("{0} deviates significantly from the comparison window between {1} and {2}.",o,Vt(e.timeMs),Vt(s.timeMs)),c=Kt("Peak deviation from comparison: {0} at {1}.",Zt(i.residual,n),Vt(i.timeMs))):(d=Kt("{0} deviates from its expected trend between {1} and {2}.",o,Vt(e.timeMs),Vt(s.timeMs)),c=Kt("Peak deviation: {0} from a baseline of {1} at {2}.",Zt(i.residual,n),Zt(i.baselineValue,n),Vt(i.timeMs)));return{methodLabel:u,description:d,alert:c}}function us(a){let t;if(Array.isArray(a)?t=a:a?t=[a]:t=[],t.length===0)return null;const e=t.map(Ks).filter(n=>n!==null);if(e.length===0)return null;const s=It("Click the highlighted circle to add an annotation.",{id:"Click the highlighted circle to add an annotation."});if(e.length===1){const n=e[0],l=t[0]?.cluster,h=Array.isArray(l?.detectedByMethods)&&l.detectedByMethods.length>1?l.detectedByMethods:null,u=h!==null,d=u?It("⚠️ Multi-method Anomaly"):It("⚠️ Anomaly Insight"),c=hs(),w=u?`
${It("Confirmed by")} ${h.length} ${It("methods:")} ${h.map(_=>c[_]||_).join(", ")}.`:"";return{title:d,description:n.description+w,alert:`${It("Alert:")} ${n.alert}`,instruction:s}}const i=e.map(n=>`${n.methodLabel}:
${n.description}`).join(`

`),o=e.map(n=>`${n.methodLabel}: ${n.alert}`).join(`
`);return{title:It("⚠️ Multi-method Anomaly"),description:i,alert:o,instruction:s}}function Zs(a,t,e,s,i=null){if(!a)return;a.style.display="block";const o=a.getBoundingClientRect(),n=o.width||220,l=o.height||64,h=12,u=Number.isFinite(i?.left)?i?.left:h,d=Number.isFinite(i?.right)?i?.right:window.innerWidth-h,c=Number.isFinite(i?.top)?i?.top:h,w=Number.isFinite(i?.bottom)?i?.bottom:window.innerHeight-h;let _=t-h-n;if(_<u){const C=s?s.getBoundingClientRect():null;_=C?C.right+h:t+h}const g=s?s.getBoundingClientRect():null;let S=g?g.top:e-l-h;S+l>w&&(S=Math.max(c,w-l)),_=Math.min(Math.max(_,u),Math.max(u,d-n)),S=Math.min(Math.max(S,c),Math.max(c,w-l)),a.style.left=`${_}px`,a.style.top=`${S}px`}function Xs(a,t,e=null){if(!a||!t)return;a.style.display="block";const s=t.getBoundingClientRect(),i=a.getBoundingClientRect(),o=10,n=Number.isFinite(e?.left)?e?.left:o,l=Number.isFinite(e?.right)?e?.right:window.innerWidth-o,h=Number.isFinite(e?.top)?e?.top:o,u=Number.isFinite(e?.bottom)?e?.bottom:window.innerHeight-o;let d=s.right+o;d+i.width>l&&(d=s.left-i.width-o);let c=s.top;c+i.height>u&&(c=Math.max(h,u-i.height)),d=Math.min(Math.max(d,n),Math.max(n,l-i.width)),c=Math.min(Math.max(c,h),Math.max(h,u-i.height)),a.style.left=`${d}px`,a.style.top=`${c}px`}function Us(a,t,e=null){if(!a||!t)return;a.style.display="block";const s=t.getBoundingClientRect(),i=a.getBoundingClientRect(),o=8,n=Number.isFinite(e?.left)?e?.left:o,l=Number.isFinite(e?.right)?e?.right:window.innerWidth-o,h=Number.isFinite(e?.top)?e?.top:o,u=Number.isFinite(e?.bottom)?e?.bottom:window.innerHeight-o;let d=s.left;d+i.width>l&&(d=Math.max(n,l-i.width));let c=s.bottom+o;c+i.height>u&&(c=Math.max(h,s.top-i.height-o)),d=Math.min(Math.max(d,n),Math.max(n,l-i.width)),c=Math.min(Math.max(c,h),Math.max(h,u-i.height)),a.style.left=`${d}px`,a.style.top=`${c}px`}function _s(a){return!a||!Nt(a)?null:Nt(a).getElementById("annotation-tooltips")}function $e(a){const t=_s(a);t&&(t.innerHTML="")}function Ys(a,t){const e=a,s=document.createElement("div");s.className="tooltip secondary annotation-tooltip";const o=t?.chart_value!=null&&t.chart_value!==""?`<div class="tt-value">${wt(Zt(t.chart_value,t.chart_unit))}</div>`:"",n=t?.message||"Data point",l=t?.annotation&&t.annotation!==t.message?t.annotation:"",h=Qs(e._hass,t);return s.innerHTML=`
    <div class="tt-time">${wt(ge(t.timestamp))}</div>
    ${o}
    <div class="tt-message-row">
      <span class="tt-dot" style="background:${wt(t?.color||"#03a9f4")}"></span>
      <span class="tt-message">${wt(n)}</span>
    </div>
    <div class="tt-annotation" style="display:${l?"block":"none"}">${wt(l)}</div>
    <div class="tt-entities" style="display:${h?"flex":"none"}">${h}</div>
  `,s}function Gs(a,t,e,s=null){const i=_s(a);if(!i)return[];$e(a);const o=Array.isArray(t?.events)?t.events:[];if(!o.length)return[];const n=[];let l=e;for(const h of o){const u=Ys(a,h);i.appendChild(u),n.length===0?Xs(u,l,s):Us(u,l,s),n.push(u),l=u}return n}function be(a){const t=Nt(a).getElementById("tooltip"),e=Nt(a).getElementById("anomaly-tooltip");t&&(t.style.display="none"),e&&(e.style.display="none"),$e(a)}function Js(a){const t=a.grouped===!0&&a.rawVisible===!0,e=a.comparisonDerived===!0&&a.grouped===!0;if(a.comparison===!0){const s=String(a.windowLabel||It("Date window"));return a.grouped===!0?s:`${s}: ${String(a.label||"")}`}if(a.trend===!0){const s=It("Trend");return t||e?s:`${s}: ${a.baseLabel||a.label||""}`}if(a.rate===!0){const s=It("Rate");return t||e?s:`${s}: ${a.baseLabel||a.label||""}`}if(a.delta===!0){const s=It("Delta");return t||e?s:`${s}: ${a.baseLabel||a.label||""}`}if(a.summary===!0){const s=String(a.summaryType||"").toUpperCase();return t||e?s:`${s}: ${a.baseLabel||a.label||""}`}if(a.threshold===!0){const s=It("Threshold");return t||e?s:`${s}: ${a.baseLabel||a.label||""}`}return String(a.label||"")}function Pe(a,t,e,s){const i=Nt(a),o=i.getElementById("tooltip"),n=i.getElementById("tt-time"),l=i.getElementById("tt-value"),h=i.getElementById("tt-series"),u=i.getElementById("anomaly-tooltip"),d=i.getElementById("tt-secondary-title"),c=i.getElementById("tt-secondary-description"),w=i.getElementById("tt-secondary-alert"),_=i.getElementById("tt-secondary-instruction"),g=i.getElementById("tt-message-row"),S=i.getElementById("tt-message"),C=i.getElementById("tt-annotation"),P=i.getElementById("tt-entities");if(!o||!n||!l||!g||!S||!C||!P)return;const A=Number.isFinite(t.rangeStartMs)?t.rangeStartMs:t.timeMs,M=Number.isFinite(t.rangeEndMs)?t.rangeEndMs:t.timeMs;n.textContent=A===M?ge(new Date(t.timeMs).toISOString()):`${ge(new Date(A).toISOString())} - ${ge(new Date(M).toISOString())}`;const N=Array.isArray(t.values)?t.values:[],it=Array.isArray(t.trendValues)?t.trendValues:[],D=Array.isArray(t.rateValues)?t.rateValues:[],q=Array.isArray(t.deltaValues)?t.deltaValues:[],tt=Array.isArray(t.summaryValues)?t.summaryValues:[],G=Array.isArray(t.thresholdValues)?t.thresholdValues:[],At=Array.isArray(t.binaryValues)?t.binaryValues:[],ct=Array.isArray(t.comparisonValues)?t.comparisonValues:[],F=[],mt=new Set,V=new Set,ht=new Set,vt=new Set,ft=new Set,gt=new Set,Mt=(y,m)=>{it.forEach((v,E)=>{mt.has(E)||v.comparisonParentId!==y.entityId&&!(v.relatedEntityId===y.relatedEntityId&&v.windowLabel===y.windowLabel)||(mt.add(E),F.push({...v,rawVisible:!0,comparisonDerived:!0,grouped:!0,key:`comparison-trend-${m}-${E}`}))}),D.forEach((v,E)=>{V.has(E)||v.comparisonParentId!==y.entityId&&!(v.relatedEntityId===y.relatedEntityId&&v.windowLabel===y.windowLabel)||(V.add(E),F.push({...v,rawVisible:!0,comparisonDerived:!0,grouped:!0,key:`comparison-rate-${m}-${E}`}))}),tt.forEach((v,E)=>{vt.has(E)||v.comparisonParentId!==y.entityId&&!(v.relatedEntityId===y.relatedEntityId&&v.windowLabel===y.windowLabel)||(vt.add(E),F.push({...v,rawVisible:!0,comparisonDerived:!0,grouped:!0,key:`comparison-summary-${m}-${E}`}))}),G.forEach((v,E)=>{ft.has(E)||v.comparisonParentId!==y.entityId&&!(v.relatedEntityId===y.relatedEntityId&&v.windowLabel===y.windowLabel)||(ft.add(E),F.push({...v,rawVisible:!0,comparisonDerived:!0,grouped:!0,key:`comparison-threshold-${m}-${E}`}))})};if(N.forEach((y,m)=>{F.push(y),it.forEach((v,E)=>{if(mt.has(E))return;const st=v.relatedEntityId&&v.relatedEntityId===y.entityId,Ct=!v.relatedEntityId&&v.baseLabel&&v.baseLabel===y.label;!st&&!Ct||(mt.add(E),F.push({...v,rawVisible:v.rawVisible!==!1,grouped:!0,key:`trend-${m}-${E}`}))}),D.forEach((v,E)=>{if(V.has(E))return;const st=v.relatedEntityId&&v.relatedEntityId===y.entityId,Ct=!v.relatedEntityId&&v.baseLabel&&v.baseLabel===y.label;!st&&!Ct||(V.add(E),F.push({...v,rawVisible:v.rawVisible!==!1,grouped:!0,key:`rate-${m}-${E}`}))}),q.forEach((v,E)=>{if(ht.has(E))return;const st=v.relatedEntityId&&v.relatedEntityId===y.entityId,Ct=!v.relatedEntityId&&v.baseLabel&&v.baseLabel===y.label;!st&&!Ct||(ht.add(E),F.push({...v,rawVisible:v.rawVisible!==!1,grouped:!0,key:`delta-${m}-${E}`}))}),tt.forEach((v,E)=>{if(vt.has(E))return;const st=v.relatedEntityId&&v.relatedEntityId===y.entityId,Ct=!v.relatedEntityId&&v.baseLabel&&v.baseLabel===y.label;!st&&!Ct||(vt.add(E),F.push({...v,rawVisible:v.rawVisible!==!1,grouped:!0,key:`summary-${m}-${E}`}))}),G.forEach((v,E)=>{if(ft.has(E))return;const st=v.relatedEntityId&&v.relatedEntityId===y.entityId,Ct=!v.relatedEntityId&&v.baseLabel&&v.baseLabel===y.label;!st&&!Ct||(ft.add(E),F.push({...v,rawVisible:v.rawVisible!==!1,grouped:!0,key:`threshold-${m}-${E}`}))}),ct.forEach((v,E)=>{if(gt.has(E)||!v.relatedEntityId||v.relatedEntityId!==y.entityId)return;gt.add(E);const st={...v,grouped:!0,comparison:!0,key:`comparison-${m}-${E}`};F.push(st),Mt(st,E)})}),it.forEach((y,m)=>{mt.has(m)||y.comparisonDerived===!0||typeof y.comparisonParentId=="string"||F.push({...y,rawVisible:y.rawVisible!==!1})}),D.forEach((y,m)=>{V.has(m)||y.comparisonDerived===!0||typeof y.comparisonParentId=="string"||F.push({...y,rawVisible:y.rawVisible!==!1})}),q.forEach((y,m)=>{ht.has(m)||F.push({...y,rawVisible:y.rawVisible!==!1})}),tt.forEach((y,m)=>{vt.has(m)||y.comparisonDerived===!0||typeof y.comparisonParentId=="string"||F.push({...y,rawVisible:y.rawVisible!==!1})}),G.forEach((y,m)=>{ft.has(m)||y.comparisonDerived===!0||typeof y.comparisonParentId=="string"||F.push({...y,rawVisible:y.rawVisible!==!1})}),ct.forEach((y,m)=>{if(gt.has(m))return;const v={...y,comparison:!0};F.push(v),Mt(v,m)}),F.push(...At),F.length===1&&it.length===0&&D.length===0&&q.length===0&&tt.length===0&&G.length===0&&ct.length===0&&At.length===0&&F[0]?.comparison!==!0){const y=F[0];l.textContent=y?Ke(y.value,y.unit):"",l.style.display=y?"block":"none",h&&(h.innerHTML="",h.style.display="none")}else l.textContent="",l.style.display="none",h&&(h.innerHTML=F.map(y=>`
        <div class="tt-series-row ${y.grouped===!0&&y.rawVisible===!0?"subordinate":""}">
          <div class="tt-series-main">
            ${y.grouped===!0&&y.rawVisible===!0?"":`<span class="tt-dot" style="background:${wt(y.color||"#03a9f4")}"></span>`}
            <span class="tt-series-label">${wt(Js(y))}</span>
          </div>
          <span class="tt-series-value">${wt(Ke(y.value,y.unit))}</span>
        </div>
      `).join(""),h.style.display=F.length?"grid":"none");if(g.style.display="none",S.textContent="",C.textContent="",C.style.display="none",P.innerHTML="",P.style.display="none",u&&d&&c&&w&&_){const y=us(t.anomalyRegions);y?(d.textContent=y.title,c.textContent=y.description,w.textContent=y.alert,_.textContent=y.instruction):(d.textContent="",c.textContent="",w.textContent="",_.textContent="",u.style.display="none")}const j=(i.querySelector(".chart-wrap")??a).getBoundingClientRect();Ls(o,e,s,Me(j)),u&&(t.anomalyRegions?.length??0)>0&&Zs(u,e,s,o,Me(j)),Array.isArray(t.events)&&t.events.length>0?Gs(a,t,o,Me(j)):$e(a)}function Qs(a,t){const e=Array.isArray(t?.entity_ids)?t.entity_ids:[],s=Array.isArray(t?.device_ids)?t.device_ids:[],i=Array.isArray(t?.area_ids)?t.area_ids:[],o=Array.isArray(t?.label_ids)?t.label_ids:[],n=[...e.map(l=>({icon:is(a,l),label:Bt(a,l)})),...s.map(l=>({icon:as(a,l),label:ns(a,l)})),...i.map(l=>({icon:rs(a,l),label:os(a,l)})),...o.map(l=>({icon:cs(a,l),label:ls(a,l)}))].filter(l=>l.label);return n.length?n.map(l=>`
    <span class="tt-entity-chip" title="${wt(l.label)}">
      <ha-icon icon="${wt(l.icon)}"></ha-icon>
      <span>${wt(l.label)}</span>
    </span>
  `).join(""):""}function Oe(a,t,e){const s=Nt(a).getElementById("chart-crosshair"),i=Nt(a).getElementById("crosshair-vertical"),o=Nt(a).getElementById("crosshair-horizontal"),n=Nt(a).getElementById("crosshair-points"),l=Nt(a).getElementById("chart-add-annotation");if(!s||!i||!o||!n)return;s.hidden=!1,i.style.left=`${e.x}px`,e.splitVertical?(i.style.top=`${e.splitVertical.top}px`,i.style.height=`${e.splitVertical.height}px`):(i.style.top=`${t.pad.top}px`,i.style.height=`${t.ch}px`),o.hidden=!0;const h=[...e.values||[],...e.showTrendCrosshairs===!0?(e.trendValues||[]).filter(u=>u.showCrosshair===!0):[],...e.showRateCrosshairs===!0?(e.rateValues||[]).filter(u=>u.showCrosshair===!0):[],...e.comparisonValues||[]];n.innerHTML=`
    ${h.filter(u=>u.hasValue!==!1).map(u=>`
      <span
        class="crosshair-line horizontal series ${e.emphasizeGuides?"emphasized":"subtle"}"
        style="top:${u.y}px;color:${wt(u.color||"#03a9f4")};opacity:${Number.isFinite(u.opacity)?u.opacity:1}"
      ></span>
    `).join("")}
    ${h.filter(u=>u.hasValue!==!1).map(u=>`
    <span
      class="crosshair-point"
      style="left:${u.x}px;top:${u.y}px;background:${wt(u.color||"#03a9f4")};opacity:${Number.isFinite(u.opacity)?u.opacity:1}"
    ></span>
    `).join("")}
  `,ss(a,h),l&&l.dataset.allowAddAnnotation!=="false"&&(l.hidden=!1,l.style.left=`${e.x}px`,e.splitVertical?l.style.top=`${e.splitVertical.top+e.splitVertical.height}px`:l.style.top=`${t.pad.top+t.ch}px`)}function xe(a,t){a.dispatchEvent(new CustomEvent("hass-datapoints-chart-hover",{bubbles:!0,composed:!0,detail:t?{timeMs:t.timeMs}:{timeMs:null}}))}function ti(a,t){if(!Array.isArray(a)||a.length===0)return null;let e=0,s=a.length-1;for(;e+1<s;){const n=Math.floor((e+s)/2);a[n][0]<=t?e=n:s=n}const i=a[e]?.[0],o=a[s]?.[0];return!Number.isFinite(i)&&!Number.isFinite(o)?null:Number.isFinite(i)?Number.isFinite(o)?Math.abs(i-t)<=Math.abs(o-t)?i:o:i:o}function ps(a,t,e="follow_series"){if(e!=="snap_to_data_points")return t;let s=null,i=1/0;for(const o of Array.isArray(a)?a:[]){const n=ti(o?.pts,t);if(n==null||!Number.isFinite(n))continue;const l=Math.abs(n-t);l<i&&(i=l,s=n)}return s!=null&&Number.isFinite(s)?s:t}function ce(a){xe(a,null),be(a);const t=Nt(a).getElementById("chart-crosshair"),e=Nt(a).getElementById("crosshair-points"),s=Nt(a).getElementById("chart-add-annotation");t&&(t.hidden=!0),e&&(e.innerHTML=""),ss(a,[]);const i=Nt(a).getElementById("crosshair-horizontal");i&&(i.hidden=!0),s&&(s.hidden=!0)}function ei(a,t,e,s,i,o,n,l,h,u=null,d={}){const c=a;if(!t||!e)return;c._chartHoverCleanup&&(c._chartHoverCleanup(),c._chartHoverCleanup=null);const w=Array.isArray(s)?s:[],_=e.cw?14*((n-o)/e.cw):0,g=Array.isArray(d.binaryStates)?d.binaryStates:[],S=Array.isArray(d.comparisonSeries)?d.comparisonSeries:[],C=Array.isArray(d.trendSeries)?d.trendSeries:[],P=Array.isArray(d.rateSeries)?d.rateSeries:[],A=Array.isArray(d.deltaSeries)?d.deltaSeries:[],M=Array.isArray(d.summarySeries)?d.summarySeries:[],N=Array.isArray(d.thresholdSeries)?d.thresholdSeries:[],it=Array.isArray(d.anomalyRegions)?d.anomalyRegions:[];if(!w.length&&!g.length&&!S.length&&!C.length&&!P.length&&!A.length&&!M.length&&!N.length&&!it.length)return;const D=d.hoverSurfaceEl||null,q=Nt(a)?.getElementById("chart-add-annotation")||null,tt=x=>x.axis||u&&u[0]||{min:l,max:h},G=(x,k,at,dt={},W={})=>{const Z=typeof k=="number"&&Number.isFinite(k),O=W.includePosition===!0&&Z;return{entityId:x.entityId||"",comparisonParentId:x.comparisonParentId||"",relatedEntityId:x.relatedEntityId||"",label:x.label||x.entityId||"",baseLabel:x.baseLabel||"",windowLabel:x.windowLabel||"",value:Z?k:k??null,unit:x.unit||"",color:x.color,opacity:Number.isFinite(x.hoverOpacity)?x.hoverOpacity:1,hasValue:Z||k!=null,x:O?W.x:void 0,y:O?e.yOf(k,at.min,at.max):void 0,axisSide:at.side==="right"?"right":"left",axisSlot:Number.isFinite(at.slot)?at.slot:0,rawVisible:x.rawVisible!==!1,comparisonDerived:x.comparisonDerived===!0,showCrosshair:x.showCrosshair===!0,...dt}},At=(x,k)=>{const at=t.getBoundingClientRect();if(!at.width||!at.height)return[];const dt=x-at.left,W=k-at.top,Z=[];for(const O of it){const pt=Number(O?.radiusX)||0,Et=Number(O?.radiusY)||0;if(pt<=0||Et<=0)continue;const zt=(dt-O.centerX)/pt,Ft=(W-O.centerY)/Et;zt*zt+Ft*Ft<=1&&Z.push(O)}return Z},ct=(x,k)=>{const at=t.getBoundingClientRect();if(!at.width||!at.height||!e.cw||!e.ch)return null;const dt=ie(x-at.left,e.pad.left,e.pad.left+e.cw),W=ie(k-at.top,e.pad.top,e.pad.top+e.ch),Z=e.cw?(dt-e.pad.left)/e.cw:0,O=o+Z*(n-o),pt=ps(w,O,d.hoverSnapMode||"follow_series"),Et=e.xOf(pt,o,n),zt=w.map(b=>{const K=e._interpolateValue(b.pts||[],pt),B=tt(b);return G(b,K,B,{},{includePosition:K!=null,x:Et})}),Ft=S.map(b=>{const K=e._interpolateValue(b.pts||[],pt),B=tt(b);return G(b,K,B,{comparison:!0},{includePosition:K!=null,x:Et})}),qt=C.map(b=>{const K=e._interpolateValue(b.pts||[],pt),B=tt(b);return G(b,K,B,{trend:!0},{includePosition:K!=null,x:Et})}),Dt=P.map(b=>{const K=e._interpolateValue(b.pts||[],pt),B=tt(b);return G(b,K,B,{rate:!0},{includePosition:K!=null,x:Et})}),Ut=A.map(b=>{const K=e._interpolateValue(b.pts||[],pt),B=tt(b);return G(b,K,B,{delta:!0},{includePosition:K!=null,x:Et})}),Yt=M.map(b=>{const K=tt(b),B=Number(b.value);return G(b,B,K,{summary:!0,summaryType:b.summaryType||""})}),et=N.map(b=>{const K=tt(b),B=Number(b.value);return G(b,B,K,{threshold:!0})}),L=[...zt.filter(b=>b?.hasValue!==!1),...Ft.filter(b=>b?.hasValue!==!1),...Dt.filter(b=>b?.hasValue!==!1),...d.showTrendCrosshairs===!0?qt.filter(b=>b?.hasValue!==!1&&b.showCrosshair===!0):[]];let R=pt,ut=pt,ot=L[0]||null;if(ot)for(const b of L)Number.isFinite(b.y)&&Number.isFinite(ot.y)&&Math.abs(b.y-W)<Math.abs(ot.y-W)&&(ot=b);const xt=ot&&w.find(b=>b.entityId===ot.entityId)||null;if(xt?.pts?.length){const b=xt.pts,K=b.length;let B=0,rt=K-1,$=-1;if(b[0][0]<=pt){for(;B+1<rt;){const ne=Math.floor((B+rt)/2);b[ne][0]<=pt?B=ne:rt=ne}$=b[rt][0]<=pt?rt:B}const St=$<K-1?$+1:-1,Wt=$>=0?b[$]:null;let $t=null;if(St>=0?$t=b[St]:$<0&&($t=b[0]),Wt&&$t){const ne=b[Math.max(0,$-1)]||Wt,ye=b[Math.min(K-1,St+1)]||$t;R=Wt===$t?Wt[0]:Math.round((Wt[0]+ne[0])/2),ut=Wt===$t?$t[0]:Math.round(($t[0]+ye[0])/2)}else Wt?(R=Wt[0],ut=Wt[0]):$t&&(R=$t[0],ut=$t[0])}const Tt=g.map(b=>{const K=(b.spans||[]).find(B=>pt>=B.start&&pt<=B.end);return{entityId:b.entityId||"",label:b.label||b.entityId||"",value:K?b.onLabel||"on":b.offLabel||"off",unit:"",color:b.color,hasValue:!0,active:!!K}}).filter(b=>!!b.label);if(!zt.length&&!Tt.length&&!qt.length&&!Dt.length&&!Ut.length&&!Yt.length&&!et.length&&!Ft.length)return null;const z=e.pad.top+12,H=ot?ot.y:z,Q=[];for(const b of i||[]){const K=new Date(b.timestamp).getTime();if(K<o||K>n)continue;const B=Math.abs(K-pt);B<=_&&Q.push({...b,_hoverDistanceMs:B})}Q.sort((b,K)=>{const B=(b._hoverDistanceMs||0)-(K._hoverDistanceMs||0);return B!==0?B:new Date(b.timestamp).getTime()-new Date(K.timestamp).getTime()});const Rt=Q.map(b=>{const{_hoverDistanceMs:K,...B}=b;return B});return{x:Et,y:H,timeMs:pt,rangeStartMs:R,rangeEndMs:ut,values:zt,trendValues:qt,rateValues:Dt,deltaValues:d.showDeltaTooltip===!0?Ut:[],summaryValues:Yt,thresholdValues:et,comparisonValues:Ft,binaryValues:Tt,primary:ot,event:Rt[0]||null,events:Rt,emphasizeGuides:d.emphasizeHoverGuides===!0,showTrendCrosshairs:d.showTrendCrosshairs===!0,showRateCrosshairs:d.showRateCrosshairs===!0,hideRawData:d.hideRawData===!0}},F=(x,k)=>{if(c._chartZoomDragging)return;const at=At(x,k),dt=ct(x,k);if(!dt){c._chartLastHover=null,ce(a),t.style.cursor="default";return}dt.anomalyRegions=at,c._chartLastHover=dt,Oe(a,e,dt),d.showTooltip!==!1||Array.isArray(dt.events)&&dt.events.length>0?Pe(a,dt,x,k):be(a),xe(a,dt),t.style.cursor=at.length>0?"pointer":"crosshair"},mt=()=>{c._chartLastHover=null,ce(a),t.style.cursor="default"};let V=null,ht=0,vt=0;const ft=x=>{ht=x.clientX,vt=x.clientY,V===null&&(V=requestAnimationFrame(()=>{V=null,F(ht,vt)}))},gt=x=>{const k=x.relatedTarget;k instanceof Node&&D&&D.contains(k)||k instanceof Node&&q&&q.contains(k)||mt()},Mt=x=>{F(x.clientX,x.clientY)},bt=x=>{const k=x.relatedTarget;k instanceof Node&&t.contains(k)||k instanceof Node&&q&&q.contains(k)||mt()},j=x=>{const k=x.relatedTarget;k instanceof Node&&(t.contains(k)||D&&D.contains(k))||mt()},y=x=>{typeof d.onAddAnnotation!="function"||!c._chartLastHover||(x.preventDefault(),x.stopPropagation(),d.onAddAnnotation(c._chartLastHover,x))},m=x=>{if(typeof d.onContextMenu!="function")return;const k=ct(x.clientX,x.clientY);k&&(x.preventDefault(),c._chartLastHover=k,Oe(a,e,k),Pe(a,k,x.clientX,x.clientY),xe(a,k),d.onContextMenu(k,x))},v=x=>{if(typeof d.onAnomalyClick!="function")return;const k=At(x.clientX,x.clientY);k.length&&(x.preventDefault(),x.stopPropagation(),d.onAnomalyClick(k,x))};let E=null;const st=()=>{E&&window.clearTimeout(E),E=window.setTimeout(()=>mt(),1800)},Ct=x=>{x.preventDefault();const k=x.touches[0];k&&(F(k.clientX,k.clientY),st())},Xt=x=>{x.preventDefault();const k=x.touches[0];k&&(F(k.clientX,k.clientY),st())},J=()=>st();t.addEventListener("mousemove",ft),t.addEventListener("mouseleave",gt),t.addEventListener("click",v),t.addEventListener("contextmenu",m),t.addEventListener("touchstart",Ct,{passive:!1}),t.addEventListener("touchmove",Xt,{passive:!1}),t.addEventListener("touchend",J),t.addEventListener("touchcancel",J),D?.addEventListener("mousemove",Mt),D?.addEventListener("mouseleave",bt),q?.addEventListener("mouseleave",j),q?.addEventListener("click",y),c._chartHoverCleanup=()=>{t.removeEventListener("mousemove",ft),t.removeEventListener("mouseleave",gt),t.removeEventListener("click",v),t.removeEventListener("contextmenu",m),t.removeEventListener("touchstart",Ct),t.removeEventListener("touchmove",Xt),t.removeEventListener("touchend",J),t.removeEventListener("touchcancel",J),D?.removeEventListener("mousemove",Mt),D?.removeEventListener("mouseleave",bt),q?.removeEventListener("mouseleave",j),q?.removeEventListener("click",y),V!==null&&(cancelAnimationFrame(V),V=null),E&&(window.clearTimeout(E),E=null),mt()}}function si(a,t,e,s,i,o={}){const n=a;if(!t||!e)return;n._chartZoomCleanup&&(n._chartZoomCleanup(),n._chartZoomCleanup=null);const l=Nt(a).getElementById("chart-zoom-selection");if(!l)return;let h=null,u=0,d=0,c=!1;const w=()=>{l.hidden=!0,l.classList.remove("visible")},_=D=>{const q=t.getBoundingClientRect(),tt=ie(D-q.left,e.pad.left,e.pad.left+e.cw),G=e.cw?(tt-e.pad.left)/e.cw:0;return s+G*(i-s)},g=(D,q)=>{const tt=t.getBoundingClientRect(),G=D-tt.left,At=q-tt.top;return G>=e.pad.left&&G<=e.pad.left+e.cw&&At>=e.pad.top&&At<=e.pad.top+e.ch},S=()=>{const D=Math.min(u,d),q=Math.abs(d-u);l.style.left=`${D}px`,l.style.top=`${e.pad.top}px`,l.style.width=`${q}px`,l.style.height=`${e.ch}px`,l.hidden=!1,l.classList.add("visible")},C=()=>{if(!c||Math.abs(d-u)<8){o.onPreview?.(null);return}const D=t.getBoundingClientRect().left,q=Math.min(_(D+u),_(D+d)),tt=Math.max(_(D+u),_(D+d));o.onPreview?.({startTime:q,endTime:tt})},P=(D=!0)=>{h=null,c=!1,n._chartZoomDragging=!1,w(),D&&o.onPreview?.(null)},A=D=>{if(h==null||D.pointerId!==h)return;d=ie(D.clientX-t.getBoundingClientRect().left,e.pad.left,e.pad.left+e.cw);const q=Math.abs(d-u);!c&&q<6||(c=!0,n._chartZoomDragging=!0,ce(a),S(),C(),D.preventDefault())},M=D=>{if(h==null||D.pointerId!==h)return;const q=c,tt=d;if(window.removeEventListener("pointermove",A),window.removeEventListener("pointerup",M),window.removeEventListener("pointercancel",M),!q||Math.abs(tt-u)<8){P(!0);return}const G=t.getBoundingClientRect().left,At=Math.min(_(G+u),_(G+tt)),ct=Math.max(_(G+u),_(G+tt));o.onZoom?.({startTime:At,endTime:ct}),P(!1)},N=D=>{if(D.button!==0||!g(D.clientX,D.clientY))return;h=D.pointerId;const q=t.getBoundingClientRect();u=ie(D.clientX-q.left,e.pad.left,e.pad.left+e.cw),d=u,c=!1,n._chartZoomDragging=!1,o.onPreview?.(null),window.addEventListener("pointermove",A),window.addEventListener("pointerup",M),window.addEventListener("pointercancel",M)},it=D=>{g(D.clientX,D.clientY)&&o.onReset&&(D.preventDefault(),o.onReset())};t.addEventListener("pointerdown",N),t.addEventListener("dblclick",it),n._chartZoomCleanup=()=>{t.removeEventListener("pointerdown",N),t.removeEventListener("dblclick",it),window.removeEventListener("pointermove",A),window.removeEventListener("pointerup",M),window.removeEventListener("pointercancel",M),P()}}const Ze=2160*60*60*1e3;function Xe(a){const t=Date.parse(a);return Number.isFinite(t)?t:null}function ii(a,t){const e=Xe(a),s=Xe(t);if(e==null||s==null||s<=e||s-e<=Ze)return[{startTime:a,endTime:t}];const i=[];let o=e;for(;o<s;){const n=Math.min(s,o+Ze);if(i.push({startTime:new Date(o).toISOString(),endTime:new Date(n).toISOString()}),n>=s)break;o=n+1}return i}function Ue(a,t,e,s,i,o){const n=JSON.stringify({type:"hass_datapoints/history",entity_id:t,start_time:e,end_time:s,interval:i,aggregate:o});return Te(n,s,async()=>{const l=ii(e,s),u=(await Promise.all(l.map(async c=>a.connection.sendMessagePromise({type:"hass_datapoints/history",entity_id:t,start_time:c.startTime,end_time:c.endTime,interval:i,aggregate:o})))).flatMap(c=>c.pts||[]);if(!u.length)return[];const d=new Map;for(const c of u)Array.isArray(c)&&c.length>0?d.set(String(c[0]),c):d.set(JSON.stringify(c),c);return[...d.values()]})}function Ye(a,t,e,s,i){return a.connection.sendMessagePromise({type:"hass_datapoints/anomalies",entity_id:t,start_time:e,end_time:s,anomaly_methods:i.anomaly_methods||[],anomaly_sensitivity:i.anomaly_sensitivity||"medium",anomaly_overlap_mode:i.anomaly_overlap_mode||"all",anomaly_rate_window:i.anomaly_rate_window||"1h",anomaly_zscore_window:i.anomaly_zscore_window||"24h",anomaly_persistence_window:i.anomaly_persistence_window||"1h",trend_method:i.trend_method||"rolling_average",trend_window:i.trend_window||"24h",...i.anomaly_use_sampled_data!==!1&&i.sample_interval&&i.sample_interval!=="raw"?{sample_interval:i.sample_interval,sample_aggregate:i.sample_aggregate||"mean"}:{},...i.comparison_entity_id?{comparison_entity_id:i.comparison_entity_id,comparison_start_time:i.comparison_start_time,comparison_end_time:i.comparison_end_time,comparison_time_offset_ms:i.comparison_time_offset_ms||0}:{}}).then(o=>o.anomaly_clusters||[])}async function Ge(a,t,e,s,i={}){const o=ke(s),n=JSON.stringify({type:"history/history_during_period",start_time:t,end_time:e,entity_ids:o,include_start_time_state:i.include_start_time_state!==!1,significant_changes_only:!!i.significant_changes_only,no_attributes:i.no_attributes!==!1});return Te(n,e,()=>a.connection.sendMessagePromise({type:"history/history_during_period",start_time:t,end_time:e,entity_ids:o,include_start_time_state:i.include_start_time_state!==!1,significant_changes_only:!!i.significant_changes_only,no_attributes:i.no_attributes!==!1}))}const ms=`(function(){"use strict";function y(e){const t={"1h":36e5,"6h":216e5,"24h":864e5,"7d":6048e5,"14d":12096e5,"21d":18144e5,"28d":24192e5};return t[e]||t["24h"]}function b(e,t){if(!Array.isArray(e)||e.length<2||!Number.isFinite(t)||t<=0)return[];const s=[];let r=0,i=0;for(let l=0;l<e.length;l+=1){const[n,u]=e[l];for(i+=u;r<l&&n-e[r][0]>t;)i-=e[r][1],r+=1;const o=l-r+1;o>0&&s.push([n,i/o])}return s}function I(e){if(!Array.isArray(e)||e.length<2)return[];const t=e[0][0];let s=0,r=0,i=0,l=0;for(const[F,S]of e){const h=(F-t)/36e5;s+=h,r+=S,i+=h*h,l+=h*S}const n=e.length,u=n*i-s*s;if(!Number.isFinite(u)||Math.abs(u)<1e-9)return[];const o=(n*l-s*r)/u,a=(r-o*s)/n,c=e[0][0],d=e[e.length-1][0],f=(c-t)/36e5,R=(d-t)/36e5;return[[c,a+o*f],[d,a+o*R]]}function w(e,t,s){return!Array.isArray(e)||e.length<2?[]:t==="linear_trend"?I(e):b(e,y(s))}function m(e){const t=e&&typeof e=="object"?e:{};return{show_trend_lines:t.show_trend_lines===!0,trend_method:t.trend_method==="linear_trend"?"linear_trend":"rolling_average",trend_window:typeof t.trend_window=="string"&&t.trend_window?t.trend_window:"24h",show_summary_stats:t.show_summary_stats===!0,show_rate_of_change:t.show_rate_of_change===!0,rate_window:typeof t.rate_window=="string"&&t.rate_window?t.rate_window:"1h",show_delta_analysis:t.show_delta_analysis===!0}}function P(e,t){if(!Array.isArray(e)||e.length===0||t<e[0][0]||t>e[e.length-1][0])return null;if(t===e[0][0])return e[0][1];if(t===e[e.length-1][0])return e[e.length-1][1];for(let s=0;s<e.length-1;s+=1){const[r,i]=e[s],[l,n]=e[s+1];if(t>=r&&t<=l){const u=(t-r)/(l-r);return i+(n-i)*u}}return null}function g(e,t){if(!Array.isArray(e)||e.length<2)return[];const s=[];for(let r=1;r<e.length;r+=1){const[i,l]=e[r];let n=null;if(t==="point_to_point")n=e[r-1];else{const c=y(t);if(!Number.isFinite(c)||c<=0)continue;for(let d=r-1;d>=0;d-=1){const f=e[d];if(i-f[0]>=c){n=f;break}}n||(n=e[0])}if(!Array.isArray(n)||n.length<2)continue;const u=i-n[0];if(!Number.isFinite(u)||u<=0)continue;const o=u/36e5;if(!Number.isFinite(o)||o<=0)continue;const a=(l-n[1])/o;Number.isFinite(a)&&s.push([i,a])}return s}function C(e,t){if(!Array.isArray(e)||e.length<2||!Array.isArray(t)||t.length<2)return[];const s=[];for(const[r,i]of e){const l=P(t,r);l!=null&&s.push([r,i-l])}return s}function A(e){if(!Array.isArray(e)||e.length===0)return null;let t=1/0,s=-1/0,r=0,i=0;for(const l of e){const n=Number(l?.[1]);Number.isFinite(n)&&(n<t&&(t=n),n>s&&(s=n),r+=n,i+=1)}return!Number.isFinite(t)||!Number.isFinite(s)||i===0?null:{min:t,max:s,mean:r/i}}function N(e){const t=(Array.isArray(e?.series)?e.series:[]).map(n=>({...n,analysis:m(n?.analysis)})),s=new Map((Array.isArray(e?.comparisonSeries)?e.comparisonSeries:[]).filter(n=>n?.entityId).map(n=>[n.entityId,n])),r={trendSeries:[],rateSeries:[],deltaSeries:[],summaryStats:[],anomalySeries:[],comparisonWindowResults:{}};for(const n of t){const u=Array.isArray(n?.pts)?n.pts:[],o=m(n?.analysis);if(!(u.length<2)){if(o.show_trend_lines===!0){const a=w(u,o.trend_method,o.trend_window);a.length>=2&&r.trendSeries.push({entityId:n.entityId,pts:a})}if(o.show_rate_of_change===!0){const a=g(u,o.rate_window);a.length>=2&&r.rateSeries.push({entityId:n.entityId,pts:a})}if(o.show_summary_stats===!0){const a=A(u);a&&r.summaryStats.push({entityId:n.entityId,...a})}if(o.show_delta_analysis===!0&&e?.hasSelectedComparisonWindow===!0){const c=s.get(n.entityId)?.pts??[];if(c.length>=2){const d=C(u,c);d.length>=2&&r.deltaSeries.push({entityId:n.entityId,pts:d})}}}}const i=typeof e?.seriesAnalysisConfigs=="object"&&e.seriesAnalysisConfigs!==null?e.seriesAnalysisConfigs:{},l=typeof e?.allComparisonWindowsData=="object"&&e.allComparisonWindowsData!==null?e.allComparisonWindowsData:{};for(const[n,u]of Object.entries(l)){r.comparisonWindowResults[n]={};for(const[o,a]of Object.entries(u)){const c=m(i[o]);r.comparisonWindowResults[n][o]={trendPts:c.show_trend_lines&&a.length>=2?w(a,c.trend_method,c.trend_window):[],ratePts:c.show_rate_of_change&&a.length>=2?g(a,c.rate_window):[],summaryStats:c.show_summary_stats?A(a):null}}}return r}const _=globalThis;_.onmessage=e=>{const{id:t,payload:s}=e.data||{};try{const r=N(s);_.postMessage({id:t,result:r})}catch(r){_.postMessage({id:t,error:r instanceof Error?r.message:String(r)})}}})();
`,Je=typeof self<"u"&&self.Blob&&new Blob(["(self.URL || self.webkitURL).revokeObjectURL(self.location.href);",ms],{type:"text/javascript;charset=utf-8"});function ni(a){let t;try{if(t=Je&&(self.URL||self.webkitURL).createObjectURL(Je),!t)throw"";const e=new Worker(t,{name:a?.name});return e.addEventListener("error",()=>{(self.URL||self.webkitURL).revokeObjectURL(t)}),e}catch{return new Worker("data:text/javascript;charset=utf-8,"+encodeURIComponent(ms),{name:a?.name})}}let ee=null,ai=0;const ae=new Map;function oi(){return ee||(ee=new ni,ee.addEventListener("message",a=>{const{id:t,result:e,error:s}=a.data||{},i=ae.get(t||-1);if(i){if(ae.delete(t||-1),s){i.reject(new Error(s));return}i.resolve(e)}}),ee.addEventListener("error",a=>{ae.forEach(t=>{t.reject(a)}),ae.clear(),ee=null}),ee)}function ri(){ae.size>0&&(ae.forEach(({reject:a})=>{a(new Error("Aborted: superseded by newer analysis"))}),ae.clear()),ee&&(ee.terminate(),ee=null)}function li(a){const t=oi();return new Promise((e,s)=>{const i=++ai;ae.set(i,{resolve:e,reject:s}),t.postMessage({id:i,payload:a})})}const fs='(function(){"use strict";function u(i,f,t){if(!i.length||f<=0)return i;const s=new Map,o=new Map;for(const[c,e]of i){const n=Math.floor(c/f);s.has(n)||(s.set(n,[]),o.set(n,c)),s.get(n)?.push(e)}const h=[];for(const c of[...s.keys()].sort((e,n)=>e-n)){const e=s.get(c)||[],n=o.get(c)||0;let l;if(t==="min")l=Math.min(...e);else if(t==="max")l=Math.max(...e);else if(t==="median"){const r=[...e].sort((m,p)=>m-p),a=Math.floor(r.length/2);l=r.length%2!==0?r[a]:(r[a-1]+r[a])/2}else t==="first"?l=e[0]:t==="last"?l=e[e.length-1]:l=e.reduce((r,a)=>r+a,0)/e.length;h.push([n,l])}return h}self.onmessage=({data:i})=>{const{id:f,type:t,payload:s}=i||{};try{let o;if(t==="downsample")o=u(s.pts,s.intervalMs,s.aggregate);else throw new Error(`Unknown message type: ${t}`);self.postMessage({id:f,result:o})}catch(o){self.postMessage({id:f,error:String(o)})}}})();\n',Qe=typeof self<"u"&&self.Blob&&new Blob(["(self.URL || self.webkitURL).revokeObjectURL(self.location.href);",fs],{type:"text/javascript;charset=utf-8"});function ci(a){let t;try{if(t=Qe&&(self.URL||self.webkitURL).createObjectURL(Qe),!t)throw"";const e=new Worker(t,{name:a?.name});return e.addEventListener("error",()=>{(self.URL||self.webkitURL).revokeObjectURL(t)}),e}catch{return new Worker("data:text/javascript;charset=utf-8,"+encodeURIComponent(fs),{name:a?.name})}}let oe=null,di=0;const fe=new Map;function hi(){return oe||(oe=new ci,oe.addEventListener("message",a=>{const{id:t,result:e,error:s}=a.data||{},i=fe.get(t||-1);i&&(fe.delete(t||-1),s?i.reject(new Error(s)):i.resolve(e||[]))}),oe.addEventListener("error",a=>{fe.forEach(({reject:t})=>{t(a)}),fe.clear(),oe=null}),oe)}function De(a,t,e){const s=hi();return new Promise((i,o)=>{const n=++di;fe.set(n,{resolve:i,reject:o}),s.postMessage({id:n,type:"downsample",payload:{pts:a,intervalMs:t,aggregate:e}})})}function gs(a,t,e){if(!a.length||t<=0)return a;const s=new Map,i=new Map;for(const[n,l]of a){const h=Math.floor(n/t);s.has(h)||(s.set(h,[]),i.set(h,n)),s.get(h)?.push(l)}const o=[];for(const n of[...s.keys()].sort((l,h)=>l-h)){const l=s.get(n)||[],h=i.get(n)||0;let u;if(e==="min")u=Math.min(...l);else if(e==="max")u=Math.max(...l);else if(e==="median"){const d=[...l].sort((w,_)=>w-_),c=Math.floor(d.length/2);u=d.length%2!==0?d[c]:(d[c-1]+d[c])/2}else e==="first"?u=l[0]:e==="last"?u=l[l.length-1]:u=l.reduce((d,c)=>d+c,0)/l.length;o.push([h,u])}return o}self.onmessage=({data:a})=>{const{id:t,type:e,payload:s}=a||{};try{let i;if(e==="downsample")i=gs(s.pts,s.intervalMs,s.aggregate);else throw new Error(`Unknown message type: ${e}`);self.postMessage({id:t,result:i})}catch(i){self.postMessage({id:t,error:String(i)})}};const re=3600*1e3;function ys(a){const t={"1h":re,"6h":6*re,"24h":24*re,"7d":168*re,"14d":336*re,"21d":504*re,"28d":672*re};return t[a]??t["24h"]}function ui(a,t){if(!Array.isArray(a)||a.length<2||!Number.isFinite(t)||t<=0)return[];const e=[];let s=0,i=0;for(let o=0;o<a.length;o+=1){const[n,l]=a[o];for(i+=l;s<o&&n-a[s][0]>t;)i-=a[s][1],s+=1;const h=o-s+1;h>0&&e.push([n,i/h])}return e}function _i(a){if(!Array.isArray(a)||a.length<2)return[];const t=a[0][0];let e=0,s=0,i=0,o=0;for(const[g,S]of a){const C=(g-t)/36e5;e+=C,s+=S,i+=C*C,o+=C*S}const n=a.length,l=n*i-e*e;if(!Number.isFinite(l)||Math.abs(l)<1e-9)return[];const h=(n*o-e*s)/l,u=(s-h*e)/n,d=a[0][0],c=a[a.length-1][0],w=(d-t)/(3600*1e3),_=(c-t)/(3600*1e3);return[[d,u+h*w],[c,u+h*_]]}function pi(a,t){if(!Array.isArray(a)||!a.length||t<a[0][0]||t>a[a.length-1][0])return null;if(t===a[0][0])return a[0][1];if(t===a[a.length-1][0])return a[a.length-1][1];for(let e=0;e<a.length-1;e+=1){const[s,i]=a[e],[o,n]=a[e+1];if(t>=s&&t<=o){const l=(t-s)/(o-s);return i+l*(n-i)}}return null}function mi(a,t="1h"){if(!Array.isArray(a)||a.length<2)return[];const e=[];for(let s=1;s<a.length;s+=1){const[i,o]=a[s];let n=null;if(t==="point_to_point")n=a[s-1];else{const d=ys(t);if(!Number.isFinite(d)||d<=0)continue;for(let c=s-1;c>=0;c-=1){const w=a[c];if(i-w[0]>=d){n=w;break}}n||(n=a[0])}if(!Array.isArray(n)||n.length<2)continue;const l=i-n[0];if(!Number.isFinite(l)||l<=0)continue;const h=l/(3600*1e3);if(!Number.isFinite(h)||h<=0)continue;const u=(o-n[1])/h;Number.isFinite(u)&&e.push([i,u])}return e}function fi(a,t){if(!Array.isArray(a)||a.length<2||!Array.isArray(t)||t.length<2)return[];const e=[];for(const[s,i]of a){const o=pi(t,s);o!=null&&e.push([s,i-o])}return e}function gi(a){if(!Array.isArray(a)||!a.length)return null;let t=1/0,e=-1/0,s=0,i=0;for(const o of a){const n=Number(o?.[1]);Number.isFinite(n)&&(n<t&&(t=n),n>e&&(e=n),s+=n,i+=1)}return!Number.isFinite(t)||!Number.isFinite(e)||i===0?null:{min:t,max:e,mean:s/i}}const yi=`
  hass-datapoints-history-chart {
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    --dp-spacing-xs: calc(var(--spacing, 8px) * 0.5);
    --dp-spacing-sm: var(--spacing, 8px);
    --dp-spacing-md: calc(var(--spacing, 8px) * 1.5);
    --dp-spacing-lg: calc(var(--spacing, 8px) * 2);
    --dp-spacing-xl: calc(var(--spacing, 8px) * 2.5);
    --ha-tooltip-background-color: color-mix(in srgb, #0f1218 96%, transparent);
    --ha-tooltip-text-color: rgba(255, 255, 255, 0.96);
    --ha-tooltip-padding: calc(var(--dp-spacing-sm) + 2px) calc(var(--dp-spacing-md) + 2px);
    --ha-tooltip-border-radius: 10px;
    --ha-tooltip-arrow-size: 10px;
    --ha-tooltip-font-size: 0.86rem;
    --ha-tooltip-line-height: 1.1;
  }
  ha-card { padding: 0; overflow: visible; height: 100%; display: flex; flex-direction: column; }
  .card-header {
    padding: var(--dp-spacing-lg);
    font-size: 1.1em;
    font-weight: 500;
    color: var(--primary-text-color);
    flex: 0 0 auto;
    line-height: 1.3;
  }
  .chart-top-slot[hidden] {
    display: none;
  }
  .chart-top-slot {
    position: relative;
    flex: 0 0 auto;
    min-width: 0;
    margin-left: calc(var(--dp-spacing-md) * -1);
    margin-right: calc(var(--dp-spacing-md) * -1);
    margin-top: -5px;
    z-index: 1;
  }
  .chart-wrap {
    position: relative;
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    min-height: 0;
    padding: var(--dp-spacing-sm) var(--dp-spacing-md) var(--dp-spacing-md);
    box-sizing: border-box;
    overflow: visible;
    isolation: isolate;
    z-index: 3;
  }
  .chart-preview-overlay[hidden] {
    display: none;
  }
  .chart-preview-overlay {
    position: absolute;
    top: calc(var(--dp-chart-top-slot-height, 0px) + var(--dp-spacing-sm));
    left: var(--dp-spacing-md);
    display: flex;
    flex-direction: column;
    gap: 2px;
    max-width: min(340px, calc(100% - (var(--dp-spacing-lg) * 2)));
    padding: 8px 12px;
    border-radius: 10px;
    background: color-mix(in srgb, var(--card-background-color, #fff) 90%, transparent);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
    backdrop-filter: blur(4px);
    pointer-events: none;
    z-index: 4;
  }
  .chart-preview-kicker {
    font-size: 0.68rem;
    line-height: 1.15;
    color: color-mix(in srgb, var(--warning-color, #f59e0b) 72%, var(--secondary-text-color, #6b7280));
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .chart-preview-title {
    font-size: 0.84rem;
    line-height: 1.2;
    color: var(--primary-text-color);
    font-weight: 600;
  }
  .chart-preview-line {
    font-size: 0.74rem;
    line-height: 1.2;
    color: var(--secondary-text-color);
  }
  .chart-preview-line strong {
    color: color-mix(in srgb, var(--warning-color, #f59e0b) 72%, var(--primary-text-color, #111));
    font-weight: 600;
  }
  .chart-scroll-viewport {
    position: relative;
    flex: 1 1 auto;
    min-height: 0;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-gutter: stable both-edges;
    -webkit-overflow-scrolling: touch;
  }
  .chart-stage {
    position: relative;
    min-height: 100%;
  }
  .chart-icon-overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 2;
  }
  .chart-event-icon {
    position: absolute;
    width: 18px;
    height: 18px;
    transform: translate(-50%, -50%);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    pointer-events: auto;
    cursor: pointer;
    border: 0;
    padding: 0;
    margin: 0;
    background: transparent;
    border-radius: 50%;
  }
  .chart-event-icon ha-icon {
    --mdc-icon-size: 14px;
    pointer-events: none;
  }
  .chart-axis-overlay {
    position: absolute;
    top: calc(var(--dp-chart-top-slot-height, 0px) + 5px);
    bottom: 0;
    display: none;
    pointer-events: none;
    background: var(--card-background-color, var(--primary-background-color, #fff));
    overflow: hidden;
    z-index: 3;
    border-bottom-left-radius: 11px;
  }
  .chart-axis-overlay.visible {
    display: block;
  }
  .chart-axis-overlay.left {
    left: 0;
  }
  .chart-axis-overlay.right {
    right: 0;
  }
  .chart-axis-divider {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 1px;
    background: rgba(128,128,128,0.35);
  }
  .chart-axis-overlay.left .chart-axis-divider {
    right: 0;
  }
  .chart-axis-overlay.right .chart-axis-divider {
    left: 0;
  }
  .chart-axis-label,
  .chart-axis-unit {
    position: absolute;
    color: var(--secondary-text-color);
    font: 12px sans-serif;
    line-height: 1;
    white-space: nowrap;
  }
  .chart-axis-label {
    transform: translateY(calc(-50% + 6px));
  }
  .chart-axis-unit {
    font-weight: 500;
  }
  canvas { display: block; }
  .chart-loading {
    position: absolute;
    top: 50%;
    left: 50%;
    display: none;
    align-items: center;
    justify-content: center;
    gap: var(--dp-spacing-sm);
    min-width: calc(var(--spacing, 8px) * 12);
    min-height: calc(var(--spacing, 8px) * 5);
    padding: var(--dp-spacing-sm) var(--dp-spacing-md);
    border-radius: 999px;
    background: color-mix(in srgb, var(--card-background-color, #fff) 92%, transparent);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
    z-index: 6;
    pointer-events: none;
    transform: translate(-50%, -50%);
  }
  .chart-loading.active {
    display: inline-flex;
  }
  .chart-loading-spinner {
    width: calc(var(--spacing, 8px) * 2);
    height: calc(var(--spacing, 8px) * 2);
    border-radius: 50%;
    border: 2px solid color-mix(in srgb, var(--primary-color, #03a9f4) 22%, transparent);
    border-top-color: var(--primary-color, #03a9f4);
    animation: chart-spinner 0.9s linear infinite;
  }
  .chart-loading::after {
    content: none;
  }
  .chart-loading-label {
    color: var(--secondary-text-color);
    font-size: 0.85rem;
    font-weight: 500;
  }
  @keyframes chart-spinner {
    to {
      transform: rotate(360deg);
    }
  }
  .chart-message {
    position: absolute;
    inset: 0;
    display: none;
    align-items: center;
    justify-content: center;
    padding: calc(var(--spacing, 8px) * 5) var(--dp-spacing-lg);
    text-align: center;
    color: var(--secondary-text-color);
    font-size: 0.95rem;
    pointer-events: none;
    z-index: 2;
  }
  .chart-message.visible {
    display: flex;
  }
  .chart-crosshair {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .chart-crosshair[hidden] {
    display: none;
  }
  .crosshair-line {
    position: absolute;
    background: color-mix(in srgb, var(--primary-text-color, #111) 24%, transparent);
  }
  .crosshair-line.vertical {
    width: 1px;
    transform: translateX(-50%);
  }
  .crosshair-line.horizontal {
    height: 1px;
    transform: translateY(-50%);
  }
  .crosshair-line.horizontal.series {
    left: 0;
    width: 100%;
  }
  .crosshair-line.horizontal.series.subtle {
    background: currentColor;
    opacity: 0.22;
  }
  .crosshair-line.horizontal.series.emphasized {
    height: 0;
    background: transparent;
    border-top: 1px dashed currentColor;
    opacity: 0.9;
  }
  .crosshair-points {
    position: absolute;
    inset: 0;
  }
  .crosshair-point {
    position: absolute;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 2px solid var(--card-background-color, #fff);
    box-shadow: 0 2px 6px rgba(0,0,0,0.18);
    transform: translate(-50%, -50%);
  }
  .crosshair-axis-dot {
    position: absolute;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    border: 2px solid var(--card-background-color, #fff);
    box-shadow: 0 1px 4px rgba(0,0,0,0.28);
    transform: translate(-50%, -50%);
  }
  .chart-axis-hover-dot {
    position: absolute;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    border: 2px solid var(--card-background-color, #fff);
    box-shadow: 0 1px 4px rgba(0,0,0,0.28);
    top: 0;
    transform: translateY(-50%);
  }
  .chart-axis-hover-dot.left {
    right: 0;
    transform: translate(50%, -50%);
  }
  .chart-axis-hover-dot.right {
    left: 0;
    transform: translate(-50%, -50%);
  }
  .chart-zoom-selection {
    position: absolute;
    border-radius: 6px;
    border: 1px solid color-mix(in srgb, var(--primary-color, #03a9f4) 78%, transparent);
    background: color-mix(in srgb, var(--primary-color, #03a9f4) 18%, transparent);
    pointer-events: none;
    opacity: 0;
    transition: opacity 120ms ease;
  }
  .chart-zoom-selection.visible {
    opacity: 1;
  }
  .chart-add-annotation {
    position: absolute;
    width: 24px;
    height: 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    margin: 0;
    border: 1px solid color-mix(in srgb, var(--secondary-text-color, #616161) 22%, transparent);
    border-radius: 8px;
    background: color-mix(in srgb, var(--secondary-background-color, #f3f4f6) 94%, transparent);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.16);
    color: var(--secondary-text-color, #616161);
    cursor: pointer;
    z-index: 4;
    transform: translate(-50%, -50%);
  }
  .chart-add-annotation ha-icon {
    --mdc-icon-size: 14px;
    pointer-events: none;
  }
  .chart-add-annotation:hover,
  .chart-add-annotation:focus-visible {
    background: color-mix(in srgb, var(--secondary-background-color, #f3f4f6) 82%, transparent);
    color: var(--primary-text-color);
    outline: none;
  }
  .chart-add-annotation[hidden] {
    display: none;
  }
  .chart-zoom-out {
    position: absolute;
    top: calc(var(--dp-chart-top-slot-height, 0px) + var(--dp-spacing-sm));
    right: var(--dp-spacing-lg);
    display: inline-flex;
    align-items: center;
    gap: calc(var(--spacing, 8px) * 0.75);
    padding: calc(var(--spacing, 8px) * 0.875) var(--dp-spacing-md);
    border: 1px solid color-mix(in srgb, var(--primary-color, #03a9f4) 26%, transparent);
    border-radius: 999px;
    background: color-mix(in srgb, var(--primary-color, #03a9f4) 12%, var(--card-background-color, #fff));
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    color: var(--primary-color, #03a9f4);
    font: inherit;
    font-size: 0.82rem;
    font-weight: 500;
    cursor: pointer;
    z-index: 4;
  }
  .chart-zoom-out ha-icon {
    --mdc-icon-size: 16px;
  }
  .chart-zoom-out[hidden] {
    display: none;
  }
  .chart-zoom-out:hover,
  .chart-zoom-out:focus-visible {
    background: color-mix(in srgb, var(--primary-color, #03a9f4) 18%, var(--card-background-color, #fff));
    outline: none;
  }
  .chart-adjust-axis {
    position: absolute;
    left: calc(var(--dp-chart-axis-left-width, 0px) + var(--dp-spacing-sm, 8px));
    bottom: calc(var(--dp-chart-axis-bottom-height, 50px) + var(--dp-spacing-sm, 8px));
    display: inline-flex;
    align-items: center;
    gap: calc(var(--spacing, 8px) * 0.75);
    padding: calc(var(--spacing, 8px) * 0.875) var(--dp-spacing-md);
    border: 1px solid color-mix(in srgb, var(--primary-color, #03a9f4) 26%, transparent);
    border-radius: 999px;
    background: color-mix(in srgb, var(--primary-color, #03a9f4) 12%, var(--card-background-color, #fff));
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    color: var(--primary-color, #03a9f4);
    font: inherit;
    font-size: 0.82rem;
    font-weight: 500;
    cursor: pointer;
    z-index: 4;
  }
  .chart-adjust-axis[hidden] {
    display: none;
  }
  .chart-adjust-axis:hover,
  .chart-adjust-axis:focus-visible {
    background: color-mix(in srgb, var(--primary-color, #03a9f4) 18%, var(--card-background-color, #fff));
    outline: none;
  }
  .legend {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    gap: var(--dp-spacing-sm);
    padding: var(--dp-spacing-sm) var(--dp-spacing-md) var(--dp-spacing-md);
    padding-left: calc(var(--dp-spacing-md) + var(--dp-chart-axis-left-width, 0px));
    padding-right: max(var(--dp-spacing-md), var(--dp-chart-axis-right-width, 0px));
    flex: 0 0 auto;
    border-top: 1px solid color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 88%, transparent);
    min-width: 0;
    max-width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: thin;
    -webkit-overflow-scrolling: touch;
  }
  .legend.wrap-rows {
    flex-wrap: wrap;
    align-items: flex-start;
    overflow-x: hidden;
    overflow-y: auto;
    max-height: calc((30px * 3) + (var(--dp-spacing-sm) * 2));
  }
  .legend-item {
    display: flex;
    align-items: center;
    gap: calc(var(--spacing, 8px) * 0.625);
    font-size: 0.78em;
    color: var(--secondary-text-color);
    flex: 0 0 auto;
  }
  .legend.wrap-rows .legend-item {
    max-width: 100%;
  }
  .legend-toggle {
    display: inline-flex;
    align-items: center;
    gap: calc(var(--spacing, 8px) * 0.625);
    border: 0;
    padding: calc(var(--spacing, 8px) * 0.375) var(--dp-spacing-sm);
    background: none;
    font: inherit;
    line-height: 1.2;
    text-align: left;
    cursor: pointer;
    border-radius: 999px;
    transition: opacity 120ms ease, color 120ms ease, background-color 120ms ease;
    white-space: nowrap;
  }
  .legend-toggle:hover,
  .legend-toggle:focus-visible {
    color: var(--primary-text-color);
    background: color-mix(in srgb, var(--primary-text-color, #111) 6%, transparent);
    outline: none;
  }
  .legend-toggle[aria-pressed="false"] {
    opacity: 0.45;
  }
  .legend-line {
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex: 0 0 12px;
  }
  .legend-label {
    display: inline-block;
    min-width: 0;
  }
  .tooltip {
    position: fixed;
    background: color-mix(in srgb, #0f1218 96%, transparent);
    border: 1px solid color-mix(in srgb, #ffffff 14%, transparent);
    border-radius: 10px;
    padding: calc(var(--dp-spacing-sm) + 2px) calc(var(--dp-spacing-md) + 2px);
    font-size: 0.86rem;
    line-height: 1.1;
    box-shadow: 0 10px 24px rgba(0,0,0,0.28);
    pointer-events: none;
    display: none;
    max-width: clamp(220px, 30vw, 320px);
    z-index: 1200;
    color: rgba(255, 255, 255, 0.96);
  }
  .tt-dot {
    display: inline-block;
    width: 8px; height: 8px;
    border-radius: 50%;
    margin-right: var(--dp-spacing-xs);
    flex-shrink: 0;
  }
  .tt-time { color: rgba(255, 255, 255, 0.72); margin-bottom: calc(var(--spacing, 8px) * 0.375); }
  .tt-value { color: rgba(255, 255, 255, 0.78); margin-bottom: var(--dp-spacing-xs); }
  .tt-series {
    display: grid;
    gap: var(--dp-spacing-xs);
    margin-bottom: var(--dp-spacing-xs);
  }
  .tt-series-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--dp-spacing-md);
    min-width: 0;
  }
  .tt-series-row.subordinate {
    padding-left: calc(var(--spacing, 8px) * 2.25);
  }
  .tt-series-main {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: calc(var(--spacing, 8px) * 0.75);
  }
  .tt-series-label {
    min-width: 0;
    color: rgba(255, 255, 255, 0.76);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .tt-series-value {
    flex: 0 0 auto;
    color: rgba(255, 255, 255, 0.96);
    font-weight: 500;
    white-space: nowrap;
    text-align: right;
  }
  .tt-message-row {
    display: flex;
    align-items: flex-start;
    gap: var(--dp-spacing-xs);
  }
  .tt-message { font-weight: 500; }
  .tt-annotation {
    color: rgba(255, 255, 255, 0.74);
    margin-top: var(--dp-spacing-xs);
    margin-left: calc(8px + var(--dp-spacing-xs) + calc(var(--spacing, 8px) * 0.75));
    white-space: pre-wrap;
    line-height: 1.4;
  }
  .tooltip.secondary {
    max-width: 260px;
  }
  .tooltip.annotation-tooltip {
    max-width: 300px;
  }
  .tt-secondary {
    display: grid;
    gap: calc(var(--spacing, 8px) * 0.5);
  }
  .tt-secondary-title {
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.72);
  }
  .tt-secondary-text {
    font-size: 0.88rem;
    line-height: 1.45;
    color: rgba(255, 255, 255, 0.9);
    white-space: pre-wrap;
  }
  .tt-secondary-text.muted {
    color: rgba(255, 255, 255, 0.74);
  }
  .tt-entities {
    display: flex;
    flex-wrap: wrap;
    gap: var(--dp-spacing-xs);
    margin-top: calc(var(--spacing, 8px) * 0.75);
  }
  .tt-entity-chip {
    display: inline-flex;
    align-items: center;
    gap: calc(var(--spacing, 8px) * 0.5);
    max-width: 100%;
    padding: 2px 8px;
    border-radius: 999px;
    background: color-mix(in srgb, #ffffff 10%, transparent);
    color: rgba(255, 255, 255, 0.82);
    white-space: nowrap;
  }
  .tt-entity-chip ha-icon {
    --mdc-icon-size: 12px;
    flex: 0 0 auto;
  }
  .tt-entity-chip span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;var wi=Object.defineProperty,vi=(a,t,e)=>t in a?wi(a,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):a[t]=e,Y=(a,t,e)=>vi(a,typeof t!="symbol"?t+"":t,e);const bi=500,xi=440,Si=Math.floor(16383/(window.devicePixelRatio||1)),Ai=365;class Ci extends HTMLElement{constructor(){super(...arguments),Y(this,"_hass",null),Y(this,"_config",{}),Y(this,"_legendWrapRows",!1),Y(this,"_adjustComparisonAxisScale",!1),Y(this,"_drawRequestId",0),Y(this,"_analysisCache",null),Y(this,"_backendAnomalyByEntity",new Map),Y(this,"_backendComparisonAnomalyByKey",new Map),Y(this,"_pendingAnomalyEntityIds",new Set),Y(this,"_pendingComparisonAnomalyKeys",new Set),Y(this,"_chartHoverCleanup",null),Y(this,"_chartZoomCleanup",null),Y(this,"_chartZoomDragging",!1),Y(this,"_chartLastHover",null),Y(this,"_scrollSyncSuspended",!1),Y(this,"_lastProgrammaticScrollLeft",null),Y(this,"_ignoreNextProgrammaticScrollEvent",!1),Y(this,"_skipNextScrollViewportSync",!1),Y(this,"_preserveUserScrollViewportUntil",0),Y(this,"_creatingContextAnnotation",!1),Y(this,"_lastComparisonResults",null),Y(this,"_hiddenSeries",new Set),Y(this,"_entityIds",[]),Y(this,"_previousSeriesEndpoints",new Map),Y(this,"_zoomRange",null),Y(this,"_chartScrollViewportEl",null),Y(this,"_chartStageEl",null),Y(this,"_annotationDialog",null),Y(this,"_scrollZoomApplyTimer",null),Y(this,"_onChartScroll",()=>{if(this._scrollSyncSuspended||this._ignoreNextProgrammaticScrollEvent){this._ignoreNextProgrammaticScrollEvent=!1;return}if(!this._chartScrollViewportEl||!this._zoomRange)return;const t=this._chartScrollViewportEl,e=t.scrollLeft,s=Math.max(1,t.scrollWidth-t.clientWidth),i=e/s,o=Math.max(1,this._lastT1-this._lastT0),n=this._zoomRange.end-this._zoomRange.start,l=Math.max(0,o-n),h=this._lastT0+i*l;this._zoomRange={start:h,end:h+n},this._dispatchZoomPreview({startTime:h,endTime:h+n}),this._scrollZoomApplyTimer!==null&&clearTimeout(this._scrollZoomApplyTimer),this._scrollZoomApplyTimer=setTimeout(()=>{this._scrollZoomApplyTimer=null,this._zoomRange&&(this._skipNextScrollViewportSync=!0,this._preserveUserScrollViewportUntil=Date.now()+1e3,this.dispatchEvent(new CustomEvent("hass-datapoints-zoom-apply",{bubbles:!0,composed:!0,detail:{start:this._zoomRange.start,end:this._zoomRange.end}})))},300)}),Y(this,"_lastAnomalyRegions",[]),Y(this,"_lastHistResult",null),Y(this,"_lastStatsResult",null),Y(this,"_lastEvents",null),Y(this,"_hiddenEventIds",new Set),Y(this,"_lastT0",0),Y(this,"_lastT1",0),Y(this,"_lastDrawArgs",[])}connectedCallback(){this.style.cssText="position:relative;display:flex;flex-direction:column;height:100%;min-height:0;padding:var(--dp-spacing-sm,8px) var(--dp-spacing-md,12px) var(--dp-spacing-md,12px);box-sizing:border-box;overflow:visible;isolation:isolate;z-index:3;",!this.querySelector("#chart")&&(this.innerHTML=`<style>${yi}</style>
      <div class="chart-top-slot" id="chart-top-slot" hidden></div>
      <div class="chart-preview-overlay" id="chart-preview-overlay" hidden></div>
      <div class="chart-scroll-viewport" id="chart-scroll-viewport">
        <div class="chart-stage" id="chart-stage">
          <div class="chart-loading active" id="loading" aria-hidden="true">
            <div class="chart-loading-spinner"></div>
            <span class="chart-loading-label">Loading</span>
          </div>
          <div class="chart-message" id="chart-message"></div>
          <canvas id="chart"></canvas>
          <div class="chart-icon-overlay" id="chart-icon-overlay"></div>
          <div class="chart-crosshair" id="chart-crosshair" hidden>
            <div class="crosshair-line vertical" id="crosshair-vertical"></div>
            <div class="crosshair-line horizontal" id="crosshair-horizontal"></div>
            <div class="crosshair-points" id="crosshair-points"></div>
          </div>
          <button type="button" class="chart-add-annotation" id="chart-add-annotation" hidden aria-label="Create data point">
            <ha-icon icon="mdi:plus"></ha-icon>
          </button>
          <ha-tooltip for="chart-add-annotation" placement="bottom" distance="8" show-delay="1000">Create Data Point</ha-tooltip>
          <div class="chart-zoom-selection" id="chart-zoom-selection" hidden></div>
        </div>
        <button type="button" class="chart-adjust-axis" id="chart-adjust-axis" hidden>
          <span>Adjust Y-Axis</span>
        </button>
      </div>
      <div class="chart-axis-overlay left" id="chart-axis-left"></div>
      <div class="chart-axis-overlay right" id="chart-axis-right"></div>
      <button type="button" class="chart-zoom-out" id="chart-zoom-out" hidden>
        <ha-icon icon="mdi:magnify-minus-outline"></ha-icon>
        <span>Zoom out</span>
      </button>
      <div class="tooltip" id="tooltip">
        <div class="tt-time" id="tt-time"></div>
        <div class="tt-value" id="tt-value" style="display:none"></div>
        <div class="tt-series" id="tt-series" style="display:none"></div>
        <div class="tt-message-row" id="tt-message-row" style="display:none">
          <span class="tt-dot" id="tt-dot"></span>
          <span class="tt-message" id="tt-message"></span>
        </div>
        <div class="tt-annotation" id="tt-annotation" style="display:none"></div>
        <div class="tt-entities" id="tt-entities" style="display:none"></div>
      </div>
      <div class="tooltip secondary" id="anomaly-tooltip">
        <div class="tt-secondary">
          <div class="tt-secondary-title" id="tt-secondary-title"></div>
          <div class="tt-secondary-text" id="tt-secondary-description"></div>
          <div class="tt-secondary-text" id="tt-secondary-alert"></div>
          <div class="tt-secondary-text muted" id="tt-secondary-instruction"></div>
        </div>
      </div>
      <div id="annotation-tooltips"></div>
      <div class="legend" id="legend"></div>`)}get hass(){return this._hass}set hass(t){this._hass=t}_el(t){return this.querySelector(`#${t}`)}_els(t){return this.querySelectorAll(t)}_setChartLoading(t){const e=this._el("loading");e&&e.classList.toggle("active",!!t)}_setChartMessage(t=""){const e=this._el("chart-message");e&&(e.textContent=t||"",e.classList.toggle("visible",!!t))}_drawEmptyChartFrame(t,e){const s=this._el("chart"),i=this,o=this._el("chart-scroll-viewport"),n=this._el("chart-stage");if(!s)return;this._syncTopSlotOffset();const l=this._getAvailableChartHeight(280),h=Math.max(o?.clientWidth||i?.clientWidth||360,360);n&&(n.style.width=`${h}px`,n.style.height=`${l}px`);const{w:u,h:d}=Ee(s,n||i,l,h),c=new Re(s,u,d);c.labelColor=Le(this),c.clear(),c.drawGrid(t,e,[{key:"placeholder",min:0,max:1,side:"left",unit:"",color:null}],void 0,5,{fixedAxisOverlay:!0}),qe(this,c,c._activeAxes||[])}_getAvailableChartHeight(t=280){const e=this.closest("ha-card"),s=e?.querySelector(".card-header"),i=this._el("chart-top-slot"),o=this._el("legend"),n=this._el("chart-scroll-viewport"),l=this,h=e?.clientHeight||0,u=(s?.offsetHeight||0)+(i&&!i.hidden&&i.offsetHeight||0)+(o?.offsetHeight||0),d=h?Math.max(0,h-u):0,c=n?.clientHeight||0,w=l?.clientHeight||0;return Math.max(t,d||c||w||0)}_syncTopSlotOffset(){const t=this._el("chart-top-slot"),e=t&&!t.hidden&&t.offsetHeight||0;this.style.setProperty("--dp-chart-top-slot-height",`${e}px`)}_updateLegendLayout(t){if(!t)return;const s=this.closest("ha-card")?.clientHeight||0;this._legendWrapRows?this._legendWrapRows=s>=xi:this._legendWrapRows=s>=bi,t.classList.toggle("wrap-rows",this._legendWrapRows)}_setAdjustAxisButtonVisibility(t,e){const s=this._el("chart-adjust-axis");if(s){if(s.hidden=!t,t){s.onclick=()=>{this._adjustComparisonAxisScale=!0,e?.(),this._redrawLastDraw()};return}s.onclick=null}}_renderComparisonPreviewOverlay(t=null){const e=this._el("chart-preview-overlay");if(!e)return;const s=this._config?.comparison_preview_overlay||null;if(!s?.window_range_label||!s?.actual_range_label){e.hidden=!0,e.innerHTML="";return}t?.pad?.left!=null?e.style.left=`${Math.max(8,t.pad.left+8)}px`:e.style.left="",e.innerHTML=`
      <div class="chart-preview-line"><strong>${It("Date window:")}</strong> ${wt(s.window_range_label)}</div>
      <div class="chart-preview-line"><strong>${It("Actual:")}</strong> ${wt(s.actual_range_label)}</div>
    `,e.hidden=!1}_queueDrawChart(t,e,s,i,o,n={}){const l=++this._drawRequestId;kt.log("[hass-datapoints history-card] draw queued",{drawRequestId:l,loading:n.loading??!1}),this._drawChart(t,e,s,i,o,{...n,drawRequestId:l}).catch(h=>{l===this._drawRequestId&&(kt.error("[hass-datapoints history-card] draw failed",h),this._setChartLoading(!1),this._setChartMessage("Failed to render chart."))})}_redrawLastDraw(){if(this._lastDrawArgs.length!==5&&this._lastDrawArgs.length!==6)return;const[t,e,s,i,o,n={}]=this._lastDrawArgs;this._queueDrawChart(t,e,s,i,o,n)}_buildBackendAnomalyConfig(t){const e={anomaly_methods:Array.isArray(t.anomaly_methods)?t.anomaly_methods:void 0,anomaly_sensitivity:typeof t.anomaly_sensitivity=="string"?t.anomaly_sensitivity:void 0,anomaly_overlap_mode:typeof t.anomaly_overlap_mode=="string"?t.anomaly_overlap_mode:void 0,anomaly_rate_window:typeof t.anomaly_rate_window=="string"?t.anomaly_rate_window:void 0,anomaly_zscore_window:typeof t.anomaly_zscore_window=="string"?t.anomaly_zscore_window:void 0,anomaly_persistence_window:typeof t.anomaly_persistence_window=="string"?t.anomaly_persistence_window:void 0,trend_method:typeof t.trend_method=="string"?t.trend_method:void 0,trend_window:typeof t.trend_window=="string"?t.trend_window:void 0,anomaly_use_sampled_data:t.anomaly_use_sampled_data!==!1};return t.anomaly_use_sampled_data!==!1&&(e.sample_interval=typeof t.sample_interval=="string"?t.sample_interval:null,e.sample_aggregate=typeof t.sample_aggregate=="string"?t.sample_aggregate:null),e}_buildEntityStateList(t,e,s){const i=this._seriesSettings?.map(h=>h.entity_id).filter(Boolean)??[],o=Bs(e,t,i),n=Ws(t,o),l=je(t,s);return qs(n,l)}_buildBinaryStateSpans(t,e,s){const i=[];if(!t.length)return i;let o=t[0];for(let l=1;l<t.length;l++){const h=t[l],u=Math.max(o.lu*1e3,e),d=Math.min(h.lu*1e3,s);d>u&&i.push({start:u,end:d,state:o.s}),o=h}const n=Math.max(o.lu*1e3,e);return s>n&&i.push({start:n,end:s,state:o.s}),i}_binaryOnLabel(t){const e=this._hass?.states?.[t]?.attributes?.device_class;return Ns(e??"")}_binaryOffLabel(t){const e=this._hass?.states?.[t]?.attributes?.device_class;return Fs(e??"")}_normalizeStatisticsHistory(t,e){return je(t,e)}_renderLegend(t,e){const s=this.querySelector("#legend");if(!s)return;const i=[...t,...e];this._updateLegendLayout(s),s.innerHTML=i.map(o=>`<div class="legend-item">
        <button type="button" class="legend-toggle" aria-pressed="${this._hiddenSeries?.has(o.entityId)?"false":"true"}" data-entity-id="${wt(o.entityId)}">
          <span class="legend-line" style="background:${wt(o.color)}"></span>
          <span class="legend-label">${wt(o.label)}</span>
        </button>
      </div>`).join(""),s.querySelectorAll(".legend-toggle").forEach(o=>{o.addEventListener("click",()=>{const n=o.dataset.entityId;!n||!this._hiddenSeries||(this._hiddenSeries.has(n)?this._hiddenSeries.delete(n):this._hiddenSeries.add(n),o.setAttribute("aria-pressed",this._hiddenSeries.has(n)?"false":"true"),this._redrawLastDraw())})})}_drawSeriesLine(t,e,s,i,o,n,l,h){const u=t,d=this._config,c=d?.show_data_gaps!==!1,w=d?.data_gap_threshold||"2h",_=ve[w]??120*6e4;if(!c||e.length<2||!Number.isFinite(_)){u.drawLine(e,s,i,o,n,l,h);return}const g=[],S=[];let C=[e[0]];for(let M=1;M<e.length;M++)e[M][0]-e[M-1][0]>_?(g.push(C),S.push([e[M-1],e[M]]),C=[e[M]]):C.push(e[M]);if(g.push(C),g.length===1){u.drawLine(e,s,i,o,n,l,h);return}for(const M of g)u.drawLine(M,s,i,o,n,l,h);const P=s.startsWith("rgba")?s.replace(/[\d.]+\)$/,"0.35)"):`${s}59`;for(const[M,N]of S)u.drawLine([M,N],P,i,o,n,l,{dashed:!0,lineWidth:1.2,lineOpacity:.5});const A=S.flatMap(([M,N])=>[M,N]);u.drawGapMarkers(A,s,i,o,n,l)}_drawRecordedEventPoints(t,e,s,i,o,n){const l=t,h=e,u=s,d=n,c=this.querySelector("#chart-icon-overlay");if(c&&!d.skipOverlayClear&&(c.innerHTML=""),!l||!u?.length)return[];const w=Number.isFinite(d.yOffset)?d.yOffset:0,_=[],{ctx:g}=l,S=d.showIcons!==!1,C=Array.isArray(this._config?.hovered_event_ids)?this._config.hovered_event_ids:[],P=new Set(Array.isArray(d.highlightedEventIds)?d.highlightedEventIds:C);for(const A of u){const M=new Date(A.timestamp).getTime();if(M<i||M>o)continue;const N=Array.isArray(A.entity_ids)?A.entity_ids:[],it=l.xOf(M,i,o),D=y=>{for(const m of y){if(!m?.pts?.length||!m.axis)continue;const v=l._interpolateValue(m.pts,M);if(v!=null)return{series:m,value:v}}return null},q=N.map(y=>h.find(m=>m.entityId===y)).filter(y=>y!=null),tt=D(q),G=N.length>0&&q.length===0,At=tt||(G?null:D([...h].reverse())),ct=At?.series||null,F=!!(ct?.pts?.length&&ct.axis),mt=F?At?.value??null:null;if(F&&mt==null)continue;let V;F?V=l.yOf(mt,ct.axis.min,ct.axis.max):G?V=l.pad.top+l.ch:V=l.pad.top+12;const ht=A.color||ct?.color||"#03a9f4",vt=P.has(String(A.id||"")),ft=S?18:10,gt=S?15:8,Mt=S?13:6,bt=S?11:4;vt&&(g.save(),g.beginPath(),g.arc(it,V,ft,0,Math.PI*2),g.fillStyle=U(ht,.18),g.fill(),g.restore(),g.save(),g.beginPath(),g.arc(it,V,gt,0,Math.PI*2),g.strokeStyle=ht,g.lineWidth=2,g.stroke(),g.restore()),g.save(),g.beginPath(),g.arc(it,V,Mt,0,Math.PI*2),g.fillStyle="rgba(255,255,255,0.92)",g.fill(),g.restore(),g.save(),g.beginPath(),g.arc(it,V,bt,0,Math.PI*2),g.fillStyle=ht,g.fill(),g.restore();const j=y=>{y.preventDefault(),y.stopPropagation(),ds(this,{entity_id:A.entity_ids||[],device_id:[],area_id:[],label_id:[]},{start_time:this._config?.start_time||null,end_time:this._config?.end_time||null,zoom_start_time:this._config?.zoom_start_time||null,zoom_end_time:this._config?.zoom_end_time||null,datapoint_scope:this._config?.datapoint_scope})};if(c&&S){const y=document.createElement("button");y.type="button",y.className="chart-event-icon",y.style.left=`${it}px`,y.style.top=`${V+w}px`,y.title=A.message||"Open related history",y.setAttribute("aria-label",A.message||"Open related history"),y.innerHTML=`<ha-icon icon="${wt(A.icon||"mdi:bookmark")}" style="color:${Ps(ht)}"></ha-icon>`,y.addEventListener("click",j),c.appendChild(y)}else if(c){const y=document.createElement("button");y.type="button",y.className="chart-event-icon",y.style.left=`${it}px`,y.style.top=`${V+w}px`,y.title=A.message||"Open related history",y.setAttribute("aria-label",A.message||"Open related history"),y.addEventListener("click",j),c.appendChild(y)}_.push({event:A,entityId:ct?.entityId||null,unit:ct?.unit||"",value:mt,x:it,y:V})}return _}_getAxisValueExtent(t){return js(t)}_getComparisonWindowLineStyle(t,e,s){return t?{lineOpacity:1,dashed:!1,hoverOpacity:.85}:s&&e?{lineOpacity:.25,lineWidth:1.25,dashed:!1,hoverOpacity:.25}:{lineOpacity:.85,dashed:!1,hoverOpacity:.85}}_syncChartViewportScroll(t,e,s){if(!this._chartScrollViewportEl||!this._zoomRange)return;const i=this._chartScrollViewportEl;if(Date.now()<this._preserveUserScrollViewportUntil){this._skipNextScrollViewportSync=!1;return}if(this._skipNextScrollViewportSync){this._skipNextScrollViewportSync=!1;return}const o=i.clientWidth,n=Math.max(1,e-t),l=n*Math.min(1,o/Math.max(s,o)),h=Math.max(0,Math.max(s,o)-o),u=Math.max(0,n-l),d=ie(this._zoomRange.start,t,e-l),w=(u>0?(d-t)/u:0)*h,_=i.scrollLeft;Math.abs(_-w)<2||(this._scrollSyncSuspended=!0,this._lastProgrammaticScrollLeft=w,this._ignoreNextProgrammaticScrollEvent=!0,i.scrollLeft=w,window.requestAnimationFrame(()=>{this._scrollSyncSuspended=!1}))}_ensureContextAnnotationDialog(){const t=this.getRootNode()?.host??null;t?._annotationDialog&&typeof t._annotationDialog.ensureDialog=="function"&&t._annotationDialog.ensureDialog()}_openContextAnnotationDialog(t){const e=this.getRootNode()?.host??null;e?._annotationDialog&&typeof e._annotationDialog.open=="function"&&e._annotationDialog.open(t)}async _handleChartContextMenu(t){const s=(this.getRootNode()?.host??null)?._annotationDialog;!t||!this._hass||s?.isOpen?.()||this._openContextAnnotationDialog(t)}_handleChartAddAnnotation(t){const s=(this.getRootNode()?.host??null)?._annotationDialog;!t||!this._hass||s?.isOpen?.()||this._openContextAnnotationDialog(t)}_handleAnomalyAddAnnotation(t){const e=t;if(!e?.length||!this._hass)return;const s=this._buildAnomalyAnnotationPrefill(e),l=e[0]?.cluster?.points?.reduce((h,u)=>!h||Math.abs(u.residual)>Math.abs(h.residual)?u:h,null)?.timeMs??this._chartLastHover?.timeMs??Date.now();this._openContextAnnotationDialog({timeMs:l,annotationPrefill:s})}_buildAnomalyAnnotationPrefill(t){const e=t;if(!e?.length)return{};const s=us(e),o=e[0]?.relatedEntityId??null;return{message:s?`${s.description}
${s.alert}`:"",icon:"mdi:alert-circle",linkedTarget:o?{entity_id:[o]}:null}}_fireBackendAnomalyRequests(t,e,s,i){if(!t||!t.length||!this._hass)return;const o=this._hass;t.forEach(n=>{const l=e.get(n);if(!l)return;const h=this._buildBackendAnomalyConfig(l),u=JSON.stringify({...h,anomaly_methods:[...h.anomaly_methods||[]].sort()}),d=this._backendAnomalyByEntity.get(n);d&&d.configKey===u||(this._pendingAnomalyEntityIds.add(n),this._setChartLoading(!0),Ye(o,n,s,i,h).then(c=>{if(this._pendingAnomalyEntityIds.delete(n),s!==new Date(this._lastT0).toISOString()||i!==new Date(this._lastT1).toISOString()){this._pendingAnomalyEntityIds.size===0&&this._setChartLoading(!1);return}if(this._backendAnomalyByEntity.set(n,{configKey:u,clusters:c}),this._analysisCache?.result){const w=this._analysisCache.result.anomalySeries||[],_=w.findIndex(S=>S.entityId===n),g={entityId:n,anomalyClusters:c};_>=0?w[_]=g:w.push(g)}this._lastHistResult&&this._lastEvents?this._queueDrawChart(this._lastHistResult,this._lastStatsResult||{},this._filterEvents(this._lastEvents),this._lastT0,this._lastT1,{loading:this._pendingAnomalyEntityIds.size>0}):this._pendingAnomalyEntityIds.size===0&&this._setChartLoading(!1)}).catch(c=>{this._pendingAnomalyEntityIds.delete(n),this._pendingAnomalyEntityIds.size===0&&this._setChartLoading(!1),kt.warn("[hass-datapoints history-card] backend anomaly fetch failed",{entityId:n,err:c})}))})}_dispatchZoomPreview(t){const e=t;this.dispatchEvent(new CustomEvent("hass-datapoints-chart-zoom",{bubbles:!0,composed:!0,detail:e?{startTime:e.startTime,endTime:e.endTime,preview:!0}:{startTime:null,endTime:null,preview:!0}}))}_applyZoomRange(t,e){const s=Math.min(t,e),i=Math.max(t,e);s<i&&(this._zoomRange={start:s,end:i},this.dispatchEvent(new CustomEvent("hass-datapoints-zoom-apply",{bubbles:!0,composed:!0,detail:{start:s,end:i}})),this._redrawLastDraw())}_clearZoomRange(){this._zoomRange&&(this._zoomRange=null,this.dispatchEvent(new CustomEvent("hass-datapoints-zoom-apply",{bubbles:!0,composed:!0,detail:null})),this._redrawLastDraw())}_filterEvents(t){const e=t,s=String(this._config?.message_filter||"").trim().toLowerCase(),i=e.filter(o=>!this._hiddenEventIds.has(o?.id??""));return s?i.filter(o=>[o?.message||"",o?.annotation||"",...(o?.entity_ids||[]).filter(Boolean)].join(`
`).toLowerCase().includes(s)):i}_buildCorrelatedAnomalySpans(t,e,s){const i=t,o=e,n=[];for(const c of i){if(s.get(c.entityId)?.show_anomalies!==!0)continue;const _=o.get(c.entityId)||[];if(!_.length)continue;const g=c.pts;let S=6e4;if(Array.isArray(g)&&g.length>=2){const P=[];for(let A=1;A<g.length;A++){const M=g[A][0]-g[A-1][0];M>0&&P.push(M)}if(P.length){P.sort((M,N)=>M-N);const A=Math.floor(P.length/2);S=P.length%2===0?(P[A-1]+P[A])/2:P[A],S=Math.max(S,1e3)}}const C=[];for(const P of _){if(!Array.isArray(P.points)||P.points.length===0)continue;const A=P.points[0]?.timeMs,M=P.points[P.points.length-1]?.timeMs;!Number.isFinite(A)||!Number.isFinite(M)||C.push({start:Math.min(A,M)-S,end:Math.max(A,M)+S})}C.length&&n.push({entityId:c.entityId,intervals:C})}if(n.length<2)return[];const l=[];for(const{entityId:c,intervals:w}of n)for(const{start:_,end:g}of w)l.push({time:_,delta:1,entityId:c}),l.push({time:g,delta:-1,entityId:c});l.sort((c,w)=>c.time-w.time||c.delta-w.delta);const h=new Map,u=[];let d=null;for(const c of l){const _=(h.get(c.entityId)||0)+c.delta;_<=0?h.delete(c.entityId):h.set(c.entityId,_);const g=h.size;d===null&&g>=2?d=c.time:d!==null&&g<2&&(u.push({start:d,end:c.time}),d=null)}return d!==null&&l.length>0&&u.push({start:d,end:l[l.length-1].time}),u}_filterAnnotatedAnomalyClusters(t,e){const s=t;if(!Array.isArray(s?.anomalyClusters)||s.anomalyClusters.length===0)return[];const i=Array.isArray(e)?e:[];if(i.length===0)return s.anomalyClusters;const o=n=>{if(!Array.isArray(n.points)||n.points.length===0)return null;const l=n.points[0]?.timeMs,h=n.points[n.points.length-1]?.timeMs;return!Number.isFinite(l)||!Number.isFinite(h)?null:{startTime:Math.min(l,h),endTime:Math.max(l,h)}};return s.anomalyClusters.filter(n=>{const l=o(n);return l?!i.some(h=>{if(!(Array.isArray(h.entity_ids)?h.entity_ids.filter(Boolean):[]).includes(s.entityId))return!1;const d=new Date(h.timestamp).getTime();return Number.isFinite(d)?d>=l.startTime&&d<=l.endTime:!1}):!0})}_fireComparisonBackendAnomalyRequests(t,e,s,i){if(!t.length||!this._hass)return;const o=new Date(s).toISOString(),n=new Date(i).toISOString();t.forEach(l=>{const h=new Date(s+l.time_offset_ms).toISOString(),u=new Date(i+l.time_offset_ms).toISOString();this._seriesSettings.forEach(d=>{const c=String(d.entity_id||"");if(!c||this._hiddenSeries.has(c))return;const w=e.get(c);if(!w||w.show_anomalies!==!0)return;const _=this._buildBackendAnomalyConfig(w),g=JSON.stringify({..._,windowId:l.id,startIso:o,endIso:n,anomaly_methods:[..._.anomaly_methods||[]].sort()}),S=this._getComparisonAnomalyCacheKey(l.id,c),C=this._backendComparisonAnomalyByKey.get(S);if(C&&C.configKey===g||this._pendingComparisonAnomalyKeys.has(S))return;this._pendingComparisonAnomalyKeys.add(S);const P=this._hass;if(!P){this._pendingComparisonAnomalyKeys.delete(S);return}Ye(P,c,h,u,_).then(A=>{if(this._pendingComparisonAnomalyKeys.delete(S),o!==new Date(this._lastT0).toISOString()||n!==new Date(this._lastT1).toISOString())return;const M=this._shiftComparisonAnomalyClusters(Array.isArray(A)?A:[],l.time_offset_ms);this._backendComparisonAnomalyByKey.set(S,{configKey:g,clusters:M}),this._lastHistResult&&this._lastEvents&&this._queueDrawChart(this._lastHistResult,this._lastStatsResult||{},this._filterEvents(this._lastEvents),this._lastT0,this._lastT1,{loading:!1})}).catch(()=>{this._pendingComparisonAnomalyKeys.delete(S)})})})}_renderSplitAxisOverlays(t){const e=t,s=this.querySelector("#chart-axis-left"),i=this.querySelector("#chart-axis-right");if(!s||!i||!e.length)return;const o=e[0].renderer,n=Math.max(0,o.pad.left),l=Math.max(0,o.pad.bottom);s.style.width=`${n}px`,i.style.width="0px",this.style.setProperty("--dp-chart-axis-left-width",`${n}px`),this.style.setProperty("--dp-chart-axis-right-width","0px"),this.style.setProperty("--dp-chart-axis-bottom-height",`${l}px`);const h=10;let u="";for(const{renderer:d,axis:c,rowOffset:w}of e)if(c?.ticks?.length){for(const _ of c.ticks){const g=w+d.yOf(_,c.min,c.max),S=d._formatAxisTick(_,c.unit);u+=`<div class="chart-axis-label" style="top:${Math.round(g)+1}px;right:${h}px;text-align:right;">${wt(S)}</div>`}if(c.unit){const _=w+Math.max(0,o.pad.top-18);u+=`<div class="chart-axis-unit" style="top:${_}px;right:${h}px;text-align:right;">${wt(c.unit)}</div>`}}s.innerHTML=`<div class="chart-axis-divider"></div>${u}`,s.classList.add("visible"),i.innerHTML="",i.classList.remove("visible")}get _seriesSettings(){return Array.isArray(this._config?.series_settings)?this._config.series_settings:[]}get _comparisonWindows(){return Array.isArray(this._config?.comparison_windows)?this._config.comparison_windows:[]}_getDrawableComparisonResults(t){const e=new Set(this._comparisonWindows.map(o=>String(o?.id||"")).filter(o=>o.length>0)),s=String(this._config?.selected_comparison_window_id||""),i=String(this._config?.hovered_comparison_window_id||"");return s&&e.add(s),i&&e.add(i),e.size===0?[]:t.filter(o=>e.has(String(o.id||"")))}_resolveAnomalyClusterDisplay(t,e,s=[]){const i=t.filter(n=>!n.isOverlap),o=t.filter(n=>n.isOverlap===!0);if(e==="only"){const n=this._filterClustersByCorrelatedSpans(t,s);return{baseClusters:n,regionClusters:n,showCorrelatedSpans:!0}}return{baseClusters:[...i,...o],regionClusters:[...i,...o],showCorrelatedSpans:!1}}_filterClustersByCorrelatedSpans(t,e){return!Array.isArray(t)||t.length===0?[]:!Array.isArray(e)||e.length===0?[]:t.filter(s=>{const i=s.points;if(!Array.isArray(i)||i.length===0)return!1;const o=Number(i[0]?.timeMs),n=Number(i[i.length-1]?.timeMs);if(!Number.isFinite(o)||!Number.isFinite(n))return!1;const l=Math.min(o,n),h=Math.max(o,n);return e.some(u=>{const d=Number(u.start),c=Number(u.end);return!Number.isFinite(d)||!Number.isFinite(c)?!1:h>=d&&l<=c})})}_getComparisonAnomalyCacheKey(t,e){return`${t}:${e}`}_shiftComparisonAnomalyClusters(t,e){return(Array.isArray(t)?t:[]).map(s=>({...s,points:Array.isArray(s.points)?s.points.map(i=>({...i,timeMs:Number(i.timeMs)-e})):[]}))}async _resolveComparisonWindowPoints(t,e,s,i,o){const n=this._buildEntityStateList(t,e.histResult,e.statsResult||{}),l=[];for(const S of n){const C=parseFloat(S.s);Number.isNaN(C)||l.push([Math.round(S.lu*1e3)-e.time_offset_ms,C])}const h=s.sample_interval||"raw";if(h==="raw"||!this._hass)return l;const u=new Date(i+e.time_offset_ms).toISOString(),d=new Date(o+e.time_offset_ms).toISOString(),c=await Ue(this._hass,t,u,d,h,s.sample_aggregate||"mean");if(!Array.isArray(c)||c.length===0){const S=ve[h]??0;if(S<=0||l.length===0)return l;const C=s.sample_aggregate||"mean";return gs(l,S,C)}let w=c.map(([S,C])=>[S-e.time_offset_ms,C]);const g=this._normalizeStatisticsHistory(t,e.statsResult||{}).map(S=>[Math.round(S.lu*1e3)-e.time_offset_ms,parseFloat(S.s)]).filter(([,S])=>!Number.isNaN(S));if(g.length>0){const S=w[0][0],C=w[w.length-1][0],P=g.filter(([A])=>A<S||A>C);if(P.length>0){const A=ve[h]??0,M=s.sample_aggregate||"mean";w=[...A>0?await De(P,A,M):P,...w],w.sort((it,D)=>it[0]-D[0])}}return w}_drawComparisonAnalysisOverlays({renderer:t,entityId:e,seriesColor:s,comparisonPts:i,analysis:o,renderT0:n,renderT1:l,axis:h,rateAxis:u=null,events:d=[],comparisonWindowId:c}){const w=this._analysisCache?.result?.comparisonWindowResults?.[c]?.[e];if(o.show_threshold_analysis===!0){const _=Number(o.threshold_value);Number.isFinite(_)&&(o.show_threshold_shading===!0&&i.length&&t.drawThresholdArea(i,_,s,n,l,h.min,h.max,{mode:o.threshold_direction==="below"?"below":"above",fillAlpha:.08}),t.drawLine([[n,_],[l,_]],U(s,.28),n,l,h.min,h.max,{lineOpacity:.34,lineWidth:1.05,dashed:!0}))}if(o.show_summary_stats===!0){const _=w?.summaryStats??this._buildSummaryStats(i);if(Number.isFinite(_.min)&&Number.isFinite(_.max)&&Number.isFinite(_.mean)){o.show_summary_stats_shading===!0&&(t.drawGradientBand(_.min,_.mean,s,n,l,h.min,h.max,{fillAlpha:.04}),t.drawGradientBand(_.max,_.mean,s,n,l,h.min,h.max,{fillAlpha:.04}));const g=[{value:_.min,alpha:.24,width:1,dotted:!0},{value:_.mean,alpha:.44,width:1.45,dotted:!1},{value:_.max,alpha:.24,width:1,dotted:!0}];for(const S of g)t.drawLine([[n,S.value],[l,S.value]],U(s,S.alpha),n,l,h.min,h.max,{lineOpacity:S.alpha+.08,lineWidth:S.width,dotted:S.dotted})}}if(o.show_trend_lines===!0&&i.length>=2){const _=w?.trendPts??this._buildTrendPoints(i,o.trend_method,o.trend_window);if(_.length>=2){const g=this._getTrendRenderOptions(o.trend_method,!1);t.drawLine(_,U(s,Math.max(.3,g.colorAlpha-.18)),n,l,h.min,h.max,{lineOpacity:Math.max(.3,g.lineOpacity-.18),lineWidth:Math.max(1.35,g.lineWidth-.35),dashed:g.dashed,dotted:g.dotted})}}if(o.show_rate_of_change===!0&&u&&i.length>=2){const _=w?.ratePts??this._buildRateOfChangePoints(i,o.rate_window);_.length>=2&&t.drawLine(_,U(s,.52),n,l,u.min,u.max,{lineOpacity:.46,lineWidth:1.35,dashPattern:[6,3,1.5,3]})}if(o.show_anomalies===!0){const _=this._getComparisonAnomalyCacheKey(c,e),g=this._backendComparisonAnomalyByKey.get(_),S=Array.isArray(g?.clusters)?g.clusters:[];if(S.length>0){const C={strokeAlpha:.72,lineWidth:1.6,haloWidth:3.4,haloColor:"rgba(255,255,255,0.72)",haloAlpha:.64,fillColor:U(s,.06),fillAlpha:1,pointPadding:8,minRadiusX:8,minRadiusY:8},P=this._filterAnnotatedAnomalyClusters({entityId:e,anomalyClusters:S},d);P.length>0&&t.drawAnomalyClusters(P,U(s,.74),n,l,h.min,h.max,C)}}}async _drawChart(t,e,s,i,o,n={}){const l=Array.isArray(s)?s:[];be(this),this._syncTopSlotOffset();const h=this.querySelector("#chart"),u=this.querySelector("#chart-zoom-out"),d=this,c=this.querySelector("#chart-scroll-viewport"),w=this.querySelector("#chart-stage");this._chartScrollViewportEl=c,this._chartStageEl=w;const _=[],g=[],S=new Map,C=[],P=this._seriesSettings,A=this._getSeriesAnalysisMap(),M=Array.isArray(this._lastComparisonResults)?this._lastComparisonResults:[],N=this._getDrawableComparisonResults(M),it=this._config?.selected_comparison_window_id||null,D=this._config?.hovered_comparison_window_id||null,q=this._comparisonWindows.length>0,tt=this._config?.delink_y_axis===!0,G=q&&!!D&&!this._zoomRange&&!this._chartZoomDragging,At=!!D&&!!it&&D!==it,ct=!!it;P.forEach((r,f)=>{const p=r.entity_id;if(p.split(".")[0]==="binary_sensor"){const Pt=this._buildEntityStateList(p,t,e),Gt=this._buildBinaryStateSpans(Pt,i,o);Gt.length&&C.push({entityId:p,label:Bt(this._hass,p)||p,color:r.color||te[f%te.length],onLabel:this._binaryOnLabel(p),offLabel:this._binaryOffLabel(p),spans:Gt});return}const T=this._buildEntityStateList(p,t,e),X=[],lt=this._hass?.states?.[p]?.attributes?.unit_of_measurement||"",_t=tt?`${lt||"__unitless__"}::${p}`:lt||"__unitless__";let Lt=S.get(_t);Lt||(Lt={key:_t,unit:lt,color:r.color||te[f%te.length],side:S.size===0?"left":"right",values:[]},S.set(_t,Lt),g.push(Lt));for(const Pt of T){const Gt=parseFloat(Pt.s);Number.isNaN(Gt)||(X.push([Math.round(Pt.lu*1e3),Gt]),Lt.values.push(Gt))}X.length&&_.push({entityId:p,legendEntityId:p,label:Bt(this._hass,p)||p,unit:lt,pts:X,color:r.color||te[f%te.length],axisKey:_t})});const F=new Date(i).toISOString(),mt=new Date(o).toISOString();_.length&&this._hass&&((i!==this._lastT0||o!==this._lastT1)&&(this._backendAnomalyByEntity.clear(),this._backendComparisonAnomalyByKey.clear()),await Promise.all(_.map(async r=>{const f=A.get(r.entityId)||nt(null),p=f.sample_interval||"raw";if(p==="raw")return;const I=this._hass;if(I)try{const T=ve[p]??0,X=f.sample_aggregate||"mean",lt=await Ue(I,r.entityId,F,mt,p,X);if(Array.isArray(lt)&&lt.length>0){const Lt=this._normalizeStatisticsHistory(r.entityId,e).map(Ot=>[Math.round(Ot.lu*1e3),parseFloat(Ot.s)]).filter(([,Ot])=>!Number.isNaN(Ot));let Pt=lt;if(Lt.length>0){const Ot=lt[0][0],he=lt[lt.length-1][0],Qt=Lt.filter(([Ht])=>Ht<Ot||Ht>he);Qt.length>0&&(Pt=[...T>0?await De(Qt,T,X):Qt,...lt],Pt.sort((jt,Cs)=>jt[0]-Cs[0]))}r.pts=Pt;const Gt=g.find(Ot=>Ot.key===r.axisKey);Gt&&(Gt.values=Pt.map(([,Ot])=>Ot).filter(Number.isFinite))}else if(Array.isArray(r.pts)&&r.pts.length>0&&T>0){const _t=await De(r.pts,T,X);if(_t.length>0){r.pts=_t;const Lt=g.find(Pt=>Pt.key===r.axisKey);Lt&&(Lt.values=_t.map(([,Pt])=>Pt).filter(Number.isFinite))}}}catch(T){kt.warn("[hass-datapoints history-card] downsampled history fetch failed",{entityId:r.entityId,err:T})}})));for(const r of _){if(!r.pts.length)continue;const f=r.pts[r.pts.length-1],p=this._previousSeriesEndpoints.get(r.entityId);p?f[0]!==p.t||f[1]!==p.v?kt.log("[hass-datapoints history-card] series updated — live update detected",{entityId:r.entityId,pointCount:r.pts.length,prev:p,lastPt:f}):kt.log("[hass-datapoints history-card] series unchanged — no new data",{entityId:r.entityId,pointCount:r.pts.length,lastPt:f}):kt.log("[hass-datapoints history-card] series initial draw",{entityId:r.entityId,pointCount:r.pts.length,lastPt:f}),this._previousSeriesEndpoints.set(r.entityId,{t:f[0],v:f[1]})}if(!_.length&&!C.length){this._setAdjustAxisButtonVisibility(!1),this._renderComparisonPreviewOverlay();const r=Number.isFinite(this._lastT0)&&Number.isFinite(this._lastT1)&&this._lastT0===i&&this._lastT1===o&&Array.isArray(this._lastDrawArgs)&&this._lastDrawArgs.length>0;if(this._setChartLoading(!!n.loading),this._setChartMessage(n.loading?"":"No numeric data in the selected time range."),r)return;this._lastHistResult=t,this._lastStatsResult=e,this._lastEvents=l,this._lastT0=i,this._lastT1=o,this._lastDrawArgs=[t,e,l,i,o,n];return}this._lastHistResult=t,this._lastStatsResult=e,this._lastEvents=l,this._lastT0=i,this._lastT1=o,this._lastDrawArgs=[t,e,l,i,o,n];const V=_.filter(r=>!this._hiddenSeries.has(r.legendEntityId||r.entityId)),ht=N.find(r=>r.id===it)||null,vt=new Map;if(ht)for(let r=0;r<P.length;r+=1){const f=P[r],p=f.entity_id;if(p.split(".")[0]==="binary_sensor"||this._hiddenSeries.has(p))continue;const I=this._hass?.states?.[p]?.attributes?.unit_of_measurement||"",T=A.get(p)||nt(null),X=await this._resolveComparisonWindowPoints(p,ht,T,i,o);X.length&&vt.set(p,{entityId:p,label:Bt(this._hass,p)||p,unit:I,color:f.color||te[r%te.length],pts:X})}const ft={};for(const r of V){const f=A.get(r.entityId)||nt(null);if(f.show_anomalies!==!0||!f.anomaly_methods?.includes("comparison_window")||!f.anomaly_comparison_window_id)continue;const p=f.anomaly_comparison_window_id;if(ft[p]||(ft[p]={}),!ft[p][r.entityId]){const I=M.find(T=>T.id===p);if(I){const T=await this._resolveComparisonWindowPoints(r.entityId,I,f,i,o);T.length&&(ft[p][r.entityId]=T)}}}const gt=V.filter(r=>{const f=A.get(r.entityId)||{};return f.show_trend_lines||f.show_summary_stats||f.show_rate_of_change}).map(r=>r.entityId),Mt=gt.length?r=>{this.dispatchEvent(new CustomEvent("hass-datapoints-analysis-computing",{bubbles:!0,composed:!0,detail:{computing:!0,entityIds:gt,progress:r}}))}:null,bt=await this._computeHistoryAnalysis(V,vt,A,ct,ft,i,o,Mt);gt.length&&this.dispatchEvent(new CustomEvent("hass-datapoints-analysis-computing",{bubbles:!0,composed:!0,detail:{computing:!1,entityIds:gt,progress:100}}));const j=V.filter(r=>{const f=A.get(r.entityId);return f&&f.show_anomalies===!0&&Array.isArray(f.anomaly_methods)&&f.anomaly_methods.length>0}).map(r=>r.entityId);if(j.length>0){const r=j.map(f=>{const p=this._backendAnomalyByEntity.get(f);return p?{entityId:f,anomalyClusters:p.clusters}:null}).filter(Boolean);bt.anomalySeries=r}if(n.drawRequestId&&n.drawRequestId!==this._drawRequestId)return;h&&(h.style.display=""),w?.querySelectorAll(".split-series-row").forEach(r=>r.remove()),w?.querySelector("#chart-split-overlay")?.remove();const y=this.querySelector("#chart-axis-left"),m=this.querySelector("#chart-axis-right");y&&(y.style.display=""),m&&(m.style.display="");let v;_.length?v=280:C.length?v=100:v=280;const E=this._getAvailableChartHeight(v),st=Math.max(c?.clientWidth||d?.clientWidth||360,360),Ct=Math.max(1,o-i),Xt=this._zoomRange?Math.max(1,this._zoomRange.end-this._zoomRange.start):null,J=Xt?Ct/Xt:1,x=ie(J,1,Ai),k=Math.min(Si,Xt?Math.max(st,Math.round(st*x)):st);if(this._config?.split_view===!0&&V.length>=2){u&&(u.hidden=!this._zoomRange,u.onclick=()=>this._clearZoomRange()),this._renderLegend(_,C),await this._drawSplitChart({visibleSeries:V,binaryBackgrounds:C,events:s,renderT0:i,renderT1:o,canvasWidth:k,availableHeight:E,chartStage:w,canvas:h,wrap:d,options:n,drawableComparisonResults:N,selectedComparisonWindowId:it,hoveredComparisonWindowId:D,comparisonPreviewActive:q,hoveringDifferentComparison:At,analysisResult:bt,analysisMap:A,hasSelectedComparisonWindow:ct}),this._chartScrollViewportEl&&(this._chartScrollViewportEl.removeEventListener("scroll",this._onChartScroll),this._chartScrollViewportEl.addEventListener("scroll",this._onChartScroll,{passive:!0}),this._syncChartViewportScroll(i,o,k)),this._fireBackendAnomalyRequests(j,A,F,mt);return}w&&(w.style.width=`${k}px`,w.style.height=`${E}px`),c&&(c.style.overflowY="");const{w:at,h:dt}=Ee(h,w||d,E,k),W=new Re(h,at,dt);W.labelColor=Le(this),W.clear();const Z=i,O=o,pt=new Map((bt?.trendSeries||[]).map(r=>[r.entityId,r.pts])),Et=new Map((bt?.rateSeries||[]).map(r=>[r.entityId,r.pts])),zt=new Map((bt?.deltaSeries||[]).map(r=>[r.entityId,r.pts])),Ft=new Map((bt?.summaryStats||[]).map(r=>[r.entityId,r])),qt=new Map((bt?.anomalySeries||[]).map(r=>[r.entityId,r.anomalyClusters])),Dt=new Set,Ut=new Set;V.forEach(r=>{const f=A.get(r.entityId)||nt(null);this._seriesShouldHideSource(f,ct)&&Dt.add(r.entityId),f.hide_source_series===!0&&f.show_delta_analysis===!0&&ct&&Ut.add(r.entityId)});const Yt=V.some(r=>{const f=A.get(r.entityId)||nt(null);return f.show_trend_lines===!0&&f.show_trend_crosshairs===!0}),et=V.some(r=>{const f=A.get(r.entityId)||nt(null);return f.show_rate_of_change===!0&&f.show_rate_crosshairs===!0});this._setChartLoading(!!n.loading),this._setChartMessage(""),u&&(u.hidden=!this._zoomRange,u.onclick=()=>this._clearZoomRange());const L=new Map;if(this._adjustComparisonAxisScale||G){for(const r of N)if(!(G&&D&&r.id!==D))for(const f of P){const p=f.entity_id;if(p.split(".")[0]==="binary_sensor"||this._hiddenSeries.has(p))continue;const I=this._hass?.states?.[p]?.attributes?.unit_of_measurement||"",T=tt?`${I||"__unitless__"}::${p}`:I||"__unitless__",X=A.get(p)||nt(null),lt=await this._resolveComparisonWindowPoints(p,r,X,Z,O);for(const[,_t]of lt)L.has(T)||L.set(T,[]),L.get(T).push(_t)}}const R=new Map,ut=new Map;V.forEach(r=>{const f=A.get(r.entityId)||nt(null);if(f.show_delta_analysis===!0&&ct&&f.show_delta_lines===!0){const p=zt.get(r.entityId)||[];if(p.length){const I=`delta:${r.axisKey}`,T=r.unit?`Δ ${r.unit}`:"Δ";let X=R.get(I);X||(X={key:I,unit:T,color:r.color,side:"right",values:[]},R.set(I,X)),p.forEach(lt=>{X.values.push(lt[1])})}}if(f.show_rate_of_change===!0){const p=Et.get(r.entityId)||[];if(p.length){const I=`rate:${r.axisKey}`,T=r.unit?`${r.unit}/h`:"Rate/h";let X=ut.get(I);X||(X={key:I,unit:T,color:r.color,side:"right",values:[]},ut.set(I,X)),p.forEach(lt=>{X.values.push(lt[1])})}}});const ot=g.filter(r=>r.values.length).map(r=>{const f=_.filter(lt=>lt.axisKey===r.key).flatMap(lt=>lt.pts.map(_t=>_t[1]));(this._adjustComparisonAxisScale||G)&&L.has(r.key)&&f.push(...L.get(r.key));const p=this._getAxisValueExtent(f);if(!p)return null;const{min:I,max:T}=p,X=(T-I)*.1||1;return{key:r.key,unit:r.unit,color:r.color,side:r.side==="right"?"right":"left",min:I-X,max:T+X}}).filter(r=>r!==null),xt=Array.from(R.values()).filter(r=>r.values.length).map(r=>{const f=this._getAxisValueExtent(r.values);if(!f)return null;const{min:p,max:I}=f,T=(I-p)*.1||1;return{key:r.key,unit:r.unit,color:r.color,side:r.side==="right"?"right":"left",min:p-T,max:I+T}}).filter(r=>r!==null),Tt=Array.from(ut.values()).filter(r=>r.values.length).map(r=>{const f=this._getAxisValueExtent(r.values);if(!f)return null;const{min:p,max:I}=f,T=(I-p)*.1||1;return{key:r.key,unit:r.unit,color:r.color,side:r.side==="right"?"right":"left",min:p-T,max:I+T}}).filter(r=>r!==null),z=ot.length||xt.length?[...ot,...xt,...Tt]:[{key:"binary",min:0,max:1,side:"left",unit:"",color:null}];W.drawGrid(Z,O,z,void 0,5,{fixedAxisOverlay:!0}),this._renderComparisonPreviewOverlay(W);const H=ot.length?W._activeAxes||[]:[],Q=new Map(H.map(r=>[r.key,r]));_.forEach(r=>{r.axis=Q.get(r.axisKey)||H[0]||ot[0]}),qe(this,W,H),this.style.setProperty("--dp-chart-axis-bottom-height",`${Math.max(0,W.pad.bottom)}px`),C.forEach(r=>{r?.spans?.length&&!this._hiddenSeries.has(r.entityId)&&W.drawStateBands(r.spans,Z,O,r.color,.12)});const Rt=this._config?.show_correlated_anomalies===!0||this._config?.anomaly_overlap_mode==="only",b=this._config?.show_correlated_anomalies===!0,K=Rt?this._buildCorrelatedAnomalySpans(V,qt,A):[];b&&K.length&&W.drawStateBands(K,Z,O,"#ef4444",.1);let B=!1,rt;q?At?rt=.15:rt=.25:rt=1;const $=Dt.size>0,St=V.filter(r=>!Dt.has(r.entityId)).map(r=>({...r,hoverOpacity:rt})),Wt=V.flatMap(r=>{if((A.get(r.entityId)||nt(null)).show_summary_stats!==!0)return[];const p=Ft.get(r.entityId)||null;if(!p)return[];const I=r;return[{entityId:`summary:min:${r.entityId}`,relatedEntityId:r.entityId,label:r.label,baseLabel:r.label,unit:r.unit||"",value:p.min,color:U(r.color,$?.94:.78),baseColor:r.color,axis:I.axis,hoverOpacity:$?.94:.72,summaryType:"min",summary:!0},{entityId:`summary:mean:${r.entityId}`,relatedEntityId:r.entityId,label:r.label,baseLabel:r.label,unit:r.unit||"",value:p.mean,color:U(r.color,$?.94:.78),baseColor:r.color,axis:I.axis,hoverOpacity:$?.94:.72,summaryType:"mean",summary:!0},{entityId:`summary:max:${r.entityId}`,relatedEntityId:r.entityId,label:r.label,baseLabel:r.label,unit:r.unit||"",value:p.max,color:U(r.color,$?.94:.78),baseColor:r.color,axis:I.axis,hoverOpacity:$?.94:.72,summaryType:"max",summary:!0}]}),$t=V.flatMap(r=>{const f=A.get(r.entityId)||nt(null);if(f.show_threshold_analysis!==!0)return[];const p=f.threshold_value,I=Number(p);if(!Number.isFinite(I))return[];const T=r;return[{entityId:`threshold:${r.entityId}`,relatedEntityId:r.entityId,label:r.label,baseLabel:r.label,unit:r.unit||"",value:I,baseColor:r.color,color:U(r.color,$?.82:.46),axis:T.axis,hoverOpacity:$?.84:.48,direction:f.threshold_direction==="below"?"below":"above",threshold:!0}]}),ne=V.map(r=>({...r,trendPts:pt.get(r.entityId)||[]})).filter(r=>Array.isArray(r.trendPts)&&r.trendPts.length>=2),ye=V.map(r=>{const f=Et.get(r.entityId)||[];if(!Array.isArray(f)||f.length<2)return null;const p=Q.get(`rate:${r.axisKey}`);return p?{...r,ratePts:f,rateAxis:p}:null}).filter(r=>r!==null),ze=V.map(r=>{const f=qt.get(r.entityId)||[];return!Array.isArray(f)||f.length===0?null:{...r,anomalyClusters:f}}).filter(r=>r!==null),He=[],Ne=[],Fe=[],We=[],Be=[],Ce=[];for(const r of N)for(const f of P){const p=f.entity_id;if(p.split(".")[0]==="binary_sensor"||this._hiddenSeries.has(p))continue;const I=A.get(p)||nt(null),T=await this._resolveComparisonWindowPoints(p,r,I,Z,O);if(!T.length)continue;const X=this._hass?.states?.[p]?.attributes?.unit_of_measurement||"",lt=tt?`${X||"__unitless__"}::${p}`:X||"__unitless__",_t=Q.get(lt);if(!_t)continue;!this._adjustComparisonAxisScale&&!G&&T.some(Ht=>Ht[1]<_t.min||Ht[1]>_t.max)&&(B=!0);const Lt=f.color||te[P.indexOf(f)%te.length],Pt=!!D&&r.id===D,Gt=!!it&&r.id===it,Ot=this._getComparisonWindowLineStyle(Pt,Gt,At);if(He.push({entityId:`${r.id}:${p}`,relatedEntityId:p,label:f.label||Bt(this._hass,p)||p,windowLabel:r.label||"Date window",unit:X,pts:T,color:Lt,axis:_t,hoverOpacity:Ot.hoverOpacity}),I.show_trend_lines===!0&&T.length>=2){const Ht=this._analysisCache?.result?.comparisonWindowResults?.[r.id]?.[p]?.trendPts??this._buildTrendPoints(T,I.trend_method,I.trend_window);if(Ht.length>=2){const jt=this._getTrendRenderOptions(I.trend_method,!1);Ne.push({entityId:`trend:${r.id}:${p}`,relatedEntityId:p,comparisonParentId:`${r.id}:${p}`,label:f.label||Bt(this._hass,p)||p,baseLabel:f.label||Bt(this._hass,p)||p,windowLabel:r.label||"Date window",unit:X,pts:Ht,color:U(Lt,Math.max(.3,jt.colorAlpha-.18)),axis:_t,rawVisible:!0,hoverOpacity:Math.max(.3,jt.lineOpacity-.18),trend:!0})}}if(I.show_rate_of_change===!0&&T.length>=2){const Ht=this._analysisCache?.result?.comparisonWindowResults?.[r.id]?.[p]?.ratePts??this._buildRateOfChangePoints(T,I.rate_window),jt=Q.get(`rate:${lt}`)||_t;Ht.length>=2&&Fe.push({entityId:`rate:${r.id}:${p}`,relatedEntityId:p,comparisonParentId:`${r.id}:${p}`,label:f.label||Bt(this._hass,p)||p,baseLabel:f.label||Bt(this._hass,p)||p,windowLabel:r.label||"Date window",unit:X?`${X}/h`:"/h",pts:Ht,color:U(Lt,.52),axis:jt,rawVisible:!0,hoverOpacity:.46,rate:!0})}if(I.show_summary_stats===!0){const Ht=this._analysisCache?.result?.comparisonWindowResults?.[r.id]?.[p]?.summaryStats??this._buildSummaryStats(T);[{type:"min",value:Ht.min},{type:"mean",value:Ht.mean},{type:"max",value:Ht.max}].forEach(jt=>{Number.isFinite(jt.value)&&We.push({entityId:`summary:${jt.type}:${r.id}:${p}`,relatedEntityId:p,comparisonParentId:`${r.id}:${p}`,label:f.label||Bt(this._hass,p)||p,baseLabel:f.label||Bt(this._hass,p)||p,windowLabel:r.label||"Date window",unit:X,value:jt.value,color:U(Lt,jt.type==="mean"?.44:.24),axis:_t,rawVisible:!0,hoverOpacity:jt.type==="mean"?.52:.3,summaryType:jt.type,summary:!0})})}if(I.show_threshold_analysis===!0){const Qt=Number(I.threshold_value);Number.isFinite(Qt)&&Be.push({entityId:`threshold:${r.id}:${p}`,relatedEntityId:p,comparisonParentId:`${r.id}:${p}`,label:f.label||Bt(this._hass,p)||p,baseLabel:f.label||Bt(this._hass,p)||p,windowLabel:r.label||"Date window",unit:X,value:Qt,color:U(Lt,.28),axis:_t,rawVisible:!0,hoverOpacity:.34,threshold:!0})}Ut.has(p)||W.drawLine(T,Lt,Z,O,_t.min,_t.max,{lineOpacity:Ot.lineOpacity,lineWidth:Ot.lineWidth,dashed:Ot.dashed,dashPattern:Ot.dashPattern,stepped:I.stepped_series===!0});const he=Q.get(`rate:${lt}`)||null;this._drawComparisonAnalysisOverlays({renderer:W,entityId:p,seriesColor:Lt,comparisonPts:T,analysis:I,renderT0:Z,renderT1:O,axis:_t,rateAxis:he,events:s,comparisonWindowId:r.id})}this._setAdjustAxisButtonVisibility(q&&B&&!this._adjustComparisonAxisScale&&!G);for(const r of V){if(Dt.has(r.entityId))continue;const f=r;this._drawSeriesLine(W,r.pts,r.color,Z,O,f.axis.min,f.axis.max,{lineOpacity:rt,lineWidth:this._config?.comparison_hover_active===!0?1.25:void 0,stepped:(A.get(r.entityId)||nt(null)).stepped_series===!0})}const ws=ne.map(r=>{const f=A.get(r.entityId)||nt(null),p=Dt.has(r.entityId),I=this._getTrendRenderOptions(f.trend_method,p),T=r;return{entityId:`trend:${r.entityId}`,relatedEntityId:r.entityId,label:r.label,baseLabel:r.label,unit:r.unit||"",pts:r.trendPts,color:U(r.color,I.colorAlpha),axis:T.axis,rawVisible:!p,showCrosshair:f.show_trend_crosshairs===!0,hoverOpacity:q?Math.max(.25,Math.min(.9,rt+.12)):I.lineOpacity,trend:!0}}),vs=ye.map(r=>({entityId:`rate:${r.entityId}`,relatedEntityId:r.entityId,label:r.label,baseLabel:r.label,unit:r.unit?`${r.unit}/h`:"/h",pts:r.ratePts,color:U(r.color,$?.9:.72),axis:r.rateAxis,rawVisible:!Dt.has(r.entityId),showCrosshair:(A.get(r.entityId)||nt(null)).show_rate_crosshairs===!0,hoverOpacity:$?.88:.66,rate:!0}));for(const r of ne){const f=A.get(r.entityId)||nt(null),p=this._getTrendRenderOptions(f.trend_method,Dt.has(r.entityId)),I=r;W.drawLine(r.trendPts,U(r.color,p.colorAlpha),Z,O,I.axis.min,I.axis.max,{lineOpacity:q?Math.max(.25,Math.min(.9,rt+.12)):p.lineOpacity,lineWidth:p.lineWidth,dashed:p.dashed,dotted:p.dotted})}for(const r of ye)W.drawLine(r.ratePts,U(r.color,$?.96:.82),Z,O,r.rateAxis.min,r.rateAxis.max,{lineOpacity:$?.88:.66,lineWidth:1.55,dashed:!1,dotted:!1,dashPattern:[7,3,1.5,3]});for(const r of V){const f=A.get(r.entityId)||nt(null);if(!(f.show_delta_analysis===!0&&ct===!0))continue;const p=Q.get(`delta:${r.axisKey}`);if(!p)continue;const I=zt.get(r.entityId)||[];I.length&&(f.show_delta_tooltip===!0&&Ce.push({entityId:`delta:${r.entityId}`,relatedEntityId:r.entityId,label:r.label,baseLabel:r.label,unit:r.unit||"",pts:I,color:U(r.color,.92),axis:p,rawVisible:!Dt.has(r.entityId),hoverOpacity:.82,delta:!0}),f.show_delta_lines===!0&&W.drawLine(I,U(r.color,.92),Z,O,p.min,p.max,{lineOpacity:.82,lineWidth:1.9,dashed:!0}))}if(V.forEach(r=>{const f=A.get(r.entityId)||nt(null);if(f.show_summary_stats!==!0||f.show_summary_stats_shading!==!0)return;const p=Ft.get(r.entityId),T=r.axis;if(!p||!T||!Number.isFinite(p.min)||!Number.isFinite(p.max)||!Number.isFinite(p.mean))return;const X=$?.1:.06;W.drawGradientBand(p.min,p.mean,r.color,Z,O,T.min,T.max,{fillAlpha:X}),W.drawGradientBand(p.max,p.mean,r.color,Z,O,T.min,T.max,{fillAlpha:X})}),Wt.forEach(r=>{const f=r.axis;f&&W.drawLine([[Z,r.value],[O,r.value]],r.color,Z,O,f.min,f.max,{lineOpacity:r.hoverOpacity,lineWidth:1.8,dashed:!1,dotted:!1})}),$t.forEach(r=>{const f=r.axis;if(!f)return;if((A.get(r.relatedEntityId)||nt(null)).show_threshold_shading===!0){const I=V.find(T=>T.entityId===r.relatedEntityId);I?.pts?.length&&W.drawThresholdArea(I.pts,r.value,r.baseColor||I.color,Z,O,f.min,f.max,{mode:r.direction==="below"?"below":"above",fillAlpha:$?.24:.14})}W.drawLine([[Z,r.value],[O,r.value]],r.color,Z,O,f.min,f.max,{lineOpacity:r.hoverOpacity,lineWidth:1.15})}),ze.length){const r=[];ze.forEach(f=>{const I=f.axis;if(!I)return;const T=this._filterAnnotatedAnomalyClusters(f,s);if(T.length===0)return;const X=(A.get(f.entityId)||nt(null)).anomaly_overlap_mode,{baseClusters:lt,regionClusters:_t}=this._resolveAnomalyClusterDisplay(T,X,K),Lt=U(f.color,$?.96:.86),Pt={strokeAlpha:$?.98:.9,lineWidth:$?2.5:2.1,haloWidth:$?5.5:4.8,haloColor:"rgba(255,255,255,0.88)",haloAlpha:$?.92:.82,fillColor:U(f.color,$?.14:.1),fillAlpha:1,pointPadding:$?12:10,minRadiusX:10,minRadiusY:10};lt.length>0&&W.drawAnomalyClusters(lt,Lt,Z,O,I.min,I.max,Pt),W.getAnomalyClusterRegions(_t,Z,O,I.min,I.max,Pt).forEach(Ot=>{const he=A.get(f.entityId)||nt(null);r.push({...Ot,relatedEntityId:f.entityId,label:String(f.label),unit:String(f.unit||""),color:f.color||null,sensitivity:he.anomaly_sensitivity})})}),this._lastAnomalyRegions=r}else this._lastAnomalyRegions=[];const bs=He.filter(r=>!Ut.has(r.relatedEntityId||r.entityId));W.drawAnnotations(l,Z,O,{showLines:this._config.show_event_lines!==!1,showMarkers:this._config.show_event_lines!==!1});const xs=this._drawRecordedEventPoints(W,V,l,Z,O,{showIcons:this._config.show_event_markers!==!1});this._renderLegend(_,C);const Ss=new Map(xs.map(r=>[r.event.id,r])),As=l.map(r=>{const f=Ss.get(r.id||"");return f?{...r,chart_value:f.value,chart_unit:f.unit}:r}),we=this.querySelector("#chart-add-annotation");we&&(we.dataset.allowAddAnnotation=this._config.show_add_annotation_button===!1?"false":"true",we.dataset.allowAddAnnotation==="false"&&(we.hidden=!0)),V.length?(this._ensureContextAnnotationDialog(),ei(this,h,W,St,As,Z,O,0,0,H,{onContextMenu:r=>this._handleChartContextMenu(r),onAddAnnotation:this._config.show_add_annotation_button===!1?void 0:r=>this._handleChartAddAnnotation(r),binaryStates:C.filter(r=>!this._hiddenSeries.has(r.entityId)),comparisonSeries:bs,trendSeries:[...ws,...Ne],rateSeries:[...vs,...Fe],deltaSeries:Ce,summarySeries:[...Wt,...We],thresholdSeries:[...$t,...Be],anomalyRegions:Array.isArray(this._lastAnomalyRegions)?this._lastAnomalyRegions:[],hoverSurfaceEl:this.querySelector("#chart-icon-overlay"),showTooltip:this._config.show_tooltips!==!1,emphasizeHoverGuides:this._config.emphasize_hover_guides===!0,hoverSnapMode:this._config.hover_snap_mode==="snap_to_data_points"?"snap_to_data_points":"follow_series",showTrendCrosshairs:Yt,showRateCrosshairs:et,hideRawData:Dt.size===V.length&&V.length>0,showDeltaTooltip:Ce.length>0,onAnomalyClick:r=>this._handleAnomalyAddAnnotation(r)}),si(this,h,W,Z,O,{onPreview:r=>this._dispatchZoomPreview(r),onZoom:({startTime:r,endTime:f})=>this._applyZoomRange(r,f),onReset:()=>this._clearZoomRange()})):(this._chartHoverCleanup&&(this._chartHoverCleanup(),this._chartHoverCleanup=null),this._chartZoomCleanup&&(this._chartZoomCleanup(),this._chartZoomCleanup=null)),this._chartScrollViewportEl&&(this._chartScrollViewportEl.removeEventListener("scroll",this._onChartScroll),this._chartScrollViewportEl.addEventListener("scroll",this._onChartScroll,{passive:!0}),this._syncChartViewportScroll(i,o,at)),this._fireBackendAnomalyRequests(j,A,F,mt),this._fireComparisonBackendAnomalyRequests(N,A,Z,O)}_buildAnalysisCacheKey(t,e,s,i,o,n){const l=["show_trend_lines","trend_method","trend_window","show_rate_of_change","rate_window","show_delta_analysis","show_summary_stats","show_anomalies","anomaly_methods","anomaly_sensitivity","anomaly_overlap_mode","anomaly_rate_window","anomaly_zscore_window","anomaly_persistence_window","anomaly_comparison_window_id","anomaly_use_sampled_data"],h=t.map(c=>{const w=s.get(c.entityId)||nt(null),_=c.pts[0]?.[0]??0,g=c.pts[c.pts.length-1]?.[0]??0,S=l.map(C=>JSON.stringify(w[C])).join(",");return`${c.entityId}:${c.pts.length}:${_}:${g}:${S}`}).join("|"),u=Array.from(e.values()).map(c=>{const w=c.pts[0]?.[0]??0,_=c.pts[c.pts.length-1]?.[0]??0;return`${c.entityId}:${c.pts.length}:${w}:${_}`}).sort().join("|"),d=Object.entries(i).flatMap(([c,w])=>Object.entries(w).map(([_,g])=>{const S=g[0]?.[0]??0,C=g[g.length-1]?.[0]??0;return`${c}:${_}:${g.length}:${S}:${C}`})).sort().join("|");return`${o}:${n}|${h}|${u}|${d}`}_buildHistoryAnalysisPayload(t,e,s,i,o={}){const n=nt(null),l=t.map(d=>({entityId:d.entityId,pts:d.pts,analysis:s.get(d.entityId)||n})),h=Array.from(e.values()).map(d=>({entityId:d.entityId,pts:d.pts})),u={};for(const d of t)u[d.entityId]=s.get(d.entityId)||n;return{series:l,comparisonSeries:h,hasSelectedComparisonWindow:i===!0,allComparisonWindowsData:o,seriesAnalysisConfigs:u}}async _computeHistoryAnalysis(t,e,s,i,o={},n=0,l=0,h=null){ri();const u=this._buildAnalysisCacheKey(t,e,s,o,n,l);if(this._analysisCache?.key===u)return this._analysisCache.result;h?.(0);const d=this._buildHistoryAnalysisPayload(t,e,s,i,o);try{const c=await li(d);return this._analysisCache={key:u,result:c},c}catch(c){const w=c?.message??"";if(w.startsWith("Aborted"))return{trendSeries:[],rateSeries:[],deltaSeries:[],summaryStats:[],anomalySeries:[]};kt.warn("[hass-datapoints history-card] analysis worker fallback",{message:w||String(c)});try{return{trendSeries:t.map(_=>{const g=s.get(_.entityId)||nt(null);return g.show_trend_lines!==!0?null:{entityId:_.entityId,pts:this._buildTrendPoints(_.pts,g.trend_method,g.trend_window)}}).filter(Boolean).filter(_=>Array.isArray(_.pts)&&_.pts.length>=2),rateSeries:t.map(_=>{const g=s.get(_.entityId)||nt(null);return g.show_rate_of_change!==!0?null:{entityId:_.entityId,pts:this._buildRateOfChangePoints(_.pts,g.rate_window)}}).filter(Boolean).filter(_=>Array.isArray(_.pts)&&_.pts.length>=2),deltaSeries:t.map(_=>{if(!((s.get(_.entityId)||nt(null)).show_delta_analysis===!0&&i===!0))return null;const S=e.get(_.entityId);return{entityId:_.entityId,pts:S?this._buildDeltaPoints(_.pts,S.pts):[]}}).filter(Boolean).filter(_=>Array.isArray(_.pts)&&_.pts.length>=2),summaryStats:t.map(_=>(s.get(_.entityId)||nt(null)).show_summary_stats!==!0?null:{entityId:_.entityId,...this._buildSummaryStats(_.pts)}).filter(_=>_&&Number.isFinite(_.min)&&Number.isFinite(_.max)&&Number.isFinite(_.mean)),anomalySeries:[]}}catch(_){return kt.error("[hass-datapoints history-card] analysis fallback failed",_),{trendSeries:[],rateSeries:[],deltaSeries:[],summaryStats:[],anomalySeries:[]}}}}_buildTrendPoints(t,e,s){return!Array.isArray(t)||t.length<2?[]:(e||"rolling_average")==="linear_trend"?_i(t):ui(t,ys(s||"24h"))}_buildRateOfChangePoints(t,e){return!Array.isArray(t)||t.length<2?[]:mi(t,e||"1h")}_buildDeltaPoints(t,e){return fi(t,e)}_buildSummaryStats(t){return gi(t)??{min:0,max:0,mean:0}}_getSeriesAnalysisMap(){const t=Array.isArray(this._config?.series_settings)?this._config.series_settings:[];return new Map(t.filter(e=>e?.entity_id!=null).map(e=>[e.entity_id,nt(e?.analysis)]))}_getSeriesAnalysis(t,e=null){const s=e||this._getSeriesAnalysisMap();return nt(s.get(t))}_seriesHasActiveAnalysis(t,e=!1){return!!(t.show_trend_lines||t.show_summary_stats||t.show_rate_of_change||t.show_threshold_analysis||t.show_anomalies||t.show_delta_analysis&&e)}_seriesShouldHideSource(t,e=!1){return t.hide_source_series===!0&&this._seriesHasActiveAnalysis(t,e)}_getTrendRenderOptions(t="rolling_average",e=!1){return t==="linear_trend"?{colorAlpha:e?.94:.88,lineOpacity:e?.86:.74,lineWidth:2.1,dashed:!0,dotted:!1}:{colorAlpha:e?.9:.82,lineOpacity:e?.84:.62,lineWidth:2.2,dashed:!1,dotted:!0}}async _drawSplitChart({visibleSeries:t,binaryBackgrounds:e,events:s,renderT0:i,renderT1:o,canvasWidth:n,availableHeight:l,chartStage:h,canvas:u,wrap:d,options:c,drawableComparisonResults:w,selectedComparisonWindowId:_,hoveredComparisonWindowId:g,comparisonPreviewActive:S,hoveringDifferentComparison:C,analysisResult:P,analysisMap:A,hasSelectedComparisonWindow:M}){u&&(u.style.display="none");const N=t.length,D=Math.max(140,Math.floor(l/N)),q=D*N;h&&(h.style.width=`${n}px`,h.style.height=`${q}px`);const tt=this.querySelector("#chart-scroll-viewport");tt&&(tt.style.overflowY=q>l?"auto":"hidden"),this._setChartLoading(!!c.loading),this._setChartMessage("");const G=this.querySelector("#chart-icon-overlay");G&&(G.innerHTML="");const At=new Map((P?.trendSeries||[]).map(j=>[j.entityId,j.pts])),ct=new Map((P?.rateSeries||[]).map(j=>[j.entityId,j.pts])),F=new Map((P?.deltaSeries||[]).map(j=>[j.entityId,j.pts])),mt=new Map((P?.summaryStats||[]).map(j=>[j.entityId,j])),V=new Map((P?.anomalySeries||[]).map(j=>[j.entityId,j.anomalyClusters])),ht=A||new Map,vt=this._config?.show_correlated_anomalies===!0||this._config?.anomaly_overlap_mode==="only",ft=this._config?.show_correlated_anomalies===!0,gt=vt?this._buildCorrelatedAnomalySpans(t,V,ht):[],Mt=[];for(let j=0;j<N;j+=1){const y=j===N-1,m=t[j],v=j*D,E=document.createElement("div");E.className="split-series-row",E.style.cssText=`position:absolute;left:0;top:${v}px;width:${n}px;height:${D}px;pointer-events:none;overflow:hidden;`;const st=document.createElement("canvas");st.className="split-series-canvas",E.appendChild(st),h?.appendChild(E);const{w:Ct,h:Xt}=Ee(st,h||d,D,n),J=new Re(st,Ct,Xt);J.labelColor=Le(this),J.basePad={top:24,right:12,bottom:y?48:10,left:12},J.clear();const x=ht.get(m.entityId)||nt(null),k=x.show_trend_lines===!0?At.get(m.entityId)||[]:[],at=x.show_rate_of_change===!0?ct.get(m.entityId)||[]:[],dt=x.show_delta_analysis===!0&&M?F.get(m.entityId)||[]:[],W=x.show_summary_stats===!0&&mt.get(m.entityId)||null,Z=x.show_anomalies===!0?V.get(m.entityId)||[]:[],O=this._seriesShouldHideSource(x,M),pt=m.pts.map(([,z])=>z),Et=this._getAxisValueExtent(pt);let zt=0,Ft=1;if(Et){const z=(Et.max-Et.min)*.1||1;zt=Et.min-z,Ft=Et.max+z}const qt=m.axisKey||m.unit||"__unitless__",Dt={key:qt,unit:String(m.unit||""),color:m.color||null,side:"left",min:zt,max:Ft,values:pt},Ut=[Dt];let Yt=null;if(at.length>=2){const z=at.map(([,Q])=>Q),H=this._getAxisValueExtent(z);if(H){const Q=(H.max-H.min)*.1||1;Yt=`rate:${qt}`,Ut.push({key:Yt,unit:m.unit?`${String(m.unit)}/h`:"Rate/h",color:m.color||null,side:"right",min:H.min-Q,max:H.max+Q,values:z})}}let et=null;if(dt.length>=2){const z=dt.map(([,Q])=>Q),H=this._getAxisValueExtent(z);if(H){const Q=(H.max-H.min)*.1||1;et=`delta:${qt}`,Ut.push({key:et,unit:m.unit?`Δ ${String(m.unit)}`:"Δ",color:m.color||null,side:"right",min:H.min-Q,max:H.max+Q,values:z})}}J.drawGrid(i,o,Ut,void 0,4,{fixedAxisOverlay:!0,hideTimeLabels:!y});const L=J._activeAxes,R=L?.[0]||Dt,ut=Yt&&L?.find(z=>z.key===Yt)||null,ot=et&&L?.find(z=>z.key===et)||null;m.axis=R;let xt;S?C?xt=.15:xt=.25:xt=1,O||this._drawSeriesLine(J,m.pts,m.color,i,o,R.min,R.max,{lineWidth:S?1.25:1.75,lineOpacity:xt,stepped:x.stepped_series===!0});for(const z of w||[]){const H=await this._resolveComparisonWindowPoints(m.entityId,z,x,i,o);if(!H.length)continue;const Q=!!g&&z.id===g,Rt=!!_&&z.id===_,b=this._getComparisonWindowLineStyle(Q,Rt,C);J.drawLine(H,m.color,i,o,R.min,R.max,{lineOpacity:b.lineOpacity,lineWidth:b.lineWidth,dashed:b.dashed,dashPattern:b.dashPattern,stepped:x.stepped_series===!0}),this._drawComparisonAnalysisOverlays({renderer:J,entityId:m.entityId,seriesColor:m.color,comparisonPts:H,analysis:x,renderT0:i,renderT1:o,axis:R,rateAxis:ut,events:s,comparisonWindowId:String(z.id||"")})}if(e.forEach(z=>{const H=z;!this._hiddenSeries.has(H.entityId)&&H.spans?.length&&J.drawStateBands(H.spans,i,o,H.color,.1)}),ft&&gt.length&&J.drawStateBands(gt,i,o,"#ef4444",.1),J.drawAnnotations(s,i,o,{showLines:this._config.show_event_lines!==!1,showMarkers:this._config.show_event_lines!==!1}),this._drawRecordedEventPoints(J,[m],s,i,o,{showIcons:this._config.show_event_markers!==!1,yOffset:v,skipOverlayClear:!0}),x.show_threshold_analysis===!0){const z=Number(x.threshold_value);Number.isFinite(z)&&(x.show_threshold_shading===!0&&m.pts.length&&J.drawThresholdArea(m.pts,z,m.color,i,o,R.min,R.max,{mode:x.threshold_direction==="below"?"below":"above",fillAlpha:O?.24:.14}),J.drawLine([[i,z],[o,z]],U(m.color,O?.82:.46),i,o,R.min,R.max,{lineOpacity:O?.84:.48,lineWidth:1.15}))}if(W){if(x.show_summary_stats_shading===!0){const H=O?.1:.06;J.drawGradientBand(W.min,W.mean,m.color,i,o,R.min,R.max,{fillAlpha:H}),J.drawGradientBand(W.max,W.mean,m.color,i,o,R.min,R.max,{fillAlpha:H})}const z=[{type:"min",value:W.min,alpha:O?.78:.42,width:1.1,dotted:!0},{type:"mean",value:W.mean,alpha:O?.94:.78,width:1.8,dotted:!1},{type:"max",value:W.max,alpha:O?.78:.42,width:1.1,dotted:!0}];for(const H of z)Number.isFinite(H.value)&&J.drawLine([[i,H.value],[o,H.value]],U(m.color,H.alpha),i,o,R.min,R.max,{lineOpacity:O?.82:.34,lineWidth:H.width,dotted:H.dotted})}if(k.length>=2){const z=this._getTrendRenderOptions(x.trend_method,O);J.drawLine(k,U(m.color,z.colorAlpha),i,o,R.min,R.max,{lineOpacity:z.lineOpacity,lineWidth:z.lineWidth,dashed:z.dashed,dotted:z.dotted})}at.length>=2&&ut&&J.drawLine(at,U(m.color,O?.96:.82),i,o,ut.min,ut.max,{lineOpacity:O?.88:.66,lineWidth:1.55,dashPattern:[7,3,1.5,3]}),dt.length>=2&&ot&&x.show_delta_lines===!0&&J.drawLine(dt,U(m.color,.92),i,o,ot.min,ot.max,{lineOpacity:.82,lineWidth:1.9,dashed:!0});let Tt=[];if(Z.length){const z=this._filterAnnotatedAnomalyClusters({entityId:m.entityId,anomalyClusters:Z},s);if(z.length>0){const{baseClusters:H,regionClusters:Q}=this._resolveAnomalyClusterDisplay(z,x.anomaly_overlap_mode,gt),Rt=U(m.color,O?.96:.86),b={strokeAlpha:O?.98:.9,lineWidth:O?2.5:2.1,haloWidth:O?5.5:4.8,haloColor:"rgba(255,255,255,0.88)",haloAlpha:O?.92:.82,fillColor:U(m.color,O?.14:.1),fillAlpha:1,pointPadding:O?12:10,minRadiusX:10,minRadiusY:10};H.length>0&&J.drawAnomalyClusters(H,Rt,i,o,R.min,R.max,b),Tt=J.getAnomalyClusterRegions(Q,i,o,R.min,R.max,b).map(K=>({...K,relatedEntityId:String(m.entityId),label:String(m.label),unit:String(m.unit||""),color:m.color||null,sensitivity:String(x.anomaly_sensitivity||"")}))}}Mt.push({canvas:st,renderer:J,series:m,axis:R,rowOffset:v,analysis:x,summaryStats:W,trendPts:k,ratePts:at,rateAxis:ut,deltaPts:dt,deltaAxis:ot,anomalyRegions:Tt})}this._renderSplitAxisOverlays(Mt),this._renderComparisonPreviewOverlay(Mt[0]?Mt[0].renderer:null);const bt=[];for(const j of Mt){const y=j.series,m=j.analysis||nt(null);for(const v of w||[]){const E=await this._resolveComparisonWindowPoints(y.entityId,v,m,i,o);if(!E.length)continue;const st=!!g&&v.id===g,Ct=!!_&&v.id===_,Xt=this._getComparisonWindowLineStyle(st,Ct,C),J=String(v.id||""),x=this._analysisCache?.result?.comparisonWindowResults?.[J]?.[y.entityId];bt.push({entityId:`${J}:${y.entityId}`,relatedEntityId:y.entityId,comparisonParentId:`${J}:${y.entityId}`,label:y.label,windowLabel:v.label||"Date window",unit:y.unit,pts:E,trendPts:m.show_trend_lines===!0&&E.length>=2?x?.trendPts??this._buildTrendPoints(E,m.trend_method,m.trend_window):[],ratePts:m.show_rate_of_change===!0&&E.length>=2?x?.ratePts??this._buildRateOfChangePoints(E,m.rate_window):[],summaryStats:m.show_summary_stats===!0?x?.summaryStats??this._buildSummaryStats(E):null,thresholdValue:m.show_threshold_analysis===!0?Number(m.threshold_value):null,color:y.color,hoverOpacity:Xt.hoverOpacity,track:j})}}this._attachSplitHover(Mt,bt,s,i,o,h,c,ht,M),this._fireComparisonBackendAnomalyRequests(w,ht,i,o)}_attachSplitHover(t,e,s,i,o,n,l,h,u){if(this._chartHoverCleanup&&(this._chartHoverCleanup(),this._chartHoverCleanup=null),!t.length||!n)return;const d=t[0].renderer,c=t[t.length-1],w=d.cw?14*((o-i)/d.cw):0,_=t[0].rowOffset+d.pad.top,S=c.rowOffset+c.renderer.pad.top+c.renderer.ch-_,C=document.createElement("div");C.id="chart-split-overlay",C.style.cssText="position:absolute;inset:0;pointer-events:auto;z-index:2;cursor:crosshair;",n.appendChild(C);const P=m=>{const v=C.getBoundingClientRect();return ie(m-v.left,d.pad.left,d.pad.left+d.cw)},A=m=>{const v=d.cw?(m-d.pad.left)/d.cw:0;return i+v*(o-i)},M=m=>{const v=C.getBoundingClientRect(),E=m-v.left;return E>=d.pad.left&&E<=d.pad.left+d.cw},N=m=>{const v=t[0].canvas.getBoundingClientRect();if(!v.width||!d.cw)return null;const st=(ie(m-v.left,d.pad.left,d.pad.left+d.cw)-d.pad.left)/d.cw,Ct=i+st*(o-i),Xt=this._config.hover_snap_mode==="snap_to_data_points"?"snap_to_data_points":"follow_series",J=t.map(et=>({pts:et.series?.pts||[]})),x=ps(J,Ct,Xt),k=d.xOf(x,i,o),at=t.map(et=>{const{renderer:L,series:R,axis:ut,rowOffset:ot}=et,xt=L._interpolateValue(R.pts,x);return xt==null?{entityId:String(R.entityId||""),label:String(R.label||""),value:null,unit:String(R.unit||""),color:String(R.color||""),opacity:1,hasValue:!1,axisSide:"left",axisSlot:0}:{entityId:String(R.entityId||""),label:String(R.label||""),value:xt,unit:String(R.unit||""),color:String(R.color||""),opacity:1,hasValue:!0,x:k,y:ot+L.yOf(xt,ut.min,ut.max),axisSide:"left",axisSlot:0}}),dt=[];for(const et of s||[]){const L=new Date(et.timestamp).getTime();if(L<i||L>o)continue;const R=Math.abs(L-x);R<=w&&dt.push({...et,_hoverDistanceMs:R})}dt.sort((et,L)=>(et._hoverDistanceMs||0)-(L._hoverDistanceMs||0));const W=(e||[]).map(et=>{const{pts:L,entityId:R,relatedEntityId:ut,comparisonParentId:ot,label:xt,windowLabel:Tt,unit:z,color:H,hoverOpacity:Q,track:Rt}=et,b=Rt.renderer._interpolateValue(L,x);return b==null?{entityId:String(R||""),label:String(xt||""),value:null,unit:String(z||""),color:H,opacity:Number(Q)||1,hasValue:!1,axisSide:"left",axisSlot:0}:{entityId:String(R||""),relatedEntityId:String(ut||""),comparisonParentId:String(ot||""),label:String(xt||""),windowLabel:String(Tt||""),value:b,unit:String(z||""),color:H,opacity:Number(Q)||1,hasValue:!0,x:k,y:Rt.rowOffset+Rt.renderer.yOf(b,Rt.axis.min,Rt.axis.max),axisSide:"left",axisSlot:0}}),Z=[],O=[],pt=[],Et=[],zt=[],Ft=[];let qt=!1,Dt=!1;for(const et of t){const{renderer:L,series:R,axis:ut,rowOffset:ot,analysis:xt,summaryStats:Tt,trendPts:z,ratePts:H,rateAxis:Q,deltaPts:Rt,deltaAxis:b,anomalyRegions:K}=et,B=xt||(h||new Map).get(R.entityId)||nt(null),rt=this._seriesShouldHideSource(B,u);if(B.show_trend_lines===!0&&Array.isArray(z)&&z.length>=2){B.show_trend_crosshairs===!0&&(qt=!0);const $=this._getTrendRenderOptions(B.trend_method,rt),St=L._interpolateValue(z,x);Z.push({entityId:`trend:${R.entityId}`,relatedEntityId:String(R.entityId||""),label:String(R.label||""),baseLabel:String(R.label||""),unit:String(R.unit||""),color:U(R.color,$.colorAlpha),opacity:$.lineOpacity,hasValue:St!=null,value:St??null,...St!=null?{x:k,y:ot+L.yOf(St,ut.min,ut.max)}:{},axisSide:"left",axisSlot:0,trend:!0,rawVisible:!rt,showCrosshair:B.show_trend_crosshairs===!0})}if(B.show_rate_of_change===!0&&Array.isArray(H)&&H.length>=2&&Q){B.show_rate_crosshairs===!0&&(Dt=!0);const $=L._interpolateValue(H,x);O.push({entityId:`rate:${R.entityId}`,relatedEntityId:String(R.entityId||""),label:String(R.label||""),baseLabel:String(R.label||""),unit:R.unit?`${String(R.unit)}/h`:"/h",color:U(R.color,rt?.96:.82),opacity:rt?.88:.66,hasValue:$!=null,value:$??null,...$!=null?{x:k,y:ot+L.yOf($,Q.min,Q.max)}:{},axisSide:"right",axisSlot:0,rate:!0,rawVisible:!rt,showCrosshair:B.show_rate_crosshairs===!0})}if(B.show_delta_analysis===!0&&B.show_delta_tooltip===!0&&Array.isArray(Rt)&&Rt.length>=2&&b){const $=L._interpolateValue(Rt,x);pt.push({entityId:`delta:${R.entityId}`,relatedEntityId:String(R.entityId||""),label:String(R.label||""),baseLabel:String(R.label||""),unit:String(R.unit||""),color:U(R.color,.92),opacity:.82,hasValue:$!=null,value:$??null,...$!=null?{x:k,y:ot+L.yOf($,b.min,b.max)}:{},axisSide:"right",axisSlot:0,delta:!0,rawVisible:!rt})}if(B.show_summary_stats===!0&&Tt){const $=[{type:"min",value:Tt.min,alphaV:rt?.94:.78,opac:rt?.94:.72},{type:"mean",value:Tt.mean,alphaV:rt?.94:.78,opac:rt?.94:.72},{type:"max",value:Tt.max,alphaV:rt?.94:.78,opac:rt?.94:.72}];for(const St of $)Number.isFinite(St.value)&&Et.push({entityId:`summary:${St.type}:${R.entityId}`,relatedEntityId:String(R.entityId||""),label:String(R.label||""),baseLabel:String(R.label||""),unit:String(R.unit||""),color:U(R.color,St.alphaV),opacity:St.opac,hasValue:!0,value:St.value,axisSide:"left",axisSlot:0,summaryType:St.type,summary:!0,rawVisible:!rt})}if(B.show_threshold_analysis===!0){const $=Number(B.threshold_value);Number.isFinite($)&&zt.push({entityId:`threshold:${R.entityId}`,relatedEntityId:String(R.entityId||""),label:String(R.label||""),baseLabel:String(R.label||""),unit:String(R.unit||""),color:U(R.color,rt?.82:.46),opacity:rt?.84:.48,hasValue:!0,value:$,axisSide:"left",axisSlot:0,threshold:!0,rawVisible:!rt})}if(Array.isArray(K))for(const $ of K){const St=$?.cluster?$.cluster?.points:void 0,Wt=St?.[0]?St[0]?.timeMs??$.startTime:$.startTime,$t=St?.length?St[St.length-1]?.timeMs??$.endTime:$.endTime;Number.isFinite(Wt)&&Number.isFinite($t)&&x>=Wt&&x<=$t&&Ft.push($)}}for(const et of e){const L=et,R=L.track,ut=R.renderer,ot=R.axis,xt=R.rateAxis||null,Tt=R.rowOffset,z=Array.isArray(L.trendPts)?L.trendPts:[];if(z.length>=2){const b=ut._interpolateValue(z,x);Z.push({entityId:`trend:${L.entityId}`,relatedEntityId:String(L.relatedEntityId||""),comparisonParentId:String(L.comparisonParentId||""),label:String(L.label||""),baseLabel:String(L.label||""),windowLabel:String(L.windowLabel||"Date window"),unit:String(L.unit||""),color:U(L.color,.34),opacity:.34,hasValue:b!=null,value:b??null,...b!=null?{x:k,y:Tt+ut.yOf(b,ot.min,ot.max)}:{},axisSide:"left",axisSlot:0,trend:!0,rawVisible:!0,comparisonDerived:!0})}const H=Array.isArray(L.ratePts)?L.ratePts:[];if(H.length>=2&&xt){const b=ut._interpolateValue(H,x);O.push({entityId:`rate:${L.entityId}`,relatedEntityId:String(L.relatedEntityId||""),comparisonParentId:String(L.comparisonParentId||""),label:String(L.label||""),baseLabel:String(L.label||""),windowLabel:String(L.windowLabel||"Date window"),unit:L.unit?`${String(L.unit)}/h`:"/h",color:U(L.color,.46),opacity:.46,hasValue:b!=null,value:b??null,...b!=null?{x:k,y:Tt+ut.yOf(b,xt.min,xt.max)}:{},axisSide:"right",axisSlot:0,rate:!0,rawVisible:!0,comparisonDerived:!0,showCrosshair:h.get(String(L.relatedEntityId||""))?.show_rate_crosshairs===!0})}const Q=L.summaryStats;Q&&[{type:"min",value:Q.min},{type:"mean",value:Q.mean},{type:"max",value:Q.max}].forEach(b=>{Number.isFinite(b.value)&&Et.push({entityId:`summary:${b.type}:${L.entityId}`,relatedEntityId:String(L.relatedEntityId||""),comparisonParentId:String(L.comparisonParentId||""),label:String(L.label||""),baseLabel:String(L.label||""),windowLabel:String(L.windowLabel||"Date window"),unit:String(L.unit||""),color:U(L.color,b.type==="mean"?.44:.24),opacity:b.type==="mean"?.52:.3,hasValue:!0,value:b.value,axisSide:"left",axisSlot:0,summaryType:b.type,summary:!0,rawVisible:!0,comparisonDerived:!0})});const Rt=Number(L.thresholdValue);Number.isFinite(Rt)&&zt.push({entityId:`threshold:${L.entityId}`,relatedEntityId:String(L.relatedEntityId||""),comparisonParentId:String(L.comparisonParentId||""),label:String(L.label||""),baseLabel:String(L.label||""),windowLabel:String(L.windowLabel||"Date window"),unit:String(L.unit||""),color:U(L.color,.28),opacity:.34,hasValue:!0,value:Rt,axisSide:"left",axisSlot:0,threshold:!0,rawVisible:!0,comparisonDerived:!0})}const Ut=t.every(et=>{const L=et.analysis||(h||new Map).get(et.series.entityId)||nt(null);return this._seriesShouldHideSource(L,u)}),Yt=at.find(et=>et.hasValue===!0);return{x:k,y:Yt?.y??_+12,timeMs:x,rangeStartMs:x,rangeEndMs:x,values:at.filter(et=>et.hasValue===!0),trendValues:Z,rateValues:O,deltaValues:pt,summaryValues:Et,thresholdValues:zt,comparisonValues:W.filter(et=>et.hasValue===!0),binaryValues:[],primary:Yt??null,event:dt.length>0?(({_hoverDistanceMs:et,...L})=>L)(dt[0]):null,events:dt.map(({_hoverDistanceMs:et,...L})=>L),anomalyRegions:Ft,emphasizeGuides:l.emphasizeHoverGuides===!0,showTrendCrosshairs:qt,showRateCrosshairs:Dt,hideRawData:Ut,splitVertical:{top:_,height:S}}},it=(m,v)=>{if(this._chartZoomDragging)return;const E=N(m);if(!E){this._chartLastHover=null,ce(this),C.style.cursor="default";return}this._chartLastHover=E,Oe(this,d,E),this._config.show_tooltips!==!1?Pe(this,E,m,v):be(this),xe(this,E),C.style.cursor="crosshair"},D=()=>{this._chartLastHover=null,ce(this)},q=m=>it(m.clientX,m.clientY),tt=m=>{const v=m.relatedTarget,E=this.querySelector("#chart-add-annotation");v&&E instanceof HTMLElement&&E.contains(v)||D()},G=m=>{m.touches.length===1&&it(m.touches[0].clientX,m.touches[0].clientY)},At=()=>D(),ct=m=>{if(this._chartZoomDragging)return;const E=this._chartLastHover?.anomalyRegions;E?.length&&(m.preventDefault(),m.stopPropagation(),this._handleAnomalyAddAnnotation(E))};C.addEventListener("mousemove",q),C.addEventListener("mouseleave",tt),C.addEventListener("touchmove",G,{passive:!0}),C.addEventListener("touchend",At),C.addEventListener("click",ct),this._chartHoverCleanup=()=>{C.removeEventListener("mousemove",q),C.removeEventListener("mouseleave",tt),C.removeEventListener("touchmove",G),C.removeEventListener("touchend",At),C.removeEventListener("click",ct)};const F=this.querySelector("#chart-zoom-selection"),mt=()=>{F&&(F.hidden=!0,F.classList.remove("visible"))},V=(m,v)=>{if(!F)return;const E=Math.min(m,v),st=Math.abs(v-m);F.style.left=`${E}px`,F.style.top=`${_}px`,F.style.width=`${st}px`,F.style.height=`${S}px`,F.hidden=!1,F.classList.add("visible")};let ht=null,vt=0,ft=0,gt=!1;const Mt=m=>{ht==null||m.pointerId!==ht||(ft=P(m.clientX),!(!gt&&Math.abs(ft-vt)<6)&&(gt=!0,this._chartZoomDragging=!0,ce(this),V(vt,ft),m.preventDefault()))},bt=m=>{if(ht==null||m.pointerId!==ht)return;const v=gt,E=ft;if(window.removeEventListener("pointermove",Mt),window.removeEventListener("pointerup",bt),window.removeEventListener("pointercancel",bt),ht=null,gt=!1,this._chartZoomDragging=!1,mt(),!v||Math.abs(E-vt)<8)return;const st=Math.min(A(vt),A(E)),Ct=Math.max(A(vt),A(E));this._applyZoomRange(st,Ct)},j=m=>{m.button!==0||!M(m.clientX)||(ht=m.pointerId,vt=P(m.clientX),ft=vt,gt=!1,this._chartZoomDragging=!1,window.addEventListener("pointermove",Mt),window.addEventListener("pointerup",bt),window.addEventListener("pointercancel",bt))},y=m=>{M(m.clientX)&&(m.preventDefault(),this._clearZoomRange())};C.addEventListener("pointerdown",j),C.addEventListener("dblclick",y),this._chartZoomCleanup&&this._chartZoomCleanup(),this._chartZoomCleanup=()=>{C.removeEventListener("pointerdown",j),C.removeEventListener("dblclick",y),window.removeEventListener("pointermove",Mt),window.removeEventListener("pointerup",bt),window.removeEventListener("pointercancel",bt),ht=null,gt=!1,this._chartZoomDragging=!1,mt()}}}customElements.get("hass-datapoints-history-chart")||customElements.define("hass-datapoints-history-chart",Ci);function Ei(a=[]){return new Set((Array.isArray(a)?a:[]).filter(t=>t?.visible===!1).map(t=>t.entity_id||t.entity||t.entityId).filter(t=>!!t))}function Ri(a=[]){return new Set((Array.isArray(a)?a:[]).filter(Boolean))}var Li=Object.defineProperty,Ii=(a,t,e)=>t in a?Li(a,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):a[t]=e,le=(a,t,e)=>Ii(a,typeof t!="symbol"?t+"":t,e);class Mi{constructor(t){le(this,"_host"),le(this,"_dialogEl"),le(this,"_panelEl"),le(this,"_chipRowEl"),le(this,"_linkedTarget"),le(this,"_target"),this._host=t,this._dialogEl=null,this._panelEl=null,this._chipRowEl=null,this._linkedTarget=se({}),this._target=se({})}isOpen(){return!!this._dialogEl?.open}ensureDialog(){if(this._dialogEl||!this._host.shadowRoot)return;const t=document.createElement("ha-dialog");t.id="chart-context-dialog",t.scrimClickAction=!0,t.escapeKeyAction=!0,t.open=!1,t.headerTitle="Create data point",t.style.setProperty("--dialog-content-padding","0 var(--dp-spacing-lg, 24px) var(--dp-spacing-lg, 24px)"),t.style.setProperty("--mdc-dialog-min-width","min(920px, 96vw)"),t.style.setProperty("--mdc-dialog-max-width","96vw"),this._host._hass&&(t.hass=this._host._hass),t.innerHTML=`
      <div id="chart-context-dialog-panel" class="chart-context-dialog-panel"></div>
    `,t.addEventListener("closed",()=>this.finalizeClose()),this._host.shadowRoot.appendChild(t),this._dialogEl=t,this._panelEl=t.querySelector("#chart-context-dialog-panel")}teardown(){this.resetFormState(),this._dialogEl?.remove(),this._dialogEl=null,this._panelEl=null,this._chipRowEl=null}resetFormState(){this._linkedTarget=se({}),this._target=se({})}finalizeClose(){this.teardown(),this._host._creatingContextAnnotation=!1}_shake(){if(!this._dialogEl)return;const t=this._host.shadowRoot;if(t){if(!t.getElementById("dp-dialog-shake-style")){const e=document.createElement("style");e.id="dp-dialog-shake-style",e.textContent=`
        @keyframes dp-dialog-shake {
          10%, 90% { transform: translate3d(-2px, 0, 0); }
          20%, 80% { transform: translate3d(4px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-6px, 0, 0); }
          40%, 60% { transform: translate3d(6px, 0, 0); }
        }
        .dp-shaking {
          animation: dp-dialog-shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }
      `,t.appendChild(e)}this._dialogEl.classList.remove("dp-shaking"),this._dialogEl.offsetWidth,this._dialogEl.classList.add("dp-shaking"),this._dialogEl.addEventListener("animationend",()=>this._dialogEl?.classList.remove("dp-shaking"),{once:!0})}}formatDate(t){const e=new Date(t),s=e.getFullYear(),i=String(e.getMonth()+1).padStart(2,"0"),o=String(e.getDate()).padStart(2,"0"),n=String(e.getHours()).padStart(2,"0"),l=String(e.getMinutes()).padStart(2,"0");return`${s}-${i}-${o}T${n}:${l}`}_buildChips(t){return[...(t.entity_id||[]).map(e=>{const s=Bt(this._host._hass,e);return{type:"entity_id",itemId:e,icon:is(this._host._hass,e),name:s,secondaryText:s!==e?e:"",stateObj:this._host?._hass?.states?.[e]??null}}),...(t.device_id||[]).map(e=>({type:"device_id",itemId:e,icon:as(this._host._hass,e),name:ns(this._host._hass,e)})),...(t.area_id||[]).map(e=>({type:"area_id",itemId:e,icon:rs(this._host._hass,e),name:os(this._host._hass,e)})),...(t.label_id||[]).map(e=>({type:"label_id",itemId:e,icon:cs(this._host._hass,e),name:ls(this._host._hass,e)}))]}removeLinkedTarget(t,e){if(!this._linkedTarget||!t||!e)return;const s=se(this._linkedTarget);s[t]&&(s[t]=s[t].filter(i=>i!==e),this._linkedTarget=s,this._chipRowEl&&(this._chipRowEl.hass=this._host._hass??null,this._chipRowEl.chips=this._buildChips(this._linkedTarget)))}bindTargetChipActions(){}_getDefaultLinkedTarget(){const t=this._host?._config||{},e=this._host?._hiddenSeries instanceof Set?this._host._hiddenSeries:new Set,i=(Array.isArray(t.series_settings)?t.series_settings:[]).map(o=>o?.entity_id||o?.entity||o?.entityId||null).filter(o=>typeof o=="string"&&o.length>0&&!e.has(o));return i.length>0?se({entity_id:[...new Set(i)]}):se({entity_id:(this._host?._entityIds||[]).filter(Boolean)})}bindFields(t){if(!this._panelEl)return;const e=t?.annotationPrefill&&typeof t.annotationPrefill=="object"?t.annotationPrefill:{},s=this._panelEl.querySelector("#chart-context-message"),i=this._panelEl.querySelector("#chart-context-annotation"),o=this._panelEl.querySelector("#chart-context-icon");o&&(o.hass=this._host._hass,o.value=e.icon||t?.event?.icon||"mdi:bookmark");const n=this._panelEl.querySelector("#chart-context-target");n&&(n.hass=this._host._hass,n.value="{}",n.addEventListener("value-changed",c=>{this._target=se(c.detail.value||{})})),s&&(s.value=e.message||""),i&&(i.value=e.annotation||"");const l=this._panelEl.querySelector("#chart-context-linked-targets");if(l&&!this._chipRowEl){const c=document.createElement("annotation-chip-row");c.hass=this._host._hass??null,c.addEventListener("dp-target-remove",w=>{const _=w.detail;this.removeLinkedTarget(_.type,_.id)}),l.appendChild(c),this._chipRowEl=c}this._chipRowEl&&(this._chipRowEl.chips=this._buildChips(this._linkedTarget)),this.bindTargetChipActions();const h=this._panelEl.querySelector("#chart-context-color"),u=this._panelEl.querySelector("#chart-context-color-preview"),d=()=>{u&&h&&(u.style.background=h.value)};h&&(d(),h.addEventListener("input",d),h.addEventListener("change",d)),this._dialogEl?.querySelector("#chart-context-cancel")?.addEventListener("click",()=>this.close()),this._dialogEl?.querySelector("#chart-context-save")?.addEventListener("click",()=>this.submit()),[s,i].forEach(c=>{c?.addEventListener("keydown",w=>{const _=w;_.key==="Enter"&&(_.ctrlKey||_.metaKey)&&(_.preventDefault(),this.submit())})})}async submit(){if(!this._panelEl||!this._host._hass)return;const t=this._panelEl.querySelector("#chart-context-message"),e=this._panelEl.querySelector("#chart-context-annotation"),s=this._panelEl.querySelector("#chart-context-date"),i=this._panelEl.querySelector("#chart-context-icon"),o=this._panelEl.querySelector("#chart-context-color"),n=this._dialogEl?.querySelector("#chart-context-save"),l=this._panelEl.querySelector("#chart-context-feedback"),h=(t?.value||"").trim();if(!h){t?.focus?.(),this._shake();return}const u=Os(this._linkedTarget,this._target||{}),d={message:h},c=(e?.value||"").trim();c&&(d.annotation=c);const w=(s?.value||"").trim();if(w){const g=new Date(w);d.date=Number.isFinite(g.getTime())?g.toISOString():w}const _=i?.value;_&&(d.icon=_),d.color=o?.value||"#03a9f4",u.entity_id.length&&(d.entity_ids=u.entity_id),u.device_id.length&&(d.device_ids=u.device_id),u.area_id.length&&(d.area_ids=u.area_id),u.label_id.length&&(d.label_ids=u.label_id),n&&(n.disabled=!0),l&&(l.hidden=!0,l.textContent="");try{await this._host._hass.callService(es,"record",d),Is(),window.dispatchEvent(new CustomEvent("hass-datapoints-event-recorded")),this.close()}catch(g){l&&(l.hidden=!1,l.textContent=g?.message||"Failed to create annotation."),this._shake(),kt.error("[hass-datapoints history-card]",g)}finally{n&&(n.disabled=!1)}}open(t){if(this._dialogEl&&!this._dialogEl.open&&this.teardown(),this.ensureDialog(),!this._dialogEl||!this._panelEl||this._dialogEl.open)return;this.resetFormState();const e=t?.annotationPrefill?.linkedTarget;e&&typeof e=="object"?this._linkedTarget=se(e):this._linkedTarget=this._getDefaultLinkedTarget();const s=t?.annotationPrefill?.color||t?.primary?.color||t?.event?.color||"#03a9f4";this._panelEl.innerHTML=`
      <style>
        .chart-context-dialog-panel { width: min(920px, 96vw); max-width: 100%; color: var(--primary-text-color); }
        .context-dialog-content { display: grid; gap: 16px; padding-top: 4px; }
        .context-form { display: grid; gap: 16px; }
        .context-form-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px; }
        .context-form-main, .context-form-side { display: grid; gap: 16px; min-width: 0; }
        .context-form-side { align-content: start; justify-items: start; }
        .context-form-field { display: grid; gap: 6px; min-width: 0; }
        .context-form-field.compact-field { justify-items: start; }
        .context-form-label { font-size: 0.9rem; font-weight: 600; color: var(--primary-text-color); }
        .context-form-help { font-size: 0.8rem; color: var(--secondary-text-color); line-height: 1.45; }
        .context-form-help-inline { display: inline-flex; align-items: center; gap: 6px; }
        .context-annotation-input { width: 100%; min-height: 120px; box-sizing: border-box; resize: vertical; padding: 12px; border: 1px solid var(--input-outlined-idle-border-color, var(--divider-color, #9e9e9e)); border-radius: 12px; background: var(--card-background-color, var(--primary-background-color, #fff)); color: var(--primary-text-color); font: inherit; line-height: 1.45; }
        .context-annotation-input::placeholder { color: var(--secondary-text-color); }
        .context-annotation-input:focus { outline: none; border-color: var(--primary-color); box-shadow: 0 0 0 1px var(--primary-color); }
        .context-help-icon { color: var(--secondary-text-color); cursor: help; --mdc-icon-size: 16px; }
        .context-chip-row { display: flex; flex-wrap: wrap; gap: 6px; }
        .context-chip { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 999px; background: color-mix(in srgb, var(--primary-color) 12%, transparent); color: var(--primary-color); white-space: nowrap; }
        .context-chip ha-icon { --mdc-icon-size: 14px; }
        .context-chip-remove { display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; padding: 0; border: none; border-radius: 50%; background: transparent; color: currentColor; cursor: pointer; flex: 0 0 auto; }
        .context-chip-remove:hover { background: color-mix(in srgb, currentColor 12%, transparent); }
        .context-chip-remove ha-icon { --mdc-icon-size: 12px; pointer-events: none; }
        .context-color-control { display: flex; align-items: center; gap: 10px; }
        .context-color-preview { width: 28px; height: 28px; border-radius: 50%; border: 2px solid var(--divider-color, #ccc); background: ${wt(s)}; flex: 0 0 auto; }
        .context-color-input { width: 56px; height: 36px; padding: 0; border: none; background: transparent; cursor: pointer; }
        .context-date-input { width: 220px; max-width: 100%; }
        .context-icon-input { width: 220px; max-width: 100%; }
        .context-form-feedback { color: var(--error-color); font-size: 0.84rem; }
        .context-form-footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-top: 8px; }
        .context-form-actions { display: flex; align-items: center; justify-content: flex-end; gap: 8px; margin-left: auto; }
      </style>
      <div class="context-dialog-content">
        <div class="context-form">
          <div class="context-form-grid">
            <div class="context-form-main">
              <div class="context-form-field">
                <label class="context-form-label" for="chart-context-message">Message</label>
                <div class="context-form-help">Use a short title that will be shown in the chart tooltip and records list.</div>
                <ha-textfield id="chart-context-message" placeholder="What happened?" style="width:100%"></ha-textfield>
              </div>
              <div class="context-form-field">
                <label class="context-form-label" for="chart-context-annotation">Annotation</label>
                <div class="context-form-help">Add any longer context, outcome, or note you want to keep with this data point.</div>
                <textarea id="chart-context-annotation" class="context-annotation-input" placeholder="Detailed note shown on chart hover..."></textarea>
              </div>
              <div id="chart-context-linked-targets"></div>
              <div class="context-form-field">
                <label class="context-form-label" for="chart-context-target">Additional related items</label>
                <div class="context-form-help">Optionally add more entities, devices, areas, or labels that should also be linked to this annotation.</div>
                <ha-selector id="chart-context-target"></ha-selector>
              </div>
            </div>
            <div class="context-form-side">
              <div class="context-form-field compact-field">
                <label class="context-form-label" for="chart-context-date">Date and time</label>
                <div class="context-form-help">The annotation will be placed at this exact moment on the chart.</div>
                <ha-textfield id="chart-context-date" class="context-date-input" type="datetime-local" value="${wt(this.formatDate(t.timeMs))}"></ha-textfield>
              </div>
              <div class="context-form-field compact-field">
                <label class="context-form-label" for="chart-context-icon">Icon</label>
                <div class="context-form-help">Choose the icon shown for this data point in the chart and records list.</div>
                <ha-icon-picker id="chart-context-icon" class="context-icon-input" label="Icon"></ha-icon-picker>
              </div>
              <div class="context-form-field">
                <label class="context-form-label" for="chart-context-color">Color</label>
                <div class="context-form-help context-form-help-inline">
                  Pick a color for the point marker and its related timeline indicators.
                  <ha-icon class="context-help-icon" icon="mdi:information-outline" title="This color is used for the chart marker, timeline dot, and record icon."></ha-icon>
                </div>
                <div class="context-color-control">
                  <span id="chart-context-color-preview" class="context-color-preview" aria-hidden="true"></span>
                  <input id="chart-context-color" class="context-color-input" type="color" value="${wt(s)}" aria-label="Annotation color">
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="context-form-footer">
          <div id="chart-context-feedback" class="context-form-feedback" hidden></div>
          <div class="context-form-actions">
            <ha-button id="chart-context-cancel">Cancel</ha-button>
            <ha-button id="chart-context-save" raised>Create data point</ha-button>
          </div>
        </div>
      </div>
    `,this._dialogEl&&(this._dialogEl.hass=this._host._hass,this._dialogEl.dialogInitialFocus="#chart-context-message");const i=this._panelEl.querySelector("#chart-context-target");i&&(i.selector={target:{}}),this.bindFields(t),this._dialogEl.open=!0,this._host._creatingContextAnnotation=!0,window.requestAnimationFrame(()=>{this._panelEl?.querySelector("#chart-context-message")?.focus?.()})}close(){this._host._creatingContextAnnotation=!1,this._dialogEl&&(this._dialogEl.open=!1),window.setTimeout(()=>this.finalizeClose(),0)}}async function ts(a,t,e,s,i={}){const o=ke(s),n=ke(i.types),l=JSON.stringify({type:"recorder/statistics_during_period",start_time:t,end_time:e,statistic_ids:o,period:i.period||"hour",types:n});return Te(l,e,()=>a.connection.sendMessagePromise({type:"recorder/statistics_during_period",start_time:t,end_time:e,statistic_ids:o,period:i.period||"hour",types:n,units:i.units||{}}))}function Di(a){return{entities:a._entities,series_rows:a._seriesRows,target_selection:a._targetSelection,target_selection_raw:a._targetSelectionRaw,datapoint_scope:a._datapointScope,show_chart_datapoint_icons:a._showChartDatapointIcons,show_chart_datapoint_lines:a._showChartDatapointLines,show_chart_tooltips:a._showChartTooltips,show_chart_emphasized_hover_guides:a._showChartEmphasizedHoverGuides,chart_hover_snap_mode:a._chartHoverSnapMode,delink_chart_y_axis:a._delinkChartYAxis,split_chart_view:a._splitChartView,show_chart_trend_lines:!1,show_chart_summary_stats:!1,show_chart_rate_of_change:!1,show_chart_threshold_analysis:!1,show_chart_threshold_shading:!1,show_chart_anomalies:!1,chart_anomaly_method:"trend_residual",chart_anomaly_rate_window:"1h",chart_anomaly_zscore_window:"24h",chart_anomaly_persistence_window:"1h",chart_anomaly_comparison_window_id:null,hide_chart_source_series:!1,show_chart_trend_crosshairs:!1,chart_trend_method:"rolling_average",chart_trend_window:"24h",chart_rate_window:"1h",chart_anomaly_sensitivity:"medium",chart_threshold_values:{},chart_threshold_directions:{},show_chart_delta_analysis:!1,show_chart_delta_tooltip:!0,show_chart_delta_lines:!1,show_chart_correlated_anomalies:a._showCorrelatedAnomalies,chart_anomaly_overlap_mode:a._chartAnomalyOverlapMode||"all",show_data_gaps:a._showDataGaps,data_gap_threshold:a._dataGapThreshold,content_split_ratio:a._contentSplitRatio,start_time:a._startTime?.toISOString()||null,end_time:a._endTime?.toISOString()||null,zoom_start_time:a._chartZoomCommittedRange?new Date(a._chartZoomCommittedRange.start).toISOString():null,zoom_end_time:a._chartZoomCommittedRange?new Date(a._chartZoomCommittedRange.end).toISOString():null,date_windows:Ms(a._comparisonWindows),hours:a._hours,sidebar_collapsed:a._sidebarCollapsed,sidebar_accordion_targets_open:a._sidebarAccordionTargetsOpen!==!1,sidebar_accordion_datapoints_open:a._sidebarAccordionDatapointsOpen!==!1,sidebar_accordion_analysis_open:a._sidebarAccordionAnalysisOpen!==!1,sidebar_accordion_chart_open:a._sidebarAccordionChartOpen!==!1}}var ki=Object.defineProperty,Pi=(a,t,e)=>t in a?ki(a,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):a[t]=e,yt=(a,t,e)=>Pi(a,typeof t!="symbol"?t+"":t,e);class Ve extends zs{constructor(){super(),yt(this,"_hiddenSeries",new Set),yt(this,"_hiddenEventIds",new Set),yt(this,"_zoomRange",null),yt(this,"_configKey"),yt(this,"_comparisonRequestId",0),yt(this,"_comparisonDataCache",new Map),yt(this,"_lastComparisonResults",null),yt(this,"_lastHistResult",null),yt(this,"_lastStatsResult",null),yt(this,"_lastEvents",null),yt(this,"_lastT0",0),yt(this,"_lastT1",0),yt(this,"_scrollSyncSuspended",!1),yt(this,"_lastProgrammaticScrollLeft",null),yt(this,"_ignoreNextProgrammaticScrollEvent",!1),yt(this,"_adjustComparisonAxisScale",!1),yt(this,"_drawRequestId",0),yt(this,"_zoomReloadTimer",null),yt(this,"_chartScrollViewportEl",null),yt(this,"_annotationDialog"),yt(this,"_onWindowKeyDown"),yt(this,"_onChartScroll"),yt(this,"_onZoomApply"),this._annotationDialog=new Mi(this),this._onWindowKeyDown=t=>this._handleWindowKeyDown(t),this._onChartScroll=()=>this._handleChartScroll(),this._onZoomApply=t=>{const e=t.detail;this._zoomRange=e?{start:e.start,end:e.end}:null,this._dispatchZoomRange(e?"zoom":"reset"),this._lastHistResult&&this._lastEvents&&this._queueDrawChart(this._lastHistResult,this._lastStatsResult||{},this._lastEvents,this._lastT0,this._lastT1),this._scheduleZoomReload()}}set hass(t){this._hass=t,this.requestUpdate();const e=this._chartEl();e&&(e.hass=t)}get hass(){return this._hass}connectedCallback(){window.addEventListener("keydown",this._onWindowKeyDown),this.addEventListener("hass-datapoints-zoom-apply",this._onZoomApply),super.connectedCallback()}disconnectedCallback(){window.removeEventListener("keydown",this._onWindowKeyDown),this.removeEventListener("hass-datapoints-zoom-apply",this._onZoomApply),this._zoomReloadTimer!=null&&(window.clearTimeout(this._zoomReloadTimer),this._zoomReloadTimer=null),this._chartScrollViewportEl&&this._chartScrollViewportEl.removeEventListener("scroll",this._onChartScroll),this._annotationDialog?.teardown(),super.disconnectedCallback()}setConfig(t){if(!t.entity&&!t.entities&&!t.target&&!(Array.isArray(t.series_settings)&&t.series_settings.length>0))throw new Error("hass-datapoints-history-card: define `target`, `entity`, `entities` or `series_settings`");const e={hours_to_show:24,...t,target:t.target?Ie(t.target):void 0,series_settings:Array.isArray(t.series_settings)?t.series_settings.map(N=>({...N,analysis:N?.analysis&&typeof N.analysis=="object"?{...N.analysis}:N?.analysis})):t.series_settings,hidden_event_ids:Array.isArray(t.hidden_event_ids)?[...t.hidden_event_ids]:t.hidden_event_ids,hovered_event_ids:Array.isArray(t.hovered_event_ids)?[...t.hovered_event_ids]:t.hovered_event_ids,comparison_windows:Array.isArray(t.comparison_windows)?t.comparison_windows.map(N=>({...N})):t.comparison_windows,preload_comparison_windows:Array.isArray(t.preload_comparison_windows)?t.preload_comparison_windows.map(N=>({...N})):t.preload_comparison_windows,comparison_preview_overlay:t.comparison_preview_overlay?{...t.comparison_preview_overlay}:null,selected_comparison_window_id:t.selected_comparison_window_id||null,hovered_comparison_window_id:t.hovered_comparison_window_id||null,show_trend_lines:t.show_trend_lines===!0,show_summary_stats:t.show_summary_stats===!0,show_rate_of_change:t.show_rate_of_change===!0,show_threshold_analysis:t.show_threshold_analysis===!0,show_threshold_shading:t.show_threshold_shading===!0,hide_raw_data:t.hide_raw_data===!0,show_trend_crosshairs:t.show_trend_crosshairs===!0,trend_method:t.trend_method||"rolling_average",trend_window:t.trend_window||"24h",rate_window:t.rate_window||"1h",threshold_values:t.threshold_values&&typeof t.threshold_values=="object"?{...t.threshold_values}:{},threshold_directions:t.threshold_directions&&typeof t.threshold_directions=="object"?{...t.threshold_directions}:{},show_delta_analysis:t.show_delta_analysis===!0,show_delta_tooltip:t.show_delta_tooltip!==!1,show_delta_lines:t.show_delta_lines===!0,hide_delta_source_series:t.hide_delta_source_series===!0,delink_y_axis:t.delink_y_axis===!0,split_view:t.split_view===!0,show_data_gaps:t.show_data_gaps!==!1,data_gap_threshold:t.data_gap_threshold||"2h"},s=this._config||{},i=JSON.stringify({target:s.target||null,entities:s.entities,entity:s.entity,series_entities:Array.isArray(s.series_settings)?s.series_settings.map(N=>N?.entity_id||N?.entity||N?.entityId||null):null,datapoint_scope:s.datapoint_scope,hours_to_show:s.hours_to_show,start_time:s.start_time,end_time:s.end_time}),o=JSON.stringify({target:e.target||null,entities:e.entities,entity:e.entity,series_entities:Array.isArray(e.series_settings)?e.series_settings.map(N=>N?.entity_id||N?.entity||N?.entityId||null):null,datapoint_scope:e.datapoint_scope,hours_to_show:e.hours_to_show,start_time:e.start_time,end_time:e.end_time}),n=JSON.stringify({series_settings:s.series_settings||[],zoom_start_time:s.zoom_start_time,zoom_end_time:s.zoom_end_time,message_filter:s.message_filter||"",hidden_event_ids:s.hidden_event_ids||[],hovered_event_ids:s.hovered_event_ids||[],show_event_markers:s.show_event_markers!==!1,show_event_lines:s.show_event_lines!==!1,show_tooltips:s.show_tooltips!==!1,emphasize_hover_guides:s.emphasize_hover_guides===!0,hover_snap_mode:s.hover_snap_mode||"follow_series",show_correlated_anomalies:s.show_correlated_anomalies===!0,show_trend_lines:s.show_trend_lines===!0,show_summary_stats:s.show_summary_stats===!0,show_rate_of_change:s.show_rate_of_change===!0,show_threshold_analysis:s.show_threshold_analysis===!0,show_threshold_shading:s.show_threshold_shading===!0,show_anomalies:s.show_anomalies===!0,hide_raw_data:s.hide_raw_data===!0,show_trend_crosshairs:s.show_trend_crosshairs===!0,trend_method:s.trend_method||"rolling_average",trend_window:s.trend_window||"24h",rate_window:s.rate_window||"1h",anomaly_sensitivity:s.anomaly_sensitivity||"medium",threshold_values:s.threshold_values||{},threshold_directions:s.threshold_directions||{},show_delta_analysis:s.show_delta_analysis===!0,show_delta_tooltip:s.show_delta_tooltip!==!1,show_delta_lines:s.show_delta_lines===!0,hide_delta_source_series:s.hide_delta_source_series===!0,delink_y_axis:s.delink_y_axis===!0,split_view:s.split_view===!0,show_data_gaps:s.show_data_gaps!==!1,data_gap_threshold:s.data_gap_threshold||"2h",comparison_hover_active:s.comparison_hover_active===!0,selected_comparison_window_id:s.selected_comparison_window_id||null,hovered_comparison_window_id:s.hovered_comparison_window_id||null}),l=JSON.stringify({series_settings:e.series_settings||[],zoom_start_time:e.zoom_start_time,zoom_end_time:e.zoom_end_time,message_filter:e.message_filter||"",hidden_event_ids:e.hidden_event_ids||[],hovered_event_ids:e.hovered_event_ids||[],show_event_markers:e.show_event_markers!==!1,show_event_lines:e.show_event_lines!==!1,show_tooltips:e.show_tooltips!==!1,emphasize_hover_guides:e.emphasize_hover_guides===!0,hover_snap_mode:e.hover_snap_mode||"follow_series",show_correlated_anomalies:e.show_correlated_anomalies===!0,show_trend_lines:e.show_trend_lines===!0,show_summary_stats:e.show_summary_stats===!0,show_rate_of_change:e.show_rate_of_change===!0,show_threshold_analysis:e.show_threshold_analysis===!0,show_threshold_shading:e.show_threshold_shading===!0,show_anomalies:e.show_anomalies===!0,hide_raw_data:e.hide_raw_data===!0,show_trend_crosshairs:e.show_trend_crosshairs===!0,trend_method:e.trend_method||"rolling_average",trend_window:e.trend_window||"24h",rate_window:e.rate_window||"1h",anomaly_sensitivity:e.anomaly_sensitivity||"medium",threshold_values:e.threshold_values||{},threshold_directions:e.threshold_directions||{},show_delta_analysis:e.show_delta_analysis===!0,show_delta_tooltip:e.show_delta_tooltip!==!1,show_delta_lines:e.show_delta_lines===!0,hide_delta_source_series:e.hide_delta_source_series===!0,delink_y_axis:e.delink_y_axis===!0,split_view:e.split_view===!0,show_data_gaps:e.show_data_gaps!==!1,data_gap_threshold:e.data_gap_threshold||"2h",comparison_hover_active:e.comparison_hover_active===!0,selected_comparison_window_id:e.selected_comparison_window_id||null,hovered_comparison_window_id:e.hovered_comparison_window_id||null}),h=JSON.stringify(s.comparison_windows||[]),u=JSON.stringify(e.comparison_windows||[]),d=JSON.stringify(s.preload_comparison_windows||[]),c=JSON.stringify(e.preload_comparison_windows||[]),w=JSON.stringify(s.comparison_preview_overlay||null),_=JSON.stringify(e.comparison_preview_overlay||null),g=i!==o,S=n!==l,C=h!==u,P=d!==c,A=w!==_;if(!g&&!S&&!C&&!P&&!A&&this._configKey)return;this._config=e,this._configKey=JSON.stringify(e),this._hiddenSeries=Ei(e.series_settings),this._hiddenEventIds=Ri(e.hidden_event_ids),this._zoomRange=Ds(e.zoom_start_time,e.zoom_end_time);const M=this._chartEl();if(M&&(M.hass=this._hass,M._config=this._config,M._hiddenSeries=this._hiddenSeries,M._hiddenEventIds=this._hiddenEventIds,M._zoomRange=this._zoomRange,M._lastComparisonResults=this._getResolvedComparisonResults(),A&&typeof M._renderComparisonPreviewOverlay=="function"&&M._renderComparisonPreviewOverlay()),(g||!Array.isArray(e.comparison_windows)||!e.comparison_windows.length)&&(this._adjustComparisonAxisScale=!1),this._hass&&g){this._load();return}if(this._hass&&C){this._loadComparisonWindows({redraw:!0,showLoading:!0});return}if(this._hass&&P&&this._preloadComparisonWindows().catch(()=>{}),this._hass&&A&&this._lastHistResult&&this._lastEvents){this._queueDrawChart(this._lastHistResult,this._lastStatsResult||{},this._lastEvents,this._lastT0,this._lastT1);return}this._hass&&S&&this._lastHistResult&&this._lastEvents&&this._queueDrawChart(this._lastHistResult,this._lastStatsResult||{},this._lastEvents,this._lastT0,this._lastT1)}get _entityIds(){if(Array.isArray(this._config.series_settings)){const t=this._config.series_settings.map(e=>e?.entity_id||e?.entity||e?.entityId||null).filter(e=>typeof e=="string"&&!!e);if(t.length)return[...new Set(t)]}return this._config.target?Ts(this._hass,this._config.target):this._config.entities?this._config.entities.map(t=>typeof t=="string"?t:t.entity_id??t.entity):[this._config.entity]}get _statisticsEntityIds(){return this._entityIds.filter(t=>!String(t).startsWith("binary_sensor."))}_getRange(){const t=this._config.end_time?new Date(this._config.end_time):new Date;return{start:this._config.start_time?new Date(this._config.start_time):new Date(t.getTime()-this._config.hours_to_show*3600*1e3),end:t}}get _comparisonWindows(){return Array.isArray(this._config?.comparison_windows)?this._config.comparison_windows.filter(t=>t?.time_offset_ms!=null):[]}get _preloadComparisonWindowsConfig(){return Array.isArray(this._config?.preload_comparison_windows)?this._config.preload_comparison_windows.filter(t=>t?.time_offset_ms!=null):[]}_getComparisonCacheKey(t,e,s){return JSON.stringify({id:t?.id||"",start:e?.toISOString?.()||"",end:s?.toISOString?.()||"",entities:this._entityIds,statistics_entities:this._statisticsEntityIds})}_getResolvedComparisonResults(){const{start:t,end:e}=this._getRange(),s=new Set,i=[],o=[...this._comparisonWindows,...this._preloadComparisonWindowsConfig];for(const n of o){const l=String(n?.id||"");if(!l||s.has(l))continue;s.add(l);const h=new Date(t.getTime()+n.time_offset_ms),u=new Date(e.getTime()+n.time_offset_ms),d=this._getComparisonCacheKey(n,h,u),c=this._comparisonDataCache.get(d);c&&i.push(c)}return i}async _loadComparisonWindowData(t,e,s){const i=this._hass;if(!i)return{id:t.id,time_offset_ms:t.time_offset_ms,histResult:{},statsResult:{}};const o=this._getComparisonCacheKey(t,e,s),n=this._comparisonDataCache.get(o);if(n)return n;const l=Ge(i,e.toISOString(),s.toISOString(),this._entityIds,{include_start_time_state:!0,significant_changes_only:!1,no_attributes:!0}).catch(()=>({})),h=this._statisticsEntityIds.length?ts(i,e.toISOString(),s.toISOString(),this._statisticsEntityIds,{period:"hour",types:["mean"],units:{}}).catch(()=>({})):Promise.resolve({}),[u,d]=await Promise.all([l,h]),c={...t,histResult:u||{},statsResult:d||{}};return this._comparisonDataCache.set(o,c),c}_preloadComparisonWindows(){const{start:t,end:e}=this._getRange(),s=this._preloadComparisonWindowsConfig;return s.length?Promise.all(s.map(async i=>{const o=new Date(t.getTime()+i.time_offset_ms),n=new Date(e.getTime()+i.time_offset_ms),l=await this._loadComparisonWindowData(i,o,n);return{...i,id:l.id,histResult:l.histResult,statsResult:l.statsResult}})).then(i=>(this._lastComparisonResults=this._getResolvedComparisonResults(),this._config?.hovered_comparison_window_id&&this._lastHistResult&&this._lastEvents&&this._queueDrawChart(this._lastHistResult,this._lastStatsResult||{},this._lastEvents,this._lastT0,this._lastT1),i)).catch(i=>(kt.warn("[hass-datapoints history-card] comparison preload:failed",{message:i?.message||String(i)}),[])):Promise.resolve([])}_loadComparisonWindows({redraw:t=!1,requestId:e=null,showLoading:s=!1}={}){const{start:i,end:o}=this._getRange(),n=this._comparisonWindows,l=e??this._loadRequestId,h=++this._comparisonRequestId;if(!n.length)return this._lastComparisonResults=[],this.dispatchEvent(new CustomEvent("hass-datapoints-comparison-loading",{bubbles:!0,composed:!0,detail:{ids:[],loading:!1}})),t&&this._lastHistResult&&this._lastEvents&&this._queueDrawChart(this._lastHistResult,this._lastStatsResult||{},this._lastEvents,this._lastT0,this._lastT1),Promise.resolve([]);const u=[],d=[];for(const c of n){const w=new Date(i.getTime()+c.time_offset_ms),_=new Date(o.getTime()+c.time_offset_ms),g=this._getComparisonCacheKey(c,w,_),S=this._comparisonDataCache.get(g);S?u.push(S):d.push({win:c,winStart:w,winEnd:_})}return d.length?(this._lastComparisonResults=u.length?this._getResolvedComparisonResults():null,s&&this._setChartLoading(!0),this.dispatchEvent(new CustomEvent("hass-datapoints-comparison-loading",{bubbles:!0,composed:!0,detail:{ids:d.map(({win:c})=>c.id).filter(Boolean),loading:!0}})),Promise.all(d.map(async({win:c,winStart:w,winEnd:_})=>this._loadComparisonWindowData(c,w,_))).then(()=>h!==this._comparisonRequestId?this._lastComparisonResults||[]:l!=null&&l!==this._loadRequestId?this._lastComparisonResults||[]:(this._lastComparisonResults=this._getResolvedComparisonResults(),this.dispatchEvent(new CustomEvent("hass-datapoints-comparison-loading",{bubbles:!0,composed:!0,detail:{ids:d.map(({win:c})=>c.id).filter(Boolean),loading:!1}})),t&&this._lastHistResult&&this._lastEvents?this._queueDrawChart(this._lastHistResult,this._lastStatsResult||{},this._lastEvents,this._lastT0,this._lastT1):s&&this._setChartLoading(!1),this._lastComparisonResults)).catch(()=>(h===this._comparisonRequestId?(this._lastComparisonResults=[],kt.warn("[hass-datapoints history-card] comparison load:failed",{comparisonRequestId:h,ids:n.map(c=>c.id).filter(Boolean)}),this.dispatchEvent(new CustomEvent("hass-datapoints-comparison-loading",{bubbles:!0,composed:!0,detail:{ids:d.map(({win:c})=>c.id).filter(Boolean),loading:!1}})),t&&this._lastHistResult&&this._lastEvents?this._queueDrawChart(this._lastHistResult,this._lastStatsResult||{},this._lastEvents,this._lastT0,this._lastT1):s&&this._setChartLoading(!1)):s&&this._setChartLoading(!1),[]))):(this._lastComparisonResults=this._getResolvedComparisonResults(),t&&this._lastHistResult&&this._lastEvents&&this._queueDrawChart(this._lastHistResult,this._lastStatsResult||{},this._lastEvents,this._lastT0,this._lastT1),Promise.resolve(this._lastComparisonResults))}async _load(){const{start:t,end:e}=this._getRange(),s=t.getTime(),i=e.getTime(),o=++this._loadRequestId;this._setChartLoading(!0),kt.log("[hass-datapoints history-card] load triggered",{requestId:o,entityIds:this._entityIds,start:t.toISOString(),end:e.toISOString()});const n={histResult:null,statsResult:this._statisticsEntityIds.length?null:{},events:null,histDone:!1,statsDone:!this._statisticsEntityIds.length,eventsDone:!1,histFailed:!1,statsFailed:!1,eventsFailed:!1,hasDrawnDrawable:!1,lastDrawState:null,lastDrawQuality:null},l=(d,c,w,_)=>{kt.log("[hass-datapoints history] redraw data update",{reason:d,requestId:o,entityIds:this._entityIds,start:t.toISOString(),end:e.toISOString(),histResult:c,statsResult:w,events:_})},h=()=>{if(o!==this._loadRequestId)return;const d=this._hasDrawableHistoryData(n.histResult||{},n.statsResult||{}),c=n.histDone&&n.statsDone;if(!d&&!c)return;if(n.hasDrawnDrawable){const _=d?this._getDrawableHistoryQuality(n.histResult||{},n.statsResult||{}):null,g=d&&!n.lastDrawState?.histDone&&n.histDone,S=d&&!n.lastDrawState?.statsDone&&n.statsDone,C=d&&!n.lastDrawState?.eventsDone&&n.eventsDone,P=g||S||C,A=!!_&&!!n.lastDrawQuality&&_.totalPoints<n.lastDrawQuality.totalPoints;if(!P){n.histDone&&n.statsDone&&n.eventsDone&&this._setChartLoading(!1);return}if(A){n.histDone&&n.statsDone&&n.eventsDone&&this._setChartLoading(!1);return}if(C&&!g&&this._lastHistResult&&Number.isFinite(this._lastT0)&&Number.isFinite(this._lastT1)){const M=this._filterEvents(n.events||[]);l("events_update",this._lastHistResult,this._lastStatsResult||{},M),n.lastDrawState={histDone:n.histDone,statsDone:n.statsDone,eventsDone:n.eventsDone},this._queueDrawChart(this._lastHistResult,this._lastStatsResult||{},n.events||[],this._lastT0,this._lastT1,{loading:!(n.histDone&&n.statsDone&&n.eventsDone)});return}}if(d){const _=this._getDrawableHistoryQuality(n.histResult||{},n.statsResult||{});n.hasDrawnDrawable=!0,n.lastDrawState={histDone:n.histDone,statsDone:n.statsDone,eventsDone:n.eventsDone},n.lastDrawQuality=_}const w=this._filterEvents(n.events||[]);l(n.hasDrawnDrawable?"data_update":"initial_data_draw",n.histResult||{},n.statsResult||{},w),this._queueDrawChart(n.histResult||{},n.statsResult||{},n.events||[],s,i,{loading:!(n.histDone&&n.statsDone&&n.eventsDone)})},u=()=>{if(o===this._loadRequestId&&n.histDone&&n.statsDone&&n.eventsDone){if(n.histFailed&&n.statsFailed||n.histResult==null&&n.statsResult==null){this._setChartMessage("Failed to load data."),this._setChartLoading(!1);return}n.hasDrawnDrawable&&this._setChartLoading(!1),this._preloadComparisonWindows().catch(()=>{})}};this._loadComparisonWindows({redraw:!0,requestId:o}).catch(()=>{});try{const d=this._hass;if(!d){this._setChartMessage("Failed to load data."),this._setChartLoading(!1);return}Ge(d,t.toISOString(),e.toISOString(),this._entityIds,{include_start_time_state:!0,significant_changes_only:!1,no_attributes:!0}).then(c=>{n.histResult=c||{},n.histDone=!0,h(),u()}).catch(c=>{n.histDone=!0,n.histFailed=!0,kt.error("[hass-datapoints history-card] history load failed",c),h(),u()}),this._statisticsEntityIds.length&&ts(d,t.toISOString(),e.toISOString(),this._statisticsEntityIds,{period:"hour",types:["mean"],units:{}}).then(c=>{n.statsResult=c||{},n.statsDone=!0,h(),u()}).catch(c=>{n.statsDone=!0,n.statsFailed=!0,kt.error("[hass-datapoints history-card] statistics load failed",c),h(),u()}),this._config.datapoint_scope==="hidden"?(n.events=[],n.eventsDone=!0,h(),u()):ks(d,t.toISOString(),e.toISOString(),this._config.datapoint_scope==="all"?void 0:this._entityIds).then(c=>{n.events=c||[],n.eventsDone=!0,h(),u()}).catch(c=>{n.eventsDone=!0,n.eventsFailed=!0,kt.error("[hass-datapoints history-card] event load failed",c),h(),u()})}catch(d){this._setChartMessage("Failed to load data."),this._setChartLoading(!1),kt.error("[hass-datapoints history-card]",d)}}_drawChart(...t){const e=this._chartEl();e&&(e.hass=this._hass,e._config=this._config,e._hiddenSeries=this._hiddenSeries,e._hiddenEventIds=this._hiddenEventIds,e._zoomRange=this._zoomRange,e._lastComparisonResults=this._lastComparisonResults,e._drawChart(...t))}_chartEl(){return this.shadowRoot?.querySelector("hass-datapoints-history-chart")??null}_queueDrawChart(t,e,s,i,o,n={}){const l=++this._drawRequestId,h=this._filterEvents(s);this._lastHistResult=t,this._lastStatsResult=e,this._lastEvents=s,this._lastT0=i,this._lastT1=o,this._lastDrawArgs=[t,e,s,i,o,{...n,drawRequestId:l}];const u=this._chartEl();u&&(u.hass=this._hass,u._config=this._config,u._hiddenSeries=this._hiddenSeries,u._hiddenEventIds=this._hiddenEventIds,u._zoomRange=this._zoomRange,u._lastComparisonResults=this._lastComparisonResults,u._queueDrawChart(t,e,h,i,o,{...n,drawRequestId:l}))}_setChartLoading(t){const e=this._chartEl();e?._setChartLoading&&e._setChartLoading(t)}_setChartMessage(t=""){const e=this._chartEl();e?._setChartMessage&&e._setChartMessage(t)}_hasDrawableHistoryData(t,e){return this._entityIds.some(s=>{const i=t[s],o=e[s],n=Array.isArray(i)?i.length:0,l=Array.isArray(o)?o.length:0;return n>0||l>0})}_getDrawableHistoryQuality(t,e){let s=0;for(const i of this._entityIds){const o=t[i],n=e[i];s+=Array.isArray(o)?o.length:0,s+=Array.isArray(n)?n.length:0}return{totalPoints:s}}_filterEvents(t){const e=String(this._config?.message_filter||"").trim().toLowerCase(),s=t.filter(i=>!this._hiddenEventIds.has(i?.id??""));return e?s.filter(i=>{const o=i;return[o?.message||"",o?.annotation||"",...(o?.entity_ids||[]).filter(Boolean)].join(`
`).toLowerCase().includes(e)}):s}_buildNavigationPageState(){const t=this._getRange(),e=typeof this._config.zoom_start_time<"u"&&typeof this._config.zoom_end_time<"u"?{start:this._config.zoom_start_time,end:this._config.zoom_end_time}:null,s=this._config.target&&typeof this._config.target=="object"?Ie(this._config.target):{entity_id:this._entityIds};return{...Di({_entities:this._entityIds,_seriesRows:Array.isArray(this._config.series_settings)?[...this._config.series_settings]:this._entityIds.map(o=>({entity_id:o})),_targetSelection:s,_targetSelectionRaw:s,_datapointScope:this._config.datapoint_scope||"linked",_showChartDatapointIcons:this._config.show_event_markers!==!1,_showChartDatapointLines:this._config.show_event_lines!==!1,_showChartTooltips:this._config.show_tooltips!==!1,_showChartEmphasizedHoverGuides:this._config.emphasize_hover_guides===!0,_chartHoverSnapMode:this._config.hover_snap_mode||"follow_series",_delinkChartYAxis:this._config.delink_y_axis===!0,_splitChartView:this._config.split_view===!0,_showCorrelatedAnomalies:this._config.show_correlated_anomalies===!0,_chartAnomalyOverlapMode:"all",_showDataGaps:this._config.show_data_gaps!==!1,_dataGapThreshold:this._config.data_gap_threshold||"2h",_contentSplitRatio:.62,_startTime:t.start,_endTime:t.end,_chartZoomCommittedRange:this._zoomRange?{start:this._zoomRange.start,end:this._zoomRange.end}:e,_comparisonWindows:Array.isArray(this._config.comparison_windows)?[...this._config.comparison_windows]:[],_hours:Number(this._config.hours_to_show||24),_sidebarCollapsed:!1,_sidebarAccordionTargetsOpen:!0,_sidebarAccordionDatapointsOpen:!0,_sidebarAccordionAnalysisOpen:!0,_sidebarAccordionChartOpen:!0}),show_chart_trend_lines:this._config.show_trend_lines===!0,show_chart_summary_stats:this._config.show_summary_stats===!0,show_chart_rate_of_change:this._config.show_rate_of_change===!0,show_chart_threshold_analysis:this._config.show_threshold_analysis===!0,show_chart_threshold_shading:this._config.show_threshold_shading===!0,show_chart_anomalies:this._config.show_anomalies===!0,show_chart_trend_crosshairs:this._config.show_trend_crosshairs===!0,chart_trend_method:this._config.trend_method||"rolling_average",chart_trend_window:this._config.trend_window||"24h",chart_rate_window:this._config.rate_window||"1h",chart_anomaly_sensitivity:this._config.anomaly_sensitivity||"medium",chart_threshold_values:this._config.threshold_values||{},chart_threshold_directions:this._config.threshold_directions||{},show_chart_delta_analysis:this._config.show_delta_analysis===!0,show_chart_delta_tooltip:this._config.show_delta_tooltip!==!1,show_chart_delta_lines:this._config.show_delta_lines===!0,hide_chart_source_series:this._config.hide_raw_data===!0,chart_anomaly_rate_window:this._config.rate_window||"1h"}}_navigateToPanel(t){t.preventDefault(),t.stopPropagation();const e=this._getRange(),s=this._zoomRange?.start?this._zoomRange.start:this._config.zoom_start_time,i=this._zoomRange?.end?this._zoomRange.end:this._config.zoom_end_time;ds(this,this._config.target&&typeof this._config.target=="object"?Ie(this._config.target):{entity_id:this._entityIds},{datapoint_scope:this._config.datapoint_scope||void 0,start_time:Number.isFinite(this._lastT0)?this._lastT0:e.start,end_time:Number.isFinite(this._lastT1)?this._lastT1:e.end,zoom_start_time:s,zoom_end_time:i,page_state:this._buildNavigationPageState()})}_handleWindowKeyDown(t){if(t.key==="Escape"){if(this._annotationDialog?.isOpen?.()){t.preventDefault();return}this._zoomRange&&(t.preventDefault(),this._zoomRange=null,this._dispatchZoomRange("reset"))}}_handleChartScroll(){if(!(this._scrollSyncSuspended||!this._zoomRange)){if(this._ignoreNextProgrammaticScrollEvent){this._ignoreNextProgrammaticScrollEvent=!1,this._lastProgrammaticScrollLeft=null;return}if(this._lastProgrammaticScrollLeft!=null&&Math.abs((this._chartScrollViewportEl?.scrollLeft||0)-this._lastProgrammaticScrollLeft)<1){this._lastProgrammaticScrollLeft=null;return}this._lastProgrammaticScrollLeft=null}}_dispatchZoomRange(t){this.dispatchEvent(new CustomEvent("hass-datapoints-chart-zoom",{bubbles:!0,composed:!0,detail:this._zoomRange?{startTime:this._zoomRange.start,endTime:this._zoomRange.end,preview:!1,source:t}:{startTime:null,endTime:null,preview:!1,source:t}}))}_scheduleZoomReload(){this._zoomReloadTimer!=null&&window.clearTimeout(this._zoomReloadTimer),this._zoomReloadTimer=window.setTimeout(()=>{this._zoomReloadTimer=null,this._load()},140)}render(){return de`
      <ha-card>
        ${this._config?.title?de`
              <h1 class="card-header">
                <span class="card-header-title"
                  >${this._config.title}</span
                >
                <ha-icon-button
                  class="card-header-action"
                  .label=${"Open in Data Points"}
                  @click=${this._navigateToPanel}
                >
                  <ha-icon icon="mdi:chevron-right"></ha-icon>
                </ha-icon-button>
              </h1>
            `:""}
        <hass-datapoints-history-chart></hass-datapoints-history-chart>
      </ha-card>
    `}static getStubConfig(){return{title:"History with Events",entity:"sensor.example",hours_to_show:24}}static getConfigElement(){return document.createElement("hass-datapoints-history-card-editor")}}yt(Ve,"styles",Hs);customElements.define("hass-datapoints-history-card",Ve);customElements.get("hass-datapoints-history-card")||customElements.define("hass-datapoints-history-card",Ve);const Yi={title:"Charts/History Card",component:"hass-datapoints-history-card"},Se={states:{"sensor.temperature":{state:"22.5",attributes:{friendly_name:"Living Room Temperature",unit_of_measurement:"°C"}},"sensor.humidity":{state:"58",attributes:{friendly_name:"Living Room Humidity",unit_of_measurement:"%"}},"sensor.co2":{state:"812",attributes:{friendly_name:"CO₂ Level",unit_of_measurement:"ppm"}}},connection:{subscribeEvents:()=>Promise.resolve(()=>{}),sendMessagePromise:()=>Promise.resolve({})}};function Ae(a){return a.querySelector("hass-datapoints-history-card")}const ue={render:()=>de`<hass-datapoints-history-card></hass-datapoints-history-card>`,play:async({canvasElement:a})=>{const t=Ae(a);t.setConfig({entity:"sensor.temperature",hours_to_show:24}),t.hass=Se}},_e={render:()=>de`<hass-datapoints-history-card></hass-datapoints-history-card>`,play:async({canvasElement:a})=>{const t=Ae(a);t.setConfig({title:"Living Room Temperature",entity:"sensor.temperature",hours_to_show:24}),t.hass=Se}},pe={name:"Multiple Entities",render:()=>de`<hass-datapoints-history-card></hass-datapoints-history-card>`,play:async({canvasElement:a})=>{const t=Ae(a);t.setConfig({title:"Living Room Climate",entities:["sensor.temperature","sensor.humidity","sensor.co2"],hours_to_show:48}),t.hass=Se}},me={name:"Extended Range (7 days)",render:()=>de`<hass-datapoints-history-card></hass-datapoints-history-card>`,play:async({canvasElement:a})=>{const t=Ae(a);t.setConfig({title:"Weekly Overview",entity:"sensor.temperature",hours_to_show:168,show_trend_lines:!0}),t.hass=Se}};ue.parameters={...ue.parameters,docs:{...ue.parameters?.docs,source:{originalSource:`{
  render: () => html\`<hass-datapoints-history-card></hass-datapoints-history-card>\`,
  play: async ({
    canvasElement
  }) => {
    const card = getCard(canvasElement);
    card.setConfig({
      entity: "sensor.temperature",
      hours_to_show: 24
    });
    card.hass = mockHass;
  }
}`,...ue.parameters?.docs?.source},description:{story:"Single entity, no title — minimal config.",...ue.parameters?.docs?.description}}};_e.parameters={..._e.parameters,docs:{..._e.parameters?.docs,source:{originalSource:`{
  render: () => html\`<hass-datapoints-history-card></hass-datapoints-history-card>\`,
  play: async ({
    canvasElement
  }) => {
    const card = getCard(canvasElement);
    card.setConfig({
      title: "Living Room Temperature",
      entity: "sensor.temperature",
      hours_to_show: 24
    });
    card.hass = mockHass;
  }
}`,..._e.parameters?.docs?.source},description:{story:"Card with a visible title in the header.",..._e.parameters?.docs?.description}}};pe.parameters={...pe.parameters,docs:{...pe.parameters?.docs,source:{originalSource:`{
  name: "Multiple Entities",
  render: () => html\`<hass-datapoints-history-card></hass-datapoints-history-card>\`,
  play: async ({
    canvasElement
  }) => {
    const card = getCard(canvasElement);
    card.setConfig({
      title: "Living Room Climate",
      entities: ["sensor.temperature", "sensor.humidity", "sensor.co2"],
      hours_to_show: 48
    });
    card.hass = mockHass;
  }
}`,...pe.parameters?.docs?.source},description:{story:"Entities array — multiple series on one chart.",...pe.parameters?.docs?.description}}};me.parameters={...me.parameters,docs:{...me.parameters?.docs,source:{originalSource:`{
  name: "Extended Range (7 days)",
  render: () => html\`<hass-datapoints-history-card></hass-datapoints-history-card>\`,
  play: async ({
    canvasElement
  }) => {
    const card = getCard(canvasElement);
    card.setConfig({
      title: "Weekly Overview",
      entity: "sensor.temperature",
      hours_to_show: 168,
      show_trend_lines: true
    });
    card.hass = mockHass;
  }
}`,...me.parameters?.docs?.source},description:{story:"Extended time window — 7 days of history.",...me.parameters?.docs?.description}}};const Gi=["Default","WithTitle","MultipleEntities","ExtendedRange"];export{ue as Default,me as ExtendedRange,pe as MultipleEntities,_e as WithTitle,Gi as __namedExportsOrder,Yi as default};
