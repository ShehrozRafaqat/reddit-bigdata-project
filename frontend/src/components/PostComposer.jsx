export default function PostComposer({ loggedIn, postForm, onPostFormChange, onCreatePost, postMessage }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-900">Create Post</h3>
        <p className="text-sm text-slate-500">Share updates with your community.</p>
      </div>
      {loggedIn ? (
        <form className="space-y-3" onSubmit={onCreatePost}>
          <input
            type="text"
            placeholder="Title"
            value={postForm.title}
            onChange={(event) => onPostFormChange({ ...postForm, title: event.target.value })}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            required
          />
          <textarea
            placeholder="Write something..."
            value={postForm.body}
            onChange={(event) => onPostFormChange({ ...postForm, body: event.target.value })}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            rows={4}
          />
          <input
            type="file"
            accept="image/*,video/*"
            onChange={(event) =>
              onPostFormChange({
                ...postForm,
                mediaFile: event.target.files?.[0] || null,
              })
            }
            className="w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-600 hover:file:bg-indigo-100"
          />
          <button
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
            type="submit"
          >
            Post
          </button>
          {postMessage ? <span className="block text-sm text-rose-500">{postMessage}</span> : null}
        </form>
      ) : (
        <p className="text-sm text-slate-400">Login to create a post.</p>
      )}
    </div>
  );
}
