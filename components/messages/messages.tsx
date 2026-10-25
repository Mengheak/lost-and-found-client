"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  RefreshCw,
  Send,
  X,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { useSessionQuery } from "@/store/api/auth-api";
import {
  useConversationsQuery,
  useConversationQuery,
  useMessagesQuery,
  useSendMessageMutation,
  useSendImageMutation,
} from "@/store/api/chat-api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { chatError, validateChatImage } from "@/lib/chat";
import { STATUS_LABELS } from "@/lib/items";
import styles from "./messages.module.css";

export function Messages({ id }: { id?: string }) {
  const session = useSessionQuery();
  return (
    <section className={`container ${styles.page}`}>
      {session.isLoading ? (
        <p role="status">Checking your session…</p>
      ) : !session.data?.user ? (
        <div className={styles.empty}>
          <MessageCircle size={32} aria-hidden="true" />
          <h1>Messages</h1>
          <p>
            {session.isError && !("status" in session.error && session.error.status === 401)
              ? chatError(session.error)
              : "Sign in to keep in touch with reporters and arrange a return."}
          </p>
          <div className="row">
            <Link className="ui-button ui-button--primary" href="/login">
              Sign in
            </Link>
            <Button variant="secondary" onClick={() => session.refetch()}>
              Retry
            </Button>
          </div>
        </div>
      ) : id ? (
        <ConversationView
          key={`${session.data.user.id}:${id}`}
          id={id}
          userId={session.data.user.id}
        />
      ) : (
        <Inbox key={session.data.user.id} userId={session.data.user.id} />
      )}
    </section>
  );
}

function Pages({
  page,
  last,
  busy,
  onChange,
  messages = false,
}: {
  page: number;
  last: boolean;
  busy: boolean;
  onChange: (page: number) => void;
  messages?: boolean;
}) {
  return (
    <nav
      className={styles.pagination}
      aria-label={messages ? "Message history pages" : "Conversation pages"}
    >
      <Button variant="secondary" disabled={page === 0 || busy} onClick={() => onChange(page - 1)}>
        <ChevronLeft size={16} aria-hidden="true" />
        {messages ? "Newer" : "Previous"}
      </Button>
      <span>Page {page + 1}</span>
      <Button variant="secondary" disabled={last || busy} onClick={() => onChange(page + 1)}>
        {messages ? "Older" : "Next"}
        <ChevronRight size={16} aria-hidden="true" />
      </Button>
    </nav>
  );
}

