import type { ReactNode } from 'react';
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import { HomeRoute } from './routes/home';
import { BucketRoute, BucketsRoute, S3ObjectRoute } from './routes/placeholders';
import { TaggedResourcesRoute } from './routes/tagged-resources';
import { TagsRoute } from './routes/tags';

export function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

export function AppShell() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-zinc-200 bg-white px-4 py-5 lg:block">
        <div className="px-2">
          <p className="text-sm font-semibold text-zinc-950">my-aws</p>
          <p className="mt-1 text-xs text-zinc-500">Local AWS dashboard</p>
        </div>

        <nav aria-label="Main" className="mt-8 grid gap-1">
          <NavigationLink to="/">Account</NavigationLink>
          <NavigationLink to="/tags">My tags</NavigationLink>
          <NavigationLink to="/s3">My buckets</NavigationLink>
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="border-b border-zinc-200 bg-white px-4 py-3 lg:hidden">
          <p className="text-sm font-semibold">my-aws</p>
          <nav aria-label="Main" className="mt-3 flex gap-2">
            <NavigationLink to="/">Account</NavigationLink>
            <NavigationLink to="/tags">My tags</NavigationLink>
            <NavigationLink to="/s3">My buckets</NavigationLink>
          </nav>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<HomeRoute />} />
            <Route path="/tags" element={<TagsRoute />} />
            <Route path="/tags/:key/:value" element={<TaggedResourcesRoute />} />
            <Route path="/s3" element={<BucketsRoute />} />
            <Route path="/s3/:bucket" element={<BucketRoute />} />
            <Route path="/s3/:bucket/*" element={<S3ObjectRoute />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function NavigationLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <NavLink
      className={({ isActive }) =>
        [
          'rounded-md px-3 py-2 text-sm font-medium',
          isActive ? 'bg-zinc-900 text-white' : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950',
        ].join(' ')
      }
      to={to}
    >
      {children}
    </NavLink>
  );
}
