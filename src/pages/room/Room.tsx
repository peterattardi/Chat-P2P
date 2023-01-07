import { useContext, useEffect, useRef } from 'react'
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
  const { setRemoteStream, answerOffer } = useSignal()
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
    } catch (err) {
      console.error(err)
    }
  }

  const handleClickOpenWebcam = (): void => {
    openWebcam().catch((err) => console.error(err))
  }

  useEffect(() => {
    if (remoteWebcam.current != null) {
      setRemoteStream(remoteWebcam.current)
    }

    if (state?.offer == null && id != null) {
      answerOffer(id).catch((err) => console.error(err))
    }
  }, [])

  return (
    <Layout>
      <section className='w-full flex flex-col justify-center items-center space-y-[64px]'>
        <h1 className='text-[3vh]'>{connectionState !== 'connected' ? 'Waiting for other peer to join...' : 'Peer joined!'}</h1>
        <section className='w-full grid md:grid-cols-2 md:grid-rows-1 grid-rows-2 grid-cols-1 gap-[64px]'>
          <div className='flex md:flex-col flex-col-reverse space-y-[12px] flex-r'>
            <Video ref={localWebcam} />
            <Button small buttonType='secondary' onClick={handleClickOpenWebcam} disabled={connectionState !== 'connected'}>
              Open Wecam
            </Button>
          </div>

          <Video ref={remoteWebcam} />
        </section>
      </section>
    </Layout>
  )
}

export default Room
