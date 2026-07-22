import React, { useState } from 'react'
import { Building2 } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Button from '../ui/Button'
import RentalItem from '@/types/equipment/rentalItem'

interface CreateRentalItemModalProps {
  onClose: () => void
}

type CompanyDraft = {
  id: string
  dayRate: string
  quantity: string
  versionsOptional: boolean
  versions: Array<{ id: string; name: string }>
}

type RentalItemFormData = {
  manufacturer: string
  model: string
  path: string
  description: string
  width: string
  height: string
  depth: string
  weight: string
  companies: CompanyDraft[]
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

function createEmptyCompany(): CompanyDraft {
  return {
    id: '',
    dayRate: '',
    quantity: '',
    versionsOptional: true,
    versions: [],
  }
}

export default function CreateRentalItemModal({ onClose }: CreateRentalItemModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [entryData, setEntryData] = useState<RentalItemFormData>({
    manufacturer: '',
    model: '',
    path: '',
    description: '',
    width: '',
    height: '',
    depth: '',
    weight: '',
    companies: [createEmptyCompany()],
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

  function addCompany() {
    setEntryData((prev) => ({
      ...prev,
      companies: [...prev.companies, createEmptyCompany()],
    }))
  }

  function removeCompany(index: number) {
    setEntryData((prev) => ({
      ...prev,
      companies: prev.companies.length > 1 ? prev.companies.filter((_, i) => i !== index) : prev.companies,
    }))
  }

  function addVersion(companyIndex: number) {
    setEntryData((prev) => {
      const nextCompanies = [...prev.companies]
      nextCompanies[companyIndex].versions.push({ id: uuidv4(), name: '' })
      return {
        ...prev,
        companies: nextCompanies,
      }
    })
  }

  function removeVersion(companyIndex: number, versionIndex: number) {
    setEntryData((prev) => {
      const nextCompanies = [...prev.companies]
      nextCompanies[companyIndex].versions = nextCompanies[companyIndex].versions.filter((_, idx) => idx !== versionIndex)
      return {
        ...prev,
        companies: nextCompanies,
      }
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!entryData.model.trim() || !entryData.path.trim()) {
      alert('Bitte Modell und Pfad ausfuellen.')
      return
    }

    const companies = entryData.companies.filter((company) => company.id.trim())
    if (companies.length === 0) {
      alert('Bitte mindestens eine Firma angeben.')
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

    const payload: RentalItem = {
      id: uuidv4(),
      ...(entryData.manufacturer.trim() ? { manufacturer: entryData.manufacturer.trim() } : {}),
      model: entryData.model.trim(),
      path: entryData.path.trim(),
      ...(entryData.description.trim() ? { description: entryData.description.trim() } : {}),
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
      companies: companies.map((company) => ({
        id: company.id.trim(),
        ...(typeof parseOptionalNumber(company.dayRate) === 'number' ? { dayRate: parseOptionalNumber(company.dayRate) } : {}),
        ...(typeof parseOptionalNumber(company.quantity) === 'number' ? { quantity: parseOptionalNumber(company.quantity) } : {}),
        ...(company.versions.some((version) => version.name.trim())
          ? {
              versions: {
                optional: company.versionsOptional,
                options: company.versions
                  .filter((version) => version.name.trim())
                  .map((version) => ({
                    id: version.id,
                    name: version.name.trim(),
                  })),
              },
            }
          : {}),
      })),
    }

    try {
      const response = await fetch('/api/equipment/rentalItems', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('Fehler beim Erstellen des Rental Items')
      }

      onClose()
    } catch (error) {
      console.error(error)
      alert('Fehler beim Erstellen des Rental Items')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title='Neues Rental Item erstellen'
      onClose={onClose}
      icon={Building2}
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
                  placeholder='Shure'
                />
              </div>
              <div>
                <label className='text-sm text-gray-400'>Modell</label>
                <Input
                  value={entryData.model}
                  onChange={(e) => setEntryData({ ...entryData, model: e.target.value })}
                  placeholder='SM58'
                />
              </div>
            </div>

            <div>
              <label className='text-sm text-gray-400'>Pfad</label>
              <Input
                value={entryData.path}
                onChange={(e) => setEntryData({ ...entryData, path: e.target.value })}
                placeholder='Audio/Mikrofone/Vocal'
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

            <Button onClick={handleNextStep} className='self-end'>
              Weiter
            </Button>
          </form>
        </div>
      )}

      {currentStep === 2 && (
        <div className='flex flex-col gap-2 mt-4 h-full'>
          <h2 className='text-lg font-semibold'>Vermieter & Details</h2>
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
              <h3 className='text-md font-semibold'>Firmen</h3>
              <Button type='button' onClick={addCompany}>Firma hinzufuegen</Button>
            </div>

            {entryData.companies.map((company, companyIndex) => (
              <div key={companyIndex} className='flex flex-col gap-2 rounded-md border border-gray-700 p-3'>
                <div className='grid grid-cols-1 md:grid-cols-4 gap-2'>
                  <div>
                    <label className='text-sm text-gray-400'>Firmen-ID</label>
                    <Input
                      value={company.id}
                      onChange={(e) => {
                        const next = [...entryData.companies]
                        next[companyIndex].id = e.target.value
                        setEntryData({ ...entryData, companies: next })
                      }}
                      placeholder='company-uid'
                    />
                  </div>
                  <div>
                    <label className='text-sm text-gray-400'>Tagessatz</label>
                    <Input
                      type='number'
                      value={company.dayRate}
                      onChange={(e) => {
                        const next = [...entryData.companies]
                        next[companyIndex].dayRate = e.target.value
                        setEntryData({ ...entryData, companies: next })
                      }}
                      placeholder='Optional'
                    />
                  </div>
                  <div>
                    <label className='text-sm text-gray-400'>Menge</label>
                    <Input
                      type='number'
                      value={company.quantity}
                      onChange={(e) => {
                        const next = [...entryData.companies]
                        next[companyIndex].quantity = e.target.value
                        setEntryData({ ...entryData, companies: next })
                      }}
                      placeholder='Optional'
                    />
                  </div>
                  <div className='flex items-end'>
                    <Button type='button' onClick={() => removeCompany(companyIndex)} disabled={entryData.companies.length === 1}>
                      Firma entfernen
                    </Button>
                  </div>
                </div>

                <div className='flex items-center gap-2'>
                  <label className='inline-flex items-center gap-2'>
                    <input
                      type='checkbox'
                      checked={company.versionsOptional}
                      onChange={(e) => {
                        const next = [...entryData.companies]
                        next[companyIndex].versionsOptional = e.target.checked
                        setEntryData({ ...entryData, companies: next })
                      }}
                    />
                    Version optional
                  </label>
                  <Button type='button' onClick={() => addVersion(companyIndex)}>Version hinzufuegen</Button>
                </div>

                {company.versions.map((version, versionIndex) => (
                  <div key={version.id} className='grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2'>
                    <Input
                      value={version.name}
                      onChange={(e) => {
                        const next = [...entryData.companies]
                        next[companyIndex].versions[versionIndex].name = e.target.value
                        setEntryData({ ...entryData, companies: next })
                      }}
                      placeholder='Versionenname'
                    />
                    <Button type='button' onClick={() => removeVersion(companyIndex, versionIndex)}>
                      Entfernen
                    </Button>
                  </div>
                ))}
              </div>
            ))}

            <Button type='submit' disabled={saving}>
              {saving ? 'Erstellen...' : 'Rental Item erstellen'}
            </Button>
          </form>
        </div>
      )}
    </Modal>
  )
}
