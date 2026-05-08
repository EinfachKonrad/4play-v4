import FolderStructure from '@/components/ui/FolderStructure'
import Navbar from '@/components/ui/Navbar'
import PageTitle from '@/components/utility/PageTitle'
import ProtectedPage from '@/components/utility/ProtectedPage'
import { Box, Folders, Package } from 'lucide-react'
import { useState } from 'react'


function EquipmentPage() {
  const [view, setView] = useState<'intern' | 'extern'>('intern')

  return (
    <ProtectedPage permission="viewEquipment" pageTitle="Equipment">
      <div>
        <div className="flex items-center justify-between mb-4">
          <PageTitle title="Equipment" icon={Package} />
          <Navbar items={[
            { id: 'intern', name: 'Intern', onClick: () => setView('intern'), icon: Box},
            { id: 'extern', name: 'Extern', onClick: () => setView('extern'), icon: Folders},
          ]} activeItemId={view} />
        </div>
        <div>
          <FolderStructure items={[
            { uuid: '1', path: '/folder1/itemA/', name: 'Item A', icon: Box },
            { uuid: '2', path: '/folder2/', name: 'Bundle B', icon: Package }
          ]} />
        </div>
      </div>
    </ProtectedPage>
  )
}

export default EquipmentPage