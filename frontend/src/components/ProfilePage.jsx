import { useMemo } from "react";

export default function ProfilePage({
  profile,
  profileForm,
  onFormChange,
  onSaveProfile,
  onImageUpload,
  profileMessage,
  profileImageUrl,
  activeTab,
  onTabChange,
  createdCommunities,
  joinedCommunities,
  onOpenCommunity,
}) {
  const joinedList = useMemo(
    () =>
      joinedCommunities.filter(
        (community) => !createdCommunities.some((created) => created.id === community.id)
      ),
    [joinedCommunities, createdCommunities]
  );

  const activeCommunities = activeTab === "created" ? createdCommunities : joinedList;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="flex flex-col items-center gap-4 lg:w-56">
            <div className="h-32 w-32 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
              {profileImageUrl ? (
                <img
                  src={profileImageUrl}
                  alt={`${profile?.display_name || profile?.username || "User"} profile`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-slate-400">
                  {(profile?.username || "U")[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <label className="w-full cursor-pointer rounded-xl border border-dashed border-slate-300 px-3 py-2 text-center text-xs font-semibold text-slate-600 transition hover:border-orange-300 hover:text-orange-600">
              Change profile photo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onImageUpload}
              />
            </label>
          </div>

          <form className="flex-1 space-y-4" onSubmit={onSaveProfile}>
            <div>
              <label className="text-xs font-semibold uppercase text-slate-400">Display name</label>
              <input
                type="text"
                value={profileForm.display_name}
                onChange={(event) =>
                  onFormChange((prev) => ({ ...prev, display_name: event.target.value }))
                }
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-orange-500 focus:outline-none"
                placeholder="Add your name"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-slate-400">Username</label>
              <input
                type="text"
                value={profileForm.username}
                onChange={(event) =>
                  onFormChange((prev) => ({ ...prev, username: event.target.value }))
                }
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-slate-400">Email</label>
              <p className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-500">
                {profile?.email || "—"}
              </p>
            </div>
            {profileMessage ? (
              <p className="rounded-xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm text-orange-600">
                {profileMessage}
              </p>
            ) : null}
            <button
              type="submit"
              className="rounded-full bg-orange-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-500"
            >
              Save changes
            </button>
          </form>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">Community activity</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">Your spaces</h2>
          </div>
          <div className="flex rounded-full border border-slate-200 bg-slate-50 p-1 text-xs font-semibold text-slate-500">
            <button
              type="button"
              onClick={() => onTabChange("joined")}
              className={`rounded-full px-4 py-1 transition ${
                activeTab === "joined" ? "bg-white text-slate-900 shadow-sm" : ""
              }`}
            >
              Joined
            </button>
            <button
              type="button"
              onClick={() => onTabChange("created")}
              className={`rounded-full px-4 py-1 transition ${
                activeTab === "created" ? "bg-white text-slate-900 shadow-sm" : ""
              }`}
            >
              Created
            </button>
          </div>
        </div>
        <div className="mt-5 space-y-3">
          {activeCommunities.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
              {activeTab === "created"
                ? "You haven't created a community yet."
                : "You haven't joined any communities yet."}
            </p>
          ) : (
            activeCommunities.map((community) => (
              <button
                key={`${activeTab}-${community.id}`}
                type="button"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-left transition hover:border-orange-200 hover:bg-orange-50"
                onClick={() => onOpenCommunity(community.id)}
              >
                <p className="text-sm font-semibold text-slate-900">r/{community.name}</p>
                <p className="mt-1 text-xs text-slate-500">{community.description}</p>
              </button>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
