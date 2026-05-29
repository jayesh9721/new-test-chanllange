import { Sparkles } from 'lucide-react'

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
        <Sparkles className="h-7 w-7 text-purple-500" />
      </div>
      <p className="text-lg font-semibold text-gray-800">{title}</p>
      <p className="text-sm text-gray-500 max-w-xs">{description}</p>
    </div>
  )
}
