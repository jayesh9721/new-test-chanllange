export function GeneratingState({ message = 'AI is generating your content…' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-20">
      <div className="relative">
        <div className="h-12 w-12 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin" />
        <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-transparent border-b-pink-400 animate-spin animation-delay-150" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
      </div>
      <div className="text-center">
        <p className="font-semibold text-gray-800">{message}</p>
        <p className="text-sm text-gray-500 mt-1">This may take a few seconds</p>
      </div>
    </div>
  )
}
