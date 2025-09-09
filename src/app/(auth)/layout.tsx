import React, { ReactNode } from 'react'

const AuthLayout = ({children}: {children: ReactNode}) => {
  return (
    <main className='auth'>
        {children}    
    </main>
  )
}

export default AuthLayout