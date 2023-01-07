import React from 'react'
import ReactDOM from 'react-dom/client'

import './styles/global.css'
import { StartRoom, Room } from './pages'
import { PeerConnectionProvider } from './contexts/connection/ConnectionContext'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <PeerConnectionProvider>
      <BrowserRouter>
        <Routes>
          <Route path='/:id' element={<Room />} />
          <Route path='/' element={<StartRoom />} />
        </Routes>
      </BrowserRouter>
    </PeerConnectionProvider>
  </React.StrictMode>,
)
