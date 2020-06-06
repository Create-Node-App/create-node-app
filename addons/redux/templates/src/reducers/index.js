import { combineReducers } from 'redux';
import { reducer as formReducer } from 'redux-form';
import { connectRouter } from 'connected-react-router';

export default (history) => combineReducers({
  // connected react router reducer with history binding
  router: connectRouter(history),

  // redux form reducer
  form: formReducer,

  // Add your custom reducers here
});
