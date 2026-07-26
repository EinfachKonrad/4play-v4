import CreateBundleModal from '@/components/modals/createBundle'
import CreateItemModal from '@/components/modals/createItem'
import CreateRentalItemModal from '@/components/modals/createRentalItem'
import Button from '@/components/ui/Button'
import FolderStructure from '@/components/ui/FolderStructure'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import Navbar from '@/components/ui/Navbar'
import PageTitle from '@/components/utility/PageTitle'
import ProtectedPage from '@/components/utility/ProtectedPage'
import Bundle from '@/types/equipment/bundle'
import Item from '@/types/equipment/item'
import RentalItem from '@/types/equipment/rentalItem'
import { Box, Building2, Folders, LucideIcon, Package, Plus } from 'lucide-react'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'


type EquipmentFolderStructureItem = {
  id: string
  path: string
  name: string
  icon: LucideIcon
  iconColor?: string
  displayName?: string
  children?: EquipmentFolderStructureItem[]
  options?: Array<{
    title: string
    onClick: () => void
    name: string
  }>
  contextMenu?: {
    options: Array<{
      id: string
      label: string
      onSelect: () => void
      icon?: LucideIcon
      disabled?: boolean
      danger?: boolean
    }>
  }
  searchTerms: string[]
}

function normalizeSearchValue(value: string): string {
  return value.trim().toLowerCase()
}

function itemMatchesSearch(searchTerms: string[], searchTerm: string): boolean {
  if (!searchTerm) {
    return true
  }

  return searchTerms.some((value) => value.includes(searchTerm))
}

function collectItemBarcodes(item: Item): string[] {
  const serialBarcodes = item.stock.elements?.flatMap((element) => element.barcodes ?? []) ?? []
  const bulkBarcodes = item.stock.itemBarcodes ?? []

  return [...serialBarcodes, ...bulkBarcodes].map(normalizeSearchValue)
}

function collectBundleBarcodes(bundle: Bundle): string[] {
  return (bundle.elements ?? [])
    .flatMap((element) => element.barcodes ?? [])
    .map(normalizeSearchValue)
}

function buildItemChildren(item: Item, searchTerm: string): EquipmentFolderStructureItem[] {
  if (!searchTerm || item.stock.trackingType !== 'serial') {
    return []
  }

  return (item.stock.elements ?? [])
    .filter((element) => (element.barcodes ?? []).some((barcode) => normalizeSearchValue(barcode).includes(searchTerm)))
    .map((element) => ({
      id: `${item.id}:${element.id}`,
      path: `${item.path}/__children__`,
      name: element.serialNumber,
      displayName: `${element.serialNumber}`,
      icon: Box,
      iconColor: 'text-blue-300',
      searchTerms: [
        normalizeSearchValue(element.serialNumber),
        ...((element.barcodes ?? []).map(normalizeSearchValue)),
      ],
    }))
}

function buildBundleChildren(bundle: Bundle, searchTerm: string): EquipmentFolderStructureItem[] {
  if (!searchTerm) {
    return []
  }

  return (bundle.elements ?? [])
    .filter((element) => (element.barcodes ?? []).some((barcode) => normalizeSearchValue(barcode).includes(searchTerm)))
    .map((element) => ({
      id: `${bundle.id}:${element.id}`,
      path: `${bundle.path}/__children__`,
      name: element.id,
      displayName: `${(element.barcodes ?? [element.id]).join(', ')}`,
      icon: Package,
      iconColor: 'text-green-300',
      searchTerms: [
        normalizeSearchValue(element.id),
        ...((element.barcodes ?? []).map(normalizeSearchValue)),
      ],
    }))
}

