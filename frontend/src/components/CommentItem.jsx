import { useState } from "react";

export default function CommentItem({ comment, depth, onReply, loggedIn, children }) {
  const [showReply, setShowReply] = useState(false);
  const [replyBody, setReplyBody] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!replyBody.trim()) return;
    onReply(replyBody.trim());
    setReplyBody("");
    setShowReply(false);
  };

  return (
    <div className="space-y-3" style={{ marginLeft: depth * 20 }}>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-slate-600">
            u/{comment.author_user_id}
          </span>
          <span>{new Date(comment.created_at).toLocaleString()}</span>
        </div>
        <p className="mt-2 text-sm text-slate-700">{comment.body}</p>
        {loggedIn ? (
          <button
            className="mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-500"
            onClick={() => setShowReply((prev) => !prev)}
          >
            {showReply ? "Cancel" : "Reply"}
          </button>
        ) : null}
        {showReply && loggedIn ? (
          <form className="mt-3 space-y-2" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Write a reply"
              value={replyBody}
              onChange={(event) => setReplyBody(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              required
            />
            <button
              className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-500"
              type="submit"
            >
              Reply
            </button>
          </form>
        ) : null}
      </div>
      {children ? <div className="space-y-3">{children}</div> : null}
    </div>
  );
}
