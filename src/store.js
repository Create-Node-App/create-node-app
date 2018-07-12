import {
  applyMiddleware,
  createStore,
} from 'redux';
import { createLogger } from 'redux-logger';
import Cookies from 'js-cookie';
import { createCookieMiddleware } from 'redux-cookie';
import thunk from 'redux-thunk';

import reducers from './reducers';
import DevTools from './components/DevTools';

const packages = [];
const enhancers = [];

// Push middleware that you need for both development and production
packages.push(thunk);
packages.push(createCookieMiddleware(Cookies));

if (process.env.NODE_ENV === 'development') {
  // Push the middleware that are specific for development
  packages.push(createLogger());
  enhancers.push(DevTools.instrument());
}

const middleware = applyMiddleware(...packages);

const store = createStore(
  reducers,
  ...enhancers,
  middleware,
);

export default store;
