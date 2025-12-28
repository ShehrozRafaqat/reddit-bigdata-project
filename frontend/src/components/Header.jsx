export default function Header({
  loggedIn,
  username,
  onLogin,
  onRegister,
  onLogout,
  onHome,
  onProfile,
}) {
  const userInitial = username ? username[0].toUpperCase() : "U";

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <button
          type="button"
          className="text-lg font-semibold text-orange-600"
          onClick={onHome}
        >
          Reddit Big Data Project
        </button>
        <div className="flex items-center gap-3">
          {loggedIn ? (
            <div className="group relative">
              <button
                type="button"
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1 text-sm text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                aria-label="Open user menu"
              >
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-xs font-semibold text-orange-700"
                  aria-hidden="true"
                >
                  {userInitial}
                </span>
                <span className="text-xs font-semibold">{username}</span>
                <span className="text-xs text-slate-400">▾</span>
              </button>
              <div className="pointer-events-none absolute right-0 top-full w-56 pt-2 opacity-0 transition group-hover:pointer-events-auto group-hover:opacity-100">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-lg">
                  <p className="text-xs uppercase text-slate-400">Signed in as</p>
                  <p className="mt-1 font-semibold text-slate-900">{username}</p>
                  <button
                    className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                    onClick={onProfile}
                  >
                    Profile settings
                  </button>
                  <button
                    className="mt-3 w-full rounded-xl bg-orange-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-orange-500"
                    onClick={onLogout}
                  >
                    Log out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <button
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                type="button"
                onClick={onLogin}
              >
                Log in
              </button>
              <button
                className="rounded-full bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-500"
                type="button"
                onClick={onRegister}
              >
                Sign up
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
