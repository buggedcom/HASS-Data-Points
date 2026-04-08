import{i as q,b as a,g as B}from"./iframe-maWesKjk.js";import{n as O}from"./property-DyW-YDBW.js";import{r as J}from"./state-D8ZE3MQ0.js";import{c as K}from"./color-BkgFqjP8.js";import{f as I}from"./format-DAmR8eHG.js";import{e as Q,a as X,d as Y,b as Z,c as ee,f as te,l as ie,g as ne}from"./entity-name-TOInf1r0.js";import"./list-edit-form-CEN9a3dg.js";const ae=q`
  :host {
    display: block;
  }

  .event-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 10px 16px;
    border-bottom: 1px solid var(--divider-color, #eee);
    border-radius: 12px;
    position: relative;
    transition: background 0.15s;
  }

  .event-item.simple {
    align-items: center;
  }

  .event-item:hover {
    background: var(--secondary-background-color, rgba(0, 0, 0, 0.02));
  }

  .event-item:last-child {
    border-bottom: none;
  }

  .event-item.is-hidden .ev-icon-main,
  .event-item:hover .ev-icon-main {
    opacity: 0.22;
  }

  .event-item.is-hidden {
    opacity: 0.58;
    background: color-mix(
      in srgb,
      var(--disabled-text-color, #9aa0a6) 8%,
      transparent
    );
  }

  .event-item.is-hidden .ev-message,
  .event-item.is-hidden .ev-full-message,
  .event-item.is-hidden .ev-time-below,
  .event-item.is-hidden .ev-history-link,
  .event-item.is-hidden .ev-entity-chip {
    color: color-mix(in srgb, var(--primary-text-color, #111) 60%, transparent);
  }

  .event-item.expandable {
    cursor: pointer;
  }

  .ev-icon-wrap {
    position: relative;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .ev-icon-main {
    transition: opacity 120ms ease;
  }

  .ev-body {
    flex: 1;
    min-width: 0;
  }

  .ev-header {
    display: flex;
    align-items: flex-start;
    gap: 6px;
  }

  .ev-header-text {
    flex: 1;
    min-width: 0;
  }

  .ev-message {
    display: block;
    font-weight: 600;
    font-size: 1rem;
    line-height: 1.45;
    color: var(--primary-text-color);
    word-break: break-word;
  }

  .ev-dev-badge {
    display: inline-block;
    font-size: 0.68em;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: #fff;
    background: #ff9800;
    padding: 1px 5px;
    border-radius: 4px;
    vertical-align: middle;
    margin-left: 4px;
  }

  .ev-meta {
    margin-top: 6px;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .ev-history-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--secondary-text-color);
    padding: 0;
    margin: 0;
    cursor: pointer;
    font: inherit;
    text-align: left;
    border-radius: 8px;
    text-decoration: none;
    border: none;
    background: none;
  }

  .ev-history-link:hover {
    text-decoration: underline;
  }

  .ev-time-below {
    font-size: 0.92rem;
    font-weight: 500;
    line-height: 1.35;
    color: var(--secondary-text-color);
    display: block;
  }

  .ev-history-link ha-icon {
    --mdc-icon-size: 18px;
  }

  .ann-expand-chip {
    display: inline-flex;
    align-items: center;
    margin-top: 4px;
    padding: 1px 8px;
    border-radius: 999px;
    font-size: 0.75em;
    font-weight: 600;
    letter-spacing: 0.05em;
    color: var(--secondary-text-color);
    background: var(--secondary-background-color, rgba(0, 0, 0, 0.06));
    border: none;
    cursor: pointer;
    font-family: inherit;
  }

  .ev-full-message {
    font-size: 1rem;
    line-height: 1.6;
    color: var(--primary-text-color);
    margin-top: 10px;
  }

  .ev-full-message.hidden {
    display: none;
  }

  .ev-full-message span {
    white-space: pre-wrap;
    word-break: break-word;
  }

  .ev-entities {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 8px;
  }

  .ev-entity-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.92em;
    line-height: 1.2;
    color: var(--primary-color);
    background: color-mix(in srgb, var(--primary-color) 12%, transparent);
    padding: 4px 7px;
    border-radius: 999px;
    cursor: pointer;
    border: none;
    font-family: inherit;
    transition: background 0.15s;
  }

  .ev-entity-chip:hover {
    background: color-mix(in srgb, var(--primary-color) 22%, transparent);
  }

  .ev-entity-chip ha-icon,
  .ev-entity-chip ha-state-icon {
    --mdc-icon-size: 16px;
    flex: 0 0 auto;
  }

  .ev-entity-chip-text {
    display: inline-flex;
    flex-direction: column;
    align-items: flex-start;
    min-width: 0;
    line-height: 1.15;
  }

  .ev-entity-chip-primary,
  .ev-entity-chip-secondary {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .ev-entity-chip-primary {
    font-weight: 600;
  }

  .ev-entity-chip-secondary {
    font-size: 0.74rem;
    opacity: 0.78;
  }

  .ev-actions {
    display: flex;
    gap: 0;
    flex-shrink: 0;
    opacity: 0;
    transition: opacity 0.15s;
  }

  .event-item:hover .ev-actions,
  .event-item.is-hidden .ev-actions,
  .event-item:focus-within .ev-actions {
    opacity: 1;
  }
`;var oe=Object.create,N=Object.defineProperty,se=Object.getOwnPropertyDescriptor,H=(t,e)=>(e=Symbol[t])?e:Symbol.for("Symbol."+t),_=t=>{throw TypeError(t)},L=(t,e,n)=>e in t?N(t,e,{enumerable:!0,configurable:!0,writable:!0,value:n}):t[e]=n,re=t=>[,,,oe(t?.[H("metadata")]??null)],T=["class","method","getter","setter","accessor","field","value","get","set"],b=t=>t!==void 0&&typeof t!="function"?_("Function expected"):t,ce=(t,e,n,r,o)=>({kind:T[t],name:e,metadata:r,addInitializer:s=>n._?_("Already initialized"):o.push(b(s||null))}),le=(t,e)=>L(e,H("metadata"),t[3]),g=(t,e,n,r)=>{for(var o=0,s=t[e>>1],c=s&&s.length;o<c;o++)e&1?s[o].call(n):r=s[o].call(n,r);return r},M=(t,e,n,r,o,s)=>{for(var c,l,$,h,m,u=e&7,w=!1,k=!1,v=t.length+1,f=T[u+5],R=t[v-1]=[],C=t[v]||(t[v]=[]),p=(o=o.prototype,se({get[n](){return pe(this,s)},set[n](i){return he(this,s,i)}},n)),E=r.length-1;E>=0;E--)h=ce(u,n,$={},t[3],C),h.static=w,h.private=k,m=h.access={has:i=>n in i},m.get=i=>i[n],m.set=(i,y)=>i[n]=y,l=(0,r[E])({get:p.get,set:p.set},h),$._=1,l===void 0?b(l)&&(p[f]=l):typeof l!="object"||l===null?_("Object expected"):(b(c=l.get)&&(p.get=c),b(c=l.set)&&(p.set=c),b(c=l.init)&&R.unshift(c));return p&&N(o,n,p),o},de=(t,e,n)=>L(t,e+"",n),W=(t,e,n)=>e.has(t)||_("Cannot "+n),pe=(t,e,n)=>(W(t,e,"read from private field"),e.get(t)),z=(t,e,n)=>e.has(t)?_("Cannot add the same private member more than once"):e instanceof WeakSet?e.add(t):e.set(t,n),he=(t,e,n,r)=>(W(t,e,"write to private field"),e.set(t,n),n),G,j,U,S,d,A,P,D;const ve={showAnnotation:"Show annotation",openHistory:"Open related data point history",editRecord:"Edit record",deleteRecord:"Delete record",showChartMarker:"Show chart marker",hideChartMarker:"Hide chart marker",chooseColor:"Choose colour",save:"Save",cancel:"Cancel",message:"Message",annotationFullMessage:"Annotation / full message"};class x extends(S=B,U=[O({attribute:!1})],j=[O({attribute:!1})],G=[J()],S){constructor(){super(...arguments),z(this,A,g(d,8,this,null)),g(d,11,this),z(this,P,g(d,12,this,{hass:null,showActions:!0,showEntities:!0,showFullMessage:!0,hidden:!1,editing:!1,editColor:"#03a9f4",language:ve})),g(d,15,this),z(this,D,g(d,16,this,!1)),g(d,19,this)}_dispatch(e,n={}){this.dispatchEvent(new CustomEvent(e,{detail:n,bubbles:!0,composed:!0}))}render(){if(!this.eventRecord)return a``;const e=this.eventRecord,n=this.context.showActions,r=this.context.showEntities,o=this.context.showFullMessage,s=e.annotation&&e.annotation!==e.message?e.annotation.trim():"",c=e.color||"#03a9f4",l=e.icon||"mdi:bookmark",$=K(c),h=e.entity_ids||[],m=e.device_ids||[],u=e.area_ids||[],w=e.label_ids||[],k=h.length||m.length||u.length||w.length,v=!o&&!!s,f=this.context.hidden,R=f?"mdi:eye":"mdi:eye-off",C=f?this.context.language.showChartMarker:this.context.language.hideChartMarker,p=this.context.editing;return a`
      <div
        class="event-item${v?" expandable":""}${f?" is-hidden":""}${!s&&!k?" simple":""}"
        data-id=${e.id}
        @mouseenter=${()=>{this._dispatch("dp-hover-event-record",{eventId:e.id,hovered:!0,eventRecord:e})}}
        @mouseleave=${()=>{this._dispatch("dp-hover-event-record",{eventId:e.id,hovered:!1,eventRecord:e})}}
        @click=${v?i=>{i.target.closest(".ev-actions, .ev-entity-chip, .edit-form, ha-icon-button, ha-button")||(this._annotationExpanded=!this._annotationExpanded)}:void 0}
      >
        <div class="ev-icon-wrap" style=${`background:${c}`}>
          <ha-icon
            class="ev-icon-main"
            .icon=${l}
            style=${`--mdc-icon-size:18px;color:${$}`}
          ></ha-icon>
        </div>
        <div class="ev-body">
          <div class="ev-header">
            <div class="ev-header-text">
              <span class="ev-message">
                ${e.message}
                ${e.dev?a`<span class="ev-dev-badge">DEV</span>`:""}
                ${v?a`<button
                      class="ann-expand-chip"
                      title=${this.context.language.showAnnotation}
                    >
                      ···
                    </button>`:""}
              </span>
              <div class="ev-meta">
                <button
                  class="ev-history-link"
                  type="button"
                  title=${this.context.language.openHistory}
                  aria-label=${this.context.language.openHistory}
                  @click=${i=>{i.preventDefault(),i.stopPropagation(),this._dispatch("dp-open-history",{eventRecord:e})}}
                >
                  <ha-icon icon="mdi:history"></ha-icon>
                  <span
                    class="ev-time-below"
                    title=${I(e.timestamp)}
                    >${I(e.timestamp)}</span
                  >
                </button>
              </div>
            </div>
            ${n?a`
                  <div class="ev-actions">
                    <ha-icon-button
                      label=${C}
                      @click=${i=>{i.stopPropagation(),this._dispatch("dp-toggle-visibility",{eventId:e.id})}}
                    >
                      <ha-icon icon=${R}></ha-icon>
                    </ha-icon-button>
                    <ha-icon-button
                      label=${this.context.language.editRecord}
                      @click=${i=>{i.stopPropagation(),this._dispatch("dp-edit-event",{eventRecord:e})}}
                    >
                      <ha-icon icon="mdi:pencil-outline"></ha-icon>
                    </ha-icon-button>
                    <ha-icon-button
                      label=${this.context.language.deleteRecord}
                      style="--icon-primary-color:var(--error-color,#f44336)"
                      @click=${i=>{i.stopPropagation(),this._dispatch("dp-delete-event",{eventRecord:e})}}
                    >
                      <ha-icon icon="mdi:delete-outline"></ha-icon>
                    </ha-icon-button>
                  </div>
                `:""}
          </div>
          ${s?a`<div
                class="ev-full-message${o||this._annotationExpanded?"":" hidden"}"
              >
                <span>${s}</span>
              </div>`:""}
          ${r&&k?a`
                <div class="ev-entities">
                  ${h.map(i=>a`
                      ${(()=>{const y=Q(this.context.hass,i),V=y!==i;return a`
                          <button
                            class="ev-entity-chip"
                            @click=${F=>{F.preventDefault(),F.stopPropagation(),this._dispatch("dp-more-info",{entityId:i})}}
                          >
                            ${this.context.hass?.states?.[i]?a`<ha-state-icon
                                  .stateObj=${this.context.hass.states[i]}
                                  .hass=${this.context.hass}
                                ></ha-state-icon>`:a`<ha-icon
                                  .icon=${X(this.context.hass,i)}
                                ></ha-icon>`}
                            <span class="ev-entity-chip-text">
                              <span class="ev-entity-chip-primary"
                                >${y}</span
                              >
                              ${V?a`<span class="ev-entity-chip-secondary"
                                    >${i}</span
                                  >`:a``}
                            </span>
                          </button>
                        `})()}
                    `)}
                  ${m.map(i=>a`
                      <span class="ev-entity-chip">
                        <ha-icon
                          .icon=${Y(this.context.hass,i)}
                        ></ha-icon>
                        ${Z(this.context.hass,i)}
                      </span>
                    `)}
                  ${u.map(i=>a`
                      <span class="ev-entity-chip">
                        <ha-icon
                          .icon=${ee(this.context.hass,i)}
                        ></ha-icon>
                        ${te(this.context.hass,i)}
                      </span>
                    `)}
                  ${w.map(i=>a`
                      <span class="ev-entity-chip">
                        <ha-icon
                          .icon=${ie(this.context.hass,i)}
                        ></ha-icon>
                        ${ne(this.context.hass,i)}
                      </span>
                    `)}
                </div>
              `:""}
          ${n&&p?a`
                <list-edit-form
                  .eventRecord=${e}
                  .hass=${this.context.hass}
                  .color=${this.context.editColor}
                  .language=${this.context.language}
                  @dp-save-edit=${i=>{this._dispatch("dp-save-edit",{eventRecord:e,values:i.detail})}}
                  @dp-cancel-edit=${()=>{this._dispatch("dp-cancel-edit",{eventRecord:e})}}
                ></list-edit-form>
              `:""}
        </div>
      </div>
    `}}d=re(S);A=new WeakMap;P=new WeakMap;D=new WeakMap;M(d,4,"eventRecord",U,x,A);M(d,4,"context",j,x,P);M(d,4,"_annotationExpanded",G,x,D);le(d,x);de(x,"styles",ae);customElements.define("list-event-item",x);
