export default function AuthPage({
  mode,
  authForm,
  message,
  onChange,
  onSubmit,
  onSwitchMode,
  onBack,
}) {
  const isRegister = mode === "register";

  return (
    <main className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 space-y-2">
          <h2 className="text-2xl font-semibold text-slate-900">
            {isRegister ? "Create your account" : "Welcome back"}
          </h2>
          <p className="text-sm text-slate-500">
            {isRegister
              ? "Join the community to start posting and commenting."
              : "Log in to keep the conversation going."}
          </p>
        </div>
        <form className="space-y-4" onSubmit={onSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={authForm.username}
            onChange={(event) => onChange({ ...authForm, username: event.target.value })}
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            required
          />
          {isRegister ? (
            <input
              type="email"
              placeholder="Email"
              value={authForm.email}
              onChange={(event) => onChange({ ...authForm, email: event.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              required
            />
          ) : null}
          <input
            type="password"
            placeholder="Password"
            value={authForm.password}
            onChange={(event) => onChange({ ...authForm, password: event.target.value })}
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            required
          />
          <button
            className="w-full rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
            type="submit"
          >
            {isRegister ? "Create account" : "Login"}
          </button>
          {message ? <span className="text-sm text-rose-500">{message}</span> : null}
        </form>
        <div className="mt-6 space-y-3 text-sm text-slate-500">
          {isRegister ? (
            <p>
              Already have an account?{" "}
              <button
                type="button"
                className="font-semibold text-indigo-600 hover:text-indigo-500"
                onClick={() => onSwitchMode("login")}
              >
                Log in
              </button>
            </p>
          ) : (
            <p>
              New here?{" "}
              <button
                type="button"
                className="font-semibold text-indigo-600 hover:text-indigo-500"
                onClick={() => onSwitchMode("register")}
              >
                Sign up
              </button>
            </p>
          )}
          <button
            type="button"
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
            onClick={onBack}
          >
            Back to feed
          </button>
        </div>
      </div>
    </main>
  );
}
