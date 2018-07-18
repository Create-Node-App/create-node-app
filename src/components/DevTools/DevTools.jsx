import React from 'react';
import { createDevTools } from 'redux-devtools';
import ChartMonitor from 'redux-devtools-chart-monitor';
import Dispatcher from 'redux-devtools-dispatch';
import DockMonitor from 'redux-devtools-dock-monitor';
import FilterableLogMonitor from 'redux-devtools-filterable-log-monitor';
import LogMonitor from 'redux-devtools-log-monitor';
import SliderMonitor from 'redux-slider-monitor';

export default createDevTools(
  <DockMonitor
    toggleVisibilityKey="ctrl-alt-h"
    changePositionKey="ctrl-alt-w"
    changeMonitorKey='ctrl-alt-m'
  >
    <ChartMonitor />
    <LogMonitor />
    <FilterableLogMonitor />
    <SliderMonitor />
  </DockMonitor>
);
