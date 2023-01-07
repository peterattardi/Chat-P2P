import { createContext, Dispatch, PropsWithChildren, useReducer } from 'react'

/**
 * STUN servers
 */
const SERVERS = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
}

/**
 * Props that exposes this context
 */
interface ConnectionContextProps {
  pc: RTCPeerConnection
  localStream: MediaStream
  remoteStream: MediaStream
  connectionState: RTCPeerConnectionState
}

/**
 * Type of the dispatch action.
 *
 * Type is derived by the name of the context props with a trailing 'SET_'.
 *
 * Payload is ConnectionContextProps with every field optional. It also contains
 * a 'onActionCompeted' to synchronously execute an action after the dispatch action is completed
 */
interface ConnectionContextAction {
  type: `SET_${Uppercase<keyof ConnectionContextProps>}`
  payload: Partial<
    ConnectionContextProps & {
      onActionCompeted: (newState: Partial<ConnectionContextProps>) => void
    }
  >
}

/**
 * Setup of initial values
 */
const initialValues: ConnectionContextProps = {
  pc: new RTCPeerConnection(SERVERS),
  localStream: new MediaStream(),
  remoteStream: new MediaStream(),
  connectionState: 'new',
}

export const PeerConnectionContext = createContext({
  state: initialValues,
  dispatch: (() => null) as Dispatch<ConnectionContextAction>,
})

/**
 *
 * @param pc
 * @param stream
 *
 * @description Replaces the current tracks to a new array of tracks
 */
const replaceTracks = async (pc: RTCPeerConnection, stream: MediaStream): Promise<void> => {
  await Promise.all(
    pc.getSenders().map(async (sender) => {
      await sender.replaceTrack(stream.getTracks().find((t) => t.kind === sender.track?.kind) ?? null)
    }),
  )
}

const reducer = (state: ConnectionContextProps, action: ConnectionContextAction): ConnectionContextProps => {
  switch (action.type) {
    case 'SET_PC': {
      const { pc } = action.payload
      if (pc == null) {
        console.warn('Falsy payload passed to reducer')
        return state
      }
      return { ...state, pc: pc ?? state.pc }
    }
    case 'SET_LOCALSTREAM': {
      const { localStream, onActionCompeted } = action.payload
      if (localStream == null) {
        console.warn('Falsy payload passed to reducer')
        return state
      }
      replaceTracks(state.pc, localStream)
        .then(() => onActionCompeted?.({ localStream }))
        .catch((err) => console.error(err))
      return { ...state, localStream: localStream ?? state.localStream }
    }
    case 'SET_REMOTESTREAM': {
      const { remoteStream } = action.payload
      if (remoteStream == null) {
        console.warn('Falsy payload passed to reducer')
        return state
      }
      return { ...state, remoteStream: remoteStream ?? state.remoteStream }
    }
    case 'SET_CONNECTIONSTATE': {
      const { connectionState } = action.payload
      if (connectionState == null) {
        console.warn('Falsy payload passed to reducer')
        return state
      }
      return { ...state, connectionState: connectionState ?? state.pc.connectionState }
    }
    default:
      console.warn('Tried to dispatch an invalid action')
      return state
  }
}

export const PeerConnectionProvider = ({ children }: PropsWithChildren): JSX.Element => {
  const [state, dispatch] = useReducer(reducer, initialValues)

  return <PeerConnectionContext.Provider value={{ state, dispatch }}>{children}</PeerConnectionContext.Provider>
}
