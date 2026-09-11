import { beforeEach, describe, expect, it } from 'vitest'
import { addExpense, addMember, createGroup, getBalances } from './mockApi'

const storage = new Map()
globalThis.localStorage = {
  getItem: (key) => storage.get(key) || null,
  setItem: (key, value) => storage.set(key, value),
  clear: () => storage.clear(),
}

beforeEach(() => localStorage.clear())

describe('mock expense API', () => {
  it('calculates balances using selected split members', async () => {
    const group = await createGroup('Weekend away')
    const alex = await addMember(group.groupId, 'Alex')
    const sam = await addMember(group.groupId, 'Sam')
    await addExpense(group.groupId, { title: 'Dinner', amount: '60.00', date: '2026-09-11', paidByMemberId: alex.member.memberId, splitForMemberIds: [alex.member.memberId, sam.member.memberId] })
    expect(await getBalances(group.groupId)).toEqual({ [alex.member.memberId]: 30, [sam.member.memberId]: -30 })
  })

  it('rejects expenses without split coverage', async () => {
    const group = await createGroup('One thing')
    const alex = await addMember(group.groupId, 'Alex')
    await expect(addExpense(group.groupId, { title: 'Coffee', amount: '4.50', date: '2026-09-11', paidByMemberId: alex.member.memberId, splitForMemberIds: [] })).rejects.toThrow()
  })
})
