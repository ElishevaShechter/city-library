import { Link } from 'react-router-dom'

const NotFoundPage = () => {
  return (
    <main>
      <h1>404 - דף לא נמצא</h1>
      <Link to="/">חזרה לבית</Link>
    </main>
  )
}

export default NotFoundPage
