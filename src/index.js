import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import store from './store';

import { AppRouter } from './router';

export const App = () => (
  <Provider store={store}>
    <div className="container">
      <AppRouter />
    </div>
  </Provider>
);

ReactDOM.render(<App />, document.getElementById('app'));
