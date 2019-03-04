import { applyMiddleware, createStore, compose } from 'redux'
import { createLogger } from 'redux-logger'
import { createCookieMiddleware } from 'redux-cookie'
import thunk from 'redux-thunk'
import Cookies from 'js-cookie'

import reducers from 'src/reducers'
import DevTools from 'src/components/DevTools'

const packages = []
const enhancers = []

// Push middleware that you need for both development and production
packages.push(thunk)
packages.push(createCookieMiddleware(Cookies))

if (process.env.NODE_ENV === 'development') {
  // Push the middleware that are specific for development
  packages.push(createLogger())
  enhancers.push(DevTools.instrument())
}

const middleware = applyMiddleware(...packages)

const store = createStore(
  reducers,
  compose(
    middleware,
    ...enhancers,
  )
)

export default store
