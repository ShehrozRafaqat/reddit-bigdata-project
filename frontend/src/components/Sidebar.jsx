export default function Sidebar({
  communities,
  selectedCommunityId,
  onSelectCommunity,
  loggedIn,
  communityForm,
  onCommunityFormChange,
  onCreateCommunity,
  communityMessage,
}) {
  return (
    <aside className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">Communities</h3>
        <ul className="mt-4 space-y-2">
          {communities.map((community) => {
            const isActive = community.id === selectedCommunityId;
            return (
              <li key={community.id}>
                <button
                  className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                    isActive
                      ? "border-orange-500 bg-orange-50 text-orange-700"
                      : "border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900"
                  }`}
                  onClick={() => onSelectCommunity(community.id)}
                >
                  <div className="text-sm font-semibold">r/{community.name}</div>
                  <div className="text-xs text-slate-500">{community.description}</div>
                </button>
              </li>
            );
          })}
        </ul>
        {communities.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">No communities yet. Create one to start!</p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">Create Community</h3>
        {loggedIn ? (
          <form className="mt-4 space-y-3" onSubmit={onCreateCommunity}>
            <input
              type="text"
              placeholder="Community name"
              value={communityForm.name}
              onChange={(event) =>
                onCommunityFormChange({ ...communityForm, name: event.target.value })
              }
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
              required
            />
            <textarea
              placeholder="Short description"
              value={communityForm.description}
              onChange={(event) =>
                onCommunityFormChange({
                  ...communityForm,
                  description: event.target.value,
                })
              }
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
              rows={3}
            />
            <button
              className="w-full rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-500"
              type="submit"
            >
              Create
            </button>
            {communityMessage ? (
              <span className="text-sm text-rose-500">{communityMessage}</span>
            ) : null}
          </form>
        ) : (
          <p className="mt-4 text-sm text-slate-400">Login to create a community.</p>
        )}
      </section>
    </aside>
  );
}
