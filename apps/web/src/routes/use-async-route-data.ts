import type { DependencyList } from 'react';
import { useEffect, useState } from 'react';

type AsyncState<TData> =
  | { status: 'loading' }
  | { status: 'loaded'; data: TData }
  | { status: 'error'; message: string };

export function useAsyncRouteData<TData>(
  load: (signal: AbortSignal) => Promise<TData>,
  deps: DependencyList = [],
): AsyncState<TData> {
  const [state, setState] = useState<AsyncState<TData>>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();

    async function run() {
      setState({ status: 'loading' });

      try {
        const data = await load(controller.signal);
        setState({ status: 'loaded', data });
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        setState({
          status: 'error',
          message: error instanceof Error ? error.message : 'Request failed.',
        });
      }
    }

    void run();

    return () => controller.abort();
  }, deps);

  return state;
}
