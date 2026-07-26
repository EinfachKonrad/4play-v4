import React, { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Folder, FolderPlus } from 'lucide-react'
import Input from './Input'
import Button from './Button'

type PathPickerProps = {
  value: string
  onChange: (path: string) => void
}

type FolderNode = {
  name: string
  fullPath: string
  children: Record<string, FolderNode>
}

function normalizePath(path: string): string {
  const normalized = path.replace(/\\/g, '/').replace(/\/+/g, '/').trim()
  if (!normalized || normalized === '/') {
    return ''
  }
  return normalized.replace(/^\/+/, '').replace(/\/+$/, '')
}

function buildTree(paths: string[]): FolderNode {
  const root: FolderNode = {
    name: 'Root',
    fullPath: '',
    children: {},
  }

  paths.forEach((rawPath) => {
    const path = normalizePath(rawPath)
    if (!path) {
      return
    }

    const segments = path.split('/').filter(Boolean)
    let current = root
    let currentPath = ''

    segments.forEach((segment) => {
      currentPath = currentPath ? `${currentPath}/${segment}` : segment
      if (!current.children[segment]) {
        current.children[segment] = {
          name: segment,
          fullPath: currentPath,
          children: {},
        }
      }
      current = current.children[segment]
    })
  })

  return root
}

function collectPathsFromPayload(payload: unknown): string[] {
  if (!Array.isArray(payload)) {
    return []
  }

  return payload
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return ''
      }

      const candidate = (entry as { path?: unknown }).path
      return typeof candidate === 'string' ? candidate : ''
    })
    .filter(Boolean)
}

