import CreateContactModal from '@/components/modals/createContact'
import Navbar from '@/components/ui/Navbar'
import Table from '@/components/ui/Table'
import PageTitle from '@/components/utility/PageTitle'
import ProtectedPage from '@/components/utility/ProtectedPage'
import { Book, BookUser, Building2, Plus } from 'lucide-react'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'

function ContactsIndexPage() {
  const router = useRouter()
  const [view, setView] = useState<'clients' | 'suppliers'>('clients')
  const [displayCreateModal, setDisplayCreateModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [clients, setClients] = useState([])
  const [suppliers, setSuppliers] = useState([])

  async function fetchData() {
    try {
      const [clientsResponse, suppliersResponse] = await Promise.all([
        fetch('/api/contacts/clients'),
        fetch('/api/contacts/suppliers')
      ])
      const [clientsData, suppliersData] = await Promise.all([
        clientsResponse.json(),
        suppliersResponse.json()
      ])
      setClients(clientsData)
      setSuppliers(suppliersData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
      setView((router.query.view as typeof view) || 'clients')
  }, [router.query.view])
    
  const handleViewChange = (newView: typeof view) => {
      setView(newView)
      router.push({
          pathname: router.pathname,
          query: { ...router.query, view: newView }
      }, undefined, { shallow: true })
  }
    
  return (
        <ProtectedPage permission="accessContacts" pageTitle="Kontakte">
      <div>
        <div className="flex items-center justify-between mb-4">
          <PageTitle title="Kontakte" icon={Book} />
          <div className="flex items-center gap-2">
            <button className='text-sm rounded-md border border-gray-800 p-1 cursor-pointer transition-all duration-200 hover:bg-gray-700' onClick={() => setDisplayCreateModal(true)}>
              <Plus className='inline h-4 w-4' />
              <span className='!p-0'>Neu</span>
            </button>
          <Navbar items={[
            { id: 'clients', name: 'Kunden', onClick: () => handleViewChange('clients'), icon: BookUser, requiredPermission: 'viewClients'},
            { id: 'suppliers', name: 'Dienstleister', onClick: () => handleViewChange('suppliers'), icon: Building2, requiredPermission: 'viewSuppliers'},
          ]} activeItemId={view} />
          </div>
        </div>
        {view === 'clients' ? 
          <div>
            <Table
              loading={loading}
              columns={[
                { id: 'name', name: 'Name', sortable: true },
                { id: 'address', name: 'Adresse', sortable: false },
                { id: 'options', name: 'Optionen', sortable: false },
              ]} data={clients.map((client: any) => ({
                ...client,
                address: (
                  <>
                    {client.address.map((addr: any, index: number) => (
                      <div key={index}>
                        {addr.street}, {addr.postalCode} {addr.city}
                      </div>
                    ))}
                  </>
                ),
              }))} />
          </div> 
          : 
          <div>Dienstleister</div>
        }
      </div>
      {
          displayCreateModal && (
            <CreateContactModal onClose={() => setDisplayCreateModal(false)} />
          )
      }
    </ProtectedPage>
  )
}

export default ContactsIndexPage