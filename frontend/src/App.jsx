import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, CalendarDays, Check, Clipboard, Copy, CreditCard, Link2, Plus, Receipt, Sparkles, Users, X } from 'lucide-react'
import * as api from './api/backendApi'

const today = new Date().toISOString().slice(0, 10)
const money = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
const shortDate = (value) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(`${value}T12:00:00`))
const sessionKey = (groupId) => `expenses4all:member:${groupId}`

function App() {
  return <Routes><Route path="/" element={<Landing />} /><Route path="/g/:groupId" element={<GroupPage />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes>
}

function Landing() {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const create = async (event) => {
    event.preventDefault()
    if (!name.trim()) return setError('Give your group a name first.')
    const group = await api.createGroup(name)
    navigate(`/g/${group.groupId}`)
  }
  return <main className="landing-shell">
    <nav className="topbar"><Link className="brand" to="/"><span className="brand-mark"><Receipt size={17} /></span> expenses<span>4all</span></Link><span className="nav-note">No accounts. No awkward settling up.</span></nav>
    <section className="landing-grid">
      <div className="landing-copy"><div className="eyebrow"><Sparkles size={15} /> Shared expenses, made human</div><h1>Keep the trip<br /><em>moving.</em></h1><p>One link for the whole group. Add what you paid, see who is covered, and leave the spreadsheet behind.</p><form onSubmit={create} className="create-form"><label htmlFor="group-name">Start a new group</label><div className="input-row"><input id="group-name" value={name} onChange={(event) => { setName(event.target.value); setError('') }} placeholder="e.g. Lisbon long weekend" autoFocus /><button className="primary-button" type="submit">Create group <ArrowRight size={18} /></button></div>{error && <span className="form-error">{error}</span>}</form><div className="trust-row"><span><Check size={14} /> Free to use</span><span><Check size={14} /> Private by link</span><span><Check size={14} /> Fair splits</span></div></div>
      <div className="landing-art" aria-hidden="true"><div className="art-card art-card-back"><span>THIS WEEKEND</span><strong>Sun · Sea · Snacks</strong></div><div className="art-card art-card-main"><div className="art-card-head"><span>EXPENSES4ALL</span><Receipt size={19} /></div><div className="art-total"><small>GROUP TOTAL</small><strong>$428.60</strong></div><div className="art-lines"><i /><i /><i /></div><div className="art-footer"><span /><span /><span /></div></div><div className="art-sticker">split<br />fairly</div></div>
    </section>
    <footer className="landing-footer"><span>Made for the “who paid for that?” moments.</span><span>2026 · Expenses4All</span></footer>
  </main>
}

function GroupPage() {
  const { groupId } = useParams()
  const [group, setGroup] = useState(null)
  const [balances, setBalances] = useState({})
  const [member, setMember] = useState(() => JSON.parse(localStorage.getItem(sessionKey(groupId)) || 'null'))
  const [error, setError] = useState('')
  const refresh = async () => { try { const nextGroup = await api.getGroup(groupId); setGroup(nextGroup); setBalances(await api.getBalances(groupId)) } catch (err) { setError(err.message) } }
  useEffect(() => { refresh() }, [groupId])
  const join = async (displayName) => { try { const result = await api.addMember(groupId, displayName); setMember(result.member); localStorage.setItem(sessionKey(groupId), JSON.stringify(result.member)); setGroup(result.group) } catch (err) { setError(err.message) } }
  if (error) return <main className="center-message"><Receipt size={28} /><h1>That link has expired</h1><p>{error}</p><Link className="primary-button" to="/">Start a new group <ArrowRight size={18} /></Link></main>
  if (!group) return <main className="center-message"><div className="loader" /> <p>Loading your group…</p></main>
  if (!member) return <JoinModal groupName={group.name} onJoin={join} />
  return <Dashboard group={group} member={member} balances={balances} refresh={refresh} />
}

function JoinModal({ groupName, onJoin }) {
  const [name, setName] = useState('')
  return <main className="join-shell"><div className="join-panel"><div className="brand"><span className="brand-mark"><Receipt size={17} /></span> expenses<span>4all</span></div><div className="join-icon"><Users size={25} /></div><div className="eyebrow">You’re invited</div><h1>Who’s joining<br />{groupName}?</h1><p>Choose a name so the group knows who’s who. No account needed.</p><form onSubmit={(event) => { event.preventDefault(); if (name.trim()) onJoin(name) }}><label htmlFor="display-name">Your display name</label><input id="display-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Alex" autoFocus /><button className="primary-button full-button" type="submit">Join group <ArrowRight size={18} /></button></form><small>Your name is saved only on this device for this group.</small></div></main>
}

function Dashboard({ group, member, balances, refresh }) {
  const [showExpense, setShowExpense] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [toast, setToast] = useState('')
  const total = group.expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)
  const myBalance = balances[member.memberId] || 0
  const copyLink = async () => { await navigator.clipboard?.writeText(window.location.href); setToast('Link copied'); setTimeout(() => setToast(''), 2200) }
  return <main className="app-shell"><header className="app-header"><Link className="brand" to="/"><span className="brand-mark"><Receipt size={17} /></span> expenses<span>4all</span></Link><div className="header-actions"><button className="icon-button" onClick={copyLink} title="Copy group link"><Link2 size={18} /></button><button className="avatar" title={member.displayName}>{member.displayName.charAt(0).toUpperCase()}</button></div></header><div className="dashboard"><div className="dashboard-title"><div><div className="eyebrow">Your shared wallet</div><h1>{group.name}</h1><p>Created {new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(group.createdAt))}</p></div><button className="share-button" onClick={() => setShowShare(true)}><Copy size={16} /> Share group</button></div><section className="summary-grid"><div className="summary-card total-card"><div className="summary-label"><span className="summary-icon"><CreditCard size={17} /></span> Group total</div><strong>{money(total)}</strong><span className="summary-caption">{group.expenses.length} {group.expenses.length === 1 ? 'expense' : 'expenses'} recorded</span></div><div className={`summary-card balance-card ${myBalance > 0 ? 'positive' : myBalance < 0 ? 'negative' : ''}`}><div className="summary-label"><span className="summary-icon"><Sparkles size={17} /></span> Your balance</div><strong>{myBalance > 0 ? '+' : ''}{money(myBalance)}</strong><span className="summary-caption">{myBalance > 0 ? 'You are owed' : myBalance < 0 ? 'You owe the group' : 'All settled up'}</span></div><div className="summary-card roster-card"><div className="summary-label"><span className="summary-icon"><Users size={17} /></span> In the group</div><strong>{group.members.length}</strong><span className="summary-caption">{group.members.map((item) => item.displayName).join(' · ') || 'Be the first to join'}</span></div></section><div className="content-grid"><section className="panel expenses-panel"><div className="panel-heading"><div><h2>Recent expenses</h2><p>Everything the group has covered.</p></div><button className="primary-button compact" onClick={() => setShowExpense(true)}><Plus size={17} /> Add expense</button></div>{group.expenses.length ? <div className="expense-list">{group.expenses.map((expense) => <ExpenseRow key={expense.expenseId} expense={expense} members={group.members} />)}</div> : <EmptyExpenses onAdd={() => setShowExpense(true)} />}</section><section className="panel balances-panel"><div className="panel-heading"><div><h2>Balances</h2><p>Paid minus fair share.</p></div></div><div className="balance-list">{group.members.map((item) => <BalanceRow key={item.memberId} member={item} value={balances[item.memberId] || 0} current={item.memberId === member.memberId} />)}</div>{group.members.length > 1 && <div className="balance-note"><Check size={15} /> Splits are calculated equally per expense.</div>}</section></div></div>{showExpense && <ExpenseModal group={group} onClose={() => setShowExpense(false)} onSaved={async () => { setShowExpense(false); await refresh() }} />}{showShare && <ShareModal group={group} onClose={() => setShowShare(false)} onCopy={copyLink} />}{toast && <div className="toast"><Check size={16} /> {toast}</div>}</main>
}

