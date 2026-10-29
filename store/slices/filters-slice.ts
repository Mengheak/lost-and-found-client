import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ItemTypeFilter } from "@/lib/constants";
import type { ItemFilters, ItemStatus } from "@/lib/items";

const initialState: ItemFilters = { query: "", type: "all", categoryId: "", status: "", page: 0 };

const filtersSlice = createSlice({
  name: "filters",
  initialState,
  reducers: {
    setAdvancedFilters(
      state,
      action: PayloadAction<Pick<ItemFilters, "brand" | "color" | "dateFrom" | "dateTo">>,
    ) {
      Object.assign(state, action.payload);
      state.page = 0;
    },
    setQuery(state, action: PayloadAction<string>) {
      state.query = action.payload;
      state.page = 0;
    },
    setType(state, action: PayloadAction<ItemTypeFilter>) {
      state.type = action.payload;
      state.page = 0;
    },
    setCategory(state, action: PayloadAction<string>) {
      state.categoryId = action.payload;
      state.page = 0;
    },
    setStatus(state, action: PayloadAction<"" | ItemStatus>) {
      state.status = action.payload;
      state.page = 0;
    },
    setPage(state, action: PayloadAction<number>) {
      state.page = Math.max(0, action.payload);
    },
    resetFilters: () => initialState,
  },
});

export const {
  setQuery,
  setType,
  setCategory,
  setStatus,
  setPage,
  resetFilters,
  setAdvancedFilters,
} = filtersSlice.actions;
export default filtersSlice.reducer;
