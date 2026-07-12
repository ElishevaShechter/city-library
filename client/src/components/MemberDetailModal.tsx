import { useState, useEffect, FormEvent } from 'react'
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch'
import { updateMember, clearSaveError } from '../store/membersSlice'
import type { MemberDetail } from '../types'

interface FormErrors {
  name?: string
  email?: string
  nationalId?: string
}

interface Props {
  member: MemberDetail
  onClose: () => void
}

const fmt = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' })

const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

const MemberDetailModal = ({ member, onClose }: Props) => {
  const dispatch = useAppDispatch()
  const { saving, saveError } = useAppSelector(s => s.members)

  const [name, setName] = useState(member.name)
  const [email, setEmail] = useState(member.email)
  const [nationalId, setNationalId] = useState(member.nationalId ?? '')
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({})
  const [savedMsg, setSavedMsg] = useState<string | null>(null)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    dispatch(clearSaveError())
    setSavedMsg(null)

    const errors: FormErrors = {}
    if (!name.trim()) errors.name = 'שדה חובה'
    if (!email.trim()) {
      errors.email = 'שדה חובה'
    } else if (!validateEmail(email.trim())) {
      errors.email = 'כתובת אימייל לא תקינה'
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})

    const result = await dispatch(updateMember({
      id: member._id,
      data: { name: name.trim(), email: email.trim(), nationalId: nationalId.trim() },
    }))
    if (updateMember.fulfilled.match(result)) {
      setSavedMsg('הפרטים נשמרו בהצלחה')
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content catalog-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        <h2 className="modal-title">כרטיס חבר</h2>
        <p className="modal-author">
          מספר חבר: {member.memberNumber ?? '—'} ·{' '}
          <span className={`member-status ${member.status}`}>
            {member.status === 'active' ? 'פעיל' : 'לא פעיל'}
          </span>
        </p>

        {saveError && <div className="server-error" role="alert">{saveError}</div>}
        {savedMsg && (
          <div className="personal-notification success">
            <span>{savedMsg}</span>
            <button onClick={() => setSavedMsg(null)}>✕</button>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="catalog-form-row">
            <div className="form-group">
              <label htmlFor="member-name">שם מלא</label>
              <input id="member-name" type="text" value={name} onChange={e => setName(e.target.value)}
                className={fieldErrors.name ? 'error-input' : ''} />
              {fieldErrors.name && <span className="field-error">{fieldErrors.name}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="member-email">אימייל</label>
              <input id="member-email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                className={fieldErrors.email ? 'error-input' : ''} dir="ltr" />
              {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="member-nationalId">תעודת זהות (אופציונלי)</label>
            <input id="member-nationalId" type="text" value={nationalId} onChange={e => setNationalId(e.target.value)}
              className={fieldErrors.nationalId ? 'error-input' : ''} dir="ltr" placeholder="ריק כדי למחוק" />
            {fieldErrors.nationalId && <span className="field-error">{fieldErrors.nationalId}</span>}
          </div>

          <button type="submit" className="btn-submit" disabled={saving}>
            {saving ? 'שומר...' : 'שמור שינויים'}
          </button>
        </form>

        <div className="catalog-history">
          <p className="catalog-history-toggle" style={{ cursor: 'default' }}>
            ספרים מושאלים כעת ({member.currentLoans.length})
          </p>
          {member.currentLoans.length === 0 ? (
            <p className="catalog-history-loading">אין השאלות פעילות</p>
          ) : (
            <ul className="catalog-history-list">
              {member.currentLoans.map(loan => {
                const book = loan.book
                const title = !book ? 'ספר לא קיים' : typeof book === 'string' ? book : book.title
                return (
                  <li key={loan._id} className="catalog-history-item">
                    <div className="catalog-history-head">
                      <span className="loan-book-title">{title}</span>
                      <span className="catalog-history-meta">עד {fmt(loan.dueDate)}</span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="catalog-history">
          <p className="catalog-history-toggle" style={{ cursor: 'default' }}>
            היסטוריית השאלות ({member.loanHistory.length})
          </p>
          {member.loanHistory.length === 0 ? (
            <p className="catalog-history-loading">אין היסטוריית השאלות</p>
          ) : (
            <ul className="catalog-history-list">
              {member.loanHistory.map(loan => {
                const book = loan.book
                const title = !book ? 'ספר לא קיים' : typeof book === 'string' ? book : book.title
                const isActive = loan.status === 'active'
                return (
                  <li key={loan._id} className="catalog-history-item">
                    <div className="catalog-history-head">
                      <span className="loan-book-title">{title}</span>
                      <span className={`loan-status ${loan.status}`}>{isActive ? 'מושאל' : 'הוחזר'}</span>
                    </div>
                    <span className="catalog-history-meta">
                      הושאל {fmt(loan.loanDate)}{loan.returnDate ? ` · הוחזר ${fmt(loan.returnDate)}` : ''}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default MemberDetailModal
