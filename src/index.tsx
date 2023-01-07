import React from 'react'
import ReactDOM from 'react-dom/client'

import './styles/global.css'
import { Chat } from './pages'
import { PeerConnectionProvider } from './contexts/connection_context/ConnectionContext'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <PeerConnectionProvider>
      <Chat />
    </PeerConnectionProvider>
  </React.StrictMode>
)
