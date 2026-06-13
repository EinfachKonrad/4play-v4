import Button from '@/components/ui/Button'
import Table from '@/components/ui/Table'
import PageTitle from '@/components/utility/PageTitle'
import ProtectedPage from '@/components/utility/ProtectedPage'
import { Building2, Pencil, Plus } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import type Branding from '@/types/settings/branding'
import CreateBrandingModal from '@/components/modals/createBranding'
import EditBrandingModal from '@/components/modals/editBranding'

function SettingsBrandingsPage() {
    const [loading, setLoading] = useState(true)
    const [brandings, setBrandings] = useState<Branding[]>([])
    const [displayCreateModal, setDisplayCreateModal] = useState(false)
    const [displayEditModal, setDisplayEditModal] = useState(false)
    const [target, setTarget] = useState<Branding | null>(null)
    
    async function fetchBrandings() {
        try {
            const response = await fetch('/api/settings/brandings')
            const data = await response.json()
            setBrandings(data)
        } catch (error) {
            console.error('Error fetching brandings:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleEdit(branding: Branding) {
        try {
            const response = await fetch(`/api/settings/brandings?uid=${branding.uid}`)
            if (!response.ok) {
                throw new Error(`Failed to fetch branding ${branding.uid}`)
            }

            const data = await response.json()
            setTarget(data)
            setDisplayEditModal(true)
        } catch (error) {
            console.error('Error fetching branding for edit:', error)
        }
    }

    const onCloseModal = () => {
        setDisplayEditModal(false)
        setDisplayCreateModal(false)
        setTarget(null)
        setLoading(true)
        fetchBrandings()
    }

    useEffect(() => {
        let cancelled = false

        fetch('/api/settings/brandings')
            .then((response) => response.json())
            .then((data) => {
                if (!cancelled) {
                    setBrandings(data)
                    setLoading(false)
                }
            })
            .catch((error) => {
                if (!cancelled) {
                    console.error('Error fetching brandings:', error)
                    setLoading(false)
                }
            })

        return () => {
            cancelled = true
        }
    }, [])

    return (
        <ProtectedPage permission="manageBrandingSettings" pageTitle="Brandings">
            <div className="flex items-center justify-between mb-4">
                <PageTitle title="Brandings" icon={Building2} />
                <div className="flex items-center gap-2">
                    <Button onClick={() => setDisplayCreateModal(true)}>
                        <Plus className='inline h-4 w-4' />
                        <span className='!p-0'>Neu</span>
                    </Button>
                </div>
            </div>
            <div>
                <Table 
                    loading={loading}
                    columns={[
                        { id: 'name', name: 'Name', sortable: true },
                        { id: 'adress', name: 'Adresse', sortable: false },
                        { id: 'options', name: 'Optionen', sortable: false },
                    ]} data={brandings.map(branding => ({
                    ...branding,
                    adress: `${branding.address.street}, ${branding.address.postalCode} ${branding.address.city}`,
                    options: (
                        <>
                <button title='Crew-Mitglied bearbeiten' onClick={() => handleEdit(branding)} className="p-1 cursor-pointer transition-all duration-200 hover:text-gray-700">
                  <Pencil size={16} />
                </button>
              </>
            ),
        }))} />
            </div>

            { displayCreateModal && (
                <CreateBrandingModal onClose={onCloseModal} />
            )}

            { displayEditModal && target && (
                <EditBrandingModal target={target} onClose={onCloseModal} />
            )}
        </ProtectedPage>
    )
}

export default SettingsBrandingsPage