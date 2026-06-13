import { ChevronDown } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'

interface DropdownProps {
    options: Array<{
        label: string
        value: string
    }>
    className?: string
    onSelect?: (value: string) => void
    onChange?: (value: string) => void
    searchable?: boolean
    value?: string
    onInputChange?: (value: string) => void
    allowCustom?: boolean
    placeholder?: string
}

export default function Dropdown({ options, onSelect, onChange, className, searchable = false, value, onInputChange, allowCustom = false, placeholder }: DropdownProps ) {
    const [open, setOpen] = useState(false)
    const [inputValue, setInputValue] = useState(value ?? '')
    const rootRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        function onDocumentClick(e: MouseEvent) {
            if (!rootRef.current) return
            if (e.target instanceof Node && !rootRef.current.contains(e.target)) {
                setOpen(false)
            }
        }

        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') setOpen(false)
        }

        document.addEventListener('click', onDocumentClick)
        document.addEventListener('keydown', onKey)
        return () => {
            document.removeEventListener('click', onDocumentClick)
            document.removeEventListener('keydown', onKey)
        }
    }, [])

    useEffect(() => {
        if (typeof value === 'string') {
            const selectedOption = options.find(o => o.value === value)
            setInputValue(selectedOption?.label ?? value)
        }
    }, [value, options])

    const filtered = searchable && inputValue ? options.filter(o => o.label.toLowerCase().includes(inputValue.toLowerCase())) : options

    function handleSelect(optValue: string, optLabel?: string) {
        const selectHandler = typeof onSelect === 'function' ? onSelect : (typeof onChange === 'function' ? onChange : undefined)
        if (selectHandler) {
            selectHandler(optValue)
        }
        setInputValue(optLabel ?? optValue)
        if (onInputChange) onInputChange(optLabel ?? optValue)
        setOpen(false)
    }

    function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter') {
            e.preventDefault()
            if (filtered.length > 0) {
                handleSelect(filtered[0].value, filtered[0].label)
            } else if (allowCustom) {
                handleSelect(inputValue)
            }
        }
    }

    return (
        <div ref={rootRef} className="relative w-full">
            {searchable ? (
                <div className={`inline-flex items-center justify-between w-full border-b m-2 ${className}`}>
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => {
                            setInputValue(e.target.value)
                            if (onInputChange) onInputChange(e.target.value)
                            setOpen(true)
                        }}
                        onKeyDown={handleKey}
                        placeholder={placeholder}
                        className="bg-transparent w-full"
                    />
                    <button type="button" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen(o => !o)}>
                        <ChevronDown className='h-4 w-4' />
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    aria-expanded={open}
                    aria-haspopup="menu"
                    onClick={() => setOpen(o => !o)}
                    className={`cursor-pointer inline-flex items-center justify-between w-full border-b m-2 ${className}`}
                >
                    {options.find(o => o.value === value)?.label ?? <span className="text-neutral-500">{placeholder}</span>}
                    <ChevronDown className='h-4 w-4' />
                </button>
            )}

            <div
                role="menu"
                aria-labelledby="dropdownButton"
                className={`z-10 ${open ? '' : 'hidden'} rounded ml-2 bg-neutral-900 border border-neutral-700 rounded-base shadow-lg w-full absolute mt-2`}
            >
                <ul className="p-2 text-sm text-body font-medium">
                    {filtered.map(option => (
                        <li key={option.value}>
                            <button
                                type="button"
                                onClick={() => handleSelect(option.value, option.label)}
                                className="cursor-pointer block py-2 px-4 rounded transition-all duration-50 hover:bg-neutral-800 w-full text-left"
                            >
                                {option.label}
                            </button>
                        </li>
                    ))}
                    {allowCustom && inputValue && !options.find(o => o.label.toLowerCase() === inputValue.toLowerCase()) && (
                        <li>
                            <button
                                type="button"
                                onClick={() => handleSelect(inputValue)}
                                className="cursor-pointer block py-2 px-4 rounded transition-all duration-50 hover:bg-neutral-800 w-full text-left"
                            >
                                {`„${inputValue}“`}
                            </button>
                        </li>
                    )}
                </ul>
            </div>
        </div>
    )
}