function Inbox({ userId }: { userId: string }) {
  const [page, setPage] = useState(0);
  const conversations = useConversationsQuery(
    { page, userId },
    { refetchOnMountOrArgChange: true, pollingInterval: 15000, skipPollingIfUnfocused: true },
  );
  return (
    <>
      <div className={styles.header}>
        <div className="hero">
          <p className="eyebrow muted">Your inbox</p>
          <h1>Messages</h1>
          <p className="muted">A little conversation can bring something home.</p>
        </div>
        <Button
          variant="secondary"
          disabled={conversations.isFetching}
          onClick={() => conversations.refetch()}
        >
          <RefreshCw size={16} aria-hidden="true" /> Refresh
        </Button>
      </div>
      {conversations.isLoading && <p role="status">Loading conversations…</p>}
      {conversations.isError ? (
        <p role="alert">{chatError(conversations.error)}</p>
      ) : (
        conversations.currentData && (
          <>
            {conversations.currentData.content.length === 0 ? (
              <div className={styles.empty}>
                <MessageCircle size={32} aria-hidden="true" />
                <h2>No conversations yet</h2>
                <p>Open an item and select “Contact reporter” to start a conversation.</p>
                <Link className="ui-button ui-button--primary" href="/items">
                  Browse items <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
              </div>
            ) : (
              <ul className={styles.conversations}>
                {conversations.currentData.content.map((conversation) => {
                  const other =
                    conversation.userA.id === userId ? conversation.userB : conversation.userA;
                  return (
                    <li key={conversation.id}>
                      <Link className={styles.conversation} href={`/messages/${conversation.id}`}>
                        <Avatar name={other.name} src={other.profilePhotoUrl} decorative />
                        <div className={styles.preview}>
                          <div className={styles.previewHeading}>
                            <h2>{other.name}</h2>
                            <time dateTime={conversation.createdAt}>
                              {new Intl.DateTimeFormat("en", {
                                month: "short",
                                day: "numeric",
                              }).format(new Date(conversation.createdAt))}
                            </time>
                          </div>
                          <p>{conversation.item.name}</p>
                          <div className={styles.tags}>
                            <Badge tone={conversation.item.type === "LOST" ? "lost" : "found"}>
                              {conversation.item.type === "LOST" ? "Lost" : "Found"}
                            </Badge>
                            <span className="muted">{STATUS_LABELS[conversation.item.status]}</span>
                          </div>
                        </div>
                        <ArrowUpRight size={18} className="muted" aria-hidden="true" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
            {(!conversations.currentData.first || !conversations.currentData.last) && (
              <Pages
                page={page}
                last={conversations.currentData.last}
                busy={conversations.isFetching}
                onChange={setPage}
              />
            )}
          </>
        )
      )}
    </>
  );
}

function ChatPhoto({ file }: { file: File }) {
  const preview = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const url = URL.createObjectURL(file);
    if (preview.current) preview.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);
  // eslint-disable-next-line @next/next/no-img-element
  return <img ref={preview} className={styles.attachmentImage} alt="Selected photo preview" />;
}

function MessagePhoto({ url }: { url: string }) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <p className="muted">Photo unavailable. Refresh messages to renew its link.</p>
  ) : (
    <a href={url} target="_blank" rel="noopener noreferrer" aria-label="Open attached photo">
      {/* Signed private images load directly without an image proxy cache. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className={styles.attachmentImage}
        src={url}
        alt="Photo attached to message"
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </a>
  );
}

function ConversationView({ id, userId }: { id: string; userId: string }) {
  const valid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const [page, setPage] = useState(0);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const picker = useRef<HTMLInputElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const previousPage = useRef<number | null>(null);
  const conversation = useConversationQuery({ id, userId }, { skip: !valid });
  const history = useMessagesQuery(
    { id, page, userId },
    {
      skip: !valid || !conversation.data || conversation.isError,
      refetchOnMountOrArgChange: true,
      pollingInterval: 15000,
      skipPollingIfUnfocused: true,
    },
  );
  const [send, sending] = useSendMessageMutation();
  const [sendImage, uploading] = useSendImageMutation();
  const isLoading = sending.isLoading || uploading.isLoading;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if ((!text.trim() && !photo) || isLoading) return;
    setError("");
    setSent(false);
    try {
      if (photo) {
        const invalid = validateChatImage(photo);
        if (invalid) {
          setError(invalid);
          return;
        }
        const body = new FormData();
        body.set("id", id);
        body.set("image", photo);
        if (text.trim()) body.set("text", text.trim());
        await sendImage({ id, body }).unwrap();
      } else await send({ id, text }).unwrap();
      setPhoto(null);
      if (picker.current) picker.current.value = "";
      setText("");
      setPage(0);
      setSent(true);
    } catch (error) {
      setError(
        `${chatError(error)} Your draft is saved here. Refresh the messages to check whether it was sent before sending again.`,
      );
    }
  }

  useEffect(() => {
    const element = transcriptRef.current;
    if (!element || !history.currentData) return;
    const changedPage = previousPage.current !== page;
    const nearBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 160;
    if (changedPage) element.scrollTop = page === 0 ? element.scrollHeight : 0;
    else if (page === 0 && nearBottom) element.scrollTop = element.scrollHeight;
    previousPage.current = page;
  }, [history.currentData, page]);

  const thread = conversation.data;
  const other = thread && (thread.userA.id === userId ? thread.userB : thread.userA);
  return (
    <>
      <Link className="back-link" href="/messages">
        <ArrowLeft size={17} aria-hidden="true" /> All messages
      </Link>
      {!valid ? (
        <h1>Invalid conversation link</h1>
      ) : conversation.isError ? (
        <div className="section-stack">
          <h1>Conversation unavailable</h1>
          <p role="alert">{chatError(conversation.error)}</p>
          <Button onClick={() => conversation.refetch()}>Retry</Button>
        </div>
      ) : !thread ? (
        <p role="status">Loading conversation…</p>
      ) : (
        <div className={styles.thread}>
          <div className={styles.threadHeader}>
            <div className={styles.person}>
              <Avatar
                name={other?.name || "Community member"}
                src={other?.profilePhotoUrl}
                decorative
              />
              <div>
                <h1>{other?.name}</h1>
                <p className="muted">Private conversation</p>
              </div>
            </div>
            <Button
              variant="secondary"
              disabled={history.isFetching || history.isUninitialized || isLoading}
              onClick={() => history.refetch()}
            >
              <RefreshCw size={16} aria-hidden="true" /> Refresh
            </Button>
          </div>
          <Link className={styles.itemContext} href={`/items/${thread.item.id}`}>
            <MessageCircle size={18} aria-hidden="true" />
            <div>
              <span className="muted">About this item</span>
              <strong>{thread.item.name}</strong>
            </div>
            <Badge>{STATUS_LABELS[thread.item.status]}</Badge>
            <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
          <div
            className={styles.transcript}
            ref={transcriptRef}
            tabIndex={0}
            role="region"
            aria-label="Conversation history"
          >
            {history.isLoading && <p role="status">Loading messages…</p>}
            {history.isError ? (
              <p role="alert">{chatError(history.error)}</p>
            ) : (
              history.currentData && (
                <>
                  {history.currentData.content.length === 0 ? (
                    <div className={styles.empty}>
                      <MessageCircle size={28} aria-hidden="true" />
                      <h2>Say hello to {other?.name}</h2>
                      <p>Describe the item or ask a question to get started.</p>
                    </div>
                  ) : (
                    <ol className={styles.history} aria-label="Messages">
                      {[...history.currentData.content].reverse().map((message) => (
                        <li
                          key={message.id}
                          className={`${styles.bubble} ${message.senderId === userId ? styles.own : ""}`}
                        >
                          <strong>{message.senderId === userId ? "You" : other?.name}</strong>
                          {message.text && <p>{message.text}</p>}
                          {message.imageUrl && /^https?:\/\//i.test(message.imageUrl) && (
                            <MessagePhoto key={message.imageUrl} url={message.imageUrl} />
                          )}
                          <time dateTime={message.createdAt}>
                            {new Intl.DateTimeFormat("en", {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            }).format(new Date(message.createdAt))}
                          </time>
                        </li>
                      ))}
                    </ol>
                  )}
                  {(page > 0 || !history.currentData.last) && (
                    <Pages
                      page={page}
                      last={history.currentData.last}
                      busy={history.isFetching || isLoading}
                      onChange={setPage}
                      messages
                    />
                  )}
                </>
              )
            )}
          </div>
          <form className={styles.composer} onSubmit={submit}>
            <div className="field">
              <label htmlFor="message-text">Your message</label>
              <textarea
                id="message-text"
                className="ui-input"
                rows={2}
                maxLength={10000}
                required={!photo}
                value={text}
                disabled={isLoading}
                onChange={(event) => {
                  setText(event.target.value);
                  setSent(false);
                }}
                placeholder="Write a message…"
              />
            </div>
            <div className="field">
              <label htmlFor="message-photo">Attach a photo (optional)</label>
              <input
                ref={picker}
                id="message-photo"
                type="file"
                className="ui-input"
                accept="image/jpeg,image/png"
                disabled={isLoading}
                aria-describedby="message-photo-hint"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  const invalid = validateChatImage(file);
                  if (invalid) {
                    setError(invalid);
                    event.target.value = "";
                    return;
                  }
                  setPhoto(file);
                  setError("");
                  setSent(false);
                }}
              />
              <p id="message-photo-hint" className="field-message">
                One JPG or PNG photo, up to 5 MB. A caption is optional.
              </p>
            </div>
            {photo && (
              <div className={styles.attachmentPreview}>
                <ChatPhoto file={photo} />
                <span>{photo.name}</span>
                <Button
                  variant="secondary"
                  disabled={isLoading}
                  onClick={() => {
                    setPhoto(null);
                    if (picker.current) picker.current.value = "";
                    setSent(false);
                  }}
                >
                  <X size={16} aria-hidden="true" /> Remove photo
                </Button>
              </div>
            )}
            {uploading.isLoading && <p role="status">Uploading photo…</p>}
            {error && (
              <p role="alert" className="field-error">
                {error}
              </p>
            )}
            {sent && <p role="status">Message sent.</p>}
            <div className={styles.composerActions}>
              <span className="muted">
                Replies update automatically · {text.length.toLocaleString()} / 10,000
              </span>
              <Button
                type="submit"
                loading={isLoading}
                disabled={(!text.trim() && !photo) || history.isError || !history.currentData}
              >
                <Send size={16} aria-hidden="true" /> Send
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
