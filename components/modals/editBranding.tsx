import React, { useState } from 'react'
import Modal from '../ui/Modal'
import { Pen } from 'lucide-react'
import ContentTabs from '../ui/ContentTabs'
import Button from '../ui/Button'
import Branding from '@/types/settings/branding'
import Input from '../ui/Input'


interface EditBrandingModalProps {
    target: Branding,
    onClose: () => void
}

function buildBrandingState(target: Branding): Branding {
    return {
        ...target,
        integrations: {
            lexware: {
                enabled: target.integrations?.lexware?.enabled ?? false,
                apiKey: target.integrations?.lexware?.apiKey,
                organizationId: target.integrations?.lexware?.organizationId,
                lastSync: target.integrations?.lexware?.lastSync,
            },
        },
    }
}

function EditBrandingModal({ target, onClose }: EditBrandingModalProps) {
    const [branding, setBranding] = useState<Branding>(buildBrandingState(target))
    const [loading, setLoading] = useState(false)
    const [syncing, setSyncing] = useState(false)
    const [importing, setImporting] = useState(false)


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        try {
            fetch(`/api/settings/brandings?uid=${target.uid}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(branding)
          })
        } catch (error) {
            console.error('Error updating branding:', error)
        } finally {
            onClose()
        }
    }

    const handleSync = () => {
        setSyncing(true)

        try {
            fetch(`/api/settings/brandings?uid=${target.uid}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(branding)
          })
        } catch (error) {
            console.error('Error updating branding before sync:', error)
            setSyncing(false)
            return
        }

        try {
            fetch(`/api/integrations/lexware/profile?uid=${target.uid}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Failed to fetch Lexware profile: ${response.statusText}`)
                }
                return response.json()
            })
            .then((data) => {
                setBranding({
                    ...branding,
                    taxType: data.taxType,
                    name: data.companyName,
                    smallBusiness: data.smallBusiness,
                    integrations: {
                        ...branding.integrations,
                        lexware: {
                            ...branding.integrations.lexware,
                            lastSync: new Date(),
                            organizationId: data.organizationId,
                        }
                    }
                })
            })
        } catch (error) {
            console.error('Error synchronizing with Lexware:', error)
        } finally {
            setSyncing(false)
        }
    }

    const handleImportContacts = () => {
        setImporting(true)

        try {
            fetch(`/api/integrations/lexware/contacts?uid=${target.uid}&syncContacts=true`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Failed to fetch Lexware contacts: ${response.statusText}`)
                }
                return response.json()
            })
            .then((data) => {
                console.log('Imported contacts from Lexware:', data)
            })
        } catch (error) {
            console.error('Error importing contacts from Lexware:', error)
        } finally {
            setImporting(false)
        }
    }

    return (
        <Modal title='Branding bearbeiten' icon={Pen} onClose={onClose}>
            <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
                <ContentTabs
                    tabs={(() => {
                        const baseTabs = [
                            { 
                                id: 'general',
                                label: 'Allgemein',
                                content: 
                                    <>
                                        <div className='w-full'>
                                            <label className='text-sm text-gray-400'>Name</label>
                                            <Input disabled={branding.integrations.lexware.enabled} value={branding.name} onChange={(e) => setBranding({ ...branding, name: e.target.value })} placeholder='Veranstaltungsfirma GmbH' />
                                        </div>
                                        <div className='w-full'>
                                            <label className='text-sm text-gray-400'>Adresse</label>
                                            <div className='flex gap-2'>
                                                <Input value={branding.address.street} onChange={(e) => setBranding({ ...branding, address: { ...branding.address, street: e.target.value } })} placeholder='Musterstraße 1' />
                                                <Input value={branding.address.postalCode} onChange={(e) => setBranding({ ...branding, address: { ...branding.address, postalCode: e.target.value } })} placeholder='12345' className='mt-2' />
                                                <Input value={branding.address.city} onChange={(e) => setBranding({ ...branding, address: { ...branding.address, city: e.target.value } })} placeholder='Musterstadt' className='mt-2' />
                                                <Input value={branding.address.country} onChange={(e) => setBranding({ ...branding, address: { ...branding.address, country: e.target.value } })} placeholder='Deutschland' className='mt-2' />
                                            </div>
                                        </div>
                                        <div>
                                            <label className='text-sm text-gray-400'>Kontakt</label>
                                            <Input value={branding.email} onChange={(e) => setBranding({ ...branding, email: e.target.value })} placeholder='info@veranstaltungsfirma.de' />
                                            <Input value={branding.phone} onChange={(e) => setBranding({ ...branding, phone: e.target.value })} placeholder='+49 123 456789' className='mt-2' />
                                            <Input value={branding.website} onChange={(e) => setBranding({ ...branding, website: e.target.value })} placeholder='www.veranstaltungsfirma.de' className='mt-2' />
                                        </div>
                                    </>
                            },
                            { id: 'design', label: 'Design', content: <div>Design</div> },
                            {
                                id: 'integrations',
                                label: 'Integrationen',
                                content: 
                                    <>
                                        <div>
                                            <label className='text-sm text-gray-400'>Lexware</label>
                                            <div className='flex items-center gap-2 mt-2'>
                                                <label className="inline-flex items-center gap-4 ml-2 cursor-pointer">
                                                    <span className="select-none text-sm font-medium text-heading">Aktiv?</span>
                                                    <input
                                                        type="checkbox"
                                                        value=""
                                                        className="sr-only peer"
                                                        checked={branding.integrations.lexware.enabled}
                                                        onChange={(e) => {
                                                        const checked = e.target.checked
                                                        setBranding({ ...branding, integrations: { ...branding.integrations, lexware: { ...branding.integrations.lexware, enabled: checked } } })}}
                                                        />
                                                    <div className="relative w-9 h-5 bg-neutral-quaternary rounded-full peer dark:bg-gray-700 peer-focus:ring-4 peer-focus:ring-teal-300 dark:peer-focus:ring-teal-800 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600 dark:peer-checked:bg-teal-600"></div>
                                                </label>
                                            </div>
                                            {branding.integrations.lexware.enabled && (
                                                <div className='ml-2 mt-2'>
                                                    <label className='text-sm text-gray-400'>API-Schlüssel</label>
                                                    <div className='flex items-center gap-2'>
                                                        <Input value={branding.integrations.lexware.apiKey ?? ''} onChange={(e) => setBranding({ ...branding, integrations: { ...branding.integrations, lexware: { ...branding.integrations.lexware, apiKey: e.target.value } } })} placeholder='ABC123' />
                                                        <Button className='mt-2' onClick={() => handleSync()}>{syncing ? 'Synchronisieren...' : 'Synchronisieren'}</Button>
                                                    </div>
                                                    {branding.integrations.lexware.lastSync && (
                                                        <>
                                                            <p className='text-sm text-gray-400 mt-1'>Letzte Synchronisierung: {new Date(branding.integrations.lexware.lastSync).toLocaleString()}</p>
                                                            <Button onClick={() => handleImportContacts()} className='mt-2'>{importing ? 'Importieren...' : 'Kontakte importieren'}</Button>
                                                        </>
                                                    )}
                                                </div>
                                            )}

                                        </div>
                                    </>
                                },
                        ]
                        return baseTabs
                    })()}
                />
                <Button type='submit'>Änderungen speichern</Button>
            </form>
        </Modal>
    )
}

export default EditBrandingModal