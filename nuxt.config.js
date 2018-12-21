module.exports = {
  srcDir: 'src',
  head: {
    title: 'satellite-puzzle',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: 'Nuxt.js project' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
    ]
  },
  /*
  ** Customize the progress bar color
  */
  loading: { color: '#3B8070' },
  /*
  ** Build configuration
  */
  build: {
    /*
    ** Run ESLint on save
    */
    extend (config, { isDev, isClient }) {
      if (isDev && isClient) {
        config.module.rules.push({
          enforce: 'pre',
          test: /\.(js|vue)$/,
          loader: 'eslint-loader',
          exclude: /(node_modules)/
        })
      }
    }
  },
  modules: [
    "@nuxtjs/axios",
    ['nuxt-sass-resources-loader', '@@/assets/css/*.scss']
  ],
  plugins: [
    '~/plugins/axios.js'
  ],
  css: [
    '~/../node_modules/ress/dist/ress.min.css',
    '~/assets/css/main.css'
  ],
  axios: {}
}

