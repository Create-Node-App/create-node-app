import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import DevTools from 'src/components/DevTools'

function mapStateToProps(state) {
  return state
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators({}, dispatch),
  }
}

class App extends Component {
  render() {
    const { children } = this.props

    return (
      <div style={{ height: '100%' }}>
        {React.cloneElement(children, {...this.props})}
        {process.env.NODE_ENV === 'development' && <DevTools />}
      </div>
    )
  }
}

App.propTypes = {
  children: PropTypes.node.isRequired,
}

export default connect(mapStateToProps, mapDispatchToProps)(App)
