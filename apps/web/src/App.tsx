import { useEffect, useState } from 'react';

type AccountInfo = {
  accountId: string;
  alias: string | null;
  region: string;
};

type AccountState =
  | { status: 'loading' }
  | { status: 'connected'; account: AccountInfo }
  | { status: 'error'; message: string };

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export function App() {
  const [accountState, setAccountState] = useState<AccountState>({ status: 'loading' });

  async function loadAccount(signal?: AbortSignal) {
    setAccountState({ status: 'loading' });

    try {
      const response = await fetch(
        `${apiUrl}/account`,
        signal
          ? {
              signal,
            }
          : undefined,
      );
      const body = (await response.json()) as unknown;

      if (!response.ok) {
        setAccountState({ status: 'error', message: readErrorMessage(body) });
        return;
      }

      setAccountState({ status: 'connected', account: body as AccountInfo });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }

      setAccountState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Unable to reach the API.',
      });
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    void loadAccount(controller.signal);

    return () => controller.abort();
  }, []);

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-8 text-zinc-950">
      <div className="mx-auto grid max-w-5xl gap-8">
        <header>
          <p className="text-sm font-medium text-zinc-500">Local AWS dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold">my-aws</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-600">
            Local-first AWS learning dashboard for discovering tagged resources and browsing S3
            object previews.
          </p>
        </header>

        <section className="max-w-xl rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-zinc-500">AWS access</p>
              <h2 className="mt-1 text-lg font-semibold">{accountTitle(accountState)}</h2>
            </div>
            <StatusIndicator status={accountState.status} />
          </div>

          <AccountDetails state={accountState} />

          {accountState.status === 'error' ? (
            <button
              className="mt-5 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700"
              type="button"
              onClick={() => void loadAccount()}
            >
              Retry
            </button>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function AccountDetails({ state }: { state: AccountState }) {
  if (state.status === 'loading') {
    return <p className="mt-4 text-sm text-zinc-600">Checking local credentials...</p>;
  }

  if (state.status === 'error') {
    return <p className="mt-4 text-sm leading-6 text-red-700">{state.message}</p>;
  }

  return (
    <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-3">
      <div>
        <dt className="font-medium text-zinc-500">Account</dt>
        <dd className="mt-1 font-mono text-zinc-950">{state.account.accountId}</dd>
      </div>
      <div>
        <dt className="font-medium text-zinc-500">Alias</dt>
        <dd className="mt-1 text-zinc-950">{state.account.alias ?? 'None'}</dd>
      </div>
      <div>
        <dt className="font-medium text-zinc-500">Region</dt>
        <dd className="mt-1 font-mono text-zinc-950">{state.account.region}</dd>
      </div>
    </dl>
  );
}

function StatusIndicator({ status }: { status: AccountState['status'] }) {
  const styles = {
    loading: 'border-amber-200 bg-amber-50 text-amber-700',
    connected: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    error: 'border-red-200 bg-red-50 text-red-700',
  };

  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}

function accountTitle(state: AccountState) {
  if (state.status === 'connected') {
    return state.account.alias ?? state.account.accountId;
  }

  if (state.status === 'error') {
    return 'Not authorized';
  }

  return 'Checking';
}

function readErrorMessage(body: unknown) {
  if (typeof body === 'object' && body !== null && 'message' in body) {
    const message = (body as { message: unknown }).message;

    if (typeof message === 'string') {
      return message;
    }
  }

  return 'Unable to confirm AWS access.';
}
