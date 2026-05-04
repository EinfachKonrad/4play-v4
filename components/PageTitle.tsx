import type { LucideIcon } from 'lucide-react'
import React from 'react'

interface PageTitleProps {
  title: string;
  icon: LucideIcon
}

export default function PageTitle({ title, icon: Icon }: PageTitleProps) {
  return (
    <div className="text-2xl font-bold mb-4 flex items-center">
      <Icon className="h-6 w-6 mr-2" />
      {title}
    </div>
  )
}
