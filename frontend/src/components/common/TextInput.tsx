import type { InputHTMLAttributes } from 'react'

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function TextInput({ label, id, className = '', ...props }: TextInputProps) {
  return (
    <div className="flex w-full items-center gap-3">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-ink whitespace-nowrap">
          {label}
        </label>
      )}

      <input
        id={id}
        className={`w-full rounded-lg border border-gray-green bg-white px-3 py-2 text-sm text-ink outline-none focus:border-rail-green ${className}`}
        {...props}
      />
    </div>
  )
}