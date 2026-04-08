import{i as V,b as y,g as X}from"./iframe-maWesKjk.js";import{n as m}from"./property-DyW-YDBW.js";import{r as Y}from"./state-D8ZE3MQ0.js";import"./pagination-CjLcFMPQ.js";import"./sensor-record-item-DWIkc7Bp.js";const Z=V`
  :host {
    display: block;
    flex: 1 1 0;
    min-height: 0;
    overflow: hidden;
  }

  .ann-section {
    border-top: 1px solid var(--divider-color, #eee);
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .ann-list {
    flex: 1 1 0;
    min-height: 0;
    overflow-y: auto;
  }

  .pagination-footer {
    border-top: 1px solid var(--divider-color, #eee);
    background: color-mix(
      in srgb,
      var(--card-background-color, #fff) 92%,
      var(--primary-background-color, #f7f7f7)
    );
  }

  .ann-empty {
    text-align: center;
    padding: 16px;
    color: var(--secondary-text-color);
    font-size: 0.85em;
  }
`;var ee=Object.create,C=Object.defineProperty,te=Object.getOwnPropertyDescriptor,I=(e,t)=>(t=Symbol[e])?t:Symbol.for("Symbol."+e),w=e=>{throw TypeError(e)},O=(e,t,i)=>t in e?C(e,t,{enumerable:!0,configurable:!0,writable:!0,value:i}):e[t]=i,ie=e=>[,,,ee(e?.[I("metadata")]??null)],W=["class","method","getter","setter","accessor","field","value","get","set"],u=e=>e!==void 0&&typeof e!="function"?w("Function expected"):e,ae=(e,t,i,r,s)=>({kind:W[e],name:t,metadata:r,addInitializer:n=>i._?w("Already initialized"):s.push(u(n||null))}),se=(e,t)=>O(t,I("metadata"),e[3]),d=(e,t,i,r)=>{for(var s=0,n=e[t>>1],l=n&&n.length;s<l;s++)t&1?n[s].call(i):r=n[s].call(i,r);return r},f=(e,t,i,r,s,n)=>{for(var l,o,c,p,b,$=t&7,H=!1,J=!1,S=e.length+1,K=W[$+5],L=e[S-1]=[],Q=e[S]||(e[S]=[]),g=(s=s.prototype,te({get[i](){return ne(this,n)},set[i](_){return oe(this,n,_)}},i)),x=r.length-1;x>=0;x--)p=ae($,i,c={},e[3],Q),p.static=H,p.private=J,b=p.access={has:_=>i in _},b.get=_=>_[i],b.set=(_,U)=>_[i]=U,o=(0,r[x])({get:g.get,set:g.set},p),c._=1,o===void 0?u(o)&&(g[K]=o):typeof o!="object"||o===null?w("Object expected"):(u(l=o.get)&&(g.get=l),u(l=o.set)&&(g.set=l),u(l=o.init)&&L.unshift(l));return g&&C(s,i,g),s},A=(e,t,i)=>O(e,typeof t!="symbol"?t+"":t,i),D=(e,t,i)=>t.has(e)||w("Cannot "+i),ne=(e,t,i)=>(D(e,t,"read from private field"),t.get(e)),v=(e,t,i)=>t.has(e)?w("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(e):t.set(e,i),oe=(e,t,i,r)=>(D(e,t,"write to private field"),t.set(e,i),i),P,T,q,B,j,G,z,a,M,k,E,N,R,F;class h extends(z=X,G=[m({type:Array,attribute:!1})],j=[m({type:Object,attribute:!1})],B=[m({type:Number,attribute:"page-size"})],q=[m({type:Number})],T=[m({type:Boolean,attribute:"show-full-message"})],P=[Y()],z){constructor(){super(...arguments),v(this,M,d(a,8,this,[])),d(a,11,this),v(this,k,d(a,12,this,new Set)),d(a,15,this),v(this,E,d(a,16,this,null)),d(a,19,this),v(this,N,d(a,20,this,null)),d(a,23,this),v(this,R,d(a,24,this,!0)),d(a,27,this),v(this,F,d(a,28,this,0)),d(a,31,this),A(this,"_paginationNotifyRaf",null)}updated(t){if(t.has("events")||t.has("pageSize")||t.has("limit")||t.has("_page")){const i=[...this.events].sort((l,o)=>new Date(o.timestamp).getTime()-new Date(l.timestamp).getTime()),s=(this.limit?i.slice(0,this.limit):i).length,n=this.pageSize?Math.max(1,Math.ceil(s/this.pageSize)):1;this._paginationNotifyRaf!==null&&window.cancelAnimationFrame(this._paginationNotifyRaf),this._paginationNotifyRaf=window.requestAnimationFrame(()=>{this._paginationNotifyRaf=null;const o=this.shadowRoot?.querySelector("pagination-nav")?.getBoundingClientRect().height??0;this.dispatchEvent(new CustomEvent("dp-sensor-pagination-visibility-change",{detail:{visible:n>1,height:n>1?o:0},bubbles:!0,composed:!0}))})}}disconnectedCallback(){super.disconnectedCallback(),this._paginationNotifyRaf!==null&&(window.cancelAnimationFrame(this._paginationNotifyRaf),this._paginationNotifyRaf=null)}render(){const t=[...this.events].sort((c,p)=>new Date(p.timestamp).getTime()-new Date(c.timestamp).getTime()),i=this.limit?t.slice(0,this.limit):t,r=i.length;if(!r)return y`
        <div class="ann-section">
          <div class="ann-list" tabindex="0">
            <div class="ann-empty">No records in this time window.</div>
          </div>
        </div>
      `;const s=this.pageSize?Math.max(1,Math.ceil(r/this.pageSize)):1,n=Math.min(this._page,s-1),l=this.pageSize?i.slice(n*this.pageSize,(n+1)*this.pageSize):i,o=s>1;return y`
      <div class="ann-section">
        <div class="ann-list">
          ${l.map(c=>y`
              <sensor-record-item
                .event=${c}
                .hidden=${this.hiddenEventIds.has(c.id)}
                .showFullMessage=${this.showFullMessage}
              ></sensor-record-item>
            `)}
        </div>
        ${o?y`
              <pagination-nav
                class="pagination-footer"
                .page=${n}
                .totalPages=${s}
                .totalItems=${r}
                label="records"
                @dp-page-change=${c=>{this._page=c.detail.page,this.shadowRoot?.querySelector(".ann-list")?.scrollTo(0,0)}}
              ></pagination-nav>
            `:""}
      </div>
    `}}a=ie(z);M=new WeakMap;k=new WeakMap;E=new WeakMap;N=new WeakMap;R=new WeakMap;F=new WeakMap;f(a,4,"events",G,h,M);f(a,4,"hiddenEventIds",j,h,k);f(a,4,"pageSize",B,h,E);f(a,4,"limit",q,h,N);f(a,4,"showFullMessage",T,h,R);f(a,4,"_page",P,h,F);se(a,h);A(h,"styles",Z);customElements.define("sensor-records",h);
