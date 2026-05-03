import useInstanceConfig from '@/hooks/useInstanceConfig'
import Link from 'next/link'
import React from 'react'

export default function Footer() {
    const instanceConfig = useInstanceConfig()
  return (
    <footer className="w-full border-t bg-white dark:bg-black py-4 text-center text-sm text-gray-500">
        <p className='text-gray-400 text-base'>{instanceConfig?.name}</p>
        <p>{new Date().getFullYear()}, <Link className='underline' target='_blank' href="https://einfachmedia.eu/projekte/4play">EinfachMedia</Link></p>
    </footer>
  )
}
