import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { DevTools } from '../components';

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators({}, dispatch),
  };
}

class App extends Component {
  render() {
    return (
      <div>
        {React.cloneElement(this.props.children, {...this.props})}
        {process.env.NODE_ENV === 'development' && <DevTools />}
      </div>
    );
  }
}

App.propTypes = {
  children: PropTypes.object.isRequired,
};

export default connect(mapStateToProps, mapDispatchToProps)(App);
