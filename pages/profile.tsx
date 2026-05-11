import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import LoadingText from '@/components/ui/LoadingText'
import MessageBox from '@/components/ui/MessageBox'
import PageTitle from '@/components/utility/PageTitle'
import useInstanceConfig from '@/hooks/useInstanceConfig'
import CrewMember from '@/types/crewMember'
import { Calendar1, LetterText, Mail, Phone, User, UserRound } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'


function profilePage() {
    const [user, setUser] = useState<CrewMember>({} as CrewMember)
    const { data: session } = useSession()
    const instanceConfig = useInstanceConfig();
    const [showMessage, setShowMessage] = useState(false)
    const [showPasswordChangeMessage, setShowPasswordChangeMessage] = useState(false)
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    async function fetchUser() {
        try {
            const res = await fetch('/api/crew/crewmember?uuid=' + session?.user?.uuid)
            if (!res.ok) {
                throw new Error(`Error fetching user: ${res.statusText}`)
            }
            const data = await res.json()
            setUser(data)
        } catch (error) {
            console.error('Failed to fetch user data:', error)
        }
    }

    useEffect(() => {
        if (session?.user?.uuid) {
            fetchUser().finally(() => setLoading(false))
        }
    }, [session?.user?.uuid])

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const res = await fetch('/api/crew/crewmember?uuid=' + session?.user?.uuid, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(user),
            })
            if (!res.ok) {
                throw new Error(`Error updating user: ${res.statusText}`)
            }
            const data = await res.json()
            setUser(data)
        } catch (error) {
            console.error('Failed to update user data:', error)
        }

        setShowMessage(true)
    }

    const onPasswordChangeSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (newPassword !== confirmPassword) {
            alert('Die neuen Passwörter stimmen nicht überein.')
            return
        }

        try {
            const res = await fetch('/api/crew/crewmember/password?uuid=' + session?.user?.uuid, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                }),
            })
            if (!res.ok) {
                const errorData = await res.json()
                throw new Error(`Error changing password: ${errorData.error || res.statusText}`)
            }
            setShowPasswordChangeMessage(true)
        } catch (error) {
            console.error('Failed to change password:', error)
        }
    }
    


  return (
    <>
        <Head>
      <title>Profil &bull; {instanceConfig?.name ?? "4play"}</title>
    </Head>
        <PageTitle title="Profil" icon={UserRound} />
        <div>
            <form className='grid grid-cols-4 gap-4' onSubmit={onSubmit}>
                <p className='col-span-4 font-bold relative top-4'>Persönliche Informationen</p>
                <div className='col-span-3 flex gap-4'>
                    <label htmlFor="firstName" className='relative top-2'><User className='relative top-1 w-5 h-5' /></label>
                    <div className='flex gap-0.5 w-full'>
                        {loading ? (
                        <LoadingText />
                    ) : (
                        <Input required value={user.firstName ?? ''} onChange={(e) => setUser({ ...user, firstName: e.target.value })} placeholder='Bernd' />
                    )}
                    {loading ? (
                        <LoadingText />
                    ) : (
                        <Input required value={user.lastName ?? ''} onChange={(e) => setUser({ ...user, lastName: e.target.value })} id="lastName" placeholder='Beispiel' />
                    )}
                    </div>
                </div>
                <div className='col-span-1 flex gap-4'>
                    <label htmlFor="dateOfBirth" className='relative top-2'><Calendar1 className='relative top-1 w-5 h-5' /></label>
                                    {loading ? (
                    <LoadingText />
                ) : (
                    <Input required value={user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : ''} onChange={(e) => setUser({ ...user, dateOfBirth: e.target.value ? new Date(e.target.value).toISOString() as any : undefined })} id="dateOfBirth" type="date" placeholder='Geburtsdatum' />
                                )}
                    </div>
                <p className='col-span-4 font-bold mt-2 relative top-4'>Kontaktdaten</p>
                <div className='col-span-2 flex gap-4'>
                    <label htmlFor="email" className='relative top-2'><Mail className='relative top-1 w-5 h-5' /></label>
                    {loading ? (
                        <LoadingText />
                    ) : (
                        <Input value={user.email ?? ''} onChange={(e) => setUser({ ...user, email: e.target.value })} id="email" placeholder='E-Mail' />
                    )}
                </div>
                <div className='col-span-2 flex gap-8'>
                    <label htmlFor="phoneAreaCode" className='relative top-2'><Phone className='relative top-1 w-5 h-5' /></label>
                    {loading ? (
                        <LoadingText />
                    ) : (
                    <div className='flex'>
                        <p className='relative top-2'>+</p>
                        <Input 
                            value={user.phone?.match(/^\+(\d{1,2})/)?.[1] ?? ''} 
                            onChange={(e) => {
                                let areaCode = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
                                const currentNumber = user.phone?.replace(/^\+\d{1,2}/, '') ?? '';
                                const fullNumber = areaCode ? `+${areaCode}${currentNumber}` : currentNumber;
                                setUser({ ...user, phone: fullNumber });
                                
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
                            value={user.phone?.replace(/^\+\d{1,2}/, '') ?? ''} 
                            onChange={(e) => {
                                const phoneNumberRegex = /^[0-9\s\-()]*$/;
                                if (e.target.value === '' || phoneNumberRegex.test(e.target.value)) {
                                    const areaCode = user.phone?.match(/^\+(\d{1,2})/)?.[1] ?? '';
                                    const fullNumber = areaCode ? `+${areaCode}${e.target.value}` : e.target.value;
                                    setUser({ ...user, phone: fullNumber });
                                }
                            }} 
                            id="phoneNumber" 
                            placeholder='0123456789'
                            className="max-w-28!"
                        />
                    </div>
                    )}
                </div>
                <Button className="text-base" type="submit">Änderungen speichern</Button>
            </form>
            <div className='mt-4'>
                <p className='font-bold mb-2'>Passwort ändern</p>
                <form onSubmit={onPasswordChangeSubmit} className='flex gap-2'>
                    <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder='Aktuelles Passwort'/>
                    <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder='Neues Passwort'/>
                    <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder='Neues Passwort wiederholen'/>
                    <Button type="submit">Passwort ändern</Button>
                </form>
            </div>
        </div>
        {showMessage && (
            <MessageBox
                title="Änderungen gespeichert"
                description="Deine Profiländerungen wurden erfolgreich gespeichert.<br>Die Änderungen werden erst angezeigt, wenn du dich das nächste Mal anmeldest."
                options={[
                    {
                        label: 'OK',
                        type: 'primary',
                        onClick: () => {
                            setShowMessage(false);
                            router.reload();
                        },
                    },
                    {
                        label: 'Jetzt abmelden',
                        type: 'danger',
                        onClick: () => {
                            setShowMessage(false);
                            signOut()
                        },
                    }
                ]}
            />
        )}

        {showPasswordChangeMessage && (
            <MessageBox
                title="Passwort geändert"
                description="Dein Passwort wurde erfolgreich geändert. Bitte melde dich erneut an."
                options={[
                    {
                        label: 'OK',
                        type: 'primary',
                        onClick: () => {
                            setShowPasswordChangeMessage(false);
                            signOut();
                        },
                    }
                ]}
            />
        )}
    </>
  )
}

export default profilePage