function FolderTreeNode({
  node,
  depth,
  expanded,
  selectedPath,
  onToggle,
  onSelect,
  createParentPath,
  newFolderName,
  onNewFolderNameChange,
  onRequestCreate,
  onCancelCreate,
  onConfirmCreate,
}: {
  node: FolderNode
  depth: number
  expanded: Set<string>
  selectedPath: string
  onToggle: (path: string) => void
  onSelect: (path: string) => void
  createParentPath: string | null
  newFolderName: string
  onNewFolderNameChange: (value: string) => void
  onRequestCreate: (parentPath: string) => void
  onCancelCreate: () => void
  onConfirmCreate: () => void
}) {
  const sortedChildren = Object.values(node.children).sort((a, b) => a.name.localeCompare(b.name))
  const hasChildren = sortedChildren.length > 0
  const isExpanded = expanded.has(node.fullPath)
  const isSelected = selectedPath === node.fullPath

  return (
    <div className='flex flex-col gap-1'>
      <div className='flex items-center gap-1 group'>
        {hasChildren ? (
          <button
            type='button'
            className='cursor-pointer rounded hover:bg-neutral-800 p-0.5'
            onClick={() => onToggle(node.fullPath)}
            aria-label='Ordner auf- oder zuklappen'
          >
            <ChevronRight className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          </button>
        ) : (
          <span className='w-4' />
        )}

        <button
          type='button'
          className={`cursor-pointer inline-flex items-center gap-2 rounded px-1 py-0.5 text-left ${isSelected ? 'bg-neutral-800 text-white' : 'text-gray-300 hover:bg-neutral-800'}`}
          onClick={() => onSelect(node.fullPath)}
          style={{ marginLeft: depth > 0 ? 0 : 0 }}
        >
          <Folder className='h-4 w-4' />
          <span className='text-sm'>{node.name}</span>
        </button>

        <button
          type='button'
          className='opacity-0 group-hover:opacity-100 transition-all duration-100 cursor-pointer rounded hover:bg-neutral-800 p-0.5 ml-1 text-gray-300'
          onClick={() => onRequestCreate(node.fullPath)}
          aria-label='Unterordner erstellen'
          title='Unterordner erstellen'
        >
          <FolderPlus className='h-3.5 w-3.5' />
        </button>
      </div>

      {createParentPath === node.fullPath && (
        <div className='ml-5 flex items-center gap-2'>
          <Input
            value={newFolderName}
            onChange={(e) => onNewFolderNameChange(e.target.value)}
            placeholder='Neuer Unterordnername'
          />
          <Button type='button' onClick={onConfirmCreate}>Erstellen</Button>
          <Button type='button' onClick={onCancelCreate}>Abbrechen</Button>
        </div>
      )}

      {hasChildren && isExpanded && (
        <div className='ml-4 border-l border-neutral-800 pl-2 flex flex-col gap-1'>
          {sortedChildren.map((child) => (
            <FolderTreeNode
              key={child.fullPath}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              selectedPath={selectedPath}
              onToggle={onToggle}
              onSelect={onSelect}
              createParentPath={createParentPath}
              newFolderName={newFolderName}
              onNewFolderNameChange={onNewFolderNameChange}
              onRequestCreate={onRequestCreate}
              onCancelCreate={onCancelCreate}
              onConfirmCreate={onConfirmCreate}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function PathPicker({ value, onChange }: PathPickerProps) {
  const [paths, setPaths] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [createParentPath, setCreateParentPath] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    let ignore = false

    async function fetchPaths() {
      setLoading(true)

      try {
        const [itemsRes, bundlesRes, rentalItemsRes] = await Promise.all([
          fetch('/api/equipment/items'),
          fetch('/api/equipment/bundles'),
          fetch('/api/equipment/rentalItems'),
        ])

        const payloads = await Promise.all([
          itemsRes.ok ? itemsRes.json() : Promise.resolve([]),
          bundlesRes.ok ? bundlesRes.json() : Promise.resolve([]),
          rentalItemsRes.ok ? rentalItemsRes.json() : Promise.resolve([]),
        ])

        const mergedPaths = payloads.flatMap((payload) => collectPathsFromPayload(payload))
        const unique = Array.from(new Set(mergedPaths.map((path) => normalizePath(path)).filter(Boolean))).sort((a, b) =>
          a.localeCompare(b),
        )

        if (!ignore) {
          setPaths(unique)
        }
      } catch (error) {
        console.error('Error fetching existing equipment paths:', error)
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    fetchPaths()

    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    const normalizedValue = normalizePath(value)
    if (!normalizedValue) {
      return
    }

    setPaths((current) => {
      if (current.includes(normalizedValue)) {
        return current
      }

      return [...current, normalizedValue].sort((a, b) => a.localeCompare(b))
    })
  }, [value])

  const tree = useMemo(() => buildTree(paths), [paths])

  function toggleExpand(path: string) {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }

  function handleSelect(path: string) {
    if (!path.trim()) {
      return
    }

    onChange(path)
    setIsOpen(false)

    const segments = path.split('/').filter(Boolean)
    let parent = ''

    setExpanded((current) => {
      const next = new Set(current)
      segments.forEach((segment) => {
        parent = parent ? `${parent}/${segment}` : segment
        next.add(parent)
      })
      return next
    })
  }

  function handleCreateFolder() {
    const folderName = normalizePath(newFolderName)
    if (!folderName || folderName.includes('/')) {
      alert('Bitte nur einen Ordnernamen ohne Slash eingeben.')
      return
    }

    const parent = normalizePath(createParentPath ?? '')
    const nextPath = parent ? `${parent}/${folderName}` : folderName

    setPaths((current) => {
      if (current.includes(nextPath)) {
        return current
      }
      return [...current, nextPath].sort((a, b) => a.localeCompare(b))
    })

    handleSelect(nextPath)
    setNewFolderName('')
    setCreateParentPath(null)
  }

  function handleRequestCreate(parentPath: string) {
    setCreateParentPath(parentPath)
    setNewFolderName('')

    if (!parentPath) {
      return
    }

    const segments = parentPath.split('/').filter(Boolean)
    let currentPath = ''

    setExpanded((current) => {
      const next = new Set(current)
      segments.forEach((segment) => {
        currentPath = currentPath ? `${currentPath}/${segment}` : segment
        next.add(currentPath)
      })
      return next
    })
  }

  function handleCancelCreate() {
    setCreateParentPath(null)
    setNewFolderName('')
  }

  const normalizedValue = normalizePath(value)

  return (
    <div className="relative w-full">
      <button
        type='button'
        className='cursor-pointer inline-flex items-center justify-between w-full border-b m-2'
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-controls='path-picker-panel'
      >
        <span className={`${normalizedValue ? '' : 'text-neutral-500'}`}>{normalizedValue || 'Pfad'}</span>
        <ChevronDown className={`h-4 w-4 text-neutral-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
      <div id='path-picker-panel' className={`z-10 ${isOpen ? '' : 'hidden'} rounded ml-2 bg-neutral-900 border border-neutral-700 rounded-base shadow-lg w-full absolute mt-2 max-h-56 overflow-y-auto`}>
        {createParentPath === '' && (
          <div className='mb-2 flex items-center gap-2'>
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder='Neuer Ordnername'
            />
            <Button type='button' onClick={handleCreateFolder}>Erstellen</Button>
            <Button type='button' onClick={handleCancelCreate}>Abbrechen</Button>
          </div>
        )}

        {loading ? (
          <div className='text-sm text-gray-400 p-1'>Lade vorhandene Pfade...</div>
        ) : Object.keys(tree.children).length === 0 ? (
          <div className='text-sm text-gray-400 p-1'>Noch keine vorhandenen Pfade gefunden.</div>
        ) : (
          <div className='flex flex-col gap-1'>
            {Object.values(tree.children)
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((node) => (
                <FolderTreeNode
                  key={node.fullPath}
                  node={node}
                  depth={0}
                  expanded={expanded}
                  selectedPath={normalizedValue}
                  onToggle={toggleExpand}
                  onSelect={handleSelect}
                  createParentPath={createParentPath}
                  newFolderName={newFolderName}
                  onNewFolderNameChange={setNewFolderName}
                  onRequestCreate={handleRequestCreate}
                  onCancelCreate={handleCancelCreate}
                  onConfirmCreate={handleCreateFolder}
                />
              ))}
          </div>
        )}

        <div className='mb-2 flex items-center gap-2'>
          <button
            type='button'
            className='cursor-pointer inline-flex items-center gap-2 rounded px-1 py-0.5 text-gray-300 hover:bg-neutral-800'
            onClick={() => handleRequestCreate('')}
            aria-label='Neuen Ordner erstellen'
            title='Neuen Ordner erstellen'
          >
            <FolderPlus className='h-3.5 w-3.5' />
            <span className='text-sm'>Neuen Ordner erstellen</span>
          </button>
        </div>
      </div>
      )}
    </div>
  )
}
