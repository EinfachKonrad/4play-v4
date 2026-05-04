import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'

function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const { data: session } = useSession()


    useEffect(() => {
    if (session) {
      const callbackUrl = (router.query.callbackUrl as string) || '/'
      router.push(callbackUrl)
    }
  }, [session, router])

  if (session) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: email.trim().toLowerCase(),
        password,
      })

      if (result?.error) {
        setError('Ungültige Anmeldedaten')
        setLoading(false)
        return
      }

      if (result?.ok) {
        const callbackUrl = (router.query.callbackUrl as string) || '/'
        router.push(callbackUrl)
      }
    } catch (err) {
      setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.')
      setLoading(false)
    }
  }




  return (
    <>
        <div className='m-auto text-center h-screen flex flex-col items-center justify-center'>
            <h1 className='text-2xl font-bold'>Login</h1>
            <form className='flex flex-col gap-4 mt-4' onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder='Email'
                    className='border p-2 rounded'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <input
                    type="password"
                    placeholder='Passwort'
                    className='border p-2 rounded'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button type="submit" className='text-sm rounded-md border border-gray-800 p-1 cursor-pointer transition-all duration-200 hover:bg-gray-700' disabled={loading}>
                    {loading ? 'Lädt...' : 'Login'}
                </button>
                {error && <p className='text-red-500'>{error}</p>}
            </form>
        </div>
    </>
  )
}

export default LoginPage