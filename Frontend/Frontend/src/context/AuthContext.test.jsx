import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { useContext } from 'react'
import { AuthProvider } from './AuthContext'
import { AuthContext } from './auth-context'
import { getProfile } from '../services/api'

vi.mock('../services/api', () => ({
  getProfile: vi.fn(),
}))

function TestConsumer() {
  const { user, loading, saveUser, logout } = useContext(AuthContext)
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user">{user ? user.email : 'none'}</span>
      <button onClick={() => saveUser({ user_id: 1, email: 'a@b.com' })}>
        save
      </button>
      <button onClick={() => logout()}>logout</button>
    </div>
  )
}

beforeEach(() => {
  localStorage.clear()
  getProfile.mockReset()
})

describe('AuthProvider', () => {
  it('starts unauthenticated when there is no token', () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    )
    expect(screen.getByTestId('loading').textContent).toBe('false')
    expect(screen.getByTestId('user').textContent).toBe('none')
  })

  it('saveUser stores and exposes the profile', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    )
    screen.getByText('save').click()
    await waitFor(() =>
      expect(screen.getByTestId('user').textContent).toBe('a@b.com'),
    )
    expect(JSON.parse(localStorage.getItem('user')).email).toBe('a@b.com')
  })

  it('logout clears the stored user and token', async () => {
    localStorage.setItem('user', JSON.stringify({ user_id: 1, email: 'a@b.com' }))
    localStorage.setItem('token', 'tok')
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    )
    screen.getByText('logout').click()
    await waitFor(() =>
      expect(screen.getByTestId('user').textContent).toBe('none'),
    )
    expect(localStorage.getItem('user')).toBeNull()
    expect(localStorage.getItem('token')).toBeNull()
  })

  it('fetches the profile when a token exists but no user is cached', async () => {
    localStorage.setItem('token', 'tok')
    getProfile.mockResolvedValue({
      data: { user: { user_id: 1, email: 'fetched@b.com', role: 'INTERN' } },
    })
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    )
    await waitFor(() =>
      expect(screen.getByTestId('user').textContent).toBe('fetched@b.com'),
    )
    expect(screen.getByTestId('loading').textContent).toBe('false')
  })
})
