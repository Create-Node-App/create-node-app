import i18n from 'i18next'
import Backend from 'i18next-xhr-backend'
import LanguageDetector from 'i18next-browser-languagedetector'
import { reactI18nextModule } from 'react-i18next'

function loadLocales(url, options, callback, data) {
  try {
    url = url.split('/')
    url[0] = url[0].split('-')[0]
    url = url.join('/')

    let locale = require(`src-static/locales/${url}.json`)
    callback(locale, { status: '200' })

    void options
    void data
  } catch (e) {
    callback(null, { status: '404' })
  }
}

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(reactI18nextModule)
  .init({
    fallbackLng: 'es',

    // have a common namespace used around the full app
    ns: [ 'home' ],
    defaultNS: 'home',

    debug: process.env.NODE_ENV === 'development',

    backend: {
      loadPath: '{{lng}}/{{ns}}',
      parse: data => data,
      ajax: loadLocales
    },

    interpolation: {
      escapeValue: false, // not needed for react!!
    },

    react: {
      defaultTransParent: 'div', // needed for preact
      wait: true
    }
  })


export default i18n
