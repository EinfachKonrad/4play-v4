import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import MessageBox from '@/components/ui/MessageBox'
import PageTitle from '@/components/utility/PageTitle'
import { Lock } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

function OnboardingSetPasswordPage() {
    const {data: session, status} = useSession()
    const router = useRouter()
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmNewPassword, setConfirmNewPassword] = useState('')
    const [showPasswordChangeMessage, setShowPasswordChangeMessage] = useState(false)
    const mustChangePassword = session?.user?.mustChangePassword === true

    useEffect(() => {
        if (status === 'loading') {
            return
        }

        if (status === 'unauthenticated') {
            router.replace('/login')
            return
        }

        if (!mustChangePassword) {
            router.replace('/profile')
        }
    }, [status, mustChangePassword, router])

    if (status === 'loading' || status === 'unauthenticated' || !mustChangePassword) {
        return null
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (newPassword !== confirmNewPassword) {
            alert('Die neuen Passwörter stimmen nicht überein')
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
            <PageTitle title="Passwort ändern" icon={Lock} />
            <div>
                <p className="text-sm text-gray-300 mb-4">Du musst dein Passwort ändern, bevor du fortfahren kannst.</p>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Aktuelles Passwort"
                    required
                />
                <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Neues Passwort"
                    required
                />
                <Input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Neues Passwort bestätigen"
                    required
                />
                <Button
                    type="submit"
                    className=""
                >
                    Passwort ändern
                </Button>
                </form>
            </div>
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

export default OnboardingSetPasswordPage