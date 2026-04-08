import{i as J,b as g,A as K,g as Q}from"./iframe-maWesKjk.js";import{n as T}from"./property-DyW-YDBW.js";import{m as y}from"./localize-Cz1ya3ms.js";import{s as U}from"./analysis-group-shared.styles-Cw1nMqQy.js";import"./analysis-group-ZyfAZWsO.js";import{l as X}from"./localized-decorator-CXjGGqe_.js";const Y=J``;var Z=Object.create,A=Object.defineProperty,j=Object.getOwnPropertyDescriptor,R=(a,e)=>(e=Symbol[a])?e:Symbol.for("Symbol."+a),p=a=>{throw TypeError(a)},W=(a,e,l)=>e in a?A(a,e,{enumerable:!0,configurable:!0,writable:!0,value:l}):a[e]=l,F=(a,e)=>A(a,"name",{value:e,configurable:!0}),ee=a=>[,,,Z(a?.[R("metadata")]??null)],x=["class","method","getter","setter","accessor","field","value","get","set"],m=a=>a!==void 0&&typeof a!="function"?p("Function expected"):a,ae=(a,e,l,i,s)=>({kind:x[a],name:e,metadata:i,addInitializer:r=>l._?p("Already initialized"):s.push(m(r||null))}),le=(a,e)=>W(e,R("metadata"),a[3]),b=(a,e,l,i)=>{for(var s=0,r=a[e>>1],v=r&&r.length;s<v;s++)e&1?r[s].call(l):i=r[s].call(l,i);return i},E=(a,e,l,i,s,r)=>{var v,o,P,h,f,t=e&7,S=!!(e&8),u=!!(e&16),w=t>3?a.length+1:t?S?1:2:0,k=x[t+5],C=t>3&&(a[w-1]=[]),H=a[w]||(a[w]=[]),c=t&&(!u&&!S&&(s=s.prototype),t<5&&(t>3||!u)&&j(t<4?s:{get[l](){return L(this,r)},set[l](n){return D(this,r,n)}},l));t?u&&t<4&&F(r,(t>2?"set ":t>1?"get ":"")+l):F(s,l);for(var O=i.length-1;O>=0;O--)h=ae(t,l,P={},a[3],H),t&&(h.static=S,h.private=u,f=h.access={has:u?n=>se(s,n):n=>l in n},t^3&&(f.get=u?n=>(t^1?L:ie)(n,s,t^4?r:c.get):n=>n[l]),t>2&&(f.set=u?(n,$)=>D(n,s,$,t^4?r:c.set):(n,$)=>n[l]=$)),o=(0,i[O])(t?t<4?u?r:c[k]:t>4?void 0:{get:c.get,set:c.set}:s,h),P._=1,t^4||o===void 0?m(o)&&(t>4?C.unshift(o):t?u?r=o:c[k]=o:s=o):typeof o!="object"||o===null?p("Object expected"):(m(v=o.get)&&(c.get=v),m(v=o.set)&&(c.set=v),m(v=o.init)&&C.unshift(v));return t||le(a,s),c&&A(s,l,c),u?t^4?r:c:s},te=(a,e,l)=>W(a,e+"",l),M=(a,e,l)=>e.has(a)||p("Cannot "+l),se=(a,e)=>Object(e)!==e?p('Cannot use the "in" operator on this value'):a.has(e),L=(a,e,l)=>(M(a,e,"read from private field"),l?l.call(a):e.get(a)),N=(a,e,l)=>e.has(a)?p("Cannot add the same private member more than once"):e instanceof WeakSet?e.add(a):e.set(a,l),D=(a,e,l,i)=>(M(a,e,"write to private field"),i?i.call(a,l):e.set(a,l),l),ie=(a,e,l)=>(M(a,e,"access private method"),l),V,q,I,B,d,z,G;const re=[{value:"raw",label:"Raw (no sampling)"},{value:"5s",label:"5 seconds"},{value:"10s",label:"10 seconds"},{value:"15s",label:"15 seconds"},{value:"30s",label:"30 seconds"},{value:"1m",label:"1 minute"},{value:"2m",label:"2 minutes"},{value:"5m",label:"5 minutes"},{value:"10m",label:"10 minutes"},{value:"15m",label:"15 minutes"},{value:"30m",label:"30 minutes"},{value:"1h",label:"1 hour"},{value:"2h",label:"2 hours"},{value:"3h",label:"3 hours"},{value:"4h",label:"4 hours"},{value:"6h",label:"6 hours"},{value:"12h",label:"12 hours"},{value:"24h",label:"24 hours"}],ne=[{value:"mean",label:"Mean (average)"},{value:"min",label:"Min"},{value:"max",label:"Max"},{value:"median",label:"Median"},{value:"first",label:"First"},{value:"last",label:"Last"}];B=[X()];class _ extends(I=Q,q=[T({type:Object})],V=[T({type:String,attribute:"entity-id"})],I){constructor(){super(...arguments),N(this,z,b(d,8,this,{})),b(d,11,this),N(this,G,b(d,12,this,"")),b(d,15,this)}_emit(e,l){this.dispatchEvent(new CustomEvent("dp-group-analysis-change",{detail:{entityId:this.entityId,key:e,value:l},bubbles:!0,composed:!0}))}_localizedOptions(e){return e.map(l=>({...l,label:y(l.label)}))}_renderSelect(e,l,i){return g`
      <select
        class="select"
        @change=${s=>this._emit(e,s.target.value)}
      >
        ${l.map(s=>g`<option value=${s.value} ?selected=${s.value===i}>
              ${s.label}
            </option>`)}
      </select>
    `}_onGroupChange(e){const l=e.detail.checked;this._emit("sample_interval",l?"5m":"raw")}render(){const e=this.analysis,l=e.sample_interval??"raw",i=l!=="raw";return g`
      <analysis-group
        .label=${y("Downsampling")}
        .checked=${i}
        @dp-group-change=${this._onGroupChange}
      >
        <label class="field">
          <span class="field-label">${y("Interval")}</span>
          ${this._renderSelect("sample_interval",this._localizedOptions(re),l)}
        </label>
        ${i?g`
              <label class="field">
                <span class="field-label">${y("Aggregate")}</span>
                ${this._renderSelect("sample_aggregate",this._localizedOptions(ne),e.sample_aggregate??"mean")}
              </label>
            `:K}
      </analysis-group>
    `}}d=ee(I);z=new WeakMap;G=new WeakMap;E(d,4,"analysis",q,_,z);E(d,4,"entityId",V,_,G);_=E(d,0,"AnalysisSampleGroup",B,_);te(_,"styles",[U,Y]);b(d,1,_);customElements.define("analysis-sample-group",_);
