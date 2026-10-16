import { configureStore } from "@reduxjs/toolkit";
import filtersReducer from "./slices/filters-slice";
import { itemsApi } from "./api/items-api";

// Each mounted provider owns its store; never share request state on the server.
export const makeStore = () => configureStore({
  reducer: { filters: filtersReducer, [itemsApi.reducerPath]: itemsApi.reducer },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(itemsApi.middleware),
});
export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
