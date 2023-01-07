import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  updateDoc
} from 'firebase/firestore'
import { firestore } from '../../../firebase'
import { BaseSyntheticEvent, useContext, useRef, useState } from 'react'
import { PeerConnectionContext } from '../../contexts/ConnectionContext'

const Chat = (): JSX.Element => {
  const {
    state: { pc, localStream, remoteStream },
    dispatch
  } = useContext(PeerConnectionContext)
  const [status, setStatus] = useState('Not connected')
  const [role, setRole] = useState<string>()
  const localWebcam = useRef<HTMLVideoElement>(null)
  const remoteWebcam = useRef<HTMLVideoElement>(null)

  const silence = (): MediaStreamTrack => {
    const ctx = new AudioContext()
    const oscillator = ctx.createOscillator()
    const dst = oscillator.connect(ctx.createMediaStreamDestination())
    oscillator.start()
    return Object.assign((dst as any).stream.getAudioTracks()[0], {
      enabled: false
    })
  }

  const black = ({ width = 640, height = 480 } = {}): MediaStreamTrack => {
    const canvas = Object.assign(document.createElement('canvas'), {
      width,
      height
    })
    const ctx = canvas.getContext('2d')
    if (ctx != null) ctx.fillRect(0, 0, width, height)
    const stream = canvas.captureStream()
    return Object.assign(stream.getVideoTracks()[0], { enabled: false })
  }

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
            audio: false
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

  const createOffer = async (): Promise<void> => {
    const { id: callDocId } = await addDoc(collection(firestore, 'calls'), {})
    const callDoc = doc(firestore, 'calls', callDocId)
    const offerCandidatesCollection = collection(
      firestore,
      'calls',
      callDocId,
      'offerCandidates'
    )
    const answerCandidatesCollection = collection(
      firestore,
      'calls',
      callDocId,
      'answerCandidates'
    )

    if (remoteWebcam.current != null) {
      remoteWebcam.current.srcObject = remoteStream
    }

    const blackSilence = new MediaStream([black(), silence()])
    blackSilence.getTracks().forEach((track) => {
      pc.addTrack(track, localStream)
    })

    pc.onnegotiationneeded = async () => {
      const offerDescription = await pc.createOffer()
      await pc.setLocalDescription(offerDescription)

      await updateDoc(callDoc, {
        offer: { sdp: offerDescription.sdp, type: offerDescription.type }
      })
    }

    pc.onconnectionstatechange = () => {
      setStatus(pc.connectionState)
    }

    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track)
      })
    }

    pc.onicecandidate = (event) => {
      if (event.candidate != null) {
        addDoc(offerCandidatesCollection, event.candidate.toJSON()).catch(
          (err) => console.error(err)
        )
      }
    }

    onSnapshot(callDoc, (snapshot) => {
      const { answer } = snapshot.data() as any
      if (answer !== undefined && answer !== pc.remoteDescription) {
        const answerDescription = new RTCSessionDescription(answer)
        pc.setRemoteDescription(answerDescription).catch((err) =>
          console.error(err)
        )
      }
    })

    onSnapshot(answerCandidatesCollection, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const candidate = new RTCIceCandidate(change.doc.data())
          pc.addIceCandidate(candidate).catch((err) => console.error(err))
        }
      })
    })

    setRole('offerer')
    const inputBox = document.getElementById(
      'call-id-input'
    ) as HTMLInputElement | null
    if (inputBox != null) {
      inputBox.value = callDocId
    }
  }

  const answerOffer = async (callDocId: string): Promise<void> => {
    if (remoteWebcam.current != null) {
      remoteWebcam.current.srcObject = remoteStream
    }

    const blackSilence = new MediaStream([black(), silence()])
    blackSilence.getTracks().forEach((track) => {
      pc.addTrack(track, localStream)
    })

    const callDoc = doc(firestore, 'calls', callDocId)

    const offerCandidatesCollection = collection(
      firestore,
      'calls',
      callDocId,
      'offerCandidates'
    )
    const answerCandidatesCollection = collection(
      firestore,
      'calls',
      callDocId,
      'answerCandidates'
    )

    pc.onnegotiationneeded = async () => {
      const { offer } = (await getDoc(callDoc)).data() as any
      await pc.setRemoteDescription(new RTCSessionDescription(offer))
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      await updateDoc(callDoc, {
        answer: { type: answer.type, sdp: answer.sdp }
      })

      onSnapshot(offerCandidatesCollection, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data()
            pc.addIceCandidate(new RTCIceCandidate(data)).catch((err) =>
              console.error(err)
            )
          }
        })
      })
    }

    pc.onconnectionstatechange = () => {
      setStatus(pc.connectionState)
    }

    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track)
      })
    }
    pc.onicecandidate = (event) => {
      if (event.candidate !== null) {
        addDoc(answerCandidatesCollection, event.candidate.toJSON()).catch(
          (err) => console.error(err)
        )
      }
    }

    setRole('answerer')
  }

  const handleClickCreateOffer: React.MouseEventHandler<
  HTMLButtonElement
  > = () => {
    createOffer().catch((err) => console.error(err))
  }

  const handleClickAnswerOffer = (ev: BaseSyntheticEvent): void => {
    ev.preventDefault()
    if (ev.target[0].value !== undefined) {
      answerOffer(ev.target[0].value).catch((err) => console.error(err))
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
        minHeight: '100vh'
      }}
    >
      <h1>{status.toUpperCase()}</h1>

      {role !== 'answerer' && (
        <div
          style={{
            display: 'flex',
            gap: '10px',
            flexDirection: 'column'
          }}
        >
          <button onClick={handleClickCreateOffer}>Create Offer</button>
          <input disabled id='call-id-input' />
        </div>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'start',
          justifyItems: 'center',
          gap: '100px'
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px'
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
              borderRadius: '0.5rem'
            }}
          />
          <button
            onClick={handleClickOpenWebcam}
            disabled={status !== 'connected'}
          >
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
            borderRadius: '0.5rem'
          }}
        />
      </div>

      {role !== 'offerer' && (
        <form
          style={{
            display: 'flex',
            gap: '24px',
            flexDirection: 'column'
          }}
          onSubmit={handleClickAnswerOffer}
        >
          <input />
          <button type='submit'>Answer Offer</button>
        </form>
      )}
    </section>
  )
}

export default Chat

// https://blog.mozilla.org/webrtc/warm-up-with-replacetrack/
