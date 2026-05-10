import React from 'react'
import Button from './Button'

interface MessageBoxProps {
    title: string
    description?: string
    icon?: React.ComponentType<any>
    options?: Array<{
        label: string
        type?: 'primary' | 'danger' | 'disabled'
        onClick: () => void
    }>
}

export default function MessageBox({ title, description, icon: Icon, options }: MessageBoxProps) {
  return (
    <div className='z-10 w-screen h-screen fixed top-0 left-0 flex items-center justify-center bg-black/60'>
        <div className='flex flex-col items-center gap-4 p-6 border border-gray-700 bg-gray-950 rounded-md'>
            {Icon && <Icon className='w-12 h-12 text-gray-500' />}
            <h2 className='text-lg font-semibold'>{title}</h2>
            {description && <p className='text-sm text-gray-200 text-center' dangerouslySetInnerHTML={{ __html: description }} />}
            {options && (
                <div className='flex gap-2 mt-4'>
                    {options.map((option, index) => (
                        <Button
                            key={index}
                            onClick={option.onClick}
                            className={`${option.type === 'disabled' ? 'bg-gray-500 text-gray-300 cursor-not-allowed' : option.type === 'danger' ? 'border-red-600 hover:bg-red-600 text-white' : ''}`}
                            disabled={option.type === 'disabled'}
                        >
                            {option.label}
                        </Button>
                    ))}
                </div>
            )}
        </div>
    </div>
  )
}