function ExpenseRow({ expense, members }) { const payer = members.find((member) => member.memberId === expense.paidByMemberId); const covered = expense.splitForMemberIds.length === members.length ? 'Everyone' : `${expense.splitForMemberIds.length} people`; return <article className="expense-row"><div className="expense-date"><strong>{new Date(`${expense.date}T12:00:00`).getDate()}</strong><span>{new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date(`${expense.date}T12:00:00`))}</span></div><div className="expense-info"><strong>{expense.title}</strong><span>Paid by {payer?.displayName || 'Unknown'} · {covered}</span></div><strong className="expense-amount">{money(Number(expense.amount))}</strong></article> }
function BalanceRow({ member, value, current }) { return <div className="balance-row"><span className="member-avatar">{member.displayName.charAt(0).toUpperCase()}</span><div className="member-name"><strong>{member.displayName}{current && <small>you</small>}</strong><span>{value > 0 ? 'gets back' : value < 0 ? 'owes group' : 'settled'}</span></div><strong className={`balance-value ${value > 0 ? 'positive-text' : value < 0 ? 'negative-text' : ''}`}>{value > 0 ? '+' : ''}{money(value)}</strong></div> }
function EmptyExpenses({ onAdd }) { return <div className="empty-state"><div className="empty-icon"><Receipt size={22} /></div><h3>Nothing on the tab yet</h3><p>Add the first expense and the group balance will take shape.</p><button className="text-button" onClick={onAdd}>Add first expense <ArrowRight size={15} /></button></div> }

