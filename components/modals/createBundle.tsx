import React, { useState } from 'react'
import { Package } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Button from '../ui/Button'
import Dropdown from '../ui/Dropdown'
import Bundle from '@/types/equipment/bundle'

interface CreateBundleModalProps {
  onClose: () => void
}

type BundleContentDraft = {
  id: string
  quantity: number
  reservationType: 'always' | 'onBook'
  optional: boolean
  displayOnLabel: boolean
  displayOnAllDocuments: boolean
  extend: boolean
  extendOnLabel: boolean
  extendOnAllDocuments: boolean
  versionUuid: string
}

type BundleFormData = {
  name: string
  description: string
  path: string
  dayRate: number
  width: string
  height: string
  depth: string
  weight: string
  contents: BundleContentDraft[]
}

function parseOptionalNumber(value: string): number | undefined {
  if (!value.trim()) {
    return undefined
  }

  const parsed = Number(value)
  if (Number.isNaN(parsed)) {
    return undefined
  }

  return parsed
}

function createEmptyContent(): BundleContentDraft {
  return {
    id: '',
    quantity: 1,
    reservationType: 'onBook',
    optional: false,
    displayOnLabel: true,
    displayOnAllDocuments: true,
    extend: false,
    extendOnLabel: false,
    extendOnAllDocuments: false,
    versionUuid: '',
  }
}

