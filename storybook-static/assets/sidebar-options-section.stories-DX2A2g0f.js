import{b as i}from"./iframe-maWesKjk.js";import"./sidebar-options-section-XIovhKDU.js";import"./preload-helper-PPVm8Dsz.js";import"./property-DyW-YDBW.js";import"./sidebar-section-header-CDFFctyZ.js";const l={title:"Atoms/Display/Sidebar Options Section",component:"sidebar-options-section",argTypes:{title:{control:"text",description:"The section heading text."},subtitle:{control:"text",description:"Optional subtitle shown below the heading in a smaller muted style."}},args:{title:"Chart Display",subtitle:"Configure visual and interaction behaviour for the chart."},render:s=>i`
    <sidebar-options-section .title=${s.title} .subtitle=${s.subtitle}>
      <div style="color: var(--secondary-text-color); font-size: 0.9rem;">
        Slotted body content goes here.
      </div>
    </sidebar-options-section>
  `,parameters:{docs:{description:{component:"`sidebar-options-section` is a layout atom that wraps a titled sidebar section.\nIt composes `sidebar-section-header` for the heading and exposes a default slot\nfor any body content (radio groups, checkbox lists, selects, etc.)."}}}},t={},e={args:{subtitle:""}},o={render:()=>i`
    <sidebar-options-section
      title="Datapoints"
      subtitle="Choose which annotation datapoints appear on the chart."
    >
      <p
        style="margin: 0; color: var(--secondary-text-color); font-size: 0.9rem;"
      >
        (Body content slotted in here)
      </p>
    </sidebar-options-section>
  `};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:"{}",...t.parameters?.docs?.source},description:{story:"Default section with title, subtitle, and placeholder body content.",...t.parameters?.docs?.description}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  args: {
    subtitle: ""
  }
}`,...e.parameters?.docs?.source},description:{story:"Section with no subtitle — only the title is shown.",...e.parameters?.docs?.description}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <sidebar-options-section
      title="Datapoints"
      subtitle="Choose which annotation datapoints appear on the chart."
    >
      <p
        style="margin: 0; color: var(--secondary-text-color); font-size: 0.9rem;"
      >
        (Body content slotted in here)
      </p>
    </sidebar-options-section>
  \`
}`,...o.parameters?.docs?.source},description:{story:"A realistic example with a checkbox-list as the slotted body.",...o.parameters?.docs?.description}}};const p=["Default","TitleOnly","WithCheckboxList"];export{t as Default,e as TitleOnly,o as WithCheckboxList,p as __namedExportsOrder,l as default};
