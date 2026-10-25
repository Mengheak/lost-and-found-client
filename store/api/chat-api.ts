"use client";

import { authApi } from "./auth-api";
import type { Conversation, Message } from "@/lib/chat";
import type { ApiResponse, Page } from "@/lib/items";

const chatApi = authApi.injectEndpoints({
  endpoints: (builder) => ({
    conversations: builder.query<Page<Conversation>, { page: number; userId: string }>({
      query: ({ page }) => ({ url: "conversations", method: "POST", body: { page } }),
      transformResponse: (result: ApiResponse<Page<Conversation>>) => result.data,
      providesTags: ["Conversations"],
      keepUnusedDataFor: 0,
    }),
    conversation: builder.query<Conversation, { id: string; userId: string }>({
      query: ({ id }) => ({ url: "conversation", method: "POST", body: { id } }),
      transformResponse: (result: ApiResponse<Conversation>) => result.data,
      keepUnusedDataFor: 0,
    }),
    messages: builder.query<Page<Message>, { id: string; page: number; userId: string }>({
      query: ({ id, page }) => ({ url: "messages", method: "POST", body: { id, page } }),
      transformResponse: (result: ApiResponse<Page<Message>>) => result.data,
      providesTags: (_result, _error, { id }) => [{ type: "Messages", id }],
      keepUnusedDataFor: 0,
    }),
    startConversation: builder.mutation<Conversation, { itemId: string }>({
      query: (body) => ({ url: "start-conversation", method: "POST", body }),
      transformResponse: (result: ApiResponse<Conversation>) => result.data,
      invalidatesTags: ["Conversations"],
    }),
    sendImage: builder.mutation<Message, { id: string; body: FormData }>({
      query: ({ body }) => ({ url: "send-image", method: "POST", body, timeout: 75000 }),
      transformResponse: (result: ApiResponse<Message>) => result.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "Messages", id }],
    }),
    sendMessage: builder.mutation<Message, { id: string; text: string }>({
      query: (body) => ({ url: "send-message", method: "POST", body }),
      transformResponse: (result: ApiResponse<Message>) => result.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "Messages", id }],
    }),
  }),
});

export const {
  useConversationsQuery,
  useConversationQuery,
  useMessagesQuery,
  useStartConversationMutation,
  useSendMessageMutation,
  useSendImageMutation,
} = chatApi;
