import{b as r}from"./iframe-maWesKjk.js";import"./pagination-CjLcFMPQ.js";import"./preload-helper-PPVm8Dsz.js";import"./property-DyW-YDBW.js";const p={title:"Atoms/Interactive/Pagination",component:"pagination-nav"},a={render:()=>r`
    <pagination-nav
      .page=${0}
      .totalPages=${5}
      .totalItems=${50}
      .label=${"records"}
    ></pagination-nav>
  `},e={render:()=>r`
    <pagination-nav
      .page=${2}
      .totalPages=${5}
      .totalItems=${50}
      .label=${"records"}
    ></pagination-nav>
  `},n={render:()=>r`
    <pagination-nav
      .page=${4}
      .totalPages=${5}
      .totalItems=${50}
      .label=${"records"}
    ></pagination-nav>
  `},t={render:()=>r`
    <pagination-nav
      .page=${0}
      .totalPages=${1}
      .totalItems=${3}
      .label=${"events"}
    ></pagination-nav>
  `};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <pagination-nav
      .page=\${0}
      .totalPages=\${5}
      .totalItems=\${50}
      .label=\${"records"}
    ></pagination-nav>
  \`
}`,...a.parameters?.docs?.source}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <pagination-nav
      .page=\${2}
      .totalPages=\${5}
      .totalItems=\${50}
      .label=\${"records"}
    ></pagination-nav>
  \`
}`,...e.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <pagination-nav
      .page=\${4}
      .totalPages=\${5}
      .totalItems=\${50}
      .label=\${"records"}
    ></pagination-nav>
  \`
}`,...n.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <pagination-nav
      .page=\${0}
      .totalPages=\${1}
      .totalItems=\${3}
      .label=\${"events"}
    ></pagination-nav>
  \`
}`,...t.parameters?.docs?.source}}};const l=["FirstPage","MiddlePage","LastPage","SinglePage"];export{a as FirstPage,n as LastPage,e as MiddlePage,t as SinglePage,l as __namedExportsOrder,p as default};
