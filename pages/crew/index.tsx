import Navbar from '@/components/ui/Navbar'
import PageTitle from '@/components/utility/PageTitle'
import ProtectedPage from '@/components/utility/ProtectedPage'
import { Box, Folders, House, UsersRound } from 'lucide-react'
import React, { useEffect, useState } from 'react'

function CrewPage() {
  const [members, setMembers] = useState([])
  const [view, setView] = useState<'intern' | 'extern'>('intern')

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
          { id: 'intern', name: 'Intern', onClick: () => setView('intern'), icon: House},
          { id: 'extern', name: 'Extern', onClick: () => setView('extern'), icon: Folders, requiredPermission: 'viewExternalCrewMembers'},
        ]} activeItemId={view} />
      </div>
      {
        
          <ul className="space-y-2">
            {members.map((member: any) => (
              <li key={member.uuid} className="p-4 border rounded">
                <p className="font-medium">{member.firstName} {member.lastName}</p>
                <p className="text-sm text-muted-foreground">Type: {member.type}</p>
              </li>
            ))}
          </ul>
       
      }
    </ProtectedPage>
  )
}

export default CrewPage