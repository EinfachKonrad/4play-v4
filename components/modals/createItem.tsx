import React, { useState } from 'react'
import { Box } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Button from '../ui/Button'
import Dropdown from '../ui/Dropdown'
import Item from '@/types/equipment/item'

interface CreateItemModalProps {
  onClose: () => void
}

type ItemFormData = {
  manufacturer: string
  model: string
  path: string
  description: string
  purchasePrice: number
  dayRate: number
  width: string
  height: string
  depth: string
  weight: string
  trackingType: Item['stock']['trackingType']
  totalQuantity: number
  locations: Array<{ id: string; quantity: string }>
  versionOptional: boolean
  versions: Array<{ id: string; name: string }>
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

export default function CreateItemModal({ onClose }: CreateItemModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [entryData, setEntryData] = useState<ItemFormData>({
    manufacturer: '',
    model: '',
    path: '',
    description: '',
    purchasePrice: 0,
    dayRate: 0,
    width: '',
    height: '',
    depth: '',
    weight: '',
    trackingType: 'bulk',
    totalQuantity: 1,
    locations: [{ id: '', quantity: '' }],
    versionOptional: true,
    versions: [],
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

  function addLocation() {
    setEntryData((prev) => ({
      ...prev,
      locations: [...prev.locations, { id: '', quantity: '' }],
    }))
  }

  function removeLocation(index: number) {
    setEntryData((prev) => ({
      ...prev,
      locations: prev.locations.length > 1 ? prev.locations.filter((_, i) => i !== index) : prev.locations,
    }))
  }

  function addVersion() {
    setEntryData((prev) => ({
      ...prev,
      versions: [...prev.versions, { id: uuidv4(), name: '' }],
    }))
  }

  function removeVersion(index: number) {
    setEntryData((prev) => ({
      ...prev,
      versions: prev.versions.filter((_, i) => i !== index),
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!entryData.model.trim() || !entryData.path.trim()) {
      alert('Bitte Modell und Pfad ausfuellen.')
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

    const payload: Item = {
      id: uuidv4(),
      ...(entryData.manufacturer.trim() ? { manufacturer: entryData.manufacturer.trim() } : {}),
      model: entryData.model.trim(),
      path: entryData.path.trim(),
      ...(entryData.description.trim() ? { description: entryData.description.trim() } : {}),
      purchasePrice: entryData.purchasePrice,
      dayRate: entryData.dayRate,
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
      ...(entryData.locations.some((location) => location.id.trim())
        ? {
            locations: entryData.locations
              .filter((location) => location.id.trim())
              .map((location) => ({
                id: location.id.trim(),
                ...(typeof parseOptionalNumber(location.quantity) === 'number'
                  ? { quantity: parseOptionalNumber(location.quantity) }
                  : {}),
              })),
          }
        : {}),
      ...(entryData.versions.some((version) => version.name.trim())
        ? {
            versions: {
              optional: entryData.versionOptional,
              options: entryData.versions
                .filter((version) => version.name.trim())
                .map((version) => ({
                  id: version.id,
                  name: version.name.trim(),
                })),
            },
          }
        : {}),
      stock:
        entryData.trackingType === 'bulk'
          ? {
              trackingType: 'bulk',
              totalQuantity: Math.max(0, entryData.totalQuantity),
            }
          : {
              trackingType: 'serial',
              elements: [],
            },
    }

    try {
      const response = await fetch('/api/equipment/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('Fehler beim Erstellen des Artikels')
      }

      onClose()
    } catch (error) {
      console.error(error)
      alert('Fehler beim Erstellen des Artikels')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title='Neuen Artikel erstellen'
      onClose={onClose}
      icon={Box}
      onBack={displayPreviousButton ? handlePreviousStep : undefined}
    >
      {currentStep === 1 && (
        <div className='flex flex-col gap-2 mt-4 h-full'>
          <h2 className='text-lg font-semibold'>Stammdaten</h2>
          <form className='flex flex-col gap-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
              <div>
                <label className='text-sm text-gray-400'>Hersteller</label>
                <Input
                  value={entryData.manufacturer}
                  onChange={(e) => setEntryData({ ...entryData, manufacturer: e.target.value })}
                  placeholder='Yamaha'
                />
              </div>
              <div>
                <label className='text-sm text-gray-400'>Modell</label>
                <Input
                  value={entryData.model}
                  onChange={(e) => setEntryData({ ...entryData, model: e.target.value })}
                  placeholder='CL5'
                />
              </div>
            </div>

            <div>
              <label className='text-sm text-gray-400'>Pfad</label>
              <Input
                value={entryData.path}
                onChange={(e) => setEntryData({ ...entryData, path: e.target.value })}
                placeholder='Audio/Consoles/Digital'
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

            <div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
              <div>
                <label className='text-sm text-gray-400'>Einkaufspreis</label>
                <Input
                  type='number'
                  value={String(entryData.purchasePrice)}
                  onChange={(e) => setEntryData({ ...entryData, purchasePrice: Number(e.target.value) || 0 })}
                  placeholder='0'
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
            </div>

            <Button onClick={handleNextStep} className='self-end'>
              Weiter
            </Button>
          </form>
        </div>
      )}

      {currentStep === 2 && (
        <div className='flex flex-col gap-2 mt-4 h-full'>
          <h2 className='text-lg font-semibold'>Bestand & Optionen</h2>
          <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
            <div>
              <label className='text-sm text-gray-400'>Tracking-Typ</label>
              <Dropdown
                placeholder='Tracking-Typ'
                value={entryData.trackingType}
                onSelect={(value) => setEntryData({ ...entryData, trackingType: value as Item['stock']['trackingType'] })}
                options={[
                  { label: 'Bulk', value: 'bulk' },
                  { label: 'Seriennummern', value: 'serial' },
                ]}
              />
            </div>

            {entryData.trackingType === 'bulk' && (
              <div>
                <label className='text-sm text-gray-400'>Gesamtmenge</label>
                <Input
                  type='number'
                  value={String(entryData.totalQuantity)}
                  onChange={(e) => setEntryData({ ...entryData, totalQuantity: Math.max(0, Number(e.target.value) || 0) })}
                  placeholder='1'
                />
              </div>
            )}

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

            <div className='flex flex-col gap-2 rounded-md border border-gray-700 p-3'>
              <div className='flex items-center justify-between gap-2'>
                <label className='text-sm text-gray-400'>Lagerorte</label>
                <Button type='button' onClick={addLocation}>Lagerort hinzufuegen</Button>
              </div>
              {entryData.locations.map((location, index) => (
                <div key={index} className='grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2'>
                  <Input
                    value={location.id}
                    onChange={(e) => {
                      const next = [...entryData.locations]
                      next[index].id = e.target.value
                      setEntryData({ ...entryData, locations: next })
                    }}
                    placeholder='Warehouse-A'
                  />
                  <Input
                    value={location.quantity}
                    onChange={(e) => {
                      const next = [...entryData.locations]
                      next[index].quantity = e.target.value
                      setEntryData({ ...entryData, locations: next })
                    }}
                    placeholder='Menge (optional)'
                  />
                  <Button type='button' onClick={() => removeLocation(index)} disabled={entryData.locations.length === 1}>Entfernen</Button>
                </div>
              ))}
            </div>

            <div className='flex flex-col gap-2 rounded-md border border-gray-700 p-3'>
              <div className='flex items-center justify-between gap-2'>
                <label className='text-sm text-gray-400'>Versionen</label>
                <Button type='button' onClick={addVersion}>Version hinzufuegen</Button>
              </div>

              <label className='inline-flex items-center gap-2 ml-2'>
                <input
                  type='checkbox'
                  checked={entryData.versionOptional}
                  onChange={(e) => setEntryData({ ...entryData, versionOptional: e.target.checked })}
                />
                Version optional
              </label>

              {entryData.versions.map((version, index) => (
                <div key={version.id} className='grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2'>
                  <Input
                    value={version.name}
                    onChange={(e) => {
                      const next = [...entryData.versions]
                      next[index].name = e.target.value
                      setEntryData({ ...entryData, versions: next })
                    }}
                    placeholder='Versionenname'
                  />
                  <Button type='button' onClick={() => removeVersion(index)}>Entfernen</Button>
                </div>
              ))}
            </div>

            <Button type='submit' disabled={saving}>
              {saving ? 'Erstellen...' : 'Artikel erstellen'}
            </Button>
          </form>
        </div>
      )}
    </Modal>
  )
}
