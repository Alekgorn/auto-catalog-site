import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const container = document.getElementById('root')!;

// В HTML уже лежит версия страницы, собранная заранее для поисковых роботов.
// Убираем её перед стартом приложения — иначе React добавит свою копию рядом
// и содержимое сайта покажется дважды.
container.innerHTML = '';

createRoot(container).render(<App />);