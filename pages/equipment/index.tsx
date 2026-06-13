import FolderStructure from '@/components/ui/FolderStructure'
import Navbar from '@/components/ui/Navbar'
import PageTitle from '@/components/utility/PageTitle'
import ProtectedPage from '@/components/utility/ProtectedPage'
import { Box, Folders, Package } from 'lucide-react'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'


function EquipmentPage() {
  const router = useRouter()
  const [view, setView] = useState<'intern' | 'extern'>('intern')

useEffect(() => {
        setView((router.query.view as typeof view) || 'intern')
    }, [router.query.view])
    
        const handleViewChange = (newView: typeof view) => {
            setView(newView)
            router.push({
                pathname: router.pathname,
                query: { ...router.query, view: newView }
            }, undefined, { shallow: true })
        }
  return (
    <ProtectedPage permission="accessEquipment" pageTitle="Equipment">
      <div>
        <div className="flex items-center justify-between mb-4">
          <PageTitle title="Equipment" icon={Package} />
          <Navbar items={[
            { id: 'intern', name: 'Intern', onClick: () => handleViewChange('intern'), icon: Box},
            { id: 'extern', name: 'Extern', onClick: () => handleViewChange('extern'), icon: Folders, requiredPermission: 'viewExternalEquipment'},
          ]} activeItemId={view} />
        </div>
        <div>
          <FolderStructure items={[
            { id: '1', path: 'folder1/itemA/', name: 'Item A', icon: Box },
            { id: '2', path: 'folder2/', name: 'Bundle B', icon: Package },
            { id: '3', path: '/', name: 'Item C', icon: Box },
          ]} />
        </div>
      </div>
    </ProtectedPage>
  )
}

export default EquipmentPage