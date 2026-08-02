interface SeatProps {
  seatNumber: number
  available: boolean
  selected: boolean
  onClick: () => void
}

export function Seat({ seatNumber, available, selected, onClick }: SeatProps) {
  return (
    <button
      type="button"
      disabled={!available}
      onClick={onClick}
      aria-label={`Seat ${seatNumber}${available ? '' : ' (unavailable)'}`}
      className={[
        'relative h-11 w-11 rounded-lg border text-sm font-mono font-medium transition-all',
        selected
          ? 'bg-brass border-brass-dark text-white shadow-sm scale-105'
          : available
            ? 'bg-leaf-bg border-leaf/40 text-leaf hover:border-leaf hover:scale-105'
            : 'bg-clay-bg border-clay/20 text-clay/50 cursor-not-allowed',
      ].join(' ')}
    >
      {seatNumber}
    </button>
  )
}
