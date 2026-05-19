import React, { useState } from 'react'
import Modal from '../ui/Modal'
import { Pen } from 'lucide-react'
import CrewMember from '@/types/crewMember'
import Input from '../ui/Input'
import Button from '../ui/Button'

interface EditCrewMemberModalProps extends CrewMember {
  onClose: () => void
}

export default function EditCrewMemberModal({ onClose, ...initialMember }: EditCrewMemberModalProps) {
  const [member, setMember] = useState(initialMember)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const res = await fetch('/api/crew/crewmember?uuid=' + member.uuid, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(member),
            })
            if (!res.ok) {
                throw new Error(`Error updating user: ${res.statusText}`)
            }
            const data = await res.json()
            onClose()
        } catch (error) {
            console.error('Failed to update user data:', error)
        }
    }

  return (
    <Modal title='Crew-Mitglied bearbeiten' icon={Pen} onClose={onClose}>
        <form onSubmit={handleSubmit}>
            <div>
                <label className='text-sm text-gray-400'>Vorname</label>
                <Input  value={member.firstName} onChange={(e) => setMember({ ...member, firstName: e.target.value })} />
            </div>
            <div>
                <label className='text-sm text-gray-400'>Nachname</label>
                <Input value={member.lastName} onChange={(e) => setMember({ ...member, lastName: e.target.value })} />
            </div>
            <div>
                <label className='text-sm text-gray-400'>Email</label>
                <Input onChange={(e) => setMember({ ...member, email: e.target.value })} value={member.email} />
            </div>
            <Button type='submit'>
                Speichern
            </Button>
        </form>
    </Modal>
  )
}