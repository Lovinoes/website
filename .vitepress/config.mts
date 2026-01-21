import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  srcDir: "web",
  
  title: "Calagopus",
  description: "A management suite for your distributed (game) containers.",
  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: 'Home', link: '/' },
      { text: 'Documentation', link: '/docs' }
    ],

    sidebar: [
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
      { icon: 'discord', link: 'https://discord.com/invite/uSM8tvTxBV' },
    ],

    search: {
      provider: 'local'
    }
  }
})
