import React, { useEffect, useRef, useState } from 'react'
import Modal from '../ui/Modal'
import { UserPlus2, X } from 'lucide-react'
import Input from '../ui/Input'
import Dropdown from '../ui/Dropdown'
import Button from '../ui/Button'
import { v4 as uuidv4 } from 'uuid'
import CrewMember from '@/types/crewMember'

interface CreateCrewMemberModalProps {
    onClose: () => void
}

const defaultTimeclock: CrewMember['timeclock'] = {
    enabled: false,
    autoGrant: 'default',
    clockEntries: [],
}

export default function CreateCrewMemberModal({ onClose }: CreateCrewMemberModalProps) {
    const [saving, setSaving] = useState(false)
    const [member, setMember] = useState<Pick<CrewMember, 'type' | 'firstName' | 'lastName' | 'dateOfBirth' | 'email' | 'phone' | 'skillTags'>>({
        type: 'internal',
        firstName: '',
        lastName: '',
        dateOfBirth: undefined,
        email: '',
        phone: '',
        skillTags: [],
    })
    const [skillInput, setSkillInput] = useState('')
    const [skillSuggestions, setSkillSuggestions] = useState<string[]>([])
    const skillFetchTimeout = useRef<number | null>(null)

    const fetchSkillSuggestions = async (query?: string) => {
        try {
            const q = query ? `?q=${encodeURIComponent(query)}` : ''
            const res = await fetch(`/api/crew/data/skills${q}`)
            if (!res.ok) return []
            const data: string[] = await res.json()
            return data
        } catch {
            return []
        }
    }

    useEffect(() => {
        if (skillFetchTimeout.current) {
            window.clearTimeout(skillFetchTimeout.current)
        }

        if (!skillInput) {
            setSkillSuggestions([])
            return
        }

        skillFetchTimeout.current = window.setTimeout(async () => {
            const data = await fetchSkillSuggestions(skillInput)
            setSkillSuggestions(data.filter(s => !(member.skillTags ?? []).includes(s)))
        }, 250)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [skillInput, member.skillTags])

    const addSkill = (raw: string) => {
        const value = raw.trim()
        if (!value) return

        const currentTags = member.skillTags ?? []
        if (currentTags.includes(value)) return

        setMember({ ...member, skillTags: [...currentTags, value] })
        setSkillInput('')
        setSkillSuggestions(prev => prev.filter(s => s !== value))
    }

    const removeSkill = (tag: string) => {
        setMember({
            ...member,
            skillTags: (member.skillTags ?? []).filter(s => s !== tag),
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            const newCrewMember: Partial<CrewMember> = {
                ...member,
                uid: uuidv4(),
                roleUid: 'crew',
                timeclock: defaultTimeclock,
                licenses: [],
                calendarSubscriptions: [],
                mustChangePassword: true,
                locked: false,
            }

            const response = await fetch('/api/crew', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newCrewMember),
            })

            if (!response.ok) {
                throw new Error('Fehler beim Erstellen des Crew-Mitglieds')
            }

            onClose()
        } catch (error) {
            console.error(error)
        } finally {
            setSaving(false)
        }
    }

    return (
        <Modal title='Neues Crewmitglied erstellen' onClose={onClose} icon={UserPlus2}>
            <form className='flex flex-col gap-4' onSubmit={handleSubmit}>
                <div className='inline-flex gap-4 w-full'>
                    <div className='w-full'>
                        <label className='text-sm text-gray-400'>Vorname</label>
                        <Input required value={member.firstName ?? ''} onChange={(e) => setMember({ ...member, firstName: e.target.value })} />
                    </div>
                    <div className='w-full'>
                        <label className='text-sm text-gray-400'>Nachname</label>
                        <Input required value={member.lastName ?? ''} onChange={(e) => setMember({ ...member, lastName: e.target.value })} />
                    </div>
                    <div>
                        <label className='text-sm text-gray-400'>Geburtsdatum</label>
                        <Input required value={member.dateOfBirth ? new Date(member.dateOfBirth).toISOString().split('T')[0] : ''} onChange={(e) => setMember({ ...member, dateOfBirth: e.target.value ? new Date(e.target.value).toISOString() as any : undefined })} id='dateOfBirth' type='date' placeholder='Geburtsdatum' />
                    </div>
                    <div className='w-full'>
                        <label className='text-sm text-gray-400'>Interne/Externe Person</label>
                        <Dropdown
                            placeholder='Interne/Externe Person'
                            options={[
                                { label: 'Intern', value: 'internal' },
                                { label: 'Extern', value: 'external' },
                            ]}
                            value={member.type}
                            onSelect={(value) => setMember({ ...member, type: value as 'internal' | 'external' })}
                        />
                    </div>
                </div>
                <div className='inline-flex w-full gap-4'>
                    <div className='w-[12rem]'>
                        <label className='text-sm text-gray-400'>Telefonnummer</label>
                        <div className='ml-2 flex'>
                            <p className='relative top-2'>+</p>
                            <Input
                                value={member.phone?.match(/^\+(\d{1,2})/)?.[1] ?? ''}
                                onChange={(e) => {
                                    const areaCode = e.target.value.replace(/[^0-9]/g, '').slice(0, 2)
                                    const currentNumber = member.phone?.replace(/^\+\d{1,2}/, '') ?? ''
                                    const fullNumber = areaCode ? `+${areaCode}${currentNumber}` : currentNumber
                                    setMember({ ...member, phone: fullNumber })

                                    if (areaCode.length === 2) {
                                        const phoneNumberInput = document.getElementById('phoneNumber') as HTMLInputElement
                                        phoneNumberInput?.focus()
                                    }
                                }}
                                id='phoneAreaCode'
                                placeholder='49'
                                maxLength={2}
                                className='w-6!'
                            />
                            <Input
                                value={member.phone?.replace(/^\+\d{1,2}/, '') ?? ''}
                                onChange={(e) => {
                                    const phoneNumberRegex = /^[0-9\s\-()]*$/
                                    if (e.target.value === '' || phoneNumberRegex.test(e.target.value)) {
                                        const areaCode = member.phone?.match(/^\+(\d{1,2})/)?.[1] ?? ''
                                        const fullNumber = areaCode ? `+${areaCode}${e.target.value}` : e.target.value
                                        setMember({ ...member, phone: fullNumber })
                                    }
                                }}
                                id='phoneNumber'
                                placeholder='0123456789'
                                className='max-w-28! mr-0 w-full'
                            />
                        </div>
                    </div>
                    <div className='w-full'>
                        <label className='text-sm text-gray-400'>Email</label>
                        <Input required type='email' onChange={(e) => setMember({ ...member, email: e.target.value })} value={member.email ?? ''} />
                    </div>
                </div>
                <div className='mt-12'>
                    <label className='text-sm text-gray-400'>Fähigkeiten</label>
                    <div>
                        <div className='flex flex-wrap gap-2'>
                            {(member.skillTags ?? []).map(tag => (
                                <div key={tag} className='flex items-center gap-2 px-2 py-1 rounded-md border border-gray-300'>
                                    <span className='text-sm'>{tag}</span>
                                    <button type='button' onClick={() => removeSkill(tag)} className='text-sm text-red-500 cursor-pointer' aria-label={`Entferne ${tag}`}>
                                        <X className='h-3 w-3' />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className='relative'>
                            <Input
                                value={skillInput}
                                onChange={(e) => setSkillInput(e.target.value.replace(/,/g, ''))}
                                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault()
                                        addSkill(skillInput)
                                    }
                                    if (e.key === ',') {
                                        e.preventDefault()
                                        addSkill(skillInput)
                                    }
                                }}
                                placeholder='Neuen Skill eingeben und Enter drücken'
                            />
                            {skillSuggestions.length > 0 && (
                                <div className='absolute z-20 left-0 right-0 bg-neutral-900 border border-neutral-700 mt-1 rounded-md max-h-40 overflow-auto'>
                                    {skillSuggestions.map(s => (
                                        <div key={s} className='px-3 py-2 hover:bg-neutral-800 cursor-pointer' onMouseDown={(ev) => { ev.preventDefault(); addSkill(s) }}>
                                            {s}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <Button type='submit' disabled={saving}>{saving ? 'Speichern...' : 'Crewmitglied erstellen'}</Button>
            </form>
        </Modal>
    )
}
