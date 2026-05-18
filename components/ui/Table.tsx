import React from 'react'

interface TableProps {
    columns: { id: string, name: string, onClick?: () => void }[],
    data: any[]
}

export default function Table({ columns, data }: TableProps) {
  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="">
        <tr>
            {columns.map((column) => (
                <th key={column.id} onClick={column.onClick} className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.onClick ? 'cursor-pointer hover:text-gray-700' : ''}`}>
                    {column.name}
                </th>
            ))}
        </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
            {data.map((row, index) => (
                <tr key={index}>
                    {columns.map((column) => (
                        <td key={column.id} className="px-6 py-4 whitespace-nowrap">
                            {row[column.id]}
                        </td>
                    ))}
                </tr>
            ))}
        </tbody>
    </table>
  )
}
