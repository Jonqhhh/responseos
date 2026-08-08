import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Demo() {
  const [status, setStatus] = useState('Launching demo...')

  console.log('Demo component mounted')

  useEffect(() => {
    console.log('useEffect running')

    async function loginDemo() {
      console.log('loginDemo called')
      setStatus('Setting up your demo environment...')
      await new Promise(r => setTimeout(r, 600))

      setStatus('Loading compliance data...')

      console.log('Attempting login...')
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'demo@responseos.com',
        password: 'demo1234'
      })

      console.log('Login result:', JSON.stringify({ error: error?.message, userId: data?.user?.id }))

      if (error) {
        setStatus(`Error: ${error.message}`)
        return
      }

      setStatus('Welcome to ResponseOS!')
      await new Promise(r => setTimeout(r, 500))
      window.location.replace('/')
    }

    loginDemo()
  }, [])

  return (
    <div style={{
      minHeight: '100vh', background: '#0F0A2E',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Inter, sans-serif', gap: 24
    }}>
      <img src="/logo.png" alt="ResponseOS" style={{ height: 56, objectFit: 'contain', marginBottom: 8 }} />

      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {[0, 150, 300].map(d => (
          <div key={d} style={{
            width: 8, height: 8, borderRadius: '50%', background: '#6B4EFF',
            animation: 'bounce 1.2s infinite', animationDelay: `${d}ms`
          }} />
        ))}
      </div>

      <div style={{ fontSize: 16, color: '#A1A1AA', fontWeight: 500 }}>{status}</div>

      <div style={{
        marginTop: 16, padding: '12px 24px',
        background: 'rgba(107,78,255,0.1)', borderRadius: 10,
        border: '1px solid rgba(107,78,255,0.2)',
        fontSize: 13, color: '#A78BFA', fontWeight: 500, textAlign: 'center',
        maxWidth: 340
      }}>
        You're exploring a demo with sample compliance data. No signup required.
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  )
}
