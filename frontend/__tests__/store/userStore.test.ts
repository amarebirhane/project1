import { useUserStore, type StoreUser } from '@/store/userStore'

describe('UserStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useUserStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      subordinates: [],
      allUsers: [],
    })
  })

  it('initializes with correct default state', () => {
    const state = useUserStore.getState()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
    expect(state.isLoading).toBe(false)
    expect(state.error).toBeNull()
    expect(state.subordinates).toEqual([])
    expect(state.allUsers).toEqual([])
  })

  it('can set user state', () => {
    const testUser: StoreUser = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'admin',
      isActive: true,
    }
    
    useUserStore.setState({ user: testUser, isAuthenticated: true })
    const state = useUserStore.getState()
    expect(state.user).toEqual(testUser)
    expect(state.isAuthenticated).toBe(true)
  })

  it('can set loading state', () => {
    useUserStore.setState({ isLoading: true })
    const state = useUserStore.getState()
    expect(state.isLoading).toBe(true)
  })

  it('can set error state', () => {
    useUserStore.setState({ error: 'An error occurred' })
    const state = useUserStore.getState()
    expect(state.error).toBe('An error occurred')
  })

  it('can set subordinates', () => {
    const subordinates: StoreUser[] = [
      {
        id: '2',
        name: 'Subordinate 1',
        email: 'sub1@example.com',
        role: 'employee',
        isActive: true,
      },
    ]
    useUserStore.setState({ subordinates })
    const state = useUserStore.getState()
    expect(state.subordinates).toEqual(subordinates)
  })

  it('can set allUsers', () => {
    const allUsers: StoreUser[] = [
      {
        id: '1',
        name: 'User 1',
        email: 'user1@example.com',
        role: 'admin',
        isActive: true,
      },
    ]
    useUserStore.setState({ allUsers })
    const state = useUserStore.getState()
    expect(state.allUsers).toEqual(allUsers)
  })
})