export default function CreateBundleModal({ onClose }: CreateBundleModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [entryData, setEntryData] = useState<BundleFormData>({
    name: '',
    description: '',
    path: '',
    dayRate: 0,
    width: '',
    height: '',
    depth: '',
    weight: '',
    contents: [createEmptyContent()],
  })

  const displayPreviousButton = currentStep > 1

  function handleNextStep() {
    setCurrentStep((prev) => prev + 1)
  }

  function handlePreviousStep() {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  function addContent() {
    setEntryData((prev) => ({
      ...prev,
      contents: [...prev.contents, createEmptyContent()],
    }))
  }

  function removeContent(index: number) {
    setEntryData((prev) => ({
      ...prev,
      contents: prev.contents.length > 1 ? prev.contents.filter((_, i) => i !== index) : prev.contents,
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!entryData.name.trim() || !entryData.path.trim()) {
      alert('Bitte Name und Pfad ausfuellen.')
      return
    }

    const contents = entryData.contents.filter((content) => content.id.trim())
    if (contents.length === 0) {
      alert('Bitte mindestens einen Inhalt mit ID angeben.')
      return
    }

    setSaving(true)

    const dimensions = {
      width: parseOptionalNumber(entryData.width),
      height: parseOptionalNumber(entryData.height),
      depth: parseOptionalNumber(entryData.depth),
    }

    const hasAllDimensions =
      typeof dimensions.width === 'number' &&
      typeof dimensions.height === 'number' &&
      typeof dimensions.depth === 'number'

    const payload: Bundle = {
      id: uuidv4(),
      name: entryData.name.trim(),
      ...(entryData.description.trim() ? { description: entryData.description.trim() } : {}),
      path: entryData.path.trim(),
      ...(hasAllDimensions
        ? {
            dimensions: {
              width: dimensions.width,
              height: dimensions.height,
              depth: dimensions.depth,
            },
          }
        : {}),
      ...(typeof parseOptionalNumber(entryData.weight) === 'number'
        ? { weight: parseOptionalNumber(entryData.weight) }
        : {}),
      dayRate: entryData.dayRate,
      contents: contents.map((content) => ({
        id: content.id.trim(),
        quantity: Math.max(1, content.quantity),
        reservationType: content.reservationType,
        optional: content.optional,
        displayOnLabel: content.displayOnLabel,
        displayOnAllDocuments: content.displayOnAllDocuments,
        extend: content.extend,
        extendOnLabel: content.extendOnLabel,
        extendOnAllDocuments: content.extendOnAllDocuments,
        ...(content.versionUuid.trim() ? { versionUuid: content.versionUuid.trim() } : {}),
      })),
    }

    try {
      const response = await fetch('/api/equipment/bundles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('Fehler beim Erstellen des Bundles')
      }

      onClose()
    } catch (error) {
      console.error(error)
      alert('Fehler beim Erstellen des Bundles')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title='Neues Bundle erstellen'
      onClose={onClose}
      icon={Package}
      onBack={displayPreviousButton ? handlePreviousStep : undefined}
    >
      {currentStep === 1 && (
        <div className='flex flex-col gap-2 mt-4 h-full'>
          <h2 className='text-lg font-semibold'>Stammdaten</h2>
          <form className='flex flex-col gap-4'>
            <div>
              <label className='text-sm text-gray-400'>Name</label>
              <Input
                value={entryData.name}
                onChange={(e) => setEntryData({ ...entryData, name: e.target.value })}
                placeholder='Audio Bundle'
              />
            </div>

            <div>
              <label className='text-sm text-gray-400'>Pfad</label>
              <Input
                value={entryData.path}
                onChange={(e) => setEntryData({ ...entryData, path: e.target.value })}
                placeholder='Audio/Bundles'
              />
            </div>

            <div>
              <label className='text-sm text-gray-400'>Beschreibung</label>
              <textarea
                value={entryData.description}
                onChange={(e) => setEntryData({ ...entryData, description: e.target.value })}
                placeholder='Optionale Beschreibung'
                className='border-b w-full m-2 bg-transparent resize-y min-h-24'
              />
            </div>

            <div>
              <label className='text-sm text-gray-400'>Tagessatz</label>
              <Input
                type='number'
                value={String(entryData.dayRate)}
                onChange={(e) => setEntryData({ ...entryData, dayRate: Number(e.target.value) || 0 })}
                placeholder='0'
              />
            </div>

            <Button onClick={handleNextStep} className='self-end'>
              Weiter
            </Button>
          </form>
        </div>
      )}

      {currentStep === 2 && (
        <div className='flex flex-col gap-2 mt-4 h-full'>
          <h2 className='text-lg font-semibold'>Inhalte & Details</h2>
          <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-2'>
              <div>
                <label className='text-sm text-gray-400'>Breite (cm)</label>
                <Input value={entryData.width} onChange={(e) => setEntryData({ ...entryData, width: e.target.value })} />
              </div>
              <div>
                <label className='text-sm text-gray-400'>Hoehe (cm)</label>
                <Input value={entryData.height} onChange={(e) => setEntryData({ ...entryData, height: e.target.value })} />
              </div>
              <div>
                <label className='text-sm text-gray-400'>Tiefe (cm)</label>
                <Input value={entryData.depth} onChange={(e) => setEntryData({ ...entryData, depth: e.target.value })} />
              </div>
            </div>

            <div>
              <label className='text-sm text-gray-400'>Gewicht (kg)</label>
              <Input value={entryData.weight} onChange={(e) => setEntryData({ ...entryData, weight: e.target.value })} />
            </div>

            <div className='flex items-center justify-between gap-2'>
              <h3 className='text-md font-semibold'>Inhalte</h3>
              <Button type='button' onClick={addContent}>Inhalt hinzufuegen</Button>
            </div>

            {entryData.contents.map((content, index) => (
              <div key={index} className='flex flex-col gap-3 rounded-md border border-gray-700 p-3'>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-2'>
                  <div>
                    <label className='text-sm text-gray-400'>Item-/Bundle-ID</label>
                    <Input
                      value={content.id}
                      onChange={(e) => {
                        const next = [...entryData.contents]
                        next[index].id = e.target.value
                        setEntryData({ ...entryData, contents: next })
                      }}
                      placeholder='id'
                    />
                  </div>
                  <div>
                    <label className='text-sm text-gray-400'>Menge</label>
                    <Input
                      type='number'
                      value={String(content.quantity)}
                      onChange={(e) => {
                        const next = [...entryData.contents]
                        next[index].quantity = Math.max(1, Number(e.target.value) || 1)
                        setEntryData({ ...entryData, contents: next })
                      }}
                    />
                  </div>
                  <div>
                    <label className='text-sm text-gray-400'>Reservierung</label>
                    <Dropdown
                      placeholder='Reservierung'
                      value={content.reservationType}
                      onSelect={(value) => {
                        const next = [...entryData.contents]
                        next[index].reservationType = value as BundleContentDraft['reservationType']
                        setEntryData({ ...entryData, contents: next })
                      }}
                      options={[
                        { label: 'always', value: 'always' },
                        { label: 'onBook', value: 'onBook' },
                      ]}
                    />
                  </div>
                </div>

                <div>
                  <label className='text-sm text-gray-400'>Versions-ID (optional)</label>
                  <Input
                    value={content.versionUuid}
                    onChange={(e) => {
                      const next = [...entryData.contents]
                      next[index].versionUuid = e.target.value
                      setEntryData({ ...entryData, contents: next })
                    }}
                    placeholder='version-uuid'
                  />
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
                  <label className='inline-flex items-center gap-2'>
                    <input
                      type='checkbox'
                      checked={content.optional}
                      onChange={(e) => {
                        const next = [...entryData.contents]
                        next[index].optional = e.target.checked
                        setEntryData({ ...entryData, contents: next })
                      }}
                    />
                    Optional
                  </label>
                  <label className='inline-flex items-center gap-2'>
                    <input
                      type='checkbox'
                      checked={content.displayOnLabel}
                      onChange={(e) => {
                        const next = [...entryData.contents]
                        next[index].displayOnLabel = e.target.checked
                        setEntryData({ ...entryData, contents: next })
                      }}
                    />
                    Auf Label anzeigen
                  </label>
                  <label className='inline-flex items-center gap-2'>
                    <input
                      type='checkbox'
                      checked={content.displayOnAllDocuments}
                      onChange={(e) => {
                        const next = [...entryData.contents]
                        next[index].displayOnAllDocuments = e.target.checked
                        setEntryData({ ...entryData, contents: next })
                      }}
                    />
                    Auf allen Dokumenten anzeigen
                  </label>
                  <label className='inline-flex items-center gap-2'>
                    <input
                      type='checkbox'
                      checked={content.extend}
                      onChange={(e) => {
                        const next = [...entryData.contents]
                        next[index].extend = e.target.checked
                        setEntryData({ ...entryData, contents: next })
                      }}
                    />
                    Bundle aufklappen
                  </label>
                  <label className='inline-flex items-center gap-2'>
                    <input
                      type='checkbox'
                      checked={content.extendOnLabel}
                      onChange={(e) => {
                        const next = [...entryData.contents]
                        next[index].extendOnLabel = e.target.checked
                        setEntryData({ ...entryData, contents: next })
                      }}
                    />
                    Auf Label aufklappen
                  </label>
                  <label className='inline-flex items-center gap-2'>
                    <input
                      type='checkbox'
                      checked={content.extendOnAllDocuments}
                      onChange={(e) => {
                        const next = [...entryData.contents]
                        next[index].extendOnAllDocuments = e.target.checked
                        setEntryData({ ...entryData, contents: next })
                      }}
                    />
                    Auf allen Dokumenten aufklappen
                  </label>
                </div>

                <Button type='button' onClick={() => removeContent(index)} disabled={entryData.contents.length === 1}>
                  Inhalt entfernen
                </Button>
              </div>
            ))}

            <Button type='submit' disabled={saving}>
              {saving ? 'Erstellen...' : 'Bundle erstellen'}
            </Button>
          </form>
        </div>
      )}
    </Modal>
  )
}
