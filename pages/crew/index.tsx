import EditCrewMemberModal from '@/components/modals/editCrewMember'
import Button from '@/components/ui/Button'
import Navbar from '@/components/ui/Navbar'
import Table from '@/components/ui/Table'
import PageTitle from '@/components/utility/PageTitle'
import ProtectedPage from '@/components/utility/ProtectedPage'
import { Box, Folders, House, UsersRound, Pencil, Plus, UserStar } from 'lucide-react'
import React, { useEffect, useState } from 'react'

function CrewPage() {
  interface CrewMember {
    uuid: string
    firstName: string
    lastName: string
    type: 'internal' | 'external'
    email: string
    roleUuid: string
    timeclock: any
  }

  const [members, setMembers] = useState<CrewMember[]>([])
  const [view, setView] = useState<'internal' | 'external'>('internal')
  const [loading, setLoading] = useState(true)
  const [target, setTarget] = useState<CrewMember | null>(null)
  const [displayEditModal, setDisplayEditModal] = useState(false)

  async function fetchCrew() {
    try {
      const response = await fetch(`/api/crew`)
      if (!response.ok) {
        throw new Error('Failed to fetch crew members')
      }
      const data = await response.json()
      setMembers(data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching crew members:', error)
    }
  }

  useEffect(() => {
    fetchCrew();
  }, [])

  async function handleEdit(member: CrewMember) {
    setTarget(member)
    setDisplayEditModal(true)
  }


  async function sortByFirstName() {
    const sorted = [...members].sort((a, b) => a.firstName.localeCompare(b.firstName))
    setMembers(sorted)
  }

  async function sortByLastName() {
    const sorted = [...members].sort((a, b) => a.lastName.localeCompare(b.lastName))
    setMembers(sorted)
  }

  return (
    <ProtectedPage permission="accessCrew" pageTitle='Crew'>
      <div className="flex items-center justify-between mb-4">
        <PageTitle title="Crew" icon={UsersRound} />
        <div className="flex items-center gap-2">
            <Button>
              <Plus className='inline h-4 w-4' />
              <span className='!p-0'>Neu</span>
            </Button>
        <Navbar items={[
          { id: 'internal', name: 'Intern', onClick: () => setView('internal'), icon: House},
          { id: 'external', name: 'Extern', onClick: () => setView('external'), icon: Folders, requiredPermission: 'viewExternalCrewMembers'},
        ]} activeItemId={view} />
        </div>
      </div>
      {
          <Table columns={[
            { id: 'firstName', name: 'Vorname', sortable: true },
            { id: 'lastName', name: 'Nachname', sortable: true },
            { id: 'email', name: 'Email', sortable: true },
            { id: 'options', name: 'Optionen' },
          ]} data={members.filter(member => member.type === view)
          .map(member => ({
            ...member,
            options: (
              <button onClick={() => handleEdit(member)} className="p-1 cursor-pointer transition-all duration-200 hover:text-gray-700">
                <Pencil size={16} />
              </button>
            ),
          }))
          } />
       
      }
      {
        displayEditModal && target && (
          <EditCrewMemberModal {...target!}  onClose={() => setDisplayEditModal(false)} />
        )
      }
    </ProtectedPage>
  )
}

export default CrewPage