import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import SimpleLedger from './components/SimpleLedger'
import Auth from './components/Auth'
import { Toaster } from 'react-hot-toast'
import './styles/global.css'
import { authStore } from './store/auth'

const Root: React.FC = () => {
  const [email, setEmail] = useState<string | null>(authStore.getState().email)

  useEffect(() => {
    return authStore.subscribe(s => setEmail(s.email))
  }, [])

  return (
    <React.StrictMode>
      {email ? <SimpleLedger /> : <Auth />}
      <Toaster position="top-right" />
    </React.StrictMode>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<Root />)
