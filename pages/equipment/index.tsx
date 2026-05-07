import PageTitle from '@/components/utility/PageTitle'
import ProtectedPage from '@/components/utility/ProtectedPage'
import useInstanceConfig from '@/hooks/useInstanceConfig'
import { Package } from 'lucide-react'
import Head from 'next/head'
import React from 'react'

function EquipmentPage() {
  const instanceConfig = useInstanceConfig()

  return (
    <ProtectedPage permission="viewEquipment" pageTitle="Equipment">
      <PageTitle title="Equipment" icon={Package} />
    </ProtectedPage>
  )
}

export default EquipmentPage