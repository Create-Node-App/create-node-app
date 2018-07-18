import React from 'react';
import { BrowserRouter, Route, Switch, Redirect } from 'react-router-dom';

import AppContainer from 'playground/containers/App';
import HomePage from 'playground/containers/Home';

const AppRoutes = () => (
  <BrowserRouter>
    <AppContainer>
      <Switch>
        <Route path='/' component={HomePage} />
        <Redirect to="/" />
      </Switch>
    </AppContainer>
  </BrowserRouter>
);

export default AppRoutes;
