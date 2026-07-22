import CreateBundleModal from '@/components/modals/createBundle'
import CreateItemModal from '@/components/modals/createItem'
import CreateRentalItemModal from '@/components/modals/createRentalItem'
import Button from '@/components/ui/Button'
import FolderStructure from '@/components/ui/FolderStructure'
import Modal from '@/components/ui/Modal'
import Navbar from '@/components/ui/Navbar'
import PageTitle from '@/components/utility/PageTitle'
import ProtectedPage from '@/components/utility/ProtectedPage'
import Bundle from '@/types/equipment/bundle'
import Item from '@/types/equipment/item'
import { Box, Building2, Folders, LucideIcon, Package, Plus } from 'lucide-react'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'


function EquipmentPage() {
  const router = useRouter()
  const [view, setView] = useState<'intern' | 'extern'>('intern')
  const [displayCreateModal, setDisplayCreateModal] = useState(false)
  const [createType, setCreateType] = useState<'item' | 'bundle' | 'rentalItem' | null>(null)
  const [internalFolderStructureItems, setInternalFolderStructureItems] = useState<Array<
  {
    id: string
    path: string
    name: string
    icon: LucideIcon
  }>>([])
  const [externalFolderStructureItems, setExternalFolderStructureItems] = useState<Array<
  {
    id: string
    path: string
    name: string
    icon: LucideIcon
  }>>([])

  useEffect(() => {
      setView((router.query.view as typeof view) || 'intern')
  }, [router.query.view])

  useEffect(() => {
      const fetchData = async () => {
          try {
              const itemsResponse = await fetch('/api/equipment/items')
              const itemsData = await itemsResponse.json()
              const bundlesResponse = await fetch('/api/equipment/bundles')
              const bundlesData = await bundlesResponse.json()
              const rentalItemsResponse = await fetch('/api/equipment/rentalItems')
              const rentalItemsData = await rentalItemsResponse.json()

              const allItems: Item[] = [...itemsData, ...rentalItemsData]
              const mappedItems = allItems.map((item) => ({
                id: item.id,
                path: item.path,
                name: item.manufacturer ? `${item.manufacturer} ${item.model}` : item.model,
                icon: Box
              }))

              const mappedBundles = (bundlesData as Bundle[]).map((bundle) => ({
                id: bundle.id,
                path: bundle.path,
                name: bundle.name,
                icon: Package
              }))

              setInternalFolderStructureItems([...mappedItems, ...mappedBundles])
              setExternalFolderStructureItems(mappedItems)
          } catch (error) {
              console.error('Error fetching equipment data:', error)
          }
      }
      fetchData()
  }, [])


  const handleViewChange = (newView: typeof view) => {
      setView(newView)
      router.push({
          pathname: router.pathname,
          query: { ...router.query, view: newView }
      }, undefined, { shallow: true })
  }

  const closeCreateFlow = () => {
    setDisplayCreateModal(false)
    setCreateType(null)
  }


  return (
    <ProtectedPage permission="accessEquipment" pageTitle="Equipment">
      <div>
        <div className="flex items-center justify-between mb-4">
          <PageTitle title="Equipment" icon={Package} />
            <div className="flex items-center gap-2">
                <Button onClick={() => setDisplayCreateModal(true)}>
                  <Plus className='inline h-4 w-4' />
                  <span className='!p-0'>Neu</span>
                </Button>
                <Navbar items={[
                  { id: 'intern', name: 'Intern', onClick: () => handleViewChange('intern'), icon: Box},
                  { id: 'extern', name: 'Extern', onClick: () => handleViewChange('extern'), icon: Folders, requiredPermission: 'viewExternalEquipment'},
                ]} activeItemId={view} />
            </div>
        </div>
        <div className="mb-4">
        </div>
        <div>
          {view === 'intern' ? (
              internalFolderStructureItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <Folders className="h-12 w-12 text-gray-400 mb-2" />
                  <p className="text-gray-400">Keine internen Equipment-Daten vorhanden.</p>
                </div>
              ) : (
              <FolderStructure items={internalFolderStructureItems} />
            )
            ) : (
              externalFolderStructureItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <Folders className="h-12 w-12 text-gray-400 mb-2" />
                  <p className="text-gray-400">Keine externen Equipment-Daten vorhanden.</p>
                </div>
              ) : (
              <FolderStructure items={externalFolderStructureItems} />
              )
            )
          }
        </div>

        {displayCreateModal && !createType && (
          <Modal title='Was moechtest du erstellen?' onClose={closeCreateFlow} icon={Plus}>
            <div className='flex flex-col gap-2 mt-4 h-full'>
              <Button onClick={() => setCreateType('item')} className='text-left'>
                <Box className='inline h-4 w-4 mr-2' />
                Artikel
              </Button>
              <Button onClick={() => setCreateType('bundle')} className='text-left'>
                <Package className='inline h-4 w-4 mr-2' />
                Bundle
              </Button>
              <Button onClick={() => setCreateType('rentalItem')} className='text-left'>
                <Building2 className='inline h-4 w-4 mr-2' />
                Rental Item
              </Button>
            </div>
          </Modal>
        )}

        {displayCreateModal && createType === 'item' && (
          <CreateItemModal onClose={closeCreateFlow} />
        )}

        {displayCreateModal && createType === 'bundle' && (
          <CreateBundleModal onClose={closeCreateFlow} />
        )}

        {displayCreateModal && createType === 'rentalItem' && (
          <CreateRentalItemModal onClose={closeCreateFlow} />
        )}
      </div>
    </ProtectedPage>
  )
}

export default EquipmentPage