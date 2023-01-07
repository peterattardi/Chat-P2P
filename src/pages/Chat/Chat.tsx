import { BaseSyntheticEvent, useContext, useRef } from 'react'
import { PeerConnectionContext } from '../../contexts'
import { useSignal } from '../../hooks'

const Chat = (): JSX.Element => {
  const { dispatch } = useContext(PeerConnectionContext)
  const { createOffer, answerOffer, connectionState } = useSignal()
  const localWebcam = useRef<HTMLVideoElement>(null)
  const remoteWebcam = useRef<HTMLVideoElement>(null)

  /**
   * Replaces the pc tracks with the new ones from the user's webcam
   *
   * After all is completed, the localWecam ref will point to the new stream
   */
  const openWebcam = async (): Promise<void> => {
    try {
      dispatch({
        type: 'SET_LOCALSTREAM',
        payload: {
          localStream: await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          }),
          onActionCompeted: ({ localStream }) => {
            if (localWebcam.current != null && localStream != null) {
              localWebcam.current.srcObject = localStream
            }
          },
        },
      })
    } catch (err) {
      console.error(err)
    }
  }

  const handleClickCreateOffer: React.MouseEventHandler<HTMLButtonElement> = () => {
    if (remoteWebcam.current != null) {
      createOffer(remoteWebcam.current)
        .then((callDocId) => {
          const box = document.getElementById('call-id-input') as HTMLInputElement | null
          if (box != null) {
            box.value = callDocId
          }
        })
        .catch((err) => console.error(err))
    }
  }

  const handleClickAnswerOffer = (ev: BaseSyntheticEvent): void => {
    ev.preventDefault()
    if (ev.target[0].value !== undefined && remoteWebcam.current != null) {
      answerOffer(ev.target[0].value, remoteWebcam.current).catch((err) => console.error(err))
    }
  }

  const handleClickOpenWebcam = (): void => {
    openWebcam().catch((err) => console.error(err))
  }

  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '5vh',
        minHeight: '100vh',
      }}
    >
      <h1>{connectionState.toUpperCase()}</h1>

      <div
        style={{
          display: 'flex',
          gap: '10px',
          flexDirection: 'column',
        }}
      >
        <button onClick={handleClickCreateOffer}>Create Offer</button>
        <input disabled id='call-id-input' />
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'start',
          justifyItems: 'center',
          gap: '100px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <video
            ref={localWebcam}
            autoPlay
            playsInline
            style={{
              width: '200px',
              height: '200px',
              objectFit: 'cover',
              border: '1px solid black',
              borderRadius: '0.5rem',
            }}
          />
          <button onClick={handleClickOpenWebcam} disabled={connectionState !== 'connected'}>
            Open Wecam
          </button>
        </div>
        <video
          ref={remoteWebcam}
          autoPlay
          playsInline
          style={{
            width: '200px',
            height: '200px',
            objectFit: 'cover',
            border: '1px solid black',
            borderRadius: '0.5rem',
          }}
        />
      </div>

      <form
        style={{
          display: 'flex',
          gap: '24px',
          flexDirection: 'column',
        }}
        onSubmit={handleClickAnswerOffer}
      >
        <input />
        <button type='submit'>Answer Offer</button>
      </form>
    </section>
  )
}

export default Chat

// https://blog.mozilla.org/webrtc/warm-up-with-replacetrack/
