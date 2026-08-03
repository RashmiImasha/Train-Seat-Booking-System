import { Link } from 'react-router-dom'

interface SectionHeaderProps {
  title?: string
  description: string
  backTo?: string
  backLabel?: string
}

export function SectionHeader({
  title,
  description,
  backTo,
  backLabel = 'Back',
}: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-2 py-7 px-5 bg-linear-to-r from-paper-raised to-gray-green rounded-t-lg border-b-4 border-[#D7E5D2]">

      {backTo && (
        <Link
          to={backTo}
          className="text-sm text-rail font-medium hover:text-rail/20"
        >
          ← {backLabel}
        </Link>
      )}

      <div>
        <h1 className="text-2xl text-ink mb-1">{title}</h1>
        <p className="text-sm text-ink/70">{description}</p>
      </div>
    </div>
  )
}