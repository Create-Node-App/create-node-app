import React from 'react';
import ReactDOM from 'react-dom';
import { StaticRouter } from 'react-router-dom';
import { Provider } from 'react-redux';

import 'semantic-ui-css/semantic.min.css';

import store from 'playground/store';
import AppRouter from 'playground/routes';

export const App = (props, context) => (
  <Provider store={store}>
    <StaticRouter context={context}>
      <AppRouter />
    </StaticRouter>
  </Provider>
);

ReactDOM.render(<App />, document.getElementById('app'));
