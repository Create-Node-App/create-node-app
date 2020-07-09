import React from 'react';
import PropTypes from 'prop-types';

import './slicer.scss';
import './cracked.css';

const Cracked = ({ children }) => (
  <div className="bg-text">
    <div className="slicer-gradient">
      {new Array(40).fill(1).map((_, i) => (
        <div key={`slice-${i + 1}`} className="text">{children}</div>
      ))}
    </div>
  </div>
);

Cracked.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Cracked;
