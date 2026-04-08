import{i as _e,A as B,b as T,g as ye}from"./iframe-maWesKjk.js";import{f as te,w as ae,u as ne,e as C}from"./index-BVN6m9Ti.js";import{n as m}from"./property-DyW-YDBW.js";import{m as b}from"./localize-Cz1ya3ms.js";import"./range-timeline-kmNm3Bww.js";import{l as Se}from"./localized-decorator-CXjGGqe_.js";import"./preload-helper-PPVm8Dsz.js";import"./range-handle-B7j9y8oM.js";const xe=_e`
  :host {
    --dp-spacing-xs: calc(var(--spacing, 8px) * 0.5);
    --dp-spacing-sm: var(--spacing, 8px);
    --dp-spacing-md: calc(var(--spacing, 8px) * 1.5);
    --dp-spacing-lg: calc(var(--spacing, 8px) * 2);
  }

  .date-window-dialog-content {
    display: grid;
    gap: var(--dp-spacing-sm);
    padding: var(--dp-spacing-sm) 0 0;
    overflow: visible;
  }

  .date-window-dialog-body {
    color: var(--secondary-text-color);
    line-height: 1.4;
    margin-bottom: calc(var(--dp-spacing-xs) * -1);
  }

  .date-window-dialog-field {
    display: grid;
    gap: var(--dp-spacing-xs);
    overflow: visible;
  }

  .date-window-dialog-field.name-field {
    max-width: 320px;
  }

  .date-window-dialog-field label {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--primary-text-color);
  }

  .date-window-dialog-field ha-textfield,
  .date-window-dialog-field input {
    width: 100%;
  }

  .date-window-dialog-dates {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--dp-spacing-sm);
  }

  .date-window-dialog-input {
    width: 100%;
    min-height: 44px;
    padding: 0 12px;
    border: 1px solid
      color-mix(
        in srgb,
        var(--divider-color, rgba(0, 0, 0, 0.12)) 92%,
        transparent
      );
    border-radius: 12px;
    background: var(--card-background-color, #fff);
    color: var(--primary-text-color);
    font: inherit;
    box-sizing: border-box;
  }

  .date-window-dialog-input:focus {
    outline: 2px solid
      color-mix(in srgb, var(--primary-color, #03a9f4) 36%, transparent);
    outline-offset: 1px;
    border-color: color-mix(
      in srgb,
      var(--primary-color, #03a9f4) 55%,
      transparent
    );
  }

  .date-window-dialog-timeline {
    border-radius: 8px;
    overflow: hidden;
    margin: calc(var(--dp-spacing-xs) * -1) 0;
  }

  .date-window-dialog-timeline range-timeline {
    display: block;
    height: 64px;
  }

  .date-window-dialog-shortcuts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--dp-spacing-sm);
  }

  .date-window-dialog-actions {
    display: flex;
    justify-content: space-between;
    gap: var(--dp-spacing-sm);
    padding-top: 0;
    margin-top: calc(var(--dp-spacing-xs) * -1);
  }

  .date-window-dialog-actions-right {
    display: flex;
    justify-content: flex-end;
    gap: var(--dp-spacing-sm);
    margin-left: auto;
  }

  .date-window-dialog-actions ha-button {
    --mdc-typography-button-font-size: 0.875rem;
  }

  .date-window-dialog-cancel {
    --mdc-theme-primary: var(--primary-text-color);
  }

  .date-window-dialog-submit {
    --mdc-theme-primary: var(--primary-color, #03a9f4);
  }

  .date-window-dialog-delete {
    --mdc-theme-primary: var(--error-color, #db4437);
  }

  @keyframes dp-dialog-shake {
    10%,
    90% {
      transform: translate3d(-2px, 0, 0);
    }
    20%,
    80% {
      transform: translate3d(4px, 0, 0);
    }
    30%,
    50%,
    70% {
      transform: translate3d(-6px, 0, 0);
    }
    40%,
    60% {
      transform: translate3d(6px, 0, 0);
    }
  }

  ha-dialog.dp-shaking {
    animation: dp-dialog-shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
  }

  @media (max-width: 720px) {
    .date-window-dialog-dates {
      grid-template-columns: 1fr;
    }
  }
`;var $e=Object.create,A=Object.defineProperty,ke=Object.getOwnPropertyDescriptor,ie=(t,e)=>(e=Symbol[t])?e:Symbol.for("Symbol."+t),y=t=>{throw TypeError(t)},oe=(t,e,a)=>e in t?A(t,e,{enumerable:!0,configurable:!0,writable:!0,value:a}):t[e]=a,X=(t,e)=>A(t,"name",{value:e,configurable:!0}),De=t=>[,,,$e(t?.[ie("metadata")]??null)],de=["class","method","getter","setter","accessor","field","value","get","set"],L=t=>t!==void 0&&typeof t!="function"?y("Function expected"):t,Ee=(t,e,a,s,o)=>({kind:de[t],name:e,metadata:s,addInitializer:r=>a._?y("Already initialized"):o.push(L(r||null))}),Ve=(t,e)=>oe(e,ie("metadata"),t[3]),d=(t,e,a,s)=>{for(var o=0,r=t[e>>1],h=r&&r.length;o<h;o++)e&1?r[o].call(a):s=r[o].call(a,s);return s},p=(t,e,a,s,o,r)=>{var h,c,S,_,f,i=e&7,x=!!(e&8),v=!!(e&16),M=i>3?t.length+1:i?x?1:2:0,J=de[i+5],Q=i>3&&(t[M-1]=[]),fe=t[M]||(t[M]=[]),u=i&&(!v&&!x&&(o=o.prototype),i<5&&(i>3||!v)&&ke(i<4?o:{get[a](){return Z(this,r)},set[a](w){return ee(this,r,w)}},a));i?v&&i<4&&X(r,(i>2?"set ":i>1?"get ":"")+a):X(o,a);for(var H=s.length-1;H>=0;H--)_=Ee(i,a,S={},t[3],fe),i&&(_.static=x,_.private=v,f=_.access={has:v?w=>Ce(o,w):w=>a in w},i^3&&(f.get=v?w=>(i^1?Z:Le)(w,o,i^4?r:u.get):w=>w[a]),i>2&&(f.set=v?(w,W)=>ee(w,o,W,i^4?r:u.set):(w,W)=>w[a]=W)),c=(0,s[H])(i?i<4?v?r:u[J]:i>4?void 0:{get:u.get,set:u.set}:o,_),S._=1,i^4||c===void 0?L(c)&&(i>4?Q.unshift(c):i?v?r=c:u[J]=c:o=c):typeof c!="object"||c===null?y("Object expected"):(L(h=c.get)&&(u.get=h),L(h=c.set)&&(u.set=h),L(h=c.init)&&Q.unshift(h));return i||Ve(t,o),u&&A(o,a,u),v?i^4?r:u:o},Te=(t,e,a)=>oe(t,e+"",a),R=(t,e,a)=>e.has(t)||y("Cannot "+a),Ce=(t,e)=>Object(e)!==e?y('Cannot use the "in" operator on this value'):t.has(e),Z=(t,e,a)=>(R(t,e,"read from private field"),a?a.call(t):e.get(t)),g=(t,e,a)=>e.has(t)?y("Cannot add the same private member more than once"):e instanceof WeakSet?e.add(t):e.set(t,a),ee=(t,e,a,s)=>(R(t,e,"write to private field"),s?s.call(t,a):e.set(t,a),a),Le=(t,e,a)=>(R(t,e,"access private method"),a),se,re,le,ce,we,pe,he,ue,me,ge,ve,z,be,n,q,O,P,I,N,F,U,j,G,K,Y;be=[Se()];class l extends(z=ye,ve=[m({type:Boolean})],ge=[m({type:String})],me=[m({type:String})],ue=[m({type:String,attribute:"start-value"})],he=[m({type:String,attribute:"end-value"})],pe=[m({type:Boolean,attribute:"show-delete"})],we=[m({type:Boolean,attribute:"show-shortcuts"})],ce=[m({type:String,attribute:"submit-label"})],le=[m({type:Object})],re=[m({type:String,attribute:"zoom-level"})],se=[m({type:String,attribute:"date-snapping"})],z){constructor(){super(...arguments),g(this,q,d(n,8,this,!1)),d(n,11,this),g(this,O,d(n,12,this,"Add date window")),d(n,15,this),g(this,P,d(n,16,this,"")),d(n,19,this),g(this,I,d(n,20,this,"")),d(n,23,this),g(this,N,d(n,24,this,"")),d(n,27,this),g(this,F,d(n,28,this,!1)),d(n,31,this),g(this,U,d(n,32,this,!1)),d(n,35,this),g(this,j,d(n,36,this,"Create date window")),d(n,39,this),g(this,G,d(n,40,this,null)),d(n,43,this),g(this,K,d(n,44,this,"auto")),d(n,47,this),g(this,Y,d(n,48,this,"hour")),d(n,51,this)}shake(){const e=this.shadowRoot?.querySelector("ha-dialog");e&&(e.classList.remove("dp-shaking"),e.offsetWidth,e.classList.add("dp-shaking"),e.addEventListener("animationend",()=>e.classList.remove("dp-shaking"),{once:!0}))}_emit(e,a={}){this.dispatchEvent(new CustomEvent(e,{detail:a,bubbles:!0,composed:!0}))}_onDialogClosed(){this._emit("dp-window-close")}_onCancel(){this._emit("dp-window-close")}_onSubmit(){const e=this.shadowRoot?.querySelector("#date-window-name"),a=this.shadowRoot?.querySelector("#date-window-start"),s=this.shadowRoot?.querySelector("#date-window-end"),o=e?.value??this.name;this._emit("dp-window-submit",{name:String(o??"").trim(),start:a?.value??this.startValue,end:s?.value??this.endValue})}_onDelete(){this._emit("dp-window-delete")}_onPreviousShortcut(){this._emit("dp-window-shortcut",{direction:-1})}_onNextShortcut(){this._emit("dp-window-shortcut",{direction:1})}_onDateChange(){const e=this.shadowRoot?.querySelector("#date-window-start"),a=this.shadowRoot?.querySelector("#date-window-end");this._emit("dp-window-date-change",{start:e?.value??"",end:a?.value??""})}_onRangeCommit(e){const{start:a,end:s}=e.detail??{};if(!a||!s)return;const o=_=>{const f=new Date(_),i=x=>String(x).padStart(2,"0");return`${f.getFullYear()}-${i(f.getMonth()+1)}-${i(f.getDate())}T${i(f.getHours())}:${i(f.getMinutes())}`},r=o(a),h=o(s),c=this.shadowRoot?.querySelector("#date-window-start"),S=this.shadowRoot?.querySelector("#date-window-end");c&&(c.value=r),S&&(S.value=h),this._emit("dp-window-date-change",{start:r,end:h})}_parseValueToDate(e){if(!e)return null;const a=new Date(e);return Number.isNaN(a.getTime())?null:a}render(){return T`
      <ha-dialog
        ?open=${this.open}
        hideActions
        .scrimClickAction=${"close"}
        .escapeKeyAction=${"close"}
        @closed=${this._onDialogClosed}
      >
        <span slot="heading">${this.heading}</span>
        <div class="date-window-dialog-content">
          <div class="date-window-dialog-body">
            ${b("A date window saves a named date range as a tab, so you can quickly preview it against the selected range or jump the chart back to it later.")}
          </div>

          <div class="date-window-dialog-field name-field">
            <ha-textfield
              id="date-window-name"
              label=${b("Name")}
              placeholder=${b("e.g. Heating season start")}
              .value=${this.name}
            ></ha-textfield>
          </div>

          <div class="date-window-dialog-field">
            <label>${b("Date range")}</label>
            <div class="date-window-dialog-dates">
              <div class="date-window-dialog-field">
                <label for="date-window-start">${b("Start")}</label>
                <input
                  id="date-window-start"
                  class="date-window-dialog-input"
                  type="datetime-local"
                  step="60"
                  .value=${this.startValue}
                  @change=${this._onDateChange}
                />
              </div>
              <div class="date-window-dialog-field">
                <label for="date-window-end">${b("End")}</label>
                <input
                  id="date-window-end"
                  class="date-window-dialog-input"
                  type="datetime-local"
                  step="60"
                  .value=${this.endValue}
                  @change=${this._onDateChange}
                />
              </div>
            </div>
          </div>

          ${this.rangeBounds?T`
                <div class="date-window-dialog-timeline">
                  <range-timeline
                    .startTime=${this._parseValueToDate(this.startValue)}
                    .endTime=${this._parseValueToDate(this.endValue)}
                    .rangeBounds=${this.rangeBounds}
                    .zoomLevel=${this.zoomLevel}
                    .dateSnapping=${this.dateSnapping}
                    @dp-range-commit=${this._onRangeCommit}
                  ></range-timeline>
                </div>
              `:B}
          ${this.showShortcuts?T`
                <div class="date-window-dialog-shortcuts">
                  <ha-button @click=${this._onPreviousShortcut}
                    >${b("Use previous range")}</ha-button
                  >
                  <ha-button @click=${this._onNextShortcut}
                    >${b("Use next range")}</ha-button
                  >
                </div>
              `:B}

          <div class="date-window-dialog-actions">
            ${this.showDelete?T`
                  <ha-button
                    class="date-window-dialog-delete"
                    @click=${this._onDelete}
                    >${b("Delete date window")}</ha-button
                  >
                `:B}
            <div class="date-window-dialog-actions-right">
              <ha-button
                class="date-window-dialog-cancel"
                @click=${this._onCancel}
                >${b("Cancel")}</ha-button
              >
              <ha-button
                raised
                class="date-window-dialog-submit"
                @click=${this._onSubmit}
                >${this.submitLabel}</ha-button
              >
            </div>
          </div>
        </div>
      </ha-dialog>
    `}}n=De(z);q=new WeakMap;O=new WeakMap;P=new WeakMap;I=new WeakMap;N=new WeakMap;F=new WeakMap;U=new WeakMap;j=new WeakMap;G=new WeakMap;K=new WeakMap;Y=new WeakMap;p(n,4,"open",ve,l,q);p(n,4,"heading",ge,l,O);p(n,4,"name",me,l,P);p(n,4,"startValue",ue,l,I);p(n,4,"endValue",he,l,N);p(n,4,"showDelete",pe,l,F);p(n,4,"showShortcuts",we,l,U);p(n,4,"submitLabel",ce,l,j);p(n,4,"rangeBounds",le,l,G);p(n,4,"zoomLevel",re,l,K);p(n,4,"dateSnapping",se,l,Y);l=p(n,0,"DateWindowDialog",be,l);Te(l,"styles",xe);d(n,1,l);customElements.define("date-window-dialog",l);const Oe={title:"Molecules/Date Window Dialog",component:"date-window-dialog",parameters:{actions:{handles:["dp-window-close","dp-window-submit","dp-window-delete","dp-window-shortcut","dp-window-date-change"]},docs:{description:{component:"`date-window-dialog` renders the Add / Edit date window dialog.\nIt wraps `ha-dialog` and provides a controlled form for setting a named date range.\n\nThe component is fully controlled — all field values come from props and\nthe parent updates them in response to events.\n\n@fires dp-window-close - `{}` fired when Cancel is clicked or the dialog is dismissed\n@fires dp-window-submit - `{ name: string, start: string, end: string }` fired on submit\n@fires dp-window-delete - `{}` fired when the Delete button is clicked\n@fires dp-window-shortcut - `{ direction: -1 | 1 }` fired when a shortcut button is clicked\n@fires dp-window-date-change - `{ start: string, end: string }` fired when a date input changes"}}},argTypes:{open:{control:"boolean",description:"Whether the dialog is open."},heading:{control:"text",description:"Title shown in the dialog header."},name:{control:"text",description:"Current value of the name text field."},startValue:{control:"text",description:"Current value of the start datetime-local input."},endValue:{control:"text",description:"Current value of the end datetime-local input."},showDelete:{control:"boolean",description:"Whether the Delete button is shown (true when editing an existing window)."},showShortcuts:{control:"boolean",description:"Whether the 'Use previous/next range' shortcut buttons are shown."},submitLabel:{control:"text",description:'Label for the submit button. E.g. "Create date window" or "Save date window".'}},args:{open:!0,heading:"Add date window",name:"",startValue:"",endValue:"",showDelete:!1,showShortcuts:!1,submitLabel:"Create date window"},render:t=>T`
    <date-window-dialog
      .open=${t.open}
      .heading=${t.heading}
      .name=${t.name}
      .startValue=${t.startValue}
      .endValue=${t.endValue}
      .showDelete=${t.showDelete}
      .showShortcuts=${t.showShortcuts}
      .submitLabel=${t.submitLabel}
    ></date-window-dialog>
  `},$={args:{heading:"Add date window",startValue:"2025-01-01T00:00",endValue:"2025-01-07T00:00",showShortcuts:!0,submitLabel:"Create date window"}},k={args:{heading:"Edit date window",name:"Heating season",startValue:"2024-11-01T00:00",endValue:"2025-03-31T00:00",showDelete:!0,showShortcuts:!1,submitLabel:"Save date window"}},D={args:{open:!1}},E={args:{name:"Test window",startValue:"2025-01-01T00:00",endValue:"2025-01-07T00:00",submitLabel:"Create date window"},play:async({canvasElement:t})=>{const e=t.querySelector("date-window-dialog"),a=te();e.addEventListener("dp-window-submit",a);const s=ae(e.shadowRoot);await ne.click(s.getByText("Create date window")),await C(a).toHaveBeenCalledOnce();const o=a.mock.calls[0][0].detail;await C(o).toHaveProperty("name"),await C(o).toHaveProperty("start"),await C(o).toHaveProperty("end")}},V={args:{heading:"Edit date window",name:"Heating season",startValue:"2024-11-01T00:00",endValue:"2025-03-31T00:00",showDelete:!0,submitLabel:"Save date window"},play:async({canvasElement:t})=>{const e=t.querySelector("date-window-dialog"),a=te();e.addEventListener("dp-window-delete",a);const s=ae(e.shadowRoot);await ne.click(s.getByText("Delete date window")),await C(a).toHaveBeenCalledOnce()}};$.parameters={...$.parameters,docs:{...$.parameters?.docs,source:{originalSource:`{
  args: {
    heading: "Add date window",
    startValue: "2025-01-01T00:00",
    endValue: "2025-01-07T00:00",
    showShortcuts: true,
    submitLabel: "Create date window"
  }
}`,...$.parameters?.docs?.source},description:{story:"Add mode — empty name field, no delete button, shortcut buttons visible.",...$.parameters?.docs?.description}}};k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  args: {
    heading: "Edit date window",
    name: "Heating season",
    startValue: "2024-11-01T00:00",
    endValue: "2025-03-31T00:00",
    showDelete: true,
    showShortcuts: false,
    submitLabel: "Save date window"
  }
}`,...k.parameters?.docs?.source},description:{story:"Edit mode — pre-filled name, delete button shown, no shortcuts.",...k.parameters?.docs?.description}}};D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  args: {
    open: false
  }
}`,...D.parameters?.docs?.source},description:{story:"Dialog closed — open=false, dialog is not visible.",...D.parameters?.docs?.description}}};E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  args: {
    name: "Test window",
    startValue: "2025-01-01T00:00",
    endValue: "2025-01-07T00:00",
    submitLabel: "Create date window"
  },
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const host = canvasElement.querySelector("date-window-dialog") as HTMLElement;
    const handler = fn();
    host.addEventListener("dp-window-submit", handler);
    const canvas = within(host.shadowRoot as unknown as HTMLElement);
    await userEvent.click(canvas.getByText("Create date window"));
    await expect(handler).toHaveBeenCalledOnce();
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail as {
      name: string;
      start: string;
      end: string;
    };
    await expect(detail).toHaveProperty("name");
    await expect(detail).toHaveProperty("start");
    await expect(detail).toHaveProperty("end");
  }
}`,...E.parameters?.docs?.source},description:{story:"Fires dp-window-submit when the submit button is clicked.",...E.parameters?.docs?.description}}};V.parameters={...V.parameters,docs:{...V.parameters?.docs,source:{originalSource:`{
  args: {
    heading: "Edit date window",
    name: "Heating season",
    startValue: "2024-11-01T00:00",
    endValue: "2025-03-31T00:00",
    showDelete: true,
    submitLabel: "Save date window"
  },
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const host = canvasElement.querySelector("date-window-dialog") as HTMLElement;
    const handler = fn();
    host.addEventListener("dp-window-delete", handler);
    const canvas = within(host.shadowRoot as unknown as HTMLElement);
    await userEvent.click(canvas.getByText("Delete date window"));
    await expect(handler).toHaveBeenCalledOnce();
  }
}`,...V.parameters?.docs?.source},description:{story:"Fires dp-window-delete when the delete button is clicked in edit mode.",...V.parameters?.docs?.description}}};const Pe=["AddMode","EditMode","Closed","EmitsSubmit","EmitsDelete"];export{$ as AddMode,D as Closed,k as EditMode,V as EmitsDelete,E as EmitsSubmit,Pe as __namedExportsOrder,Oe as default};
