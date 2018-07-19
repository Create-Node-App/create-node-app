import React from 'react';
import ReactDOM from 'react-dom';
import { StaticRouter } from 'react-router-dom';
import { Provider } from 'react-redux';

import 'semantic-ui-less/semantic.less';

import store from 'playground/store';
import AppRoutes from 'playground/routes/app';

const App = (props, context) => (
  <Provider store={store}>
    <StaticRouter context={context}>
      <AppRoutes />
    </StaticRouter>
  </Provider>
);

ReactDOM.render(<App />, document.getElementById('app'));
