import React, { useEffect, useState } from 'react'

interface TableProps {
    columns: { 
        id: string,
        name: string,
        sortable?: boolean
     }[],
    data: any[]
}

export default function Table({ columns, data }: TableProps) {
    const [tableData, setTableData] = useState<any[]>(data)

    useEffect(() => {
        setTableData(data)
    }, [data])

    function handleSort(columnId: string) {
        const column = columns.find(col => col.id === columnId)
        if (!column || !column.sortable) return

        const sortedData = [...tableData].sort((a, b) => {
            if (a[columnId] < b[columnId]) return -1
            if (a[columnId] > b[columnId]) return 1
            return 0
        })

        setTableData(sortedData)
    }

  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="">
        <tr>
            {columns.map((column) => (
                <th key={column.id} onClick={column.sortable ? () => {handleSort(column.id)} : undefined} className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.sortable ? 'cursor-pointer hover:text-gray-700' : ''}`}>
                    {column.name}
                </th>
            ))}
        </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
            {tableData.map((row, index) => (
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