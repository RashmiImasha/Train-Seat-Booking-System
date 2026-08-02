export function ErrorBanner({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-clay bg-clay-bg rounded-lg px-3 py-2">{children}</p>
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="text-center py-16 px-4">
      <p className="font-display text-lg text-ink mb-1">{title}</p>
      {hint && <p className="text-sm text-ink/50">{hint}</p>}
    </div>
  )
}
