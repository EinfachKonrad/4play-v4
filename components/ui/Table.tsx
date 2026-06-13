import React, { useEffect, useState } from 'react'
import LoadingText from './LoadingText'

interface TableProps {
    columns: { 
        id: string,
        name: string,
        sortable?: boolean
        width?: string
     }[],
    data: any[]
    loading?: boolean
}

export default function Table({ columns, data, loading }: TableProps) {
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
    <>
    <div className="relative">
        <table className={`min-w-full divide-y divide-gray-200`}>
        <thead className="select-none">
            <tr>
                {columns.map((column) => (
                    <th key={column.id} onClick={column.sortable ? () => {handleSort(column.id)} : undefined} className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.sortable ? 'cursor-pointer hover:text-gray-700' : ''}`} style={{ width: column.width }}>
                        {column.name}
                    </th>
                ))}
            </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
                {(loading ? Array.from({ length: 12}) : tableData).map((row, index) => (
                    <tr key={index}>
                        {columns.map((column) => (
                            <td key={column.id} className="px-6 py-4 whitespace-nowrap">
                                {loading ? <div className="h-6.5"><LoadingText /></div> : row[column.id]}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
        <div className={`absolute bottom-0 left-0 w-full h-full bg-linear-to-b from-transparent to-(--background) ${loading ? '' : 'hidden'}`}>
        </div>
    </div>
    </>
  )
}