import{b as i}from"./iframe-maWesKjk.js";import"./floating-menu-CtbQd94M.js";import"./page-menu-item-X-veEDuT.js";import"./preload-helper-PPVm8Dsz.js";import"./property-DyW-YDBW.js";const u={title:"Molecules/Floating Menu",component:"floating-menu",parameters:{actions:{handles:["dp-menu-close","dp-menu-action"]},docs:{description:{component:"`floating-menu` is a positioned floating overlay panel. The parent sets\n`--floating-menu-top` / `--floating-menu-left` on the element to position it\nbelow an anchor button. Content is projected via the default slot.\n\n@fires dp-menu-close - `{}` fired when the user clicks outside the open menu"}}},argTypes:{open:{control:"boolean",description:"Whether the menu panel is visible."}},args:{open:!0},render:a=>i`
    <div style="position: relative; height: 200px; padding: 16px;">
      <floating-menu
        .open=${a.open}
        style="--floating-menu-top: 56px; --floating-menu-left: 16px;"
      >
        <page-menu-item
          icon="mdi:file-excel-outline"
          label="Download spreadsheet"
        ></page-menu-item>
        <page-menu-item
          icon="mdi:refresh"
          label="Refresh data"
        ></page-menu-item>
        <page-menu-item
          icon="mdi:cog-outline"
          label="Settings"
        ></page-menu-item>
      </floating-menu>
    </div>
  `},e={args:{open:!0}},n={args:{open:!1}},t={args:{open:!0},render:()=>i`
    <div style="position: relative; height: 120px; padding: 16px;">
      <floating-menu
        .open=${!0}
        style="--floating-menu-top: 56px; --floating-menu-left: 16px;"
      >
        <page-menu-item icon="mdi:download" label="Download"></page-menu-item>
      </floating-menu>
    </div>
  `},o={args:{open:!0},render:()=>i`
    <div style="position: relative; height: 160px; padding: 16px;">
      <floating-menu
        .open=${!0}
        style="
          --floating-menu-top: 56px;
          --floating-menu-left: 16px;
          --floating-menu-padding: 16px;
          --floating-menu-min-width: 280px;
        "
      >
        <p style="margin: 0; color: var(--primary-text-color);">
          Custom slotted content can be anything — date pickers, option lists,
          forms, etc.
        </p>
      </floating-menu>
    </div>
  `};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  args: {
    open: true
  }
}`,...e.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    open: false
  }
}`,...n.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    open: true
  },
  render: () => html\`
    <div style="position: relative; height: 120px; padding: 16px;">
      <floating-menu
        .open=\${true}
        style="--floating-menu-top: 56px; --floating-menu-left: 16px;"
      >
        <page-menu-item icon="mdi:download" label="Download"></page-menu-item>
      </floating-menu>
    </div>
  \`
}`,...t.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    open: true
  },
  render: () => html\`
    <div style="position: relative; height: 160px; padding: 16px;">
      <floating-menu
        .open=\${true}
        style="
          --floating-menu-top: 56px;
          --floating-menu-left: 16px;
          --floating-menu-padding: 16px;
          --floating-menu-min-width: 280px;
        "
      >
        <p style="margin: 0; color: var(--primary-text-color);">
          Custom slotted content can be anything — date pickers, option lists,
          forms, etc.
        </p>
      </floating-menu>
    </div>
  \`
}`,...o.parameters?.docs?.source}}};const d=["Open","Closed","SingleItem","CustomContent"];export{n as Closed,o as CustomContent,e as Open,t as SingleItem,d as __namedExportsOrder,u as default};
