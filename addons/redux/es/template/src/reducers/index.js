import { combineReducers } from '../../../../ts/template/src/reducers/node_modules/redux';
import { reducer as formReducer } from '../../../../ts/template/src/reducers/node_modules/redux-form';
import { connectRouter } from '../../../../ts/template/src/reducers/node_modules/connected-react-router';

export default (history) =>
  combineReducers({
    // connected react router reducer with history binding
    router: connectRouter(history),

    // redux form reducer
    form: formReducer,

    // Add your custom reducers here
  });
