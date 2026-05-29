import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react'

const config: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  pending: {
    label: 'Pending',
    icon: <Clock className="h-3 w-3" />,
    className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  },
  processing: {
    label: 'Processing',
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
    className: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  done: {
    label: 'Done',
    icon: <CheckCircle2 className="h-3 w-3" />,
    className: 'bg-green-100 text-green-700 border-green-200',
  },
  error: {
    label: 'Error',
    icon: <XCircle className="h-3 w-3" />,
    className: 'bg-red-100 text-red-700 border-red-200',
  },
}

export function StatusBadge({ status }: { status: string }) {
  const c = config[status] ?? config['pending']
  return (
    <Badge variant="outline" className={`gap-1 ${c.className}`}>
      {c.icon}
      {c.label}
    </Badge>
  )
}
