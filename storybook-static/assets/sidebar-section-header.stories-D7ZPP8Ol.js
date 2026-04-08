import{b as s}from"./iframe-maWesKjk.js";import"./sidebar-section-header-CDFFctyZ.js";import"./preload-helper-PPVm8Dsz.js";import"./property-DyW-YDBW.js";const d={title:"Atoms/Display/Sidebar Section Header",component:"sidebar-section-header",argTypes:{title:{control:"text"},subtitle:{control:"text"}}},e={render:()=>s`
    <sidebar-section-header
      .title=${"Target Analysis"}
      .subtitle=${"3 entities tracked"}
    ></sidebar-section-header>
  `},t={render:()=>s`
    <sidebar-section-header .title=${"Filters"}></sidebar-section-header>
  `},r={render:()=>s`
    <sidebar-section-header
      .title=${"Data Points"}
      .subtitle=${"Showing results for the last 30 days across all entities"}
    ></sidebar-section-header>
  `};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <sidebar-section-header
      .title=\${"Target Analysis"}
      .subtitle=\${"3 entities tracked"}
    ></sidebar-section-header>
  \`
}`,...e.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <sidebar-section-header .title=\${"Filters"}></sidebar-section-header>
  \`
}`,...t.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <sidebar-section-header
      .title=\${"Data Points"}
      .subtitle=\${"Showing results for the last 30 days across all entities"}
    ></sidebar-section-header>
  \`
}`,...r.parameters?.docs?.source}}};const c=["Default","TitleOnly","LongSubtitle"];export{e as Default,r as LongSubtitle,t as TitleOnly,c as __namedExportsOrder,d as default};
