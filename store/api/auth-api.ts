"use client";

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { AuthUser, Credentials, Registration } from "@/lib/auth";

const baseQuery = fetchBaseQuery({ baseUrl: "/api/auth/", timeout: 25000 });
// Serialize token rotation across tabs where Web Locks are supported.
const lockedQuery: typeof baseQuery = async (args, api, options) => {
  const run = () => baseQuery(args, api, options);
  if (typeof navigator !== "undefined" && navigator.locks)
    return navigator.locks.request("lf-session", run);
  return run();
};
export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: lockedQuery,
  tagTypes: ["Session", "Reports"],
  endpoints: (builder) => ({
    myItems: builder.query<
      import("@/lib/items").Page<import("@/lib/items").Item>,
      { page: number; userId: string }
    >({
      query: ({ page }) => ({ url: "my-items", method: "POST", body: { page } }),
      transformResponse: (
        result: import("@/lib/items").ApiResponse<
          import("@/lib/items").Page<import("@/lib/items").Item>
        >,
      ) => result.data,
      providesTags: ["Reports"],
      keepUnusedDataFor: 0,
    }),
    deleteItem: builder.mutation<{ message: string }, { id: string }>({
      query: (body) => ({
        url: "delete-item",
        method: "POST",
        body,
        timeout: 75000,
      }),
      invalidatesTags: ["Reports"],
    }),
    editItem: builder.mutation<{ data: import("@/lib/items").Item }, FormData>({
      query: (body) => ({ url: "edit-item", method: "POST", body, timeout: 75000 }),
      invalidatesTags: ["Reports"],
    }),
    itemStatus: builder.mutation<unknown, { id: string; status: "RETURNED" | "CLOSED" }>({
      query: (body) => ({ url: "item-status", method: "POST", body }),
      invalidatesTags: ["Reports"],
    }),
    reportItem: builder.mutation<{ data: import("@/lib/items").Item }, FormData>({
      query: (body) => ({ url: "report-item", method: "POST", body, timeout: 75000 }),
      invalidatesTags: ["Reports"],
    }),
    startGoogle: builder.mutation<{ authorizationUrl: string }, void>({
      query: () => ({ url: "google-start", method: "POST", body: {} }),
    }),
    completeGoogle: builder.mutation<{ user: AuthUser }, void>({
      query: () => ({ url: "google-complete", method: "POST", body: {} }),
      invalidatesTags: ["Session"],
    }),
    session: builder.query<{ user: AuthUser | null }, void>({
      query: () => ({ url: "session", method: "POST", body: {} }),
      providesTags: ["Session"],
      keepUnusedDataFor: 0,
    }),
    login: builder.mutation<{ user: AuthUser }, Credentials>({
      query: (body) => ({ url: "login", method: "POST", body }),
      invalidatesTags: ["Session"],
    }),
    register: builder.mutation<{ user: AuthUser }, Registration>({
      query: (body) => ({ url: "register", method: "POST", body }),
      invalidatesTags: ["Session"],
    }),
    logout: builder.mutation<{ user: null }, void>({
      query: () => ({ url: "logout", method: "POST", body: {} }),
      invalidatesTags: ["Session"],
    }),
  }),
});
export const {
  useMyItemsQuery,
  useEditItemMutation,
  useItemStatusMutation,
  useReportItemMutation,
  useSessionQuery,
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useDeleteItemMutation,
  useStartGoogleMutation,
  useCompleteGoogleMutation,
} = authApi;
