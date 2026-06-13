import React, { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import Modal from '../ui/Modal'
import { Pen, X } from 'lucide-react'
import CrewMember from '@/types/crewMember'
import Input from '../ui/Input'
import Button from '../ui/Button'
import ContentTabs from '../ui/ContentTabs'
import { v4 as uuidv4 } from 'uuid'
import Dropdown from '../ui/Dropdown'

const licenseOptions = [
    { label: 'Erste Hilfe', value: 'firstAid' },
    { label: 'Führerschein', value: 'driversLicense' },
    { label: 'Medizinische Untersuchung', value: 'examination' },
    { label: 'Ausbildung', value: 'training' },
]

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
    const [suggestionsByType, setSuggestionsByType] = useState<Record<string, string[]>>({})
    const [skillInput, setSkillInput] = useState('')
    const [skillSuggestions, setSkillSuggestions] = useState<string[]>([])
    const skillFetchTimeout = useRef<number | null>(null)
    const { data: session } = useSession()
    const [roles, setRoles] = useState<Array<{ uid: string; name: string }>>([])

    const fetchLicenseNames = async (type?: string) => {
        if (!type) return []
        if (suggestionsByType[type]) return suggestionsByType[type]
        try {
            const res = await fetch(`/api/crew/data/licenses?type=${encodeURIComponent(type)}`)
            if (!res.ok) return []
            const data: string[] = await res.json()
            setSuggestionsByType(prev => ({ ...prev, [type]: data }))
            return data
        } catch (err) {
            return []
        }
    }

    useEffect(() => {
        // preload suggestions for existing licenses
        member.licenses?.forEach(l => {
            if (l.type) fetchLicenseNames(l.type)
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const res = await fetch('/api/crew/roles')
                if (!res.ok) return
                const data = await res.json()
                setRoles(data)
            } catch (err) {
                // ignore
            }
        }
        fetchRoles()
    }, [])

    const fetchSkillSuggestions = async (query?: string) => {
        try {
            const q = query ? `?q=${encodeURIComponent(query)}` : ''
            const res = await fetch(`/api/crew/data/skills${q}`)
            if (!res.ok) return []
            const data: string[] = await res.json()
            return data
        } catch (err) {
            return []
        }
    }

    useEffect(() => {
        if (skillFetchTimeout.current) window.clearTimeout(skillFetchTimeout.current)
        if (!skillInput) {
            setSkillSuggestions([])
            return
        }
        // debounce
        skillFetchTimeout.current = window.setTimeout(async () => {
            const data = await fetchSkillSuggestions(skillInput)
            setSkillSuggestions(data.filter(s => !(member.skillTags ?? []).includes(s)))
        }, 250)
        // cleanup handled by next effect run
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [skillInput])

    const addSkill = (raw: string) => {
        const v = raw.trim()
        if (!v) return
        const existing = member.skillTags ?? []
        if (existing.includes(v)) return
        const updated = [...existing, v]
        setMember({ ...member, skillTags: updated })
        setSkillInput('')
        setSkillSuggestions(prev => prev.filter(s => s !== v))
    }

    const removeSkill = (tag: string) => {
        const updated = (member.skillTags ?? []).filter(s => s !== tag)
        setMember({ ...member, skillTags: updated })
    }


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const payload = { ...member }
            const res = await fetch('/api/crew/crewmember?uid=' + member.uid, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
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
        <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
            <ContentTabs
                tabs={(() => {
                    const baseTabs = [
                    {
                        id: 'general',
                        label: 'Allgemein',
                        content: (
                            <>
                                <div className='inline-flex gap-4 w-full'>
                                    <div className='w-full'>
                                        <label className='text-sm text-gray-400'>Vorname</label>
                                        <Input  value={member.firstName ?? ''} onChange={(e) => setMember({ ...member, firstName: e.target.value })} />
                                    </div>
                                    <div className='w-full'>
                                        <label className='text-sm text-gray-400'>Nachname</label>
                                        <Input value={member.lastName ?? ''} onChange={(e) => setMember({ ...member, lastName: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className='text-sm text-gray-400'>Geburtsdatum</label>
                                        <Input required value={member.dateOfBirth ? new Date(member.dateOfBirth).toISOString().split('T')[0] : ''} onChange={(e) => setMember({ ...member, dateOfBirth: e.target.value ? new Date(e.target.value).toISOString() as any : undefined })} id="dateOfBirth" type="date" placeholder='Geburtsdatum' />
                                    </div>
                                    <div className='w-full'>
                                        <label className='text-sm text-gray-400'>Interne/Externe Person</label>
                                        <Dropdown
                                            placeholder="Interne/Externe Person"
                                            options={[
                                                { label: 'Intern', value: 'internal' },
                                                { label: 'Extern', value: 'external' },
                                            ]}
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
                                                    let areaCode = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
                                                    const currentNumber = member.phone?.replace(/^\+\d{1,2}/, '') ?? '';
                                                    const fullNumber = areaCode ? `+${areaCode}${currentNumber}` : currentNumber;
                                                    setMember({ ...member, phone: fullNumber });
                                                    
                                                    if (areaCode.length === 2) {
                                                        const phoneNumberInput = document.getElementById('phoneNumber') as HTMLInputElement;
                                                        phoneNumberInput?.focus();
                                                    }
                                                }} 
                                                id="phoneAreaCode" 
                                                placeholder='49' 
                                                maxLength={2}
                                                className="w-6!"
                                            />
                                            <Input 
                                                value={member.phone?.replace(/^\+\d{1,2}/, '') ?? ''} 
                                                onChange={(e) => {
                                                    const phoneNumberRegex = /^[0-9\s\-()]*$/;
                                                    if (e.target.value === '' || phoneNumberRegex.test(e.target.value)) {
                                                        const areaCode = member.phone?.match(/^\+(\d{1,2})/)?.[1] ?? '';
                                                        const fullNumber = areaCode ? `+${areaCode}${e.target.value}` : e.target.value;
                                                        setMember({ ...member, phone: fullNumber });
                                                    }
                                                }} 
                                                id="phoneNumber" 
                                                placeholder='0123456789'
                                                className="max-w-28! mr-0 w-full"
                                            />
                                        </div>
                                    </div>
                                    <div className='w-full'>
                                        <label className='text-sm text-gray-400'>Email</label>
                                        <Input onChange={(e) => setMember({ ...member, email: e.target.value })} value={member.email ?? ''} />
                                    </div>
                                </div>
                                <div className='mt-12'>
                                    <label className='text-sm text-gray-400'>Fähigkeiten</label>
                                    <div className=''>
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
                            </>
                        )
                    },
                    {
                        id: 'licenses',
                        label: 'Lizenzen',
                        content: (
                            <div className='flex flex-col gap-4'>
                                <p className='text-sm text-gray-400'>Hier kannst du die Lizenzen dieses Crew-Mitglieds verwalten.</p>
                                <div className='flex flex-col gap-2'>
                                    {
                                       member.licenses?.map((license, index) => (
                                            <div key={license.uid} className='flex gap-2'>
                                                <div className='w-full'>
                                                    <label className='text-sm text-gray-400'>Art der Lizenz</label>
                                                    <Dropdown
                                                        placeholder='Art der Lizenz'
                                                        options={licenseOptions}
                                                        onSelect={(value) => {
                                                            const updatedLicenses = [...(member.licenses ?? [])];
                                                            const typedValue = value as 'firstAid' | 'driversLicense' | 'examination' | 'training' | 'other';
                                                            updatedLicenses[index] = { ...updatedLicenses[index], type: typedValue };
                                                            setMember({ ...member, licenses: updatedLicenses });
                                                            fetchLicenseNames(typedValue)
                                                        }
                                                        }
                                                    />
                                                </div>
                                                <div className='w-full'>
                                                    <label className='text-sm text-gray-400'>Name der Lizenz</label>
                                                    <Dropdown
                                                        options={(license.type ? (suggestionsByType[license.type] ?? []) : []).map(s => ({ label: s, value: s }))}
                                                        searchable={true}
                                                        value={license.name ?? ''}
                                                        onInputChange={(v) => {
                                                            const updatedLicenses = [...(member.licenses ?? [])];
                                                            updatedLicenses[index] = { ...updatedLicenses[index], name: v };
                                                            setMember({ ...member, licenses: updatedLicenses });
                                                        }}
                                                        onSelect={(value) => {
                                                            const updatedLicenses = [...(member.licenses ?? [])];
                                                            updatedLicenses[index] = { ...updatedLicenses[index], name: value };
                                                            setMember({ ...member, licenses: updatedLicenses });
                                                        }}
                                                        allowCustom={true}
                                                        placeholder='Klasse B'
                                                    />
                                                </div>
                                                <div className='w-full'>
                                                    <label className='text-sm text-gray-400'>Gültig bis</label>
                                                    <Input type='date' value={license.validUntil ? new Date(license.validUntil).toISOString().split('T')[0] : ''} onChange={(e) => {
                                                        const updatedLicenses = [...(member.licenses ?? [])];
                                                        updatedLicenses[index] = { ...updatedLicenses[index], validUntil: e.target.value ? new Date(e.target.value).toISOString() as any : undefined };
                                                        setMember({ ...member, licenses: updatedLicenses });
                                                    }} placeholder='Gültig bis'
                                                    />
                                                 </div>
                                                {/* <Button onClick={() => {
                                                    const updatedLicenses = member.licenses?.filter((_, i) => i !== index) ?? [];
                                                    setMember({ ...member, licenses: updatedLicenses });
                                                }} className='bg-red-600 hover:bg-red-700'>
                                                    Löschen
                                                </Button> */}
                                            </div>
                                        )) 
                                    }
                                    <Button onClick={() => {    
                                        const newLicense = {
                                            uid: uuidv4(),
                                            type: 'other' as const,
                                            name: '',
                                            validUntil: undefined,
                                        }
                                        setMember({ ...member, licenses: [...(member.licenses ?? []), newLicense] })
                                    }} className='bg-green-600 hover:bg-green-700 self-start'>
                                        Lizenz hinzufügen
                                    </Button>
                                </div> 
                            </div>
                        )
                    },
                    {
                        id: 'timeclock',
                        label: 'Zeiterfassung',
                        content: (
                            member.timeclock?.enabled ? (
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
                                    <p className='text-sm text-gray-400'>Die Zeiterfassung für dieses Konto ist derzeit deaktiviert. Zeiterfassung aktivieren?</p>
                                    <Button onClick={() => setMember({ ...member, timeclock: { ...member.timeclock, enabled: true } })}>
                                        Zeiterfassung aktivieren
                                    </Button>
                                </div>
                            )
                        )
                    },
                    ]

                    if (session?.user?.uid !== member.uid) {
                        const selectedRoleName = roles.find(r => r.uid === member.roleUid)?.name ?? ''
                        const roleTab = {
                            id: 'role',
                            label: 'Rolle & Berechtigungen',
                            content: (
                                <div className='flex flex-col gap-4'>
                                    <p className='text-sm text-gray-400'>Hier kannst du die Rolle dieses Crew-Mitglieds verwalten, um dessen Berechtigungen im System zu steuern.</p>
                                    <Dropdown
                                        placeholder='Rolle wählen'
                                        options={roles.map(r => ({ label: r.name, value: r.uid }))}
                                        value={selectedRoleName}
                                        onSelect={(value) => setMember({ ...member, roleUid: value })}
                                    />
                                </div>
                            )
                        }

                        baseTabs.push(roleTab)
                    }

                    if (session?.user?.uid !== member.uid) {
                        const dangerTab = {
                            id: 'danger',
                            label: 'Löschen & Sperren',
                            content: (
                                <div className='flex flex-col gap-4'>
                                    <p className='text-sm text-gray-400'>Hier kannst du dieses Crew-Mitglied sperren oder löschen. Gesperrte Mitglieder können sich nicht mehr anmelden, bleiben aber in der Datenbank erhalten. Gelöschte Mitglieder werden dauerhaft entfernt.</p>
                                    {
                                        member.locked ? (
                                            <Button onClick={() => setMember({ ...member, locked: false })} className='bg-green-600 hover:bg-green-700'>
                                                Konto entsperren
                                            </Button>
                                        ) : (
                                           <Button onClick={() => setMember({ ...member, locked: true })} className='bg-yellow-600 hover:bg-yellow-700'>
                                                Konto sperren
                                            </Button>
                                        )
                                    }
                                </div>
                            )
                        }

                        baseTabs.push(dangerTab)
                    }

                    return baseTabs
                })()}
            />
            <Button type='submit'>
                Speichern
            </Button>
        </form>
    </Modal>
  )
}