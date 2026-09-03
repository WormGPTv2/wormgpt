import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'

export default defineConfig({
  site: 'https://wormgpt.gitlawb.com',
  trailingSlash: 'always',
  integrations: [sitemap()],
})
