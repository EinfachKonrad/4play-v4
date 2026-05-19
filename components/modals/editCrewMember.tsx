import React, { useState } from 'react'
import Modal from '../ui/Modal'
import { Pen } from 'lucide-react'
import CrewMember from '@/types/crewMember'
import Input from '../ui/Input'
import Button from '../ui/Button'
import ContentTabs from '../ui/ContentTabs'

interface EditCrewMemberModalProps extends CrewMember {
  onClose: () => void
}

const defaultTimeclock: CrewMember['timeclock'] = {
    enabled: false,
    autoGrant: 'default',
    clockEntries: [],
}

export default function EditCrewMemberModal({ onClose, ...initialMember }: EditCrewMemberModalProps) {
    const [member, setMember] = useState<CrewMember>({
        ...initialMember,
        timeclock: initialMember.timeclock ?? defaultTimeclock,
    })
    const isTimeclockEnabled = member.timeclock.enabled

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
            await res.json()
            onClose()
        } catch (error) {
            console.error('Failed to update user data:', error)
        }
    }

  return (
    <Modal title='Crew-Mitglied bearbeiten' icon={Pen} onClose={onClose}>
        <ContentTabs
            tabs={[
                {
                    id: 'general',
                    label: 'Allgemein',
                    content: (
                        <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
                            <div className='inline-flex gap-4'>
                                <div className='w-full'>
                                    <label className='text-sm text-gray-400'>Vorname</label>
                                    <Input  value={member.firstName} onChange={(e) => setMember({ ...member, firstName: e.target.value })} />
                                </div>
                                <div className='w-full'>
                                    <label className='text-sm text-gray-400'>Nachname</label>
                                    <Input value={member.lastName} onChange={(e) => setMember({ ...member, lastName: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className='text-sm text-gray-400'>Email</label>
                                <Input onChange={(e) => setMember({ ...member, email: e.target.value })} value={member.email} />
                            </div>
                            <Button type='submit'>
                                Speichern
                            </Button>
                        </form>
                    )
                },
                {
                    id: 'timeclock',
                    label: 'Zeiterfassung',
                    content: (
                        isTimeclockEnabled ? (
                            <div className='flex flex-col gap-4'>
                                <div>
                                    <label className='text-sm text-gray-400'>Aktueller Status</label>
                                </div>
                                <Button onClick={() => setMember({ ...member, timeclock: { ...member.timeclock, enabled: false } })}>
                                    Zeiterfassung deaktivieren
                                </Button>
                            </div>
                        ) : (
                            <div className='flex flex-col gap-4'>
                                <p className='text-sm text-gray-400'>Die Zeiterfassung ist derzeit deaktiviert. Möchtest du sie aktivieren?</p>
                                <Button onClick={() => setMember({ ...member, timeclock: { ...member.timeclock, enabled: true } })}>
                                    Zeiterfassung aktivieren
                                </Button>
                            </div>
                        )
                    )
                }
            ]}
        />
    </Modal>
  )
}