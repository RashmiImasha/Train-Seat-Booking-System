import type { ReactNode } from 'react'

export function PopupWindow({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div
      className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-paper-raised rounded-2xl border border-gray-green shadow-lg w-full max-w-sm max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-green">
          <p className="text-sm font-medium text-ink">{title}</p>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-ink/50 hover:text-ink text-xl leading-none px-1"
          >
            ×
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}