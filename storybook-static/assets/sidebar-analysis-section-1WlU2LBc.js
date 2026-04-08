import{i as Z,b as E,g as j}from"./iframe-maWesKjk.js";import{n as b}from"./property-DyW-YDBW.js";import{m as g}from"./localize-Cz1ya3ms.js";import"./sidebar-options-section-XIovhKDU.js";import"./checkbox-list-Z254-hxP.js";import"./radio-group-CFoLmpSs.js";import{l as ee}from"./localized-decorator-CXjGGqe_.js";const ae=Z`
  :host {
    display: block;
  }

  .no-anomalies-notice {
    margin: 0;
    padding: 8px 10px;
    border-radius: 8px;
    background: color-mix(
      in srgb,
      var(--primary-color, #03a9f4) 8%,
      transparent
    );
    border: 1px solid
      color-mix(in srgb, var(--primary-color, #03a9f4) 20%, transparent);
    color: var(--secondary-text-color);
    font-size: 0.8rem;
    line-height: 1.45;
  }

  .no-anomalies-notice strong {
    color: var(--primary-text-color);
    font-weight: 600;
  }
`;var te=Object.create,$=Object.defineProperty,oe=Object.getOwnPropertyDescriptor,G=(e,a)=>(a=Symbol[e])?a:Symbol.for("Symbol."+e),v=e=>{throw TypeError(e)},H=(e,a,t)=>a in e?$(e,a,{enumerable:!0,configurable:!0,writable:!0,value:t}):e[a]=t,L=(e,a)=>$(e,"name",{value:a,configurable:!0}),ie=e=>[,,,te(e?.[G("metadata")]??null)],R=["class","method","getter","setter","accessor","field","value","get","set"],A=e=>e!==void 0&&typeof e!="function"?v("Function expected"):e,ne=(e,a,t,s,i)=>({kind:R[e],name:a,metadata:s,addInitializer:r=>t._?v("Already initialized"):i.push(A(r||null))}),re=(e,a)=>H(a,G("metadata"),e[3]),p=(e,a,t,s)=>{for(var i=0,r=e[a>>1],m=r&&r.length;i<m;i++)a&1?r[i].call(t):s=r[i].call(t,s);return s},u=(e,a,t,s,i,r)=>{var m,c,N,y,w,o=a&7,O=!!(a&8),h=!!(a&16),S=o>3?e.length+1:o?O?1:2:0,D=R[o+5],F=o>3&&(e[S-1]=[]),X=e[S]||(e[S]=[]),d=o&&(!h&&!O&&(i=i.prototype),o<5&&(o>3||!h)&&oe(o<4?i:{get[t](){return T(this,r)},set[t](l){return Y(this,r,l)}},t));o?h&&o<4&&L(r,(o>2?"set ":o>1?"get ":"")+t):L(i,t);for(var k=s.length-1;k>=0;k--)y=ne(o,t,N={},e[3],X),o&&(y.static=O,y.private=h,w=y.access={has:h?l=>le(i,l):l=>t in l},o^3&&(w.get=h?l=>(o^1?T:ce)(l,i,o^4?r:d.get):l=>l[t]),o>2&&(w.set=h?(l,C)=>Y(l,i,C,o^4?r:d.set):(l,C)=>l[t]=C)),c=(0,s[k])(o?o<4?h?r:d[D]:o>4?void 0:{get:d.get,set:d.set}:i,y),N._=1,o^4||c===void 0?A(c)&&(o>4?F.unshift(c):o?h?r=c:d[D]=c:i=c):typeof c!="object"||c===null?v("Object expected"):(A(m=c.get)&&(d.get=m),A(m=c.set)&&(d.set=m),A(m=c.init)&&F.unshift(m));return o||re(e,i),d&&$(i,t,d),h?o^4?r:d:i},se=(e,a,t)=>H(e,a+"",t),x=(e,a,t)=>a.has(e)||v("Cannot "+t),le=(e,a)=>Object(a)!==a?v('Cannot use the "in" operator on this value'):e.has(a),T=(e,a,t)=>(x(e,a,"read from private field"),t?t.call(e):a.get(e)),f=(e,a,t)=>a.has(e)?v("Cannot add the same private member more than once"):a instanceof WeakSet?a.add(e):a.set(e,t),Y=(e,a,t,s)=>(x(e,a,"write to private field"),s?s.call(e,t):a.set(e,t),t),ce=(e,a,t)=>(x(e,a,"access private method"),t),V,q,J,K,Q,M,U,n,z,P,I,W,B;const de=[{value:"all",label:"Show all anomalies"},{value:"only",label:"Overlaps only"}];U=[ee()];class _ extends(M=j,Q=[b({type:String,attribute:"anomaly-overlap-mode"})],K=[b({type:Boolean,attribute:"show-correlated-anomalies"})],J=[b({type:Boolean,attribute:!1})],q=[b({type:Boolean})],V=[b({type:Boolean})],M){constructor(){super(...arguments),f(this,z,p(n,8,this,"all")),p(n,11,this),f(this,P,p(n,12,this,!1)),p(n,15,this),f(this,I,p(n,16,this,!1)),p(n,19,this),f(this,W,p(n,20,this,!1)),p(n,23,this),f(this,B,p(n,24,this,!0)),p(n,27,this)}_localizedOptions(a){return a.map(t=>({...t,label:g(t.label)}))}_emitAnalysis(a,t){this.dispatchEvent(new CustomEvent("dp-analysis-change",{detail:{kind:a,value:t},bubbles:!0,composed:!0}))}_onAnomalyOverlapModeChange(a){this._emitAnalysis("anomaly_overlap_mode",a.detail.value)}_onCheckboxChange(a){const{name:t,checked:s}=a.detail;this.dispatchEvent(new CustomEvent("dp-display-change",{detail:{kind:t,value:s},bubbles:!0,composed:!0}))}render(){return E`
      <sidebar-options-section
        .title=${g("Analysis")}
        .subtitle=${g("Configure how anomalies and overlapping detections are displayed.")}
        .collapsible=${this.collapsible}
        .open=${this.open}
      >
        ${this.anyAnomaliesEnabled?E`
              <checkbox-list
                .items=${[{name:"correlated_anomalies",label:g("Highlight correlated anomalies"),checked:this.showCorrelatedAnomalies}]}
                @dp-item-change=${this._onCheckboxChange}
              ></checkbox-list>
              <radio-group
                .name=${"chart-anomaly-overlap-mode"}
                .value=${this.anomalyOverlapMode}
                .options=${this._localizedOptions(de)}
                @dp-radio-change=${this._onAnomalyOverlapModeChange}
              ></radio-group>
            `:E`
              <p class="no-anomalies-notice">
                ${g("Enable anomaly detection on a target first — open a target's settings and check Show anomalies.")}
              </p>
            `}
      </sidebar-options-section>
    `}}n=ie(M);z=new WeakMap;P=new WeakMap;I=new WeakMap;W=new WeakMap;B=new WeakMap;u(n,4,"anomalyOverlapMode",Q,_,z);u(n,4,"showCorrelatedAnomalies",K,_,P);u(n,4,"anyAnomaliesEnabled",J,_,I);u(n,4,"collapsible",q,_,W);u(n,4,"open",V,_,B);_=u(n,0,"SidebarAnalysisSection",U,_);se(_,"styles",ae);p(n,1,_);customElements.define("sidebar-analysis-section",_);
