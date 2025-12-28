import CommentThread from "./CommentThread";
import PostMedia from "./PostMedia";

export default function PostCard({
  post,
  communityName,
  mediaMap,
  onLoadComments,
  comments,
  onCreateComment,
  loggedIn,
  commentMessage,
  onOpen,
}) {
  const handleCardClick = () => {
    if (onOpen) {
      onOpen();
    }
  };

  const handleKeyDown = (event) => {
    if (!onOpen) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen();
    }
  };

  return (
    <article
      className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition ${
        onOpen
          ? "cursor-pointer hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md"
          : ""
      }`}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
    >
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span className="rounded-full bg-orange-50 px-2 py-1 text-xs font-semibold text-orange-600">
          r/{communityName || "community"}
        </span>
        <span>{new Date(post.created_at).toLocaleString()}</span>
      </div>
      <h3 className="mt-3 text-lg font-semibold text-slate-900">{post.title}</h3>
      {post.body ? <p className="mt-2 text-sm text-slate-600">{post.body}</p> : null}
      <PostMedia mediaKeys={post.media_keys} mediaMap={mediaMap} />
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
        <span>{post.num_comments} comments</span>
        <button
          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          onClick={(event) => {
            event.stopPropagation();
            onLoadComments();
          }}
          type="button"
        >
          View comments
        </button>
      </div>
      <div className="mt-4 space-y-4" onClick={(event) => event.stopPropagation()}>
        {comments === undefined ? (
          <p className="text-sm text-slate-400">Load comments to view the thread.</p>
        ) : comments.length > 0 ? (
          <CommentThread
            comments={comments}
            loggedIn={loggedIn}
            onReply={(parentId, body) => onCreateComment({ parentId, body })}
          />
        ) : (
          <p className="text-sm text-slate-400">No comments yet.</p>
        )}

        {loggedIn ? (
          <form
            className="space-y-2"
            onSubmit={(event) => {
              event.preventDefault();
              const form = event.target;
              const input = form.elements.namedItem("comment");
              const value = input?.value?.trim();
              if (!value) return;
              onCreateComment({ parentId: null, body: value });
              form.reset();
            }}
          >
            <input
              type="text"
              name="comment"
              placeholder="Add a comment"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
              required
            />
            <button
              className="rounded-xl bg-orange-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-orange-500"
              type="submit"
            >
              Comment
            </button>
          </form>
        ) : (
          <p className="text-sm text-slate-400">Login to add comments.</p>
        )}
        {commentMessage ? <span className="text-sm text-rose-500">{commentMessage}</span> : null}
      </div>
    </article>
  );
}
