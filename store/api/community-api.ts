"use client";
import { authApi } from "./auth-api";
import { itemsApi } from "./items-api";
import type { ApiResponse, Page } from "@/lib/items";
import type {
  SavedItem,
  Notification,
  PublicProfile,
  Rating,
  AdminUser,
  UserBan,
} from "@/lib/community";

type ListArgs = { page: number; userId: string };
export const communityApi = authApi.injectEndpoints({
  endpoints: (b) => ({
    savedItems: b.query<Page<SavedItem>, ListArgs>({
      query: ({ page }) => ({ url: "saved-items", method: "POST", body: { page } }),
      transformResponse: (r: ApiResponse<Page<SavedItem>>) => r.data,
      providesTags: ["Saved"],
      keepUnusedDataFor: 0,
    }),
    saveItem: b.mutation<unknown, string>({
      query: (id) => ({ url: "save-item", method: "POST", body: { id } }),
      invalidatesTags: ["Saved"],
    }),
    unsaveItem: b.mutation<unknown, string>({
      query: (id) => ({ url: "unsave-item", method: "POST", body: { id } }),
      invalidatesTags: ["Saved"],
    }),
    notifications: b.query<Page<Notification>, ListArgs>({
      query: ({ page }) => ({ url: "notifications", method: "POST", body: { page } }),
      transformResponse: (r: ApiResponse<Page<Notification>>) => r.data,
      providesTags: ["Notifications"],
      keepUnusedDataFor: 0,
    }),
    readNotification: b.mutation<unknown, string | void>({
      query: (id) => ({
        url: id ? "read-notification" : "read-all-notifications",
        method: "POST",
        body: id ? { id } : {},
      }),
      invalidatesTags: ["Notifications"],
    }),
    submitRating: b.mutation<
      unknown,
      { toUserId: string; itemId: string; score: number; comment: string }
    >({
      query: (body) => ({ url: "submit-rating", method: "POST", body }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(itemsApi.util.invalidateTags(["Item", "Profile", "Ratings"]));
        } catch {}
      },
    }),
    indexItem: b.mutation<unknown, { id: string; photos: boolean }>({
      query: ({ id, photos }) => ({
        url: photos ? "index-photos" : "index-text",
        method: "POST",
        body: { id },
        timeout: 75000,
      }),
    }),
    startGoogleLink: b.mutation<{ authorizationUrl: string }, void>({
      query: () => ({ url: "google-link", method: "POST", body: {} }),
    }),
    recoverPassword: b.mutation<
      { message: string },
      { email: string } | { token: string; newPassword: string }
    >({
      query: (body) => ({
        url: "email" in body ? "forgot-password" : "reset-password",
        method: "POST",
        body,
      }),
    }),
    adminUsers: b.query<Page<AdminUser>, ListArgs & { q: string }>({
      query: ({ page, q }) => ({ url: "admin-users", method: "POST", body: { page, q } }),
      transformResponse: (r: ApiResponse<Page<AdminUser>>) => r.data,
      providesTags: ["Admin"],
      keepUnusedDataFor: 0,
    }),
    adminUser: b.query<AdminUser, { id: string; userId: string }>({
      query: ({ id }) => ({ url: "admin-user", method: "POST", body: { id } }),
      transformResponse: (r: ApiResponse<AdminUser>) => r.data,
      providesTags: ["Admin"],
      keepUnusedDataFor: 0,
    }),
    adminBans: b.query<Page<UserBan>, ListArgs & { id: string }>({
      query: ({ id, page }) => ({ url: "admin-bans", method: "POST", body: { id, page } }),
      transformResponse: (r: ApiResponse<Page<UserBan>>) => r.data,
      providesTags: ["Admin"],
      keepUnusedDataFor: 0,
    }),
    adminChange: b.mutation<
      unknown,
      {
        action:
          | "admin-role"
          | "admin-ban"
          | "admin-revoke"
          | "create-category"
          | "update-category"
          | "delete-category";
        id?: string;
        role?: string;
        reason?: string;
        expiresAt?: string | null;
        banId?: string;
        name?: string;
        iconUrl?: string;
      }
    >({
      query: ({ action, ...body }) => ({ url: action, method: "POST", body }),
      invalidatesTags: ["Admin", "Session"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(itemsApi.util.resetApiState());
        } catch {}
      },
    }),
  }),
});
const publicApi = itemsApi.injectEndpoints({
  endpoints: (b) => ({
    publicProfile: b.query<PublicProfile, string>({
      query: (id) => `users/${encodeURIComponent(id)}`,
      transformResponse: (r: ApiResponse<PublicProfile>) => r.data,
      providesTags: ["Profile"],
    }),
    ratings: b.query<Page<Rating>, { id: string; page: number }>({
      query: ({ id, page }) =>
        `ratings/user/${encodeURIComponent(id)}?page=${page}&size=20&sort=createdAt,desc`,
      transformResponse: (r: ApiResponse<Page<Rating>>) => r.data,
      providesTags: ["Ratings"],
    }),
  }),
});
export const {
  useSavedItemsQuery,
  useSaveItemMutation,
  useUnsaveItemMutation,
  useNotificationsQuery,
  useReadNotificationMutation,
  useSubmitRatingMutation,
  useIndexItemMutation,
  useRecoverPasswordMutation,
  useStartGoogleLinkMutation,
  useAdminUsersQuery,
  useAdminUserQuery,
  useAdminBansQuery,
  useAdminChangeMutation,
} = communityApi;
export const { usePublicProfileQuery, useRatingsQuery } = publicApi;
