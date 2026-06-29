# התקנה והפעלה

## שלבים ראשונים

```bash
# כנסי לתיקיית client
cd client

# התקני את כל החבילות
npm install

# הפעילי את שרת הפיתוח
npm run dev
```

האתר יעלה על: http://localhost:5173

## חבילות כלולות

| חבילה | שימוש |
|-------|--------|
| React 18 | ספריית UI |
| TypeScript | טיפוסים סטטיים |
| Vite | bundler מהיר |
| React Router DOM | ניתוב בין דפים |
| Redux Toolkit | ניהול state גלובלי |
| react-redux | חיבור Redux ל-React |
| Axios | קריאות HTTP לשרת |

## מבנה תיקיות

```
src/
├── pages/       ← דפי האפליקציה (לפחות 3 נדרשים)
├── components/  ← קומפוננטות שימוש חוזר
├── store/       ← Redux store ו-slices
├── hooks/       ← custom hooks
├── api/         ← קריאות axios לשרת
├── types/       ← TypeScript interfaces
└── assets/      ← תמונות וקבצים סטטיים
```

## הוספת דף חדש

1. צרי קובץ ב-`src/pages/MyPage.tsx`
2. הוסיפי Route ב-`App.tsx`:
   ```tsx
   <Route path="/my-page" element={<MyPage />} />
   ```

## הוספת Redux Slice

```bash
# דוגמה ל-items slice
src/store/itemsSlice.ts
```

```ts
import { createSlice } from '@reduxjs/toolkit'

const itemsSlice = createSlice({
  name: 'items',
  initialState: { list: [], loading: false },
  reducers: {
    // actions כאן
  },
})

export default itemsSlice.reducer
```

ואז ב-`src/store/index.ts`:
```ts
import itemsReducer from './itemsSlice'
reducer: { items: itemsReducer }
```
