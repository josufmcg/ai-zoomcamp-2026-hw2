const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })

  const body = await response.json().catch(() => null)
  if (!response.ok) {
    const fieldMessage = body?.fieldErrors
      ? Object.values(body.fieldErrors).flat().join(' ')
      : ''
    throw new Error(fieldMessage || body?.message || 'Something went wrong. Please try again.')
  }
  return body
}

export function createGroup(name) {
  return request('/api/groups', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

export function getGroup(groupId) {
  return request(`/api/groups/${groupId}`)
}

export async function addMember(groupId, displayName) {
  const group = await request(`/api/groups/${groupId}/members`, {
    method: 'POST',
    body: JSON.stringify({ displayName }),
  })
  return { group, member: group.members[group.members.length - 1] }
}

export function addExpense(groupId, expense) {
  return request(`/api/groups/${groupId}/expenses`, {
    method: 'POST',
    body: JSON.stringify({
      ...expense,
      amount: Number(expense.amount),
    }),
  })
}

export function getBalances(groupId) {
  return request(`/api/groups/${groupId}/balances`)
}