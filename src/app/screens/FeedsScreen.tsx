import React, { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import { useFeeds } from "../context/FeedContext";
import type { FeedChannel, FeedPost } from "../data/feedTypes";
import { FEED_CHANNELS } from "../data/feedTypes";
import {
  isCommunityAdminForFeeds,
  isSuperAdminForFeeds,
} from "@/utils/feedPermissions";

function formatFeedDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

type Draft = { channel: FeedChannel; title: string; body: string };

const emptyDraft = (channel: FeedChannel): Draft => ({
  channel,
  title: "",
  body: "",
});

export function FeedsScreen() {
  const { user } = useApp();
  const { posts, remoteLoading, canModify, addPost, updatePost, deletePost } = useFeeds();
  const [channel, setChannel] = useState<FeedChannel>("general");
  const [composeOpen, setComposeOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(() => emptyDraft("general"));
  const [editing, setEditing] = useState<FeedPost | null>(null);
  const [editDraft, setEditDraft] = useState<Draft | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FeedPost | null>(null);

  const filtered = useMemo(
    () => posts.filter((p) => p.channel === channel).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [posts, channel],
  );

  const canPost = !!(user?.id && user.email);
  const modHint =
    user && (isSuperAdminForFeeds(user) || isCommunityAdminForFeeds(user))
      ? isSuperAdminForFeeds(user)
        ? "Superadmin: you can edit or remove any post in these feeds."
        : "Community admin: you can edit or remove any post in these feeds."
      : null;

  function openCompose() {
    setDraft(emptyDraft(channel));
    setComposeOpen(true);
  }

  function submitCompose() {
    const created = addPost(draft);
    if (created) {
      setComposeOpen(false);
      setDraft(emptyDraft(channel));
    }
  }

  function openEdit(post: FeedPost) {
    setEditing(post);
    setEditDraft({
      channel: post.channel,
      title: post.title,
      body: post.body,
    });
  }

  function submitEdit() {
    if (!editing || !editDraft) return;
    if (updatePost(editing.id, editDraft)) {
      setEditing(null);
      setEditDraft(null);
    }
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    if (deletePost(deleteTarget.id)) {
      setDeleteTarget(null);
    }
  }

  return (
    <div
      data-testid="feeds-root"
      className="h-full flex flex-col overflow-hidden"
      style={{ background: "#F0EFFF" }}
    >
      <div className="flex-shrink-0 px-3 pt-2 pb-1 border-b border-gray-100 bg-white/90 backdrop-blur-sm">
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-thin" data-testid="feeds-channel-tabs">
          {FEED_CHANNELS.map((c) => {
            const active = c.id === channel;
            return (
              <button
                key={c.id}
                type="button"
                data-testid={`feeds-tab-${c.id}`}
                onClick={() => setChannel(c.id)}
                aria-current={active ? "true" : undefined}
                className="flex-shrink-0 flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: active ? "rgba(67,97,238,0.12)" : "white",
                  color: active ? "#4361EE" : "#6B7280",
                  border: `1px solid ${active ? "rgba(67,97,238,0.35)" : "#e5e7eb"}`,
                }}
              >
                <span>{c.emoji}</span>
                <span>{c.label}</span>
              </button>
            );
          })}
        </div>
        {modHint && (
          <p className="text-[10px] text-gray-500 leading-snug mt-1 px-0.5">{modHint}</p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {remoteLoading && (
          <div className="text-center text-gray-400 text-xs py-2" data-testid="feeds-remote-loading">
            Loading community posts…
          </div>
        )}
        {canPost ? (
          <button
            type="button"
            data-testid="feeds-new-post"
            onClick={openCompose}
            className="w-full py-3 rounded-2xl font-bold text-sm text-white shadow-md"
            style={{ background: "linear-gradient(135deg,#4361EE,#7209B7)" }}
          >
            + New post in {FEED_CHANNELS.find((c) => c.id === channel)?.label ?? "this feed"}
          </button>
        ) : (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Sign in with an email address to create posts. You can still read every channel.
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white/60 px-4 py-8 text-center text-gray-500 text-sm">
            No posts here yet.
            {canPost && " Be the first to share something."}
          </div>
        ) : (
          filtered.map((post) => {
            const showActions = canModify(post);
            return (
              <article
                key={post.id}
                data-testid="feeds-post-card"
                data-post-id={post.id}
                className="rounded-2xl bg-white border border-gray-100 p-3.5 shadow-sm"
                style={{ boxShadow: "0 8px 24px rgba(67,97,238,0.06)" }}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="min-w-0">
                    <div className="font-bold text-gray-900 text-sm leading-tight">{post.title}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      {post.authorDisplayName}
                      <span className="text-gray-300"> · </span>
                      {formatFeedDate(post.createdAt)}
                      {post.updatedAt !== post.createdAt && (
                        <span className="text-gray-300"> · edited {formatFeedDate(post.updatedAt)}</span>
                      )}
                    </div>
                  </div>
                  {showActions && (
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        type="button"
                        data-testid="feeds-edit"
                        onClick={() => openEdit(post)}
                        className="px-2 py-1 rounded-lg text-[11px] font-semibold text-[#4361EE] bg-[#EEF1FF]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        data-testid="feeds-delete"
                        onClick={() => setDeleteTarget(post)}
                        className="px-2 py-1 rounded-lg text-[11px] font-semibold text-red-600 bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-gray-600 text-xs leading-relaxed whitespace-pre-wrap">{post.body}</p>
              </article>
            );
          })
        )}
      </div>

      {composeOpen && (
        <Modal title="New post" testId="feeds-modal-compose" onClose={() => setComposeOpen(false)}>
          <PostForm
            draft={draft}
            onChange={setDraft}
            submitLabel="Publish"
            submitTestId="feeds-compose-submit"
            onSubmit={submitCompose}
            onCancel={() => setComposeOpen(false)}
          />
        </Modal>
      )}

      {editing && editDraft && (
        <Modal
          title="Edit post"
          testId="feeds-modal-edit"
          onClose={() => { setEditing(null); setEditDraft(null); }}
        >
          <PostForm
            draft={editDraft}
            onChange={setEditDraft}
            submitLabel="Save changes"
            submitTestId="feeds-edit-submit"
            onSubmit={submitEdit}
            onCancel={() => { setEditing(null); setEditDraft(null); }}
          />
        </Modal>
      )}

      {deleteTarget && (
        <Modal title="Delete post?" testId="feeds-modal-delete" onClose={() => setDeleteTarget(null)}>
          <p className="text-sm text-gray-600 mb-4">
            Remove “{deleteTarget.title}”? This cannot be undone on this device.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              data-testid="feeds-delete-confirm"
              onClick={confirmDelete}
              className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold"
            >
              Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({
  title,
  children,
  testId,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  testId?: string;
  onClose: () => void;
}) {
  return (
    <div
      className="absolute inset-0 z-50 flex items-end sm:items-center justify-center p-3"
      style={{ background: "rgba(15,23,42,0.45)" }}
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="feeds-modal-title"
        data-testid={testId}
        className="w-full max-w-md rounded-3xl bg-white shadow-xl border border-gray-100 p-4 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 id="feeds-modal-title" className="font-bold text-gray-900 text-sm">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 text-lg leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function PostForm({
  draft,
  onChange,
  submitLabel,
  submitTestId,
  onSubmit,
  onCancel,
}: {
  draft: Draft;
  onChange: (d: Draft) => void;
  submitLabel: string;
  submitTestId?: string;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const valid = draft.title.trim().length > 0 && draft.body.trim().length > 0;
  return (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Channel</label>
        <select
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white"
          data-testid="feeds-form-channel"
          value={draft.channel}
          onChange={(e) => onChange({ ...draft, channel: e.target.value as FeedChannel })}
        >
          {FEED_CHANNELS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.emoji} {c.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Title</label>
        <input
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          data-testid="feeds-form-title"
          value={draft.title}
          onChange={(e) => onChange({ ...draft, title: e.target.value })}
          placeholder="Short headline"
          maxLength={200}
        />
      </div>
      <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Body</label>
        <textarea
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm min-h-[120px] resize-y"
          data-testid="feeds-form-body"
          value={draft.body}
          onChange={(e) => onChange({ ...draft, body: e.target.value })}
          placeholder="What do you want to share?"
          maxLength={8000}
        />
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold"
        >
          Cancel
        </button>
        <button
          type="button"
          data-testid={submitTestId}
          disabled={!valid}
          onClick={onSubmit}
          className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-40"
          style={{ background: "linear-gradient(135deg,#4361EE,#7209B7)" }}
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
