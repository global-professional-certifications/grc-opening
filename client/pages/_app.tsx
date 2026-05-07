import '../styles/globals.css'
import '../modules/resume-analyser/resume-analyser.css'
import type { AppProps } from 'next/app'
import { useState, useEffect } from 'react'
import { UserProvider } from '../contexts/UserContext'
import { DashboardThemeProvider } from '../contexts/DashboardThemeContext'
import { ClerkProvider, useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/router'
import { registerTokenGetter } from '../lib/api'
import { EmployerJobsProvider } from '../contexts/EmployerJobsContext';

// Sits inside ClerkProvider so useAuth() is available.
// Registers Clerk's getToken so every apiFetch call gets a fresh JWT
// instead of the stale copy in localStorage (Clerk tokens expire in ~60 s).
function ClerkTokenRegistrar() {
  const { getToken } = useAuth()
  useEffect(() => {
    registerTokenGetter(getToken)
  }, [getToken])
  return null
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      {/* ClerkTokenRegistrar disabled — using local JWT auth. Re-enable when Clerk is re-integrated. */}
      {/* <ClerkTokenRegistrar /> */}
      <UserProvider>
        <DashboardThemeProvider>
            <Component {...pageProps} />
        </DashboardThemeProvider>
      </UserProvider>
    </ClerkProvider>
  )
}