function buildItemEntry(item: Item, searchTerm: string): EquipmentFolderStructureItem | null {
  const searchTerms = [
    normalizeSearchValue(item.manufacturer ?? ''),
    normalizeSearchValue(item.model),
    normalizeSearchValue(item.path),
    ...collectItemBarcodes(item),
  ].filter(Boolean)
  const children = buildItemChildren(item, searchTerm)
  const matchesSelf = itemMatchesSearch(searchTerms, searchTerm)

  if (!matchesSelf && children.length === 0) {
    return null
  }

  return {
    id: item.id,
    path: item.path,
    name: item.manufacturer ? `${item.manufacturer} ${item.model}` : item.model,
    icon: Box,
    iconColor: 'text-blue-400',
    displayName: item.manufacturer ? `${item.manufacturer} ${item.model}` : item.model,
    searchTerms,
    children: children.length > 0 ? children : undefined,
    options: [
      {
        title: (item.stock.trackingType === 'serial' ? (item.stock.elements?.length ?? 0) : (item.stock.totalQuantity ?? 0)) + ' insgesamt',
        onClick: () => {
          void 0
        },
        name: (item.stock.trackingType === 'serial' ? (item.stock.elements?.length ?? 0) : (item.stock.totalQuantity ?? 0)) + ' insgesamt',
      }
    ],
    contextMenu: {
      options: [
        {
          id: 'duplicate',
          label: 'Duplizieren',
          onSelect: () => {
            void 0
          },
          icon: Plus,
        },
      ],
    },
  }
}

function buildBundleEntry(bundle: Bundle, searchTerm: string): EquipmentFolderStructureItem | null {
  const searchTerms = [
    normalizeSearchValue(bundle.name),
    normalizeSearchValue(bundle.path),
    ...collectBundleBarcodes(bundle),
  ].filter(Boolean)
  const children = buildBundleChildren(bundle, searchTerm)
  const matchesSelf = itemMatchesSearch(searchTerms, searchTerm)

  if (!matchesSelf && children.length === 0) {
    return null
  }

  return {
    id: bundle.id,
    path: bundle.path,
    name: bundle.name,
    displayName: bundle.name,
    searchTerms,
    children: children.length > 0 ? children : undefined,
    options: [
      {
        title: (bundle.elements?.length ?? 0) + ' insgesamt',
        onClick: () => {
          void 0
        },
        name: (bundle.elements?.length ?? 0) + ' insgesamt',
      }
    ],
    icon: Package,
    iconColor: 'text-green-400',
  }
}

function buildRentalEntry(item: RentalItem, searchTerm: string): EquipmentFolderStructureItem | null {
  const searchTerms = [
    normalizeSearchValue(item.manufacturer ?? ''),
    normalizeSearchValue(item.model),
    normalizeSearchValue(item.path),
  ].filter(Boolean)

  if (!itemMatchesSearch(searchTerms, searchTerm)) {
    return null
  }

  return {
    id: item.id,
    path: item.path,
    name: item.manufacturer ? `${item.manufacturer} ${item.model}` : item.model,
    icon: Building2,
    displayName: item.manufacturer ? `${item.manufacturer} ${item.model}` : item.model,
    searchTerms,
    options: [
      {
        title: (item.companies?.length ?? 0) + ' insgesamt',
        onClick: () => {
          void 0
        },
        name: (item.companies?.length ?? 0) + ' Anbieter',
      }
    ],
  }
}

function buildEquipmentEntries(items: Item[], bundles: Bundle[], searchTerm: string): EquipmentFolderStructureItem[] {
  return [
    ...items.map((item) => buildItemEntry(item, searchTerm)).filter((item): item is EquipmentFolderStructureItem => item !== null),
    ...bundles.map((bundle) => buildBundleEntry(bundle, searchTerm)).filter((item): item is EquipmentFolderStructureItem => item !== null),
  ]
}

function buildRentalEntries(items: RentalItem[], searchTerm: string): EquipmentFolderStructureItem[] {
  return items
    .map((item) => buildRentalEntry(item, searchTerm))
    .filter((item): item is EquipmentFolderStructureItem => item !== null)
}


