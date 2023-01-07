import React from 'react'
import ReactDOM from 'react-dom/client'

import './styles/global.css'
import { StartRoom } from './pages'
import { PeerConnectionProvider } from './contexts/connection_context/ConnectionContext'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <PeerConnectionProvider>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<StartRoom />} />
        </Routes>
      </BrowserRouter>
    </PeerConnectionProvider>
  </React.StrictMode>
)
