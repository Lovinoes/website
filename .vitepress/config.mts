import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  srcDir: "web",
  
  title: "Calagopus",
  description: "Game server management - made simple",
  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: 'Home', link: '/' },
      { text: 'What is Calagopus?', link: '/docs/about/what-is-calagopus' },
      { text: 'Documentation', link: '/docs' }
    ],

    sidebar: [
      {
        text: 'About Calagopus',
        items: [
          { text: 'What is Calagopus?', link: '/docs/about/what-is-calagopus' },
          { text: 'Features', link: '/docs/about/features' },
          { text: 'Architecture', link: '/docs/about/architecture' }
        ]
      },
      {
        text: 'Installation',
        items: [
          { text: 'Panel Installation', link: '/docs/installation/panel' },
          { text: 'Wings Installation', link: '/docs/installation/wings' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/calagopus' },
      { icon: 'discord', link: 'https://discord.gg/uSM8tvTxBV' },
    ],

    search: {
      provider: 'local'
    }
  }
})
