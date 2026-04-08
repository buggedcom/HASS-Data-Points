import{i as L,b,g as q}from"./iframe-maWesKjk.js";import{n as k}from"./property-DyW-YDBW.js";import{r as J}from"./state-D8ZE3MQ0.js";import{f as K,b as Q}from"./format-DAmR8eHG.js";const U=L`
  :host {
    display: block;
  }

  .ann-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 8px 16px;
    border-bottom: 1px solid var(--divider-color, #eee);
    cursor: default;
  }

  .ann-item:last-child {
    border-bottom: none;
  }

  .ann-item.simple {
    align-items: center;
  }

  .ann-item.is-hidden .ann-icon-main,
  .ann-item:hover .ann-icon-main {
    opacity: 0.22;
  }

  .ann-icon-wrap {
    position: relative;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 0 0 2px var(--card-background-color, #fff);
  }

  .ann-icon-main {
    transition: opacity 120ms ease;
  }

  .ann-visibility-btn {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 50%;
    background: color-mix(
      in srgb,
      var(--card-background-color, #fff) 84%,
      transparent
    );
    color: var(--primary-text-color);
    cursor: pointer;
    opacity: 0;
    transition: opacity 120ms ease;
    padding: 0;
    font: inherit;
  }

  .ann-item:hover .ann-visibility-btn,
  .ann-item.is-hidden .ann-visibility-btn {
    opacity: 1;
  }

  .ann-body {
    flex: 1;
    min-width: 0;
  }

  .ann-header {
    display: flex;
    align-items: baseline;
    gap: 6px;
    flex-wrap: nowrap;
  }

  .ann-msg {
    font-size: 0.85em;
    font-weight: 500;
    color: var(--primary-text-color);
    word-break: break-word;
    flex: 1;
    min-width: 0;
  }

  .ann-dev-badge {
    display: inline-block;
    font-size: 0.68em;
    font-weight: 700;
    color: #fff;
    background: #ff9800;
    padding: 1px 5px;
    border-radius: 4px;
    vertical-align: middle;
    margin-left: 4px;
  }

  .ann-time-wrap {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }

  .ann-time {
    font-size: 0.75em;
    color: var(--secondary-text-color);
    white-space: nowrap;
  }

  .ann-history-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: none;
    color: var(--secondary-text-color);
    padding: 0;
    cursor: pointer;
  }

  .ann-history-btn ha-icon {
    --mdc-icon-size: 14px;
  }

  .ann-note {
    font-size: 0.78em;
    color: var(--secondary-text-color);
    margin-top: 2px;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .ann-note.hidden {
    display: none;
  }

  .ann-expand-chip {
    display: inline-flex;
    align-items: center;
    margin-top: 4px;
    padding: 1px 8px;
    border-radius: 999px;
    font-size: 0.75em;
    font-weight: 600;
    color: var(--secondary-text-color);
    background: var(--secondary-background-color, rgba(0, 0, 0, 0.06));
    border: none;
    cursor: pointer;
    font-family: inherit;
  }
`;var X=Object.create,F=Object.defineProperty,Y=Object.getOwnPropertyDescriptor,P=(t,e)=>(e=Symbol[t])?e:Symbol.for("Symbol."+t),g=t=>{throw TypeError(t)},C=(t,e,n)=>e in t?F(t,e,{enumerable:!0,configurable:!0,writable:!0,value:n}):t[e]=n,Z=t=>[,,,X(t?.[P("metadata")]??null)],D=["class","method","getter","setter","accessor","field","value","get","set"],f=t=>t!==void 0&&typeof t!="function"?g("Function expected"):t,ee=(t,e,n,r,i)=>({kind:D[t],name:e,metadata:r,addInitializer:s=>n._?g("Already initialized"):i.push(f(s||null))}),te=(t,e)=>C(e,P("metadata"),t[3]),c=(t,e,n,r)=>{for(var i=0,s=t[e>>1],d=s&&s.length;i<d;i++)e&1?s[i].call(n):r=s[i].call(n,r);return r},_=(t,e,n,r,i,s)=>{for(var d,o,m,l,y,O=e&7,V=!1,A=!1,x=t.length+1,B=D[O+5],H=t[x-1]=[],R=t[x]||(t[x]=[]),p=(i=i.prototype,Y({get[n](){return ie(this,s)},set[n](h){return ae(this,s,h)}},n)),w=r.length-1;w>=0;w--)l=ee(O,n,m={},t[3],R),l.static=V,l.private=A,y=l.access={has:h=>n in h},y.get=h=>h[n],y.set=(h,G)=>h[n]=G,o=(0,r[w])({get:p.get,set:p.set},l),m._=1,o===void 0?f(o)&&(p[B]=o):typeof o!="object"||o===null?g("Object expected"):(f(d=o.get)&&(p.get=d),f(d=o.set)&&(p.set=d),f(d=o.init)&&H.unshift(d));return p&&F(i,n,p),i},ne=(t,e,n)=>C(t,e+"",n),I=(t,e,n)=>e.has(t)||g("Cannot "+n),ie=(t,e,n)=>(I(t,e,"read from private field"),e.get(t)),u=(t,e,n)=>e.has(t)?g("Cannot add the same private member more than once"):e instanceof WeakSet?e.add(t):e.set(t,n),ae=(t,e,n,r)=>(I(t,e,"write to private field"),e.set(t,n),n),T,W,j,N,$,a,E,z,S,M;class v extends($=q,N=[k({type:Object,attribute:!1})],j=[k({type:Boolean})],W=[k({type:Boolean,attribute:"show-full-message"})],T=[J()],$){constructor(){super(...arguments),u(this,E,c(a,8,this,null)),c(a,11,this),u(this,z,c(a,12,this,!1)),c(a,15,this),u(this,S,c(a,16,this,!0)),c(a,19,this),u(this,M,c(a,20,this,!1)),c(a,23,this)}_onToggleVisibility(e){e.preventDefault(),e.stopPropagation(),this.dispatchEvent(new CustomEvent("dp-sensor-record-toggle-visibility",{detail:{id:this.event?.id},bubbles:!0,composed:!0}))}_onNavigate(e){e.preventDefault(),e.stopPropagation(),this.dispatchEvent(new CustomEvent("dp-sensor-record-navigate",{detail:{event:this.event},bubbles:!0,composed:!0}))}render(){const e=this.event;if(!e)return b``;const n=e.color||"#03a9f4",r=e.icon||"mdi:bookmark",i=e.annotation&&e.annotation!==e.message?e.annotation:"",s=!i,d=this.hidden?"mdi:eye":"mdi:eye-off",o=this.hidden?"Show chart marker":"Hide chart marker",m=this.showFullMessage,l=!m&&!this._noteExpanded;return b`
      <div
        class="ann-item${this.hidden?" is-hidden":""}${s?" simple":""}"
        @click=${!m&&i?()=>{this._noteExpanded=!this._noteExpanded}:void 0}
      >
        <div class="ann-icon-wrap" style="background:${n}">
          <ha-icon
            class="ann-icon-main"
            .icon=${r}
            style="--mdc-icon-size:18px"
          ></ha-icon>
          <button
            class="ann-visibility-btn"
            type="button"
            title=${o}
            aria-label=${o}
            @click=${this._onToggleVisibility}
          >
            <ha-icon .icon=${d}></ha-icon>
          </button>
        </div>
        <div class="ann-body">
          <div class="ann-header">
            <span class="ann-msg">
              ${e.message}
              ${e.dev?b`<span class="ann-dev-badge">DEV</span>`:""}
              ${i&&!m?b`<button class="ann-expand-chip" title="Show annotation">
                    ···
                  </button>`:""}
            </span>
            <span class="ann-time-wrap">
              <span
                class="ann-time"
                title=${K(e.timestamp)}
              >
                ${Q(e.timestamp)}
              </span>
              <button
                class="ann-history-btn"
                type="button"
                title="Open related history"
                @click=${this._onNavigate}
              >
                <ha-icon icon="mdi:history"></ha-icon>
              </button>
            </span>
          </div>
          ${i?b`<div class="ann-note${l?" hidden":""}">
                ${i}
              </div>`:""}
        </div>
      </div>
    `}}a=Z($);E=new WeakMap;z=new WeakMap;S=new WeakMap;M=new WeakMap;_(a,4,"event",N,v,E);_(a,4,"hidden",j,v,z);_(a,4,"showFullMessage",W,v,S);_(a,4,"_noteExpanded",T,v,M);te(a,v);ne(v,"styles",U);customElements.define("sensor-record-item",v);
