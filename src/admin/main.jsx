import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Admin from './Admin.jsx';
import '../index.css';
import './admin.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Admin />
  </StrictMode>
);
