import{i as X,b as Y,g as Z}from"./iframe-maWesKjk.js";import{n as f}from"./property-DyW-YDBW.js";import{r as x}from"./state-D8ZE3MQ0.js";const ee=X`
  :host {
    display: block;
  }

  .edit-form {
    background: var(--secondary-background-color, #f5f5f5);
    border-radius: 8px;
    padding: 10px;
    margin-top: 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .full-width-field {
    display: block;
    width: 100%;
  }

  .edit-row {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
  }

  .edit-row > * {
    min-width: 0;
  }

  .annotation-edit {
    display: block;
    width: 100%;
    min-height: 72px;
    resize: vertical;
    box-sizing: border-box;
    padding: 8px 10px;
    border: 1px solid var(--divider-color, #9e9e9e);
    border-radius: 8px;
    background: var(--card-background-color, #fff);
    color: var(--primary-text-color);
    font: inherit;
    line-height: 1.45;
  }

  .color-swatch-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 2px solid var(--divider-color, #ccc);
    cursor: pointer;
    padding: 0;
    overflow: hidden;
    flex-shrink: 0;
    background: none;
    position: relative;
  }

  .color-swatch-btn input[type="color"] {
    position: absolute;
    top: -4px;
    left: -4px;
    width: calc(100% + 8px);
    height: calc(100% + 8px);
    border: none;
    cursor: pointer;
    padding: 0;
    background: none;
    opacity: 0;
  }

  .color-swatch-inner {
    display: block;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    pointer-events: none;
  }
`;var te=Object.create,F=Object.defineProperty,ae=Object.getOwnPropertyDescriptor,O=(t,e)=>(e=Symbol[t])?e:Symbol.for("Symbol."+t),b=t=>{throw TypeError(t)},P=(t,e,a)=>e in t?F(t,e,{enumerable:!0,configurable:!0,writable:!0,value:a}):t[e]=a,ie=t=>[,,,te(t?.[O("metadata")]??null)],T=["class","method","getter","setter","accessor","field","value","get","set"],g=t=>t!==void 0&&typeof t!="function"?b("Function expected"):t,oe=(t,e,a,n,r)=>({kind:T[t],name:e,metadata:n,addInitializer:c=>a._?b("Already initialized"):r.push(g(c||null))}),re=(t,e)=>P(e,O("metadata"),t[3]),o=(t,e,a,n)=>{for(var r=0,c=t[e>>1],d=c&&c.length;r<d;r++)e&1?c[r].call(a):n=c[r].call(a,n);return n},_=(t,e,a,n,r,c)=>{for(var d,l,z,v,m,A=e&7,q=!1,B=!1,w=t.length+1,J=T[A+5],K=t[w-1]=[],Q=t[w]||(t[w]=[]),h=(r=r.prototype,ae({get[a](){return ne(this,c)},set[a](p){return ce(this,c,p)}},a)),k=n.length-1;k>=0;k--)v=oe(A,a,z={},t[3],Q),v.static=q,v.private=B,m=v.access={has:p=>a in p},m.get=p=>p[a],m.set=(p,V)=>p[a]=V,l=(0,n[k])({get:h.get,set:h.set},v),z._=1,l===void 0?g(l)&&(h[J]=l):typeof l!="object"||l===null?b("Object expected"):(g(d=l.get)&&(h.get=d),g(d=l.set)&&(h.set=d),g(d=l.init)&&K.unshift(d));return h&&F(r,a,h),r},se=(t,e,a)=>P(t,e+"",a),D=(t,e,a)=>e.has(t)||b("Cannot "+a),ne=(t,e,a)=>(D(t,e,"read from private field"),e.get(t)),u=(t,e,a)=>e.has(t)?b("Cannot add the same private member more than once"):e instanceof WeakSet?e.add(t):e.set(t,a),ce=(t,e,a,n)=>(D(t,e,"write to private field"),e.set(t,a),a),G,I,L,U,H,N,j,y,i,$,R,C,M,E,S,W;const le={showAnnotation:"Show annotation",openHistory:"Open related data point history",editRecord:"Edit record",deleteRecord:"Delete record",showChartMarker:"Show chart marker",hideChartMarker:"Hide chart marker",chooseColor:"Choose colour",save:"Save",cancel:"Cancel",message:"Message",annotationFullMessage:"Annotation / full message"};class s extends(y=Z,j=[f({attribute:!1})],N=[f({attribute:!1})],H=[f({type:String})],U=[f({attribute:!1})],L=[x()],I=[x()],G=[x()],y){constructor(){super(...arguments),u(this,$,o(i,8,this,null)),o(i,11,this),u(this,R,o(i,12,this,null)),o(i,15,this),u(this,C,o(i,16,this,"#03a9f4")),o(i,19,this),u(this,M,o(i,20,this,le)),o(i,23,this),u(this,E,o(i,24,this,"")),o(i,27,this),u(this,S,o(i,28,this,"")),o(i,31,this),u(this,W,o(i,32,this,"mdi:bookmark")),o(i,35,this)}willUpdate(e){e.has("eventRecord")&&this.eventRecord&&(this._message=this.eventRecord.message,this._annotation=this.eventRecord.annotation&&this.eventRecord.annotation!==this.eventRecord.message?this.eventRecord.annotation:"",this._icon=this.eventRecord.icon||"mdi:bookmark",this.color=this.eventRecord.color||"#03a9f4")}_save(){const e={message:this._message.trim(),annotation:this._annotation.trim(),icon:this._icon,color:this.color};this.dispatchEvent(new CustomEvent("dp-save-edit",{detail:e,bubbles:!0,composed:!0}))}_cancel(){this.dispatchEvent(new CustomEvent("dp-cancel-edit",{bubbles:!0,composed:!0}))}render(){return Y`
      <div class="edit-form">
        <ha-textfield
          class="edit-msg full-width-field"
          label=${this.language.message}
          .value=${this._message}
          @input=${e=>{this._message=e.currentTarget.value}}
        ></ha-textfield>
        <textarea
          class="edit-ann annotation-edit"
          placeholder=${this.language.annotationFullMessage}
          .value=${this._annotation}
          @input=${e=>{this._annotation=e.currentTarget.value}}
        ></textarea>
        <div class="edit-row">
          <ha-icon-picker
            class="edit-icon-picker"
            .value=${this._icon}
            .hass=${this.hass}
            style="flex:1"
            @value-changed=${e=>{this._icon=e.detail.value||"mdi:bookmark"}}
          ></ha-icon-picker>
          <button
            class="color-swatch-btn"
            type="button"
            title=${this.language.chooseColor}
            style=${`background:${this.color}`}
          >
            <span
              class="color-swatch-inner"
              style=${`background:${this.color}`}
            ></span>
            <input
              type="color"
              .value=${this.color}
              @input=${e=>{this.color=e.currentTarget.value}}
            />
          </button>
        </div>
        <div class="edit-row">
          <ha-button raised @click=${this._save}
            >${this.language.save}</ha-button
          >
          <ha-button @click=${this._cancel}>${this.language.cancel}</ha-button>
        </div>
      </div>
    `}}i=ie(y);$=new WeakMap;R=new WeakMap;C=new WeakMap;M=new WeakMap;E=new WeakMap;S=new WeakMap;W=new WeakMap;_(i,4,"eventRecord",j,s,$);_(i,4,"hass",N,s,R);_(i,4,"color",H,s,C);_(i,4,"language",U,s,M);_(i,4,"_message",L,s,E);_(i,4,"_annotation",I,s,S);_(i,4,"_icon",G,s,W);re(i,s);se(s,"styles",ee);customElements.define("list-edit-form",s);
