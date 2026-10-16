import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ItemTypeFilter } from "@/lib/constants";

type FiltersState = { query: string; type: ItemTypeFilter };
const initialState: FiltersState = { query: "", type: "all" };

const filtersSlice = createSlice({
  name: "filters",
  initialState,
  reducers: {
    setQuery(state, action: PayloadAction<string>) { state.query = action.payload; },
    setType(state, action: PayloadAction<ItemTypeFilter>) { state.type = action.payload; },
    resetFilters: () => initialState,
  },
});

export const { setQuery, setType, resetFilters } = filtersSlice.actions;
export default filtersSlice.reducer;
