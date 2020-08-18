import { CombinedState } from "redux";
import { RouterState } from "connected-react-router";
import { History } from "history";
import { FormStateMap } from "redux-form";

export type StoreType = CombinedState<{
  router: RouterState<History.UnknownFacade>;
  form: FormStateMap;
}>
