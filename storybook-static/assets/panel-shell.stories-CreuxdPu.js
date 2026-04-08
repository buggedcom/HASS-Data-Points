import{i as le,A as de,b as B,g as pe}from"./iframe-maWesKjk.js";import{e as C}from"./index-BVN6m9Ti.js";import{n as y}from"./property-DyW-YDBW.js";import{r as ce}from"./state-D8ZE3MQ0.js";import{e as q}from"./class-map-pAsNZYN8.js";import{m,s as U}from"./localize-Cz1ya3ms.js";import"./floating-menu-CtbQd94M.js";import"./page-menu-item-X-veEDuT.js";import{l as he}from"./localized-decorator-CXjGGqe_.js";import"./preload-helper-PPVm8Dsz.js";import"./directive-jorct-Oe.js";const ge=le`
  :host {
    display: block;
    height: 100%;
    color: var(--primary-text-color);
    background: var(--primary-background-color);
    --dp-spacing-xs: calc(var(--spacing, 8px) * 0.5);
    --dp-spacing-sm: var(--spacing, 8px);
    --dp-spacing-md: calc(var(--spacing, 8px) * 1.5);
    --dp-spacing-lg: calc(var(--spacing, 8px) * 2);
    --dp-spacing-xl: calc(var(--spacing, 8px) * 2.5);
  }

  ha-top-app-bar-fixed {
    display: block;
    height: 100%;
    min-height: 100%;
    overflow: visible;
    --app-header-background-color: var(
      --card-background-color,
      var(--primary-background-color)
    );
    --app-header-text-color: var(--primary-text-color);
  }

  ha-top-app-bar-fixed:not(:defined) {
    display: grid;
    min-height: 100%;
    grid-template-columns: auto minmax(0, 1fr) auto;
    grid-template-rows: auto auto 1fr;
    align-items: center;
  }

  ha-top-app-bar-fixed:not(:defined) > [slot="navigationIcon"] {
    grid-column: 1;
    grid-row: 1;
  }

  ha-top-app-bar-fixed:not(:defined) > [slot="title"] {
    grid-column: 2;
    grid-row: 1;
    min-width: 0;
    padding: 0 var(--dp-spacing-lg);
    font-size: 1.5rem;
    font-weight: 400;
    line-height: 64px;
    color: var(--app-header-text-color, var(--primary-text-color));
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  ha-top-app-bar-fixed:not(:defined) > [slot="actionItems"] {
    grid-column: 3;
    grid-row: 1;
  }

  ha-top-app-bar-fixed:not(:defined) > .controls-section {
    grid-column: 1 / -1;
    grid-row: 2;
  }

  ha-top-app-bar-fixed:not(:defined) > .page-content {
    grid-column: 1 / -1;
    grid-row: 3;
  }

  ha-menu-button:not(:defined),
  ha-icon-button:not(:defined) {
    display: block;
    width: 48px;
    height: 48px;
  }

  .controls-section {
    position: relative;
    overflow: visible;
    z-index: 1;
    background: var(
      --app-header-background-color,
      var(--card-background-color, var(--primary-background-color))
    );
    border-bottom: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
    box-sizing: border-box;
    padding: var(--dp-spacing-md) var(--dp-spacing-md) var(--dp-spacing-md) 0;
  }

  .page-header-actions {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    min-width: 48px;
    z-index: 40;
  }

  .page-menu-wrap {
    position: relative;
    display: inline-flex;
    align-items: center;
    z-index: 40;
  }

  .page-menu-button {
    display: block;
    padding: 0;
    min-width: 40px;
    --mdc-icon-size: 24px;
    --icon-primary-color: var(--secondary-text-color);
  }

  .page-menu-button:hover,
  .page-menu-button:focus-visible {
    --icon-primary-color: var(--primary-text-color);
  }

  .controls-grid {
    display: block;
    width: 100%;
    overflow: visible;
    position: relative;
    z-index: 20;
  }

  .page-content {
    --sidebar-width-expanded: clamp(280px, 24vw, 380px);
    --sidebar-width-collapsed: 52px;
    position: relative;
    z-index: 0;
    height: var(--history-page-content-height, 100%);
    min-height: 0;
    box-sizing: border-box;
    display: grid;
    grid-template-columns: var(--sidebar-width-expanded) minmax(0, 1fr);
    align-items: stretch;
    padding: 0;
    transition: grid-template-columns 400ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .page-content.sidebar-collapsed {
    grid-template-columns: var(--sidebar-width-collapsed) minmax(0, 1fr);
  }

  .page-sidebar {
    position: relative;
    width: var(--sidebar-width-expanded);
    max-width: var(--sidebar-width-expanded);
    min-width: 0;
    height: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    padding: var(--dp-spacing-lg);
    border-right: 1px solid
      color-mix(
        in srgb,
        var(--divider-color, rgba(0, 0, 0, 0.12)) 88%,
        transparent
      );
    overflow-x: hidden;
    overflow-y: auto;
    transition:
      width 400ms cubic-bezier(0.4, 0, 0.2, 1),
      max-width 400ms cubic-bezier(0.4, 0, 0.2, 1),
      padding 400ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .page-sidebar.collapsed {
    width: var(--sidebar-width-collapsed);
    max-width: var(--sidebar-width-collapsed);
    padding: var(--dp-spacing-lg) 0;
    overflow: visible;
  }

  .page-sidebar.collapsed .sidebar-toggle-button {
    left: 50%;
    right: auto;
    transform: translateX(-50%);
  }

  .sidebar-toggle-button {
    position: absolute;
    top: var(--dp-spacing-xs);
    right: calc(var(--dp-spacing-sm) / 2);
    width: 48px;
    height: 48px;
    padding: 0;
    margin: 0;
    --mdc-icon-size: 24px;
    --icon-primary-color: var(--secondary-text-color);
    z-index: 2;
  }

  .sidebar-toggle-button:hover,
  .sidebar-toggle-button:focus-visible {
    --icon-primary-color: var(--primary-text-color);
  }

  .sidebar-toggle-button ha-icon {
    display: block;
  }

  .content {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    height: 100%;
    align-self: stretch;
    box-sizing: border-box;
    overflow: hidden;
    padding: var(--dp-spacing-lg);
  }

  .content > ::slotted(*) {
    flex: 1 1 0;
    min-height: 0;
    overflow: hidden;
  }

  .content > ::slotted(resizable-panes),
  .content > ::slotted(*[is-panes]) {
    flex: 1 1 0;
    min-height: 0;
  }

  .control-date {
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
  }

  .control-target {
    width: 100%;
    max-width: none;
    min-width: 0;
    flex: 0 0 auto;
    box-sizing: border-box;
  }

  .page-sidebar.collapsed .control-target {
    display: flex;
    flex: 1 1 auto;
    min-height: 0;
  }

  .page-sidebar.collapsed .control-target > ::slotted(*) {
    flex: 1 1 auto;
    min-height: 0;
  }

  .sidebar-options {
    width: calc(var(--sidebar-width-expanded) - var(--dp-spacing-lg) * 2);
    max-width: var(--sidebar-width-expanded);
    flex: 0 0 auto;
    padding-top: var(--dp-spacing-md);
    transform: translateX(0);
    transform-origin: left center;
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    overflow: hidden;
    transition:
      opacity 220ms cubic-bezier(0.4, 0, 0.2, 1),
      transform 400ms cubic-bezier(0.4, 0, 0.2, 1),
      visibility 0s linear 0s;
  }

  .page-sidebar.collapsed .sidebar-options {
    opacity: 0;
    transform: translateX(calc(-1 * var(--sidebar-width-collapsed)));
    visibility: hidden;
    pointer-events: none;
    transition:
      opacity 180ms cubic-bezier(0.4, 0, 0.2, 1),
      transform 400ms cubic-bezier(0.4, 0, 0.2, 1),
      visibility 0s linear 180ms;
  }

  /* Scrim — hidden by default, enabled at <=900px via media query */
  .sidebar-scrim {
    display: none;
  }

  .collapsed-target-popup {
    position: fixed;
    z-index: 9;
    width: 300px;
    overflow-y: auto;
    background: var(--card-background-color, #fff);
    border-radius: 16px;
    border: 1px solid
      color-mix(
        in srgb,
        var(--divider-color, rgba(0, 0, 0, 0.12)) 88%,
        transparent
      );
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  }

  .collapsed-target-popup[hidden] {
    display: none;
  }

  .collapsed-options-popup {
    position: fixed;
    z-index: 100;
    background: var(--card-background-color, #fff);
    border-radius: 14px;
    border: 1px solid
      color-mix(
        in srgb,
        var(--divider-color, rgba(0, 0, 0, 0.12)) 88%,
        transparent
      );
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    overflow: visible;
  }

  .collapsed-options-popup[hidden] {
    display: none;
  }

  @media (max-width: 900px) {
    .controls-section {
      padding: var(--dp-spacing-md);
    }

    .page-content {
      grid-template-columns: minmax(0, 1fr);
      position: relative;
    }

    .page-content.sidebar-collapsed {
      grid-template-columns: 52px minmax(0, 1fr);
    }

    .page-sidebar {
      position: absolute;
      top: 0;
      left: 0;
      width: min(380px, 85vw);
      height: 100%;
      z-index: 10;
      background: var(--card-background-color, var(--primary-background-color));
      box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15);
      border-right: none;
      padding: var(--dp-spacing-lg);
      overflow-y: auto;
      min-height: 0;
    }

    .page-sidebar.collapsed {
      position: relative;
      width: auto;
      box-shadow: none;
      border-right: 1px solid
        color-mix(
          in srgb,
          var(--divider-color, rgba(0, 0, 0, 0.12)) 88%,
          transparent
        );
      transform: none;
      transition: none;
      z-index: 0;
    }

    .sidebar-toggle-button {
      display: inline-flex;
    }

    .sidebar-scrim {
      display: block;
      position: absolute;
      inset: 0;
      z-index: 9;
      background: rgba(0, 0, 0, 0.3);
      opacity: 0;
      pointer-events: none;
      transition: opacity 300ms;
    }

    .sidebar-scrim.visible {
      opacity: 1;
      pointer-events: auto;
    }
  }

  @media (max-width: 720px) {
    .page-content.sidebar-collapsed {
      grid-template-columns: minmax(0, 1fr);
    }

    .page-sidebar.collapsed {
      position: absolute;
      transform: translateX(-100%);
      visibility: hidden;
      transition:
        transform 400ms cubic-bezier(0.4, 0, 0.2, 1),
        visibility 0s linear 400ms;
    }

    .sidebar-toggle-button {
      display: none;
    }
  }
`;var ue=Object.create,D=Object.defineProperty,me=Object.getOwnPropertyDescriptor,V=(e,t)=>(t=Symbol[e])?t:Symbol.for("Symbol."+e),x=e=>{throw TypeError(e)},Y=(e,t,a)=>t in e?D(e,t,{enumerable:!0,configurable:!0,writable:!0,value:a}):e[t]=a,N=(e,t)=>D(e,"name",{value:t,configurable:!0}),be=e=>[,,,ue(e?.[V("metadata")]??null)],Z=["class","method","getter","setter","accessor","field","value","get","set"],k=e=>e!==void 0&&typeof e!="function"?x("Function expected"):e,ve=(e,t,a,s,o)=>({kind:Z[e],name:t,metadata:s,addInitializer:r=>a._?x("Already initialized"):o.push(k(r||null))}),xe=(e,t)=>Y(t,V("metadata"),e[3]),d=(e,t,a,s)=>{for(var o=0,r=e[t>>1],p=r&&r.length;o<p;o++)t&1?r[o].call(a):s=r[o].call(a,s);return s},b=(e,t,a,s,o,r)=>{var p,c,K,f,P,i=t&7,E=!!(t&8),u=!!(t&16),$=i>3?e.length+1:i?E?1:2:0,j=Z[i+5],G=i>3&&(e[$-1]=[]),re=e[$]||(e[$]=[]),h=i&&(!u&&!E&&(o=o.prototype),i<5&&(i>3||!u)&&me(i<4?o:{get[a](){return J(this,r)},set[a](l){return Q(this,r,l)}},a));i?u&&i<4&&N(r,(i>2?"set ":i>1?"get ":"")+a):N(o,a);for(var R=s.length-1;R>=0;R--)f=ve(i,a,K={},e[3],re),i&&(f.static=E,f.private=u,P=f.access={has:u?l=>ye(o,l):l=>a in l},i^3&&(P.get=u?l=>(i^1?J:we)(l,o,i^4?r:h.get):l=>l[a]),i>2&&(P.set=u?(l,O)=>Q(l,o,O,i^4?r:h.set):(l,O)=>l[a]=O)),c=(0,s[R])(i?i<4?u?r:h[j]:i>4?void 0:{get:h.get,set:h.set}:o,f),K._=1,i^4||c===void 0?k(c)&&(i>4?G.unshift(c):i?u?r=c:h[j]=c:o=c):typeof c!="object"||c===null?x("Object expected"):(k(p=c.get)&&(h.get=p),k(p=c.set)&&(h.set=p),k(p=c.init)&&G.unshift(p));return i||xe(e,o),h&&D(o,a,h),u?i^4?r:h:o},fe=(e,t,a)=>Y(e,t+"",a),I=(e,t,a)=>t.has(e)||x("Cannot "+a),ye=(e,t)=>Object(t)!==t?x('Cannot use the "in" operator on this value'):e.has(t),J=(e,t,a)=>(I(e,t,"read from private field"),a?a.call(e):t.get(e)),v=(e,t,a)=>t.has(e)?x("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(e):t.set(e,a),Q=(e,t,a,s)=>(I(e,t,"write to private field"),s?s.call(e,a):t.set(e,a),a),we=(e,t,a)=>(I(e,t,"access private method"),a),ee,te,ae,oe,ie,se,T,ne,n,L,W,H,A,F,X;ne=[he()];class g extends(T=pe,se=[y({type:Object})],ie=[y({type:Boolean})],oe=[y({type:Boolean,attribute:"sidebar-collapsed"})],ae=[y({type:Boolean,attribute:"has-saved-state"})],te=[y({type:String,attribute:"layout-mode"})],ee=[ce()],T){constructor(){super(...arguments),v(this,L,d(n,8,this,null)),d(n,11,this),v(this,W,d(n,12,this,!1)),d(n,15,this),v(this,H,d(n,16,this,!1)),d(n,19,this),v(this,A,d(n,20,this,!1)),d(n,23,this),v(this,F,d(n,24,this,"desktop")),d(n,27,this),v(this,X,d(n,28,this,!1)),d(n,31,this)}getPageContentEl(){return this.shadowRoot?.querySelector("#page-content")??null}getContentEl(){return this.shadowRoot?.querySelector("#content")??null}getTargetPopupEl(){return this.shadowRoot?.querySelector("#collapsed-target-popup")??null}getOptionsPopupEl(){return this.shadowRoot?.querySelector("#collapsed-options-popup")??null}syncLayoutHeight(){const t=this.getPageContentEl();if(!t)return;const a=t.getBoundingClientRect(),s=this.getBoundingClientRect(),o=Math.max(0,s.bottom-a.top);o>0&&t.style.setProperty("--history-page-content-height",`${o}px`)}closePageMenu(){this._pageMenuOpen&&(this._pageMenuOpen=!1)}_emit(t,a={}){this.dispatchEvent(new CustomEvent(t,{detail:a,bubbles:!0,composed:!0}))}_computeMenuPosition(t,a){const o=t.getBoundingClientRect(),r=Math.max(8,Math.min(o.right-a,window.innerWidth-a-8)),p=Math.max(8,o.bottom+8);return{left:r,top:p}}_togglePageMenu(t){const a=t!==void 0?t:!this._pageMenuOpen;if(this._pageMenuOpen=a,a){const s=this.shadowRoot?.querySelector("#page-menu"),o=this.shadowRoot?.querySelector("#page-menu-button");if(s&&o){const{left:r,top:p}=this._computeMenuPosition(o,Math.max(220,s.offsetWidth||220));s.style.setProperty("--floating-menu-left",`${r}px`),s.style.setProperty("--floating-menu-top",`${p}px`)}}}_onPageMenuButtonClick(){this._togglePageMenu()}_onPageMenuClose(){this._togglePageMenu(!1)}_onMenuDownload(){this._togglePageMenu(!1),this._emit("dp-shell-menu-download")}_onMenuSave(){this._togglePageMenu(!1),this._emit("dp-shell-menu-save")}_onMenuRestore(){this._togglePageMenu(!1),this._emit("dp-shell-menu-restore")}_onMenuClear(){this._togglePageMenu(!1),this._emit("dp-shell-menu-clear")}_onSidebarToggle(){this._emit("dp-shell-sidebar-toggle")}_onScrimClick(){this._emit("dp-shell-scrim-click")}render(){const t=this.layoutMode!=="desktop",a=this.sidebarCollapsed?"mdi:chevron-right":"mdi:chevron-left",s=this.sidebarCollapsed?m("Expand targets sidebar"):m("Collapse targets sidebar");return B`
      <ha-top-app-bar-fixed .hass=${this.hass} .narrow=${this.narrow}>
        <ha-menu-button
          slot="navigationIcon"
          .hass=${this.hass}
          .narrow=${this.narrow}
        ></ha-menu-button>
        <div slot="title">${m("Datapoints")}</div>

        <div slot="actionItems" class="page-header-actions">
          <div class="page-menu-wrap">
            <ha-icon-button
              id="page-menu-button"
              class="page-menu-button"
              label=${m("Page options")}
              aria-haspopup="menu"
              aria-expanded=${this._pageMenuOpen?"true":"false"}
              @click=${this._onPageMenuButtonClick}
            >
              <ha-icon icon="mdi:dots-vertical"></ha-icon>
            </ha-icon-button>
            <floating-menu
              id="page-menu"
              .open=${this._pageMenuOpen}
              @dp-menu-close=${this._onPageMenuClose}
            >
              <page-menu-item
                icon="mdi:file-excel-outline"
                label=${m("Download spreadsheet")}
                @dp-menu-action=${this._onMenuDownload}
              ></page-menu-item>
              <page-menu-item
                icon="mdi:content-save-outline"
                label=${m("Save page state")}
                @dp-menu-action=${this._onMenuSave}
              ></page-menu-item>
              ${this.hasSavedState?B`
                    <page-menu-item
                      icon="mdi:restore"
                      label=${m("Restore saved page")}
                      @dp-menu-action=${this._onMenuRestore}
                    ></page-menu-item>
                    <page-menu-item
                      icon="mdi:delete-outline"
                      label=${m("Clear saved page")}
                      @dp-menu-action=${this._onMenuClear}
                    ></page-menu-item>
                  `:de}
            </floating-menu>
          </div>
        </div>

        <div class="controls-section">
          <div class="controls-grid">
            <div id="date-slot" class="control-date">
              <slot name="controls"></slot>
            </div>
          </div>
        </div>

        <div
          id="page-content"
          class=${q({"page-content":!0,"sidebar-collapsed":this.sidebarCollapsed})}
        >
          <div
            id="sidebar-scrim"
            class=${q({"sidebar-scrim":!0,visible:t&&!this.sidebarCollapsed})}
            @click=${this._onScrimClick}
          ></div>

          <div
            id="page-sidebar"
            class=${q({"page-sidebar":!0,collapsed:this.sidebarCollapsed})}
          >
            <ha-icon-button
              id="sidebar-toggle"
              class="sidebar-toggle-button"
              label=${s}
              @click=${this._onSidebarToggle}
            >
              <ha-icon icon=${a}></ha-icon>
            </ha-icon-button>

            <div id="target-slot" class="control-target">
              <slot name="sidebar"></slot>
            </div>
            <div id="sidebar-options" class="sidebar-options">
              <slot name="sidebar-options"></slot>
            </div>
          </div>

          <div class="content" id="content">
            <slot></slot>
          </div>
        </div>

        <div
          id="collapsed-target-popup"
          class="collapsed-target-popup"
          hidden
        ></div>
        <div
          id="collapsed-options-popup"
          class="collapsed-options-popup"
          hidden
        ></div>
      </ha-top-app-bar-fixed>
    `}}n=be(T);L=new WeakMap;W=new WeakMap;H=new WeakMap;A=new WeakMap;F=new WeakMap;X=new WeakMap;b(n,4,"hass",se,g,L);b(n,4,"narrow",ie,g,W);b(n,4,"sidebarCollapsed",oe,g,H);b(n,4,"hasSavedState",ae,g,A);b(n,4,"layoutMode",te,g,F);b(n,4,"_pageMenuOpen",ee,g,X);g=b(n,0,"PanelShell",ne,g);fe(g,"styles",ge);d(n,1,g);customElements.define("panel-shell",g);const qe={title:"Panels/Datapoints/Panel Shell",component:"panel-shell",parameters:{layout:"fullscreen",actions:{handles:["dp-shell-menu-download","dp-shell-menu-save","dp-shell-menu-restore","dp-shell-menu-clear","dp-shell-sidebar-toggle","dp-shell-scrim-click"]},docs:{description:{component:"`panel-shell` provides the outer layout shell for the Datapoints panel.\nIt renders the top app bar, collapsible sidebar, controls bar, and main content area.\n\nContent is projected via named slots:\n- `controls` — range toolbar in the controls bar\n- `sidebar` — history targets in the sidebar\n- `sidebar-options` — options panel at the bottom of the sidebar\n- (default) — main chart content"}}},argTypes:{sidebarCollapsed:{control:"boolean",description:"Whether the sidebar is in collapsed state."},hasSavedState:{control:"boolean",description:"Whether a saved page state exists (shows Restore/Clear menu items)."},layoutMode:{control:{type:"select"},options:["desktop","tablet","mobile"],description:"Layout mode — affects sidebar scrim visibility."}},args:{sidebarCollapsed:!1,hasSavedState:!1,layoutMode:"desktop"},loaders:[async()=>(await U("en"),{})],render:e=>B`
    <panel-shell
      .sidebarCollapsed=${e.sidebarCollapsed}
      .hasSavedState=${e.hasSavedState}
      .layoutMode=${e.layoutMode}
      style="display: block; height: 100vh;"
    >
      <div
        slot="controls"
        style="padding: 8px 16px; color: var(--secondary-text-color); font-size: 0.9rem;"
      >
        [Range toolbar slot]
      </div>
      <div
        slot="sidebar"
        style="padding: 8px; color: var(--secondary-text-color); font-size: 0.85rem;"
      >
        [Sidebar targets slot]
      </div>
      <div
        slot="sidebar-options"
        style="padding: 8px; color: var(--secondary-text-color); font-size: 0.85rem;"
      >
        [Sidebar options slot]
      </div>
      <div style="padding: 24px; color: var(--secondary-text-color);">
        [Main chart content slot]
      </div>
    </panel-shell>
  `},w={play:async({canvasElement:e})=>{const a=e.querySelector("panel-shell").shadowRoot.querySelector('[slot="title"]');C(a?.textContent).toBe("Datapoints")}},_={args:{sidebarCollapsed:!0},play:async({canvasElement:e})=>{const a=e.querySelector("panel-shell").shadowRoot.querySelector(".sidebar-options");C(getComputedStyle(a).visibility).toBe("hidden"),C(getComputedStyle(a).pointerEvents).toBe("none")}},S={args:{hasSavedState:!0}},M={args:{hasSavedState:!0,sidebarCollapsed:!1}},z={args:{hasSavedState:!0},loaders:[async()=>(await U("fi"),{})],play:async({canvasElement:e})=>{const t=e.querySelector("panel-shell"),a=t.shadowRoot.querySelector("#page-menu-button"),s=t.shadowRoot.querySelector("#sidebar-toggle");C(a?.getAttribute("label")).toBe("Sivun asetukset"),C(s?.getAttribute("label")).toBe("Kutista kohteiden sivupalkki")}};w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const shell = canvasElement.querySelector("panel-shell") as HTMLElement & {
      shadowRoot: ShadowRoot;
    };
    const title = shell.shadowRoot.querySelector('[slot="title"]');
    expect(title?.textContent).toBe("Datapoints");
  }
}`,...w.parameters?.docs?.source},description:{story:"Default desktop layout — sidebar expanded, no saved state.",...w.parameters?.docs?.description}}};_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  args: {
    sidebarCollapsed: true
  },
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const shell = canvasElement.querySelector("panel-shell") as HTMLElement & {
      shadowRoot: ShadowRoot;
    };
    const sidebarOptions = shell.shadowRoot.querySelector<HTMLElement>(".sidebar-options");
    expect(getComputedStyle(sidebarOptions!).visibility).toBe("hidden");
    expect(getComputedStyle(sidebarOptions!).pointerEvents).toBe("none");
  }
}`,..._.parameters?.docs?.source},description:{story:"Sidebar collapsed — sidebar shows narrow icon strip.",..._.parameters?.docs?.description}}};S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  args: {
    hasSavedState: true
  }
}`,...S.parameters?.docs?.source},description:{story:"Has saved state — Restore and Clear items visible in the page menu.",...S.parameters?.docs?.description}}};M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
  args: {
    hasSavedState: true,
    sidebarCollapsed: false
  }
}`,...M.parameters?.docs?.source},description:{story:"Sidebar expanded with all page menu items shown.",...M.parameters?.docs?.description}}};z.parameters={...z.parameters,docs:{...z.parameters?.docs,source:{originalSource:`{
  args: {
    hasSavedState: true
  },
  loaders: [async () => {
    await setFrontendLocale("fi");
    return {};
  }],
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const shell = canvasElement.querySelector("panel-shell") as HTMLElement & {
      shadowRoot: ShadowRoot;
    };
    const menuButton = shell.shadowRoot.querySelector("#page-menu-button");
    const sidebarToggle = shell.shadowRoot.querySelector("#sidebar-toggle");
    expect(menuButton?.getAttribute("label")).toBe("Sivun asetukset");
    expect(sidebarToggle?.getAttribute("label")).toBe("Kutista kohteiden sivupalkki");
  }
}`,...z.parameters?.docs?.source}}};const Be=["Default","SidebarCollapsed","WithSavedState","AllMenuItems","Finnish"];export{M as AllMenuItems,w as Default,z as Finnish,_ as SidebarCollapsed,S as WithSavedState,Be as __namedExportsOrder,qe as default};
