import { Link } from 'react-router-dom'
import libraryImg from '../assets/library.jpg'
import './HomePage.css'

const HomePage = () => {
  return (
    <div className="home-hero">
      <img src={libraryImg} alt="" className="home-bg" aria-hidden="true" />
      <div className="home-overlay" />

      <div className="home-content">
        <h1 className="home-title">ספריית העיר</h1>
        <p className="home-subtitle">
          אלפי ספרים מחכים לך — חפש, גלה והשאל בקלות
        </p>
        <div className="home-buttons">
          <Link to="/books" className="home-btn home-btn-primary">ספרים</Link>
          <Link to="/personal-area" className="home-btn home-btn-secondary">אזור אישי</Link>
        </div>
      </div>
    </div>
  )
}

export default HomePage
