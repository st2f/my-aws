export function LoadingState({ label = 'Loading' }: { label?: string }) {
  return <p className="text-sm text-zinc-600">{label}</p>;
}

export function EmptyState({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-6">
      <h2 className="text-sm font-semibold text-zinc-950">{title}</h2>
      {detail ? <p className="mt-2 text-sm leading-6 text-zinc-600">{detail}</p> : null}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <p className="text-sm font-medium text-red-800">{message}</p>
    </div>
  );
}
