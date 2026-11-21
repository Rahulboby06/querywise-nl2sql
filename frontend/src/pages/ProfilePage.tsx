import { useState, type FormEvent } from 'react'
import { saveProfile, type Profile } from '../lib/profile'
import './AccountHistory.css'

type Props = { profile: Profile; onSave: (profile: Profile) => void }
export function ProfilePage({ profile, onSave }: Props) {
  const [form, setForm] = useState(profile)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const fields: { key: keyof Profile; label: string; required?: boolean }[] = [
    { key: 'fullName', label: 'Full name', required: true },
    { key: 'department', label: 'Department' },
    { key: 'designation', label: 'Designation' },
    { key: 'institution', label: 'Institution (optional)' },
  ]
  function submit(event: FormEvent) {
    event.preventDefault()
    const next = { fullName: form.fullName.trim(), department: form.department.trim(), designation: form.designation.trim(), institution: form.institution.trim() }
    if (!next.fullName) { setError('Enter your full name.'); return }
    try { saveProfile(next); onSave(next); setForm(next); setError(''); setMessage('Profile saved in this browser.') }
    catch { setMessage(''); setError('Could not save your profile in this browser.') }
  }
  return <section className="account-page" aria-labelledby="profile-heading">
    <div className="account-heading"><h2 id="profile-heading">Account profile</h2><p>Local profile saved in this browser. It is independent of authentication and database access.</p></div>
    <form className="account-panel profile-form" onSubmit={submit}>
      {fields.map(({key, label, required}) => <label key={key}>{label}<input value={form[key]} required={required} maxLength={120} onChange={event => { setForm({...form, [key]: event.target.value}); setMessage(''); setError('') }} /></label>)}
      <div><button className="account-primary" type="submit">Save profile</button></div>
      {message && <p role="status">{message}</p>}{error && <p role="alert" className="account-error">{error}</p>}
    </form>
  </section>
}