function ExpenseModal({ group, onClose, onSaved }) { const [form, setForm] = useState({ title: '', amount: '', date: today, paidByMemberId: group.members[0]?.memberId || '', splitForMemberIds: group.members.map((member) => member.memberId) }); const [error, setError] = useState(''); const update = (key, value) => setForm((current) => ({ ...current, [key]: value })); const toggleMember = (memberId) => update('splitForMemberIds', form.splitForMemberIds.includes(memberId) ? form.splitForMemberIds.filter((id) => id !== memberId) : [...form.splitForMemberIds, memberId]); const save = async (event) => { event.preventDefault(); try { await api.addExpense(group.groupId, form); await onSaved() } catch (err) { setError(err.message) } }; return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="modal"><div className="modal-heading"><div><div className="eyebrow">New entry</div><h2>Add an expense</h2></div><button className="close-button" onClick={onClose} aria-label="Close"><X size={20} /></button></div><form onSubmit={save}><label>What was it for?<input value={form.title} onChange={(event) => update('title', event.target.value)} placeholder="Dinner, taxi, groceries…" autoFocus /></label><div className="form-columns"><label>Amount<input type="number" min="0.01" step="0.01" value={form.amount} onChange={(event) => update('amount', event.target.value)} placeholder="0.00" /></label><label>Date<input type="date" value={form.date} onChange={(event) => update('date', event.target.value)} /></label></div><label>Paid by<select value={form.paidByMemberId} onChange={(event) => update('paidByMemberId', event.target.value)}>{group.members.map((member) => <option key={member.memberId} value={member.memberId}>{member.displayName}</option>)}</select></label><fieldset><legend>Split between <span>{form.splitForMemberIds.length} selected</span></legend><div className="member-picker">{group.members.map((member) => <button type="button" className={`member-chip ${form.splitForMemberIds.includes(member.memberId) ? 'selected' : ''}`} key={member.memberId} onClick={() => toggleMember(member.memberId)}><span>{member.displayName.charAt(0).toUpperCase()}</span>{member.displayName}{form.splitForMemberIds.includes(member.memberId) && <Check size={14} />}</button>)}</div></fieldset>{error && <span className="form-error">{error}</span>}<button className="primary-button full-button" type="submit">Save expense <Check size={18} /></button></form></div></div> }
function ShareModal({ group, onClose, onCopy }) { return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="modal share-modal"><button className="close-button" onClick={onClose} aria-label="Close"><X size={20} /></button><div className="share-symbol"><Link2 size={23} /></div><div className="eyebrow">Bring the whole crew</div><h2>Share this group</h2><p>Anyone with this link can join and add expenses. No account required.</p><div className="link-box"><span>{window.location.href}</span><button className="icon-button" onClick={onCopy} title="Copy link"><Clipboard size={17} /></button></div><button className="primary-button full-button" onClick={onCopy}>Copy invite link <Copy size={17} /></button><small>{group.members.length} {group.members.length === 1 ? 'person is' : 'people are'} already here.</small></div></div> }

export default App
