import { useContext, useRef, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { Button, Video } from '../../components'
import { PeerConnectionContext } from '../../contexts'
import { useSignal } from '../../hooks'
import Layout from '../Layout'

const Room = (): JSX.Element => {
  const { id } = useParams()
  const { state } = useLocation()
  const localWebcam = useRef<HTMLVideoElement>(null)
  const remoteWebcam = useRef<HTMLVideoElement>(null)
  const [joinedClick, setJoinedClick] = useState(state?.offer != null)
  const { setRemoteStream, answerOffer, closeConnection, send } = useSignal({ onMessageReceived })
  const {
    state: { connectionState },
    dispatch
  } = useContext(PeerConnectionContext)

  const openWebcam = async (): Promise<void> => {
    try {
      dispatch({
        type: 'SET_LOCALSTREAM',
        payload: {
          localStream: await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
          }),
          onActionCompeted: ({ localStream }) => {
            if (localWebcam.current != null && localStream != null) {
              localWebcam.current.srcObject = localStream
            }
          }
        }
      })

      send('Opened webcam')
    } catch (err) {
      console.error(err)
    }
  }

  const handleClickOpenWebcam = (): void => {
    openWebcam().catch((err) => console.error(err))
  }

  const start = (): void => {
    console.count('start')
    setJoinedClick(true)

    if (state?.offer == null && id != null) {
      answerOffer(id).catch((err) => console.error(err))
    }
  }

  const hangup = (): void => {
    closeConnection()
    setRemoteStream(null)
  }

  if (remoteWebcam.current != null) {
    setRemoteStream(remoteWebcam.current)
  }

  function onMessageReceived (message: unknown): void {
    console.log('message', message)
  }

  const title: string = (() => {
    switch (connectionState) {
      case 'new':
        return 'Share the link with the another peer!'
      case 'connecting':
        return 'Connecting...'
      case 'connected':
        return 'Peer joined! Say hello'
      case 'disconnected':
        return 'Peer disconnected :/'
      case 'closed':
        return 'Good bye :)'

      default:
        console.log(connectionState)
        return ''
    }
  })()

  return (
    <Layout>
      <section className='w-full min-h-screen flex flex-col justify-center items-center space-y-[32px]'>
        {!joinedClick
          ? (
            <section className='space-y-[32px] flex flex-col justify-center items-center'>
              <h1>Someone has invited you to join their room!</h1>
              <Button onClick={start}>Join</Button>
            </section>
            )
          : (
            <>
              <h1>{title}</h1>
              <section className='w-full grid md:grid-cols-2 md:grid-rows-1 grid-rows-2 grid-cols-1 gap-[64px]'>
                <div className='flex md:flex-col flex-col-reverse space-y-[12px] flex-r'>
                  <Video ref={localWebcam} />
                  <Button small buttonType='secondary' onClick={handleClickOpenWebcam} disabled={connectionState !== 'connected'}>
                    Open Wecam
                  </Button>
                </div>

                <Video ref={remoteWebcam} />
              </section>
            </>
            )}

        {connectionState === 'connected' && (
          <Button small onClick={hangup}>
            Hang up
          </Button>
        )}
      </section>
    </Layout>
  )
}

export default Room
