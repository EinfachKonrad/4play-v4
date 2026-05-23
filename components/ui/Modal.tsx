import React, { Children } from 'react'
import Button from './Button'
import { ChevronLeft, X } from 'lucide-react';

interface ModalProps {
    title: string
    icon: React.ComponentType<any>
    onClose: () => void;
    onBack?: () => void;
    children: React.ReactNode
}

export default function Modal({ title, icon: Icon, onClose, onBack, children }: ModalProps) {
  return (
    <div className='z-10 w-screen h-screen fixed top-0 left-0 flex items-center justify-center bg-black/60'>
        <div className='overflow-scroll flex flex-col gap-4 p-6 border max-h-[80vh] max-w-[60vw] border-neutral-700 bg-neutral-950 rounded-md h-full w-full'>
          <div className='flex justify-between items-center'>
            <div className='flex'>
              {onBack && <div onClick={onBack} className='cursor-pointer my-auto mr-2'><ChevronLeft /></div>}
              {Icon && <Icon className='w-5 h-5 my-auto' />}
              <h2 className='text-lg font-semibold ml-2'>{title}</h2>
            </div>
            <button onClick={onClose}>
              <X className='cursor-pointer m-auto text-gray-500 hover:text-white transition-color duration-200 h-5 w-5' />
            </button>
          </div>
          {children}
        </div>
    </div>
  )
}
