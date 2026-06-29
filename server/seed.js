const mongoose = require('mongoose');
const Book = require('./models/Book');
const Category = require('./models/Category');
require('dotenv').config();

const categories = [
  { name: 'פנטזיה' },
  { name: 'מדע בדיוני' },
  { name: 'מתח' },
  { name: 'היסטוריה' },
  { name: 'ילדים' },
  { name: 'רומן' },
];

const getBooks = (cats) => {
  const byName = (name) => cats.find(c => c.name === name)._id;

  return [
    { title: "הארי פוטר ואבן החכמים", author: "ג'יי.קיי. רולינג", category: byName('פנטזיה'), publishedYear: 1997, totalCopies: 3, availableCopies: 2, description: 'הארי פוטר מגלה ביום הולדתו האחד עשרה שהוא קוסם ומתחיל ללמוד בהוגוורטס.' },
    { title: 'שר הטבעות: אחוות הטבעת', author: "ג'יי.אר.אר. טולקין", category: byName('פנטזיה'), publishedYear: 1954, totalCopies: 2, availableCopies: 0, description: 'פרודו בגינז יוצא למסע אפי להשמיד את טבעת הכוח ולהציל את ארץ התיכון.' },
    { title: '1984', author: "ג'ורג' אורוול", category: byName('מדע בדיוני'), publishedYear: 1949, totalCopies: 2, availableCopies: 1, description: 'עולם דיסטופי שבו האח הגדול צופה בכולם, ווינסטון סמית מנסה למרוד.' },
    { title: 'עולם חדש מופלא', author: 'אולדוס האקסלי', category: byName('מדע בדיוני'), publishedYear: 1932, totalCopies: 1, availableCopies: 0, description: 'חברה עתידנית שבה בני אדם מיוצרים ומותאמים מראש לתפקידים קבועים.' },
    { title: 'מסע למרכז כדור הארץ', author: "ז'ול ורן", category: byName('מדע בדיוני'), publishedYear: 1864, totalCopies: 2, availableCopies: 2, description: 'מדען וחבריו יוצאים למסע מרתק אל תוך כדור הארץ.' },
    { title: "הקוד דה וינצ'י", author: 'דן בראון', category: byName('מתח'), publishedYear: 2003, totalCopies: 4, availableCopies: 3, description: 'רוברט לנגדון חוקר רצח מסתורי בלובר ומגלה קשר עתיק לסוד דתי.' },
    { title: 'כלב הבאסקרווילים', author: 'ארתור קונן דויל', category: byName('מתח'), publishedYear: 1902, totalCopies: 2, availableCopies: 0, description: 'שרלוק הולמס חוקר את מסתורין הכלב הרפאים הרודף את משפחת באסקרוויל.' },
    { title: 'ירושלים: ביוגרפיה', author: 'סיימון סבג מונטיפיורי', category: byName('היסטוריה'), publishedYear: 2011, totalCopies: 2, availableCopies: 1, description: 'סיפורה של ירושלים לאורך 3000 שנות היסטוריה, מלחמות וכיבושים.' },
    { title: 'ימי צקלג', author: 'ס. יזהר', category: byName('היסטוריה'), publishedYear: 1958, totalCopies: 2, availableCopies: 2, description: 'אחת מיצירות המופת של הספרות העברית, חיילים ישראלים במלחמת העצמאות.' },
    { title: 'הנסיך הקטן', author: 'אנטואן דה סנט-אכזופרי', category: byName('ילדים'), publishedYear: 1943, totalCopies: 5, availableCopies: 4, description: 'נסיך קטן נוסע בין כוכבים ולומד על החיים, האהבה והידידות.' },
    { title: 'מאה שנים של בדידות', author: 'גבריאל גרסיה מרקס', category: byName('רומן'), publishedYear: 1967, totalCopies: 2, availableCopies: 1, description: 'סאגה משפחתית על שבעה דורות של משפחת בואנדיה בעיר מקונדו.' },
    { title: 'הזקן והים', author: 'ארנסט המינגוויי', category: byName('רומן'), publishedYear: 1952, totalCopies: 3, availableCopies: 2, description: 'דייג זקן נאבק לבדו בים כדי לתפוס דג ענק.' },
  ];
};

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  await Book.deleteMany({});
  await Category.deleteMany({});
  console.log('Cleared existing data');

  const cats = await Category.insertMany(categories);
  console.log(`Created ${cats.length} categories`);

  const books = await Book.insertMany(getBooks(cats));
  console.log(`Created ${books.length} books`);

  await mongoose.disconnect();
  console.log('Done!');
};

seed().catch(err => { console.error(err); process.exit(1); });
