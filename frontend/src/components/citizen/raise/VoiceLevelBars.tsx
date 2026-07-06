type VoiceLevelBarsProps = {
  levels: number[]
  active?: boolean
}

export function VoiceLevelBars({ levels, active = true }: VoiceLevelBarsProps) {
  return (
    <div
      aria-hidden="true"
      className="flex h-16 items-end justify-center gap-1 px-2"
    >
      {levels.map((level, index) => {
        const height = 12 + level * 52
        return (
          <span
            className={`w-1.5 rounded-full transition-[height] duration-75 ${
              active
                ? 'bg-gradient-to-t from-teal-600 to-emerald-400'
                : 'bg-slate-200'
            }`}
            key={index}
            style={{ height: `${height}px` }}
          />
        )
      })}
    </div>
  )
}
