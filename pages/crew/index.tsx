import Navbar from '@/components/ui/Navbar'
import Table from '@/components/ui/Table'
import PageTitle from '@/components/utility/PageTitle'
import ProtectedPage from '@/components/utility/ProtectedPage'
import { Box, Folders, House, UsersRound, Pencil } from 'lucide-react'
import React, { useEffect, useState } from 'react'

function CrewPage() {
  interface CrewMember {
    uuid: string
    firstName: string
    lastName: string
    type: 'internal' | 'external'
    email: string
  }

  const [members, setMembers] = useState<CrewMember[]>([])
  const [view, setView] = useState<'internal' | 'external'>('internal')

  async function fetchCrew() {
    try {
      const response = await fetch(`/api/crew`)
      if (!response.ok) {
        throw new Error('Failed to fetch crew members')
      }
      const data = await response.json()
      setMembers(data)
    } catch (error) {
      console.error('Error fetching crew members:', error)
    }
  }

  useEffect(() => {
    fetchCrew();
  }, [])

  return (
    <ProtectedPage permission="accessCrew" pageTitle='Crew'>
      <div className="flex items-center justify-between mb-4">
        <PageTitle title="Crew" icon={UsersRound} />
        <Navbar items={[
          { id: 'internal', name: 'Intern', onClick: () => setView('internal'), icon: House},
          { id: 'external', name: 'Extern', onClick: () => setView('external'), icon: Folders, requiredPermission: 'viewExternalCrewMembers'},
        ]} activeItemId={view} />
      </div>
      {
        
          // <ul className="space-y-2">
          //   {members.map((member: any) => (
          //     (view === member.type) && (
          //     <li key={member.uuid} className="p-4 border rounded">
          //       <p className="font-medium">{member.firstName} {member.lastName}</p>
          //       <p className="text-sm text-muted-foreground">Type: {member.type}</p>
          //     </li>
          //     )
          //     ))}
          // </ul>
          <Table columns={[
            { id: 'firstName', name: 'Vorname' },
            { id: 'lastName', name: 'Nachname' },
            { id: 'email', name: 'Email', onClick: () => alert('Email clicked') },
            { id: 'options', name: 'Optionen', onClick: () => alert('Optionen clicked') },
          ]} data={members.filter(member => member.type === view)
          .map(member => ({
            ...member,
            options: (
              <button onClick={() => console.log(member.uuid)} className="p-1 hover:text-blue-600">
                <Pencil size={16} />
              </button>
            ),
          }))
          } />
       
      }
    </ProtectedPage>
  )
}

export default CrewPage