function EquipmentPage() {
  const router = useRouter()
  const [displayCreateModal, setDisplayCreateModal] = useState(false)
  const [createType, setCreateType] = useState<'item' | 'bundle' | 'rentalItem' | null>(null)
  const [allItems, setAllItems] = useState<Item[]>([])
  const [allBundles, setAllBundles] = useState<Bundle[]>([])
  const [allRentalItems, setAllRentalItems] = useState<RentalItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [itemPreloadData, setItemPreloadData] = useState<Partial<Item> | null>(null)
  const view = router.query.view === 'extern' ? 'extern' : 'intern'
  const [internalFolderStructureItems, setInternalFolderStructureItems] = useState<EquipmentFolderStructureItem[]>([])
  const [allInternalFolderStructureItems, setAllInternalFolderStructureItems] = useState<EquipmentFolderStructureItem[]>([])
  const [allExternalFolderStructureItems, setAllExternalFolderStructureItems] = useState<EquipmentFolderStructureItem[]>([])
  const [externalFolderStructureItems, setExternalFolderStructureItems] = useState<EquipmentFolderStructureItem[]>([])


  const fetchData = async () => {
    try {
        const itemsResponse = await fetch('/api/equipment/items')
        const itemsData = await itemsResponse.json()
        const bundlesResponse = await fetch('/api/equipment/bundles')
        const bundlesData = await bundlesResponse.json()
        const rentalItemsResponse = await fetch('/api/equipment/rentalItems')
        const rentalItemsData = await rentalItemsResponse.json()

        const items = itemsData as Item[]
        const bundles = bundlesData as Bundle[]
        const rentalItems = rentalItemsData as RentalItem[]

        setAllItems(items)
        setAllBundles(bundles)
        setAllRentalItems(rentalItems)

        const mappedInternalItems = buildEquipmentEntries(items, bundles, searchTerm)
        const mappedRentalEntries = buildRentalEntries(rentalItems, searchTerm)

        setAllInternalFolderStructureItems(mappedInternalItems)
        setAllExternalFolderStructureItems(mappedRentalEntries)
        setInternalFolderStructureItems(mappedInternalItems)
        setExternalFolderStructureItems(mappedRentalEntries)
    } catch (error) {
        console.error('Error fetching equipment data:', error)
    }
  }

  useEffect(() => {
    const nextInternalItems = buildEquipmentEntries(allItems, allBundles, searchTerm)
    const nextExternalItems = buildRentalEntries(allRentalItems, searchTerm)

    setAllInternalFolderStructureItems(nextInternalItems)
    setAllExternalFolderStructureItems(nextExternalItems)
    setInternalFolderStructureItems(nextInternalItems)
    setExternalFolderStructureItems(nextExternalItems)
  }, [allItems, allBundles, allRentalItems, searchTerm])

  useEffect(() => {
      fetchData()
  }, [])


  const handleViewChange = (newView: typeof view) => {
      router.push({
          pathname: router.pathname,
          query: { ...router.query, view: newView }
      }, undefined, { shallow: true })
  }

  const closeCreateFlow = () => {
    setDisplayCreateModal(false)
    setCreateType(null)
    setItemPreloadData(null)
    fetchData()
  }

  const onDuplicateItem = (itemId: string) => {
    const sourceItem = allItems.find((item) => item.id === itemId)
    if (!sourceItem) {
      return
    }

    const preloadData: Partial<Item> = {
      manufacturer: sourceItem.manufacturer,
      model: sourceItem.model,
      path: sourceItem.path,
      description: sourceItem.description,
      purchasePrice: sourceItem.purchasePrice,
      dayRate: sourceItem.dayRate,
      dimensions: sourceItem.dimensions,
      weight: sourceItem.weight,
      locations: sourceItem.locations,
      versions: sourceItem.versions,
      stock: {
        trackingType: sourceItem.stock.trackingType,
      },
    }

    setItemPreloadData(preloadData)
    setCreateType('item')
    setDisplayCreateModal(true)
  }


  return (
    <ProtectedPage permission="accessEquipment" pageTitle="Equipment">
      <div>
        <div className="flex items-center justify-between mb-4">
          <PageTitle title="Equipment" icon={Package} />
            <div className="flex items-center gap-2">
              <Input
                type="text"
                placeholder="Suchen..."
                className="w-64"
                onChange={(e) => {
                  setSearchTerm(normalizeSearchValue(e.target.value))
                }}
              />
                <Button
                  onClick={() => {
                    setItemPreloadData(null)
                    setDisplayCreateModal(true)
                  }}
                  className='flex items-center gap-1'
                >
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
              <FolderStructure items={internalFolderStructureItems} expandAllFolders={searchTerm.length > 0} />
            )
            ) : (
              externalFolderStructureItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <Folders className="h-12 w-12 text-gray-400 mb-2" />
                  <p className="text-gray-400">Keine externen Equipment-Daten vorhanden.</p>
                </div>
              ) : (
              <FolderStructure items={externalFolderStructureItems} expandAllFolders={searchTerm.length > 0} />
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
          <CreateItemModal onClose={closeCreateFlow} preloadData={itemPreloadData} />
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