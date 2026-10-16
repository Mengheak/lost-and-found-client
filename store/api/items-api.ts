import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { itemSearchParams, type ApiResponse, type Category, type Item, type ItemFilters, type Page } from "@/lib/items";

export const itemsApi = createApi({
  reducerPath: "itemsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/catalog/", timeout: 15000 }),
  keepUnusedDataFor: 60,
  refetchOnMountOrArgChange: 60,
  endpoints: (builder) => ({
    getItems: builder.query<Page<Item>, ItemFilters>({
      query: (filters) => `items?${itemSearchParams(filters)}`,
      transformResponse: (response: ApiResponse<Page<Item>>) => response.data,
    }),
    getItem: builder.query<Item, string>({
      query: (id) => `items/${encodeURIComponent(id)}`,
      transformResponse: (response: ApiResponse<Item>) => response.data,
    }),
    getCategories: builder.query<Category[], void>({
      query: () => "categories",
      transformResponse: (response: ApiResponse<Category[]>) => response.data,
    }),
  }),
});
export const { useGetItemsQuery, useGetItemQuery, useGetCategoriesQuery } = itemsApi;
