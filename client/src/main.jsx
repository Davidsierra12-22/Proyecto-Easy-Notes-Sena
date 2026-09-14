import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { SedeProvider } from './context/SedeContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SedeProvider>
          <App />
        </SedeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
