import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CopyButton } from './CopyButton'

interface ContentCardProps {
  title: string
  children: React.ReactNode
  copyText?: string
  className?: string
  icon?: React.ReactNode
}

export function ContentCard({ title, children, copyText, className, icon }: ContentCardProps) {
  return (
    <Card className={`border border-gray-100 shadow-sm hover:shadow-md transition-shadow ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
          {copyText && <CopyButton text={copyText} />}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
