import { useEffect, useState } from 'react';
import { graphqlRequest } from '../graphql/client';
import { ErrorState, LoadingState } from '../components/shared-states';
import { maskAwsAccountIds } from '../privacy/account-id-mask';

type AccountInfo = {
  accountId: string;
  alias: string | null;
  region: string;
};

type AccountInfoData = {
  accountInfo: AccountInfo;
};

type AccountState =
  | { status: 'loading' }
  | { status: 'connected'; account: AccountInfo }
  | { status: 'error'; message: string };

const accountInfoQuery = `{
  accountInfo {
    accountId
    alias
    region
  }
}`;

export function HomeRoute() {
  const [accountState, setAccountState] = useState<AccountState>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();

    async function loadAccount() {
      try {
        const data = await graphqlRequest<AccountInfoData>(accountInfoQuery, undefined, {
          signal: controller.signal,
        });
        setAccountState({ status: 'connected', account: data.accountInfo });
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        setAccountState({
          status: 'error',
          message: error instanceof Error ? error.message : 'Unable to confirm AWS access.',
        });
      }
    }

    void loadAccount();

    return () => controller.abort();
  }, []);

  return (
    <section className="grid gap-5">
      <div>
        <p className="text-sm font-medium text-zinc-500">Local AWS dashboard</p>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-950">my-aws</h1>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-zinc-500">AWS access</p>
            <h2 className="mt-1 text-lg font-semibold">{accountTitle(accountState)}</h2>
          </div>
          <StatusIndicator status={accountState.status} />
        </div>

        <AccountDetails state={accountState} />
      </div>
    </section>
  );
}

function AccountDetails({ state }: { state: AccountState }) {
  if (state.status === 'loading') {
    return (
      <div className="mt-4">
        <LoadingState label="Checking local credentials" />
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="mt-4">
        <ErrorState message={state.message} />
      </div>
    );
  }

  return (
    <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-3">
      <div>
        <dt className="font-medium text-zinc-500">Account</dt>
        <dd className="mt-1 font-mono text-zinc-950">{maskAwsAccountIds(state.account.accountId)}</dd>
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
    return state.account.alias ?? maskAwsAccountIds(state.account.accountId);
  }

  if (state.status === 'error') {
    return 'Not authorized';
  }

  return 'Checking';
}
