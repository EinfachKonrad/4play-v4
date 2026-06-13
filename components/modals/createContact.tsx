import React, { useState } from 'react'
import Modal from '../ui/Modal'
import { UserPlus2 } from 'lucide-react'
import Input from '../ui/Input'
import Client from '@/types/contacts/clients'
import { useSession } from 'next-auth/react'
import Dropdown from '../ui/Dropdown'
import Button from '../ui/Button'

interface CreateContactModalProps {
    onClose: () => void
}

export default function CreateContactModal({ onClose }: CreateContactModalProps) {
    const { data: session } = useSession()
    const [currentStep, setCurrentStep] = useState(1)
    const displayPreviousButton = currentStep > 1
    const [entryData, setEntryData] = useState({
        type: '',
        uid: '',
        name: '',
        address: [{
            type: '',
            street: '',
            postalCode: '',
            city: '',
            country: ''
        }],
        emails: [{
            type: '',
            email: ''
        }],
        phoneNumbers: [{
            type: '',
            number: ''
        }],
        history: [
            {
                date: new Date(),
                event: 'created',
                updatedBy: session?.user?.uid ?? 'unknown'
            }
        ]
    })


    const handlePreviousStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1)
        }
    }


    return (
        <Modal
            title="Neuen Kontakt erstellen"
            onClose={onClose} icon={UserPlus2}
            onBack={displayPreviousButton ? handlePreviousStep : undefined}
        >
            {currentStep === 1 && (
                <>
                    <div className='flex flex-col gap-2 mt-4 h-full'>
                        <h2 className='text-lg font-semibold'>Stammdaten</h2>
                        <div>
                            <form className='flex flex-col gap-4'>
                                <div className='w-full flex gap-2'>
                                    <div className='w-2/3'>
                                        <label className='text-sm text-gray-400'>Name</label>
                                        <Input value={entryData.name} onChange={(e) => setEntryData({ ...entryData, name: e.target.value })} placeholder='Veranstaltungsfirma GmbH' />
                                    </div>
                                    <div className='w-1/3'>
                                        <label className='text-sm text-gray-400'>Typ</label>
                                        <Dropdown
                                            placeholder='Kunde oder Dienstleister'
                                            options={[{
                                                label: 'Kunde',
                                                value: 'customer'
                                            }, {
                                                label: 'Dienstleister',
                                                value: 'supplier'
                                            }]}
                                            value={entryData.type}
                                            onSelect={(value) => setEntryData({ ...entryData, type: value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className='text-sm text-gray-400'>Adresse</label>
                                    {entryData.address.map((addr, idx) => (
                                        <React.Fragment key={idx}>
                                            <div key={idx} className='flex gap-2 mb-2'>
                                                <Dropdown
                                                    placeholder='Art der Adresse'
                                                    options={[
                                                        { label: 'Hauptadresse', value: 'main' },
                                                        { label: 'Rechnungsadresse', value: 'billing' },
                                                        { label: 'Lieferadresse', value: 'shipping' },
                                                        { label: 'Sonstige', value: 'other' }
                                                    ]}
                                                    value={addr.type}
                                                    onSelect={(value) => {
                                                        const newAddresses = [...entryData.address]
                                                        newAddresses[idx].type = value
                                                        setEntryData({ ...entryData, address: newAddresses })
                                                    }}
                                                />
                                                <Input value={addr.street} onChange={(e) => {
                                                    const newAddresses = [...entryData.address]
                                                    newAddresses[idx].street = e.target.value
                                                    setEntryData({ ...entryData, address: newAddresses })
                                                }} placeholder='Musterstraße 1' />
                                                <Input value={addr.postalCode} onChange={(e) => {
                                                    const newAddresses = [...entryData.address] 
                                                    newAddresses[idx].postalCode = e.target.value
                                                    setEntryData({ ...entryData, address: newAddresses })
                                                }} placeholder='12345' />
                                                <Input value={addr.city} onChange={(e) => {
                                                    const newAddresses = [...entryData.address]
                                                    newAddresses[idx].city = e.target.value
                                                    setEntryData({ ...entryData, address: newAddresses })
                                                }} placeholder='Musterstadt' />
                                                <Input value={addr.country} onChange={(e) => {
                                                    const newAddresses = [...entryData.address]
                                                    newAddresses[idx].country = e.target.value
                                                    setEntryData({ ...entryData, address: newAddresses })
                                                }} placeholder='Deutschland' />
                                                <Button type='button' onClick={() => {
                                                    const newAddresses = entryData.address.filter((_, i) => i !== idx)
                                                    setEntryData({ ...entryData, address: newAddresses })
                                                }} className='self-end'>
                                                    Entfernen
                                                </Button>
                                            </div>
                                        </React.Fragment>
                                    ))}
                                    <Button type='button' onClick={() => setEntryData({ ...entryData, address: [...entryData.address, { type: '', street: '', postalCode: '', city: '', country: '' }] })}>
                                        Weitere Adresse hinzufügen
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </>
            )}    
        </Modal>
    )
}
