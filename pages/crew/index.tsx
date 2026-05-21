import EditCrewMemberModal from '@/components/modals/editCrewMember'
import Button from '@/components/ui/Button'
import MessageBox from '@/components/ui/MessageBox'
import Navbar from '@/components/ui/Navbar'
import Table from '@/components/ui/Table'
import PageTitle from '@/components/utility/PageTitle'
import ProtectedPage from '@/components/utility/ProtectedPage'
import { Box, Folders, House, UsersRound, Pencil, Plus, UserStar, Timer, RotateCcwKey, Lock, BriefcaseMedical, Car, HeartPulse, GraduationCap } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import licenses from '../api/crew/data/licenses'

function CrewPage() {
  interface CrewMember {
    uuid: string
    firstName: string
    lastName: string
    type: 'internal' | 'external'
    email: string
    roleUuid: string
    timeclock: any
    mustChangePassword?: boolean
    locked?: boolean
    licenses?: Array<{
      uuid: string
      type: 'firstAid' | 'driversLicense' | 'examination' | 'training' | 'other'
      name: string
      validUntil?: Date
    }>
  }

  const [members, setMembers] = useState<CrewMember[]>([])
  const [view, setView] = useState<'internal' | 'external'>('internal')
  const [loading, setLoading] = useState(true)
  const [target, setTarget] = useState<CrewMember | null>(null)
  const [displayEditModal, setDisplayEditModal] = useState(false)
  const [displayResetPasswordMessageBox, setDisplayResetPasswordMessageBox] = useState(false)
  const [displayReauthModal, setDisplayReauthModal] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [resetting, setResetting] = useState(false)
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [reauthError, setReauthError] = useState<string | null>(null)
  const [displayCopySuccess, setDisplayCopySuccess] = useState(false)

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

  async function handleSaveEdit() {
    setDisplayEditModal(false)
    setTarget(null)
    fetchCrew()
  }

  async function handleResetPassword(member: CrewMember) {
    setTarget(member)
    setDisplayResetPasswordMessageBox(true)
  }

  async function confirmResetPassword() {
    // Open re-auth modal where admin must enter their password
    setDisplayResetPasswordMessageBox(false)
    setAdminPassword('')
    setReauthError(null)
    setDisplayReauthModal(true)
  }

  async function confirmReauthAndReset() {
    if (!target) return
    setResetting(true)
    setReauthError(null)
    try {
      const res = await fetch('/api/crew/crewmember/reset?uuid=' + target.uuid, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || res.statusText || 'Reset failed')
      }
      setTempPassword(data.tempPassword)
      setDisplayReauthModal(false)
    } catch (err: any) {
      setReauthError(err?.message || 'Fehler beim Zurücksetzen')
    } finally {
      setResetting(false)
    }
  }

  function closeTempModal() {
    setTempPassword(null)
    setTarget(null)
    // refresh list so UI reflects mustChangePassword if needed
    fetchCrew()
  }

  async function copyTempPassword() {
    if (!tempPassword) return
    try { await navigator.clipboard.writeText(tempPassword) } catch {}
    setDisplayCopySuccess(true)
    setTimeout(() => setDisplayCopySuccess(false), 2000)
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
            { id: 'features', name: 'Funktionen' },
            { id: 'options', name: 'Optionen' },
          ]} data={members.filter(member => member.type === view)
          .map(member => ({
            ...member,
            options: (
              <>
                <button title='Crew-Mitglied bearbeiten' onClick={() => handleEdit(member)} className="p-1 cursor-pointer transition-all duration-200 hover:text-gray-700">
                  <Pencil size={16} />
                </button>
                <button title='Passwort zurücksetzen' onClick={() => handleResetPassword(member)} className="p-1 cursor-pointer transition-all duration-200 hover:text-gray-700">
                  <RotateCcwKey size={16} />
                </button>
              </>
            ),
            features: (
              <div className='inline-flex gap-2'>
                {member.locked ? <div title='Gesperrt'><Lock className='text-red-600' size={16} /></div> : null}
                {member.mustChangePassword ? <div title='Passwortänderung erforderlich'><RotateCcwKey className='text-yellow-500' size={16} /></div> : null}
                {member.timeclock?.enabled === true ? <div title='Zeiterfassung'><Timer size={16} /></div> : null}
                {
                  member.licenses?.map((license) => (
                    <>
                      <div>

                      </div>
                      {
                        license.type === 'firstAid' ? <div key={license.uuid} title='Erste-Hilfe-Lizenz'><BriefcaseMedical size={16} /></div> :
                        license.type === 'driversLicense' ? <div key={license.uuid} title='Führerschein'><Car size={16} /></div> :
                        license.type === 'examination' ? <div key={license.uuid} title='Prüfung'><HeartPulse size={16} /></div> :
                        license.type === 'training' ? <div key={license.uuid} title='Schulung'><GraduationCap size={16} /></div> :
                        <div key={license.uuid} title={license.name}><UserStar size={16} /></div>
                      }
                    </>
                  ))
                }
                </div>
            ),
            email: <a href={`mailto:${member.email}`} className="hover:underline">{member.email}</a>
          }))
          } />
       
      }
      {
        displayEditModal && target && (
          <EditCrewMemberModal {...target!}  onClose={() => handleSaveEdit()} />
        )
      }

      { displayResetPasswordMessageBox && (
        <MessageBox 
          title='Passwort zurücksetzen'
          icon={RotateCcwKey}
          description='Möchtest du das Passwort dieses Crew-Mitglieds zurücksetzen?'
          options={[
            { label: 'Abbrechen', type: 'primary', onClick: () => setDisplayResetPasswordMessageBox(false) },
            { label: 'Passwort zurücksetzen', type: 'danger', onClick: () => confirmResetPassword() },
          ]}
        />
      )}

      { displayReauthModal && target && (
        <Modal title='Admin-Re-Authentifizierung' icon={RotateCcwKey} onClose={() => setDisplayReauthModal(false)}>
          <div className='flex flex-col gap-4'>
            <p className='text-sm text-gray-300'>Bitte gib dein Administrator-Passwort ein, um das Passwort von <strong>{target.firstName} {target.lastName}</strong> zurückzusetzen.</p>
            <Input type='password' value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder='Dein Passwort' />
            {reauthError && <div className='text-sm text-red-400'>{reauthError}</div>}
            <div className='flex gap-2'>
              <Button onClick={() => setDisplayReauthModal(false)}>Abbrechen</Button>
              <Button onClick={() => confirmReauthAndReset()} disabled={resetting}>{resetting ? 'Bitte warten...' : 'Bestätigen'}</Button>
            </div>
          </div>
        </Modal>
      )}

      { tempPassword && target && (
        <Modal title='Temporäres Passwort' icon={RotateCcwKey} onClose={() => closeTempModal()}>
          <div className='flex flex-col gap-4'>
            <p className='text-sm text-gray-300'>Das temporäre Passwort für <strong>{target.firstName} {target.lastName}</strong> lautet (einmalig):</p>
            <div className='p-4 bg-neutral-900 rounded text-lg font-mono select-all'>{tempPassword}</div>
            <div className='flex gap-2'>
              <Button onClick={() => { copyTempPassword() }}>Kopieren</Button>
              <Button onClick={() => closeTempModal()}>Schließen</Button>
            </div>
              {displayCopySuccess && <div className='text-sm text-green-400'>In Zwischenablage kopiert!</div>}
            <p className='text-xs text-gray-500'>Hinweis: Dies wird nur einmal angezeigt. Der Benutzer wird beim nächsten Login zum Ändern des Passworts aufgefordert.</p>
          </div>
        </Modal>
      )}
    </ProtectedPage>
  )
}

export default CrewPage