import React, { useState } from 'react'

interface ContentTabsProps {
    tabs: Array<{
        id: string
        label: string
        content: React.ReactNode
    }>
}

export default function ContentTabs(props: ContentTabsProps) {
    const [selectedTabId, setSelectedTabId] = useState(props.tabs[0]?.id ?? '')
    const activeTabId = props.tabs.some((tab) => tab.id === selectedTabId)
        ? selectedTabId
        : props.tabs[0]?.id ?? ''

  return (
    <>
        <div className="mb-4 border-b border-default">
             <ul className="flex flex-wrap -mb-px text-sm font-medium text-center" role="tablist">
                {props.tabs.map((tab) => (
                    <li className="me-2" role="presentation" key={tab.id}>
                        <button
                                className={`inline-block rounded-t-base border-b-2 p-4 ${activeTabId === tab.id ? 'border-brand text-fg-brand' : 'cursor-pointer border-transparent text-body hover:border-brand hover:text-fg-brand'}`}
                                id={`${tab.id}-tab`}
                                type="button"
                                role="tab"
                                aria-controls={`panel-${tab.id}`}
                                aria-selected={activeTabId === tab.id}
                                tabIndex={activeTabId === tab.id ? 0 : -1}
                                onClick={() => setSelectedTabId(tab.id)}
                        >
                            {tab.label}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
        <div>
            {props.tabs.map((tab) => (
                activeTabId === tab.id ? (
                        <div className="rounded-base bg-neutral-secondary-soft p-4" id={`panel-${tab.id}`} role="tabpanel" aria-labelledby={`${tab.id}-tab`} key={tab.id}>
                                {tab.content}
                        </div>
                ) : null
            ))}
        </div>
    </>
  )
}
