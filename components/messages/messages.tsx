"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useSessionQuery } from "@/store/api/auth-api";
import {
  useConversationsQuery,
  useConversationQuery,
  useMessagesQuery,
  useSendMessageMutation,
} from "@/store/api/chat-api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { chatError } from "@/lib/chat";
import { STATUS_LABELS } from "@/lib/items";
import styles from "./messages.module.css";

export function Messages({ id }: { id?: string }) {
  const session = useSessionQuery();
  return (
    <section className={`container page-stack ${styles.page}`}>
      {session.isLoading ? (
        <p role="status">Checking your session…</p>
      ) : !session.data?.user ? (
        <div className="section-stack">
          <h1>Messages</h1>
          <p>{session.isError ? chatError(session.error) : "Sign in to view your messages."}</p>
          <div className="row">
            <Link href="/login">Sign in</Link>
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
    <nav className="row" aria-label={messages ? "Message history pages" : "Conversation pages"}>
      <Button variant="secondary" disabled={page === 0 || busy} onClick={() => onChange(page - 1)}>
        {messages ? "Newer messages" : "Previous"}
      </Button>
      <span>Page {page + 1}</span>
      <Button variant="secondary" disabled={last || busy} onClick={() => onChange(page + 1)}>
        {messages ? "Older messages" : "Next"}
      </Button>
    </nav>
  );
}

function Inbox({ userId }: { userId: string }) {
  const [page, setPage] = useState(0);
  const conversations = useConversationsQuery(
    { page, userId },
    { refetchOnMountOrArgChange: true },
  );
  return (
    <>
      <div className="reports-header">
        <div className="hero">
          <p className="eyebrow">Keep in touch</p>
          <h1>Messages</h1>
          <p className="muted">Discuss items and arrange their return.</p>
        </div>
        <Button
          variant="secondary"
          disabled={conversations.isFetching}
          onClick={() => conversations.refetch()}
        >
          Refresh
        </Button>
      </div>
      {conversations.isFetching && <p role="status">Loading conversations…</p>}
      {conversations.isError ? (
        <p role="alert">{chatError(conversations.error)}</p>
      ) : (
        conversations.currentData && (
          <>
            {conversations.currentData.content.length === 0 ? (
              <div className="browse-message">
                <h2>No conversations yet</h2>
                <p>Open an item and select “Contact reporter” to start a conversation.</p>
                <Link href="/items">Browse items</Link>
              </div>
            ) : (
              <ul className={styles.conversations}>
                {conversations.currentData.content.map((conversation) => {
                  const other =
                    conversation.userA.id === userId ? conversation.userB : conversation.userA;
                  return (
                    <li key={conversation.id}>
                      <Link
                        className={`ui-card ${styles.conversation}`}
                        href={`/messages/${conversation.id}`}
                      >
                        <div className="row">
                          <Badge tone={conversation.item.type === "LOST" ? "lost" : "found"}>
                            {conversation.item.type === "LOST" ? "Lost" : "Found"}
                          </Badge>
                          <Badge>{STATUS_LABELS[conversation.item.status]}</Badge>
                        </div>
                        <h2>{conversation.item.name}</h2>
                        <p className="muted">With {other.name}</p>
                        <span>Open conversation →</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
            <Pages
              page={page}
              last={conversations.currentData.last}
              busy={conversations.isFetching}
              onChange={setPage}
            />
          </>
        )
      )}
    </>
  );
}

function ConversationView({ id, userId }: { id: string; userId: string }) {
  const valid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const [page, setPage] = useState(0);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const conversation = useConversationQuery({ id, userId }, { skip: !valid });
  const history = useMessagesQuery(
    { id, page, userId },
    { skip: !valid || !conversation.data || conversation.isError, refetchOnMountOrArgChange: true },
  );
  const [send, { isLoading }] = useSendMessageMutation();

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!text.trim() || isLoading) return;
    setError("");
    setSent(false);
    try {
      await send({ id, text }).unwrap();
      setText("");
      setPage(0);
      setSent(true);
    } catch (error) {
      setError(
        `${chatError(error)} Your draft is saved here. Refresh the messages to check whether it was sent before sending again.`,
      );
    }
  }

  const thread = conversation.data;
  const other = thread && (thread.userA.id === userId ? thread.userB : thread.userA);
  return (
    <>
      <Link className="back-link" href="/messages">
        ← All messages
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
        <>
          <div className="reports-header">
            <div className="hero">
              <p className="eyebrow">Conversation with {other?.name}</p>
              <h1>{thread.item.name}</h1>
              <Link href={`/items/${thread.item.id}`}>View item</Link>
            </div>
            <Button
              variant="secondary"
              disabled={history.isFetching || history.isUninitialized || isLoading}
              onClick={() => history.refetch()}
            >
              Refresh messages
            </Button>
          </div>
          <p className="muted">Use Refresh messages to check for replies.</p>
          {history.isFetching && <p role="status">Loading messages…</p>}
          {history.isError ? (
            <p role="alert">{chatError(history.error)}</p>
          ) : (
            history.currentData && (
              <>
                {history.currentData.content.length === 0 ? (
                  <p className="browse-message">
                    No messages yet. Introduce yourself and describe the item.
                  </p>
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
                          <a href={message.imageUrl} target="_blank" rel="noopener noreferrer">
                            View attached image
                          </a>
                        )}
                        <time dateTime={message.createdAt}>
                          {new Date(message.createdAt).toLocaleString()}
                        </time>
                      </li>
                    ))}
                  </ol>
                )}
                <Pages
                  page={page}
                  last={history.currentData.last}
                  busy={history.isFetching || isLoading}
                  onChange={setPage}
                  messages
                />
              </>
            )
          )}
          <form className="ui-card section-stack" onSubmit={submit}>
            <div className="field">
              <label htmlFor="message-text">Your message</label>
              <textarea
                id="message-text"
                className="ui-input"
                rows={4}
                maxLength={10000}
                required
                value={text}
                disabled={isLoading}
                onChange={(event) => {
                  setText(event.target.value);
                  setSent(false);
                }}
                placeholder="Describe the item or arrange a time to return it…"
              />
            </div>
            {error && (
              <p role="alert" className="field-error">
                {error}
              </p>
            )}
            {sent && <p role="status">Message sent.</p>}
            <div className="row">
              <Button type="submit" loading={isLoading} disabled={!text.trim() || history.isError}>
                Send message
              </Button>
              <span className="muted">{text.length.toLocaleString()} / 10,000</span>
            </div>
          </form>
        </>
      )}
    </>
  );
}
