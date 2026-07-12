import { useState, FormEvent } from 'react'
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch'
import { searchMembers, fetchMemberById, clearSelectedMember, clearSearchResults } from '../store/membersSlice'
import MemberDetailModal from './MemberDetailModal'

const AdminMembersPanel = () => {
  const dispatch = useAppDispatch()
  const { results, searchLoading, searchError, selectedMember, detailLoading, detailError } = useAppSelector(s => s.members)

  const [query, setQuery] = useState('')
  const [searched, setSearched] = useState(false)

  const handleSearch = (e: FormEvent) => {
    e.preventDefault()
    const term = query.trim()
    if (!term) {
      dispatch(clearSearchResults())
      setSearched(false)
      return
    }
    dispatch(searchMembers(term))
    setSearched(true)
  }

  const openMember = (id: string) => {
    dispatch(fetchMemberById(id))
  }

  return (
    <div className="catalog-panel">
      <form className="catalog-toolbar" onSubmit={handleSearch}>
        <input
          type="text"
          className="search-input catalog-search"
          placeholder="חיפוש לפי שם, מספר חבר או תעודת זהות..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <button type="submit" className="catalog-add-btn" disabled={searchLoading}>
          {searchLoading ? 'מחפש...' : 'חיפוש'}
        </button>
      </form>

      {detailError && (
        <div className="personal-notification error">
          <span>{detailError}</span>
          <button onClick={() => dispatch(clearSelectedMember())}>✕</button>
        </div>
      )}
      {searchError && (
        <div className="personal-notification error">
          <span>{searchError}</span>
        </div>
      )}

      {searchLoading || detailLoading ? (
        <p className="loans-loading">{detailLoading ? 'טוען פרטי חבר...' : 'מחפש...'}</p>
      ) : searched && results.length === 0 ? (
        <div className="loans-empty">
          <p>החבר לא נמצא</p>
          <p className="loans-empty-hint">נסה/י לחפש לפי שם חלקי, מספר חבר מדויק, או תעודת זהות מדויקת</p>
        </div>
      ) : results.length > 0 ? (
        <div className="loans-table-wrap">
          <table className="loans-table">
            <thead>
              <tr>
                <th>שם</th>
                <th>אימייל</th>
                <th>מספר חבר</th>
                <th>סטטוס</th>
                <th>פעולה</th>
              </tr>
            </thead>
            <tbody>
              {results.map(member => (
                <tr key={member._id}>
                  <td className="loan-book-title">{member.name}</td>
                  <td>{member.email}</td>
                  <td>{member.memberNumber ?? '—'}</td>
                  <td>
                    <span className={`member-status ${member.status}`}>
                      {member.status === 'active' ? 'פעיל' : 'לא פעיל'}
                    </span>
                  </td>
                  <td>
                    <button className="extend-btn" onClick={() => openMember(member._id)}>פרטים</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="loans-empty">
          <p>חיפוש חברי ספרייה</p>
          <p className="loans-empty-hint">הזן/י שם, מספר חבר או תעודת זהות כדי להתחיל</p>
        </div>
      )}

      {selectedMember && (
        <MemberDetailModal member={selectedMember} onClose={() => dispatch(clearSelectedMember())} />
      )}
    </div>
  )
}

export default AdminMembersPanel
