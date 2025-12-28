export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} Apalov &amp; Sheroz. Built for the r/bigdata-demo
        community.
      </div>
    </footer>
  );
}
