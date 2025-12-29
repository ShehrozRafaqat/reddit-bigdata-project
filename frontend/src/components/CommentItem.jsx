import { useState } from "react";

export default function CommentItem({ comment, loggedIn, onReply, depth = 0, children }) {
  const [showReply, setShowReply] = useState(false);
  const indent = Math.min(depth * 16, 64);

  return (
    <div
      className="rounded-xl border border-slate-100 bg-slate-50 p-3"
      style={{ marginLeft: indent }}
    >
      <div className="text-xs text-slate-500">
        {comment.author || "Anonymous"} • {new Date(comment.created_at).toLocaleString()}
      </div>
      <p className="mt-2 text-sm text-slate-700">{comment.body}</p>
      {loggedIn ? (
        <button
          type="button"
          onClick={() => setShowReply((prev) => !prev)}
          className="mt-2 text-xs font-semibold text-orange-600 hover:text-orange-500"
        >
          Reply
        </button>
      ) : null}
      {showReply ? (
        <form
          className="mt-3 space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.target;
            const input = form.elements.namedItem("reply");
            const value = input?.value?.trim();
            if (!value) return;
            onReply(value);
            form.reset();
            setShowReply(false);
          }}
        >
          <input
            type="text"
            name="reply"
            placeholder="Write a reply"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
            required
          />
          <button
            type="submit"
            className="rounded-lg bg-orange-600 px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-orange-500"
          >
            Post reply
          </button>
        </form>
      ) : null}
      {children ? (
        <div className="mt-3 space-y-3 border-l border-slate-200 pl-4">{children}</div>
      ) : null}
    </div>
  );
}
