import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import useInstanceConfig from '@/hooks/useInstanceConfig'
import { signIn, useSession } from 'next-auth/react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'

function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const { data: session } = useSession()
    const instanceConfig = useInstanceConfig()

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
    <Head>
        <title>Login &bull; {instanceConfig?.name ?? "4play"}</title>
    </Head>
        <div className='m-auto text-center h-full flex flex-col items-center justify-center'>
          <h1 className='text-3xl font-bold mb-2'>{instanceConfig?.name ?? "4play"}</h1>
            <h2 className='text-2xl font-bold'>Login</h2>
            <form className='flex flex-col gap-4 mt-4' onSubmit={handleSubmit}>
                <Input
                    type="text"
                    placeholder='Email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <Input
                    type="password"
                    placeholder='Passwort'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <Button type="submit" className='m-2 w-full' disabled={loading}>
                    {loading ? 'Lädt...' : 'Login'}
                </Button>
                {error && <p className='text-red-500'>{error}</p>}
            </form>
        </div>
    </>
  )
}

export default LoginPage