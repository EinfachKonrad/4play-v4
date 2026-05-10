import React from 'react'

interface InputProps {
    className?: string
    value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    placeholder?: string
    type?: string
    id?: string
    required?: boolean
    maxLength?: number
}

export default function Input({ value, onChange, placeholder, type = 'text', id, className, required = false, maxLength }: InputProps) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      id={id}
      className={`border-b w-full m-2 ${className}`}
      required={required}
      maxLength={maxLength}
    />
  )
}
