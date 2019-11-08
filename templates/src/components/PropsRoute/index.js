import React from 'react';
import { Route } from 'react-router-dom';

export const renderMergedProps = (component, ...rest) => React.createElement(component, rest);

export const PropsRoute = ({ component, ...rest }) => (
  <Route
    {...rest}
    render={(routeProps) => renderMergedProps(component, routeProps, rest)}
  />
);
