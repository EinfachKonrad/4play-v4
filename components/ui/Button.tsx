import React from 'react'

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

export default function Button({ children, onClick, className, type = 'button', disabled = false }: ButtonProps) {
  return (
    <button
      type={type}
      className={`text-sm rounded-md border border-gray-800 p-1 cursor-pointer transition-all duration-200 hover:bg-gray-700 ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}
