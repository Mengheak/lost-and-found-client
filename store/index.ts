import { configureStore } from "@reduxjs/toolkit";
import filtersReducer from "./slices/filters-slice";
import { itemsApi } from "./api/items-api";
import { authApi } from "./api/auth-api";

// Each mounted provider owns its store; never share request state on the server.
export const makeStore = () =>
  configureStore({
    // Authentication mutation arguments contain passwords; don't record them in DevTools.
    devTools: false,
    reducer: {
      filters: filtersReducer,
      [itemsApi.reducerPath]: itemsApi.reducer,
      [authApi.reducerPath]: authApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(itemsApi.middleware, authApi.middleware),
  });
export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
