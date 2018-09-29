import React from 'react'
import { Switch } from 'react-router-dom'

import AppContainer from 'src/containers/App'
import HomePage from 'src/containers/Home'
import { PropsRoute } from 'src/components/PropsRoute'

const AppRoutes = props => {
  return (
    <AppContainer {...props}>
      <Switch>
        <PropsRoute path='/' component={HomePage} {...props} />
      </Switch>
    </AppContainer>
  )
}

export default AppRoutes
