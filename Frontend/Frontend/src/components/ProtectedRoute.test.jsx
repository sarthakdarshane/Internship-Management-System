import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthContext } from '../context/auth-context'
import ProtectedRoute from './ProtectedRoute'

function renderWithAuth(value) {
  return render(
    <AuthContext.Provider value={value}>
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/login" element={<div>Login page</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/protected" element={<div>Protected content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

describe('ProtectedRoute', () => {
  it('shows a loader while the auth state is loading', () => {
    renderWithAuth({ user: null, loading: true })
    expect(screen.getByText(/Loading your workspace/i)).toBeTruthy()
  })

  it('renders the protected content when authenticated', () => {
    renderWithAuth({ user: { role: 'INTERN' }, loading: false })
    expect(screen.getByText('Protected content')).toBeTruthy()
  })

  it('redirects to /login when unauthenticated', () => {
    renderWithAuth({ user: null, loading: false })
    expect(screen.getByText('Login page')).toBeTruthy()
  })
})
