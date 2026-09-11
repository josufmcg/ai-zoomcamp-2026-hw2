import { beforeEach, describe, expect, it, vi } from 'vitest'
import { addMember, createGroup, getBalances } from './backendApi'

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('backend API client', () => {
  it('creates groups through the FastAPI endpoint', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ groupId: 'group-1', name: 'Trip' }), { status: 201 }),
    ))

    await createGroup('Trip')

    expect(fetch).toHaveBeenCalledWith('/api/groups', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ name: 'Trip' }),
    }))
  })

  it('normalizes the updated group response when joining', async () => {
    const group = { groupId: 'group-1', members: [{ memberId: 'member-1', displayName: 'Alex' }] }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify(group), { status: 201 }),
    ))

    await expect(addMember('group-1', 'Alex')).resolves.toEqual({ group, member: group.members[0] })
  })

  it('returns backend validation messages', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: 'Group not found' }), { status: 404 }),
    ))

    await expect(getBalances('missing')).rejects.toThrow('Group not found')
  })
})