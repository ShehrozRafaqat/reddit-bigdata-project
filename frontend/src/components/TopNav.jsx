export default function TopNav({ loggedIn, username, onLogin, onRegister, onLogout, onHome }) {
  const userInitial = username ? username[0].toUpperCase() : "U";

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <button
          type="button"
          className="text-lg font-semibold text-indigo-600"
          onClick={onHome}
        >
          r/bigdata-demo
        </button>
        <div className="flex items-center gap-3">
          {loggedIn ? (
            <div className="relative flex items-center gap-3">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700"
                aria-label={`Profile for ${username || "user"}`}
              >
                {userInitial}
              </div>
              <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-600">
                {username}
              </div>
              <button
                className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                onClick={onLogout}
              >
                Log out
              </button>
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
                className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
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
