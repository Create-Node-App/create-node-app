import React, { FC } from 'react';

import './slicer.scss';
import './cracked.css';

export interface CrackedProps {
  children?: React.ReactNode;
}

const Cracked: FC<CrackedProps> = ({ children }) => (
  <div className="bg-text">
    <div className="slicer-gradient">
      {new Array(40).fill(1).map((_, i) => (
        <div key={`slice-${i + 1}`} className="text">
          {children}
        </div>
      ))}
    </div>
  </div>
);

export default Cracked;
