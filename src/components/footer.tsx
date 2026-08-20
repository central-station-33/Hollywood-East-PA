import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <span>&copy; {new Date().getFullYear()} Hollywood East PA</span>
        <div className="flex gap-4">
          <Link href="/terms" className="hover:text-slate-700">
            Terms of Service
          </Link>
          <Link href="/privacy" className="hover:text-slate-700">
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}
