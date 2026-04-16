import { defineConfig } from "vitepress";

const repoName = "HASS-Data-Points";

export default defineConfig({
  lang: "en",
  title: "Datapoints for Home Assistant",
  description:
    "Explore Home Assistant history with interactive charts, annotations, and anomaly workflows.",
  base: `/${repoName}/`,
  lastUpdated: true,
  cleanUrls: true,

  themeConfig: {
    logo: "/logo.png",
    nav: [
      { text: "Features", link: "/features" },
      { text: "Tutorials", link: "/tutorials/" },
      { text: "Gallery", link: "/gallery" },
      { text: "Reference", link: "/reference/" },
      { text: "Development", link: "/development" },
    ],
    sidebar: {
      "/tutorials/": [
        {
          text: "Tutorials",
          items: [
            { text: "Overview", link: "/tutorials/" },
            { text: "Quickstart", link: "/tutorials/quickstart" },
            {
              text: "Range Explorer (Timeline Slider)",
              link: "/tutorials/range-explorer",
            },
            {
              text: "Manual Annotations (Dashboard)",
              link: "/tutorials/annotations-dashboard",
            },
            {
              text: "Annotations in the Datapoints Panel",
              link: "/tutorials/annotations-panel",
            },
            {
              text: "Annotations via Automations",
              link: "/tutorials/annotations-automations",
            },
            { text: "Comparisons & Windows", link: "/tutorials/comparisons" },
            { text: "Watching for Anomalies", link: "/tutorials/anomalies" },
          ],
        },
      ],
      "/reference/": [
        {
          text: "Reference",
          items: [
            { text: "At a Glance", link: "/reference/" },
            { text: "Cards", link: "/reference/cards" },
            {
              text: "Recording Datapoints",
              link: "/reference/recording-datapoints",
            },
            {
              text: "History & Analysis",
              link: "/reference/history-and-analysis",
            },
          ],
        },
      ],
    },
    socialLinks: [
      { icon: "github", link: "https://github.com/buggedcom/HASS-Data-Points" },
    ],
    footer: {
      message: "Built for Home Assistant power users.",
      copyright: "Copyright © hass_datapoints contributors",
    },
    editLink: {
      pattern:
        "https://github.com/buggedcom/HASS-Data-Points/edit/main/site/:path",
      text: "Edit this page on GitHub",
    },
  },
});
