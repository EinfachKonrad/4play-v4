import React from 'react'

interface InputProps {
    className?: string
    value?: string
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
    placeholder?: string
    type?: string
    id?: string
    required?: boolean
    maxLength?: number
    defaultValue?: string
    checked?: boolean
}

export default function Input({ value, onChange, onKeyDown, placeholder, type = 'text', id, className, required = false, maxLength, defaultValue, checked }: InputProps) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      id={id}
      className={`border-b w-full m-2 ${type === 'checkbox' ? 'cursor-pointer' : ''} ${className}`}
      required={required}
      maxLength={maxLength}
      defaultValue={defaultValue}
      checked={checked}
    />
  )
}
