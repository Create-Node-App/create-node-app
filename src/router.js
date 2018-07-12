import React, { Fragment } from 'react';
import { BrowserRouter, Route, Switch, Redirect } from 'react-router-dom';

import { HomePage } from 'playground/containers/Home';

const AppRouter = () => (
  <BrowserRouter>
    <Fragment>
      <Switch>
        <Route exact path='/' component={HomePage} />
        <Redirect to="/" />
      </Switch>
    </Fragment>
  </BrowserRouter>
);

export { AppRouter };
