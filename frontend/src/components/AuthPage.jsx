const copy = {
  login: {
    title: "Welcome back",
    description: "Log in to join the conversation.",
    submitLabel: "Log in",
    footer: "Don't have an account?",
    toggle: "Sign up",
  },
  register: {
    title: "Create your account",
    description: "Join the community in a few clicks.",
    submitLabel: "Sign up",
    footer: "Already have an account?",
    toggle: "Log in",
  },
};

export default function AuthPage({
  mode,
  authForm,
  message,
  onChange,
  onSubmit,
  onSwitchMode,
  onBack,
}) {
  const config = copy[mode];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 lg:flex-row">
      <section className="flex-1 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-semibold text-orange-600 hover:text-orange-500"
        >
          ← Back to home
        </button>
        <h2 className="mt-4 text-2xl font-semibold text-slate-900">{config.title}</h2>
        <p className="mt-2 text-sm text-slate-500">{config.description}</p>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={authForm.username}
            onChange={(event) => onChange({ ...authForm, username: event.target.value })}
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
            required
          />
          {mode === "register" ? (
            <input
              type="email"
              placeholder="Email address"
              value={authForm.email}
              onChange={(event) => onChange({ ...authForm, email: event.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
              required
            />
          ) : null}
          <input
            type="password"
            placeholder="Password"
            value={authForm.password}
            onChange={(event) => onChange({ ...authForm, password: event.target.value })}
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
            required
          />
          <button
            className="w-full rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-500"
            type="submit"
          >
            {config.submitLabel}
          </button>
          {message ? <div className="text-sm text-rose-500">{message}</div> : null}
        </form>
        <p className="mt-6 text-sm text-slate-500">
          {config.footer}{" "}
          <button
            type="button"
            className="font-semibold text-orange-600 hover:text-orange-500"
            onClick={() => onSwitchMode(mode === "login" ? "register" : "login")}
          >
            {config.toggle}
          </button>
        </p>
      </section>
      <section className="flex-1 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h3 className="text-xl font-semibold text-slate-900">What you can do</h3>
        <ul className="mt-4 space-y-3 text-sm text-slate-600">
          <li>• Join your favorite big data communities.</li>
          <li>• Post updates, links, and data-driven questions.</li>
          <li>• Share feedback with threaded comments.</li>
        </ul>
      </section>
    </div>
  );
}
