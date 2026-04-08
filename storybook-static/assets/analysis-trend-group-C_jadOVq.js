import{i as J,b as f,A as K,g as Q}from"./iframe-maWesKjk.js";import{n as D}from"./property-DyW-YDBW.js";import{m as y}from"./localize-Cz1ya3ms.js";import{s as U}from"./analysis-group-shared.styles-Cw1nMqQy.js";import"./analysis-group-ZyfAZWsO.js";import{l as V}from"./localized-decorator-CXjGGqe_.js";const X=J``;var Z=Object.create,k=Object.defineProperty,j=Object.getOwnPropertyDescriptor,F=(t,e)=>(e=Symbol[t])?e:Symbol.for("Symbol."+t),u=t=>{throw TypeError(t)},L=(t,e,a)=>e in t?k(t,e,{enumerable:!0,configurable:!0,writable:!0,value:a}):t[e]=a,G=(t,e)=>k(t,"name",{value:e,configurable:!0}),ee=t=>[,,,Z(t?.[F("metadata")]??null)],R=["class","method","getter","setter","accessor","field","value","get","set"],b=t=>t!==void 0&&typeof t!="function"?u("Function expected"):t,te=(t,e,a,l,r)=>({kind:R[t],name:e,metadata:l,addInitializer:i=>a._?u("Already initialized"):r.push(b(i||null))}),ae=(t,e)=>L(e,F("metadata"),t[3]),g=(t,e,a,l)=>{for(var r=0,i=t[e>>1],h=i&&i.length;r<h;r++)e&1?i[r].call(a):l=i[r].call(a,l);return l},T=(t,e,a,l,r,i)=>{var h,o,E,v,m,s=e&7,w=!!(e&8),c=!!(e&16),S=s>3?t.length+1:s?w?1:2:0,N=R[s+5],P=s>3&&(t[S-1]=[]),B=t[S]||(t[S]=[]),d=s&&(!c&&!w&&(r=r.prototype),s<5&&(s>3||!c)&&j(s<4?r:{get[a](){return M(this,i)},set[a](n){return x(this,i,n)}},a));s?c&&s<4&&G(i,(s>2?"set ":s>1?"get ":"")+a):G(r,a);for(var O=l.length-1;O>=0;O--)v=te(s,a,E={},t[3],B),s&&(v.static=w,v.private=c,m=v.access={has:c?n=>re(r,n):n=>a in n},s^3&&(m.get=c?n=>(s^1?M:ie)(n,r,s^4?i:d.get):n=>n[a]),s>2&&(m.set=c?(n,$)=>x(n,r,$,s^4?i:d.set):(n,$)=>n[a]=$)),o=(0,l[O])(s?s<4?c?i:d[N]:s>4?void 0:{get:d.get,set:d.set}:r,v),E._=1,s^4||o===void 0?b(o)&&(s>4?P.unshift(o):s?c?i=o:d[N]=o:r=o):typeof o!="object"||o===null?u("Object expected"):(b(h=o.get)&&(d.get=h),b(h=o.set)&&(d.set=h),b(h=o.init)&&P.unshift(h));return s||ae(t,r),d&&k(r,a,d),c?s^4?i:d:r},se=(t,e,a)=>L(t,e+"",a),A=(t,e,a)=>e.has(t)||u("Cannot "+a),re=(t,e)=>Object(e)!==e?u('Cannot use the "in" operator on this value'):t.has(e),M=(t,e,a)=>(A(t,e,"read from private field"),a?a.call(t):e.get(t)),W=(t,e,a)=>e.has(t)?u("Cannot add the same private member more than once"):e instanceof WeakSet?e.add(t):e.set(t,a),x=(t,e,a,l)=>(A(t,e,"write to private field"),l?l.call(t,a):e.set(t,a),a),ie=(t,e,a)=>(A(t,e,"access private method"),a),Y,H,I,q,_,C,z;const le=[{value:"rolling_average",label:"Rolling average"},{value:"linear_trend",label:"Linear trend"}],ne=[{value:"1h",label:"1 hour"},{value:"6h",label:"6 hours"},{value:"24h",label:"24 hours"},{value:"7d",label:"7 days"},{value:"14d",label:"14 days"},{value:"21d",label:"21 days"},{value:"28d",label:"28 days"}];q=[V()];class p extends(I=Q,H=[D({type:Object})],Y=[D({type:String,attribute:"entity-id"})],I){constructor(){super(...arguments),W(this,C,g(_,8,this,{})),g(_,11,this),W(this,z,g(_,12,this,"")),g(_,15,this)}_emit(e,a){this.dispatchEvent(new CustomEvent("dp-group-analysis-change",{detail:{entityId:this.entityId,key:e,value:a},bubbles:!0,composed:!0}))}_localizedOptions(e){return e.map(a=>({...a,label:y(a.label)}))}_renderSelect(e,a,l){return f`
      <select
        class="select"
        @change=${r=>this._emit(e,r.target.value)}
      >
        ${a.map(r=>f`<option value=${r.value} ?selected=${r.value===l}>
              ${r.label}
            </option>`)}
      </select>
    `}_onGroupChange(e){this._emit("show_trend_lines",e.detail.checked)}_onCheckbox(e,a){this._emit(e,a.target.checked)}render(){const e=this.analysis;return f`
      <analysis-group
        .label=${y("Show trend lines")}
        .checked=${e.show_trend_lines}
        @dp-group-change=${this._onGroupChange}
      >
        <label class="option">
          <input
            type="checkbox"
            .checked=${e.show_trend_crosshairs}
            @change=${a=>this._onCheckbox("show_trend_crosshairs",a)}
          />
          <span>${y("Show trend crosshairs")}</span>
        </label>
        <label class="field">
          <span class="field-label">${y("Trend method")}</span>
          ${this._renderSelect("trend_method",this._localizedOptions(le),e.trend_method)}
        </label>
        ${e.trend_method==="rolling_average"?f`
              <label class="field">
                <span class="field-label">${y("Trend window")}</span>
                ${this._renderSelect("trend_window",this._localizedOptions(ne),e.trend_window)}
              </label>
            `:K}
      </analysis-group>
    `}}_=ee(I);C=new WeakMap;z=new WeakMap;T(_,4,"analysis",H,p,C);T(_,4,"entityId",Y,p,z);p=T(_,0,"AnalysisTrendGroup",q,p);se(p,"styles",[U,X]);g(_,1,p);customElements.define("analysis-trend-group",p);
