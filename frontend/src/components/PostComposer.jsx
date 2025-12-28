export default function PostComposer({ loggedIn, postForm, onPostFormChange, onCreatePost, postMessage }) {
  if (!loggedIn) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-200 bg-white p-5 text-sm text-slate-400">
        Login to create a post.
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">Create a post</h3>
      <form className="mt-4 space-y-3" onSubmit={onCreatePost}>
        <input
          type="text"
          placeholder="Post title"
          value={postForm.title}
          onChange={(event) => onPostFormChange({ ...postForm, title: event.target.value })}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
          required
        />
        <textarea
          placeholder="Share your thoughts..."
          value={postForm.body}
          onChange={(event) => onPostFormChange({ ...postForm, body: event.target.value })}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
          rows={4}
        />
        <input
          type="file"
          onChange={(event) =>
            onPostFormChange({ ...postForm, mediaFile: event.target.files?.[0] || null })
          }
          className="w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-orange-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-orange-600 hover:file:bg-orange-100"
        />
        <button
          className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-500"
          type="submit"
        >
          Post
        </button>
        {postMessage ? <span className="text-sm text-rose-500">{postMessage}</span> : null}
      </form>
    </section>
  );
}
