import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter as Router } from 'react-router-dom'
import { Provider } from 'react-redux'
import { AppContainer } from 'react-hot-loader'
import { I18n } from 'react-i18next'

import 'src/styles/semantic-ui/semantic.less'
import 'src/styles/custom/main.less'

import store from 'src/store'
import AppRoutes from 'src/routes/app'

import 'src/i18n'

const render = (Component) => {
  ReactDOM.render(
    <AppContainer>
      <Provider store={store}>
        <Router basename='/'>
          <I18n ns='translations'>
            {
              (t, { i18n }) => <Component trans={t} i18n={i18n} />
            }
          </I18n>
        </Router>
      </Provider>
    </AppContainer>
    , document.getElementById('app'))
}

document.addEventListener('DOMContentLoaded', () => {
  render(AppRoutes)
})

if (module.hot) {
  module.hot.accept('./routes/app', () => {
    render(AppRoutes)

    render(require('src/routes/app'))
  })
}
