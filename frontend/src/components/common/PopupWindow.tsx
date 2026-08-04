import type { ReactNode } from 'react'
import { IoMdClose } from "react-icons/io";

export function PopupWindow({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div
      className="fixed inset-0 bg-ink/70 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-green rounded-2xl border border-gray-green shadow-lg w-full max-w-sm max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-paper-raised">
          <p className="text-sm font-medium text-ink">{title}</p>
          <IoMdClose
            onClick={onClose}
            aria-label="Close"
            size={20}
          ></IoMdClose>
          
          
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}