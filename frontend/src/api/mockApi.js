const GROUPS_KEY = 'expenses4all:groups'

const readGroups = () => JSON.parse(localStorage.getItem(GROUPS_KEY) || '{}')
const writeGroups = (groups) => localStorage.setItem(GROUPS_KEY, JSON.stringify(groups))
const id = () => crypto.randomUUID()

export async function createGroup(name) {
  const group = { groupId: id(), name: name.trim(), createdAt: new Date().toISOString(), members: [], expenses: [] }
  const groups = readGroups()
  groups[group.groupId] = group
  writeGroups(groups)
  return group
}

export async function getGroup(groupId) {
  const group = readGroups()[groupId]
  if (!group) throw new Error('This group link is not available.')
  return group
}

export async function addMember(groupId, displayName) {
  const groups = readGroups()
  const group = groups[groupId]
  if (!group) throw new Error('This group link is not available.')
  const member = { memberId: id(), displayName: displayName.trim() }
  group.members.push(member)
  writeGroups(groups)
  return { group, member }
}

export async function addExpense(groupId, expense) {
  const groups = readGroups()
  const group = groups[groupId]
  if (!group) throw new Error('This group link is not available.')
  const memberIds = new Set(group.members.map((member) => member.memberId))
  if (!expense.title.trim() || !Number.isFinite(Number(expense.amount)) || Number(expense.amount) <= 0) throw new Error('Add a title and a valid amount.')
  if (!memberIds.has(expense.paidByMemberId) || !expense.splitForMemberIds.length || expense.splitForMemberIds.some((memberId) => !memberIds.has(memberId))) throw new Error('Choose a payer and at least one member to split with.')
  const created = { ...expense, expenseId: id(), groupId, amount: Number(expense.amount).toFixed(2) }
  group.expenses.unshift(created)
  writeGroups(groups)
  return created
}

export async function getBalances(groupId) {
  const group = await getGroup(groupId)
  const balances = Object.fromEntries(group.members.map((member) => [member.memberId, 0]))
  group.expenses.forEach((expense) => {
    const cents = Math.round(Number(expense.amount) * 100)
    balances[expense.paidByMemberId] += cents
    const share = Math.floor(cents / expense.splitForMemberIds.length)
    let remainder = cents - share * expense.splitForMemberIds.length
    expense.splitForMemberIds.forEach((memberId) => {
      balances[memberId] -= share + (remainder-- > 0 ? 1 : 0)
    })
  })
  return Object.fromEntries(Object.entries(balances).map(([memberId, cents]) => [memberId, cents / 100]))
}
