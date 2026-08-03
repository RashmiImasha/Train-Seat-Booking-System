import type { SelectHTMLAttributes, ReactNode } from 'react'

interface SelectInputProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  children: ReactNode
}

export function SelectInput({
  label,
  id,
  className = '',
  children,
  ...props
}: SelectInputProps) {
  return (
    <div className="flex w-full items-center gap-3">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-ink whitespace-nowrap">
          {label}
        </label>
      )}

      <select
        id={id}
        className={`w-full rounded-lg border border-gray-green bg-white px-3 py-2 text-sm text-ink outline-none focus:border-rail-green ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  )
}