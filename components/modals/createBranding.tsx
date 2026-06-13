import React, { useState } from 'react'
import Modal from '../ui/Modal'
import { Building2 } from 'lucide-react'
import Input from '../ui/Input'
import Company from '@/types/settings/branding'
import Button from '../ui/Button'
import { v4 as uuidv4 } from 'uuid'

interface CreateBrandingModalProps {
  onClose: () => void
}

export default function CreateBrandingModal({ onClose }: CreateBrandingModalProps) {
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [entryData, setEntryData] = useState<Company>({
    uid: '',
    name: '',
    address: {
      street: '',
      postalCode: '',
      city: '',
      country: ''
    },
    email: '',
    phone: '',
    website: '',
    logoUrl: '',
    integrations: {
      lexware: {
        enabled: false
      }
    },
    history: []
  })

  const displayPreviousButton = currentStep > 1

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleNextStep = () => {
    setCurrentStep(currentStep + 1)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    setLoading(true)

    const payload = { ...entryData, uid: uuidv4() }
    try {
      fetch('/api/settings/brandings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    } catch (error) {
      console.error('Error creating branding:', error)
    } finally {
      onClose()
    }
  }

  return (
    <Modal
      title="Branding erstellen"
      onClose={onClose}
      icon={Building2}
      onBack={displayPreviousButton ? handlePreviousStep : undefined}
    >
      {currentStep === 1 && (
        <>
          <div className='flex flex-col gap-2 mt-4 h-full'>
            <h2 className='text-lg font-semibold'>Stammdaten</h2>
            <div>
              <form className='flex flex-col gap-4'>
                <div>
                  <label className='text-sm text-gray-400'>Name</label>
                  <Input value={entryData.name} onChange={(e) => setEntryData({ ...entryData, name: e.target.value })} placeholder='Veranstaltungsfirma GmbH' />
                </div>
                <div>
                  <label className='text-sm text-gray-400'>Adresse</label>
                  <Input value={entryData.address.street} onChange={(e) => setEntryData({ ...entryData, address: { ...entryData.address, street: e.target.value } })} placeholder='Musterstraße 1' />
                  <Input value={entryData.address.postalCode} onChange={(e) => setEntryData({ ...entryData, address: { ...entryData.address, postalCode: e.target.value } })} placeholder='12345' className='mt-2' />
                  <Input value={entryData.address.city} onChange={(e) => setEntryData({ ...entryData, address: { ...entryData.address, city: e.target.value } })} placeholder='Musterstadt' className='mt-2' />
                  <Input value={entryData.address.country} onChange={(e) => setEntryData({ ...entryData, address: { ...entryData.address, country: e.target.value } })} placeholder='Deutschland' className='mt-2' />
                </div>
                <Button onClick={handleNextStep} className='self-end mt-4'>
                  Weiter
                </Button>
              </form>
            </div>
          </div>
        </>
      )}

      {currentStep === 2 && (
        <>
          <div className='flex flex-col gap-2 mt-4 h-full'>
            <h2 className='text-lg font-semibold'>Kontakt</h2>
            <div>
              <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
                <div>
                  <label className='text-sm text-gray-400'>Logo URL</label>
                  <Input value={entryData.logoUrl} onChange={(e) => setEntryData({ ...entryData, logoUrl: e.target.value })} placeholder='https://www.veranstaltungsfirma.de/logo.png' />
                </div>
                <div>
                  <label className='text-sm text-gray-400'>Kontakt</label>
                  <Input value={entryData.email} onChange={(e) => setEntryData({ ...entryData, email: e.target.value })} placeholder='info@veranstaltungsfirma.de' />
                  <Input value={entryData.phone} onChange={(e) => setEntryData({ ...entryData, phone: e.target.value })} placeholder='+49 123 456789' className='mt-2' />
                  <Input value={entryData.website} onChange={(e) => setEntryData({ ...entryData, website: e.target.value })} placeholder='www.veranstaltungsfirma.de' className='mt-2' />
                </div>
                <Button type='submit' disabled={loading}>
                  {loading ? 'Erstellen...' : 'Branding erstellen'}
                </Button>
              </form>
            </div>
          </div>
        </>
      )}
    </Modal>
  )
}
