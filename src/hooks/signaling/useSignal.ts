import { addDoc, collection, doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore'
import { useContext } from 'react'
import { firestore } from '../../../firebase'
import { PeerConnectionContext } from '../../contexts'

interface UseSignalProps {
  createOffer: () => Promise<string>
  answerOffer: (callDocId: string) => Promise<void>
  setRemoteStream: (remoteWebcam: HTMLVideoElement) => void
  closeConnection: () => void
  send: (message: any) => void
}

interface UseSignalOptions {
  onMessageReceived: (message: any) => void
}

const useSignal = ({ onMessageReceived }: UseSignalOptions): UseSignalProps => {
  const {
    state: { pc, remoteStream, localStream, dataChannel },
    dispatch,
  } = useContext(PeerConnectionContext)

  const silence = (): MediaStreamTrack => {
    const ctx = new AudioContext()
    const oscillator = ctx.createOscillator()
    const dst = oscillator.connect(ctx.createMediaStreamDestination())
    oscillator.start()
    return Object.assign((dst as any).stream.getAudioTracks()[0], {
      enabled: false,
    })
  }

  const white = ({ width = 640, height = 480 } = {}): MediaStreamTrack => {
    const canvas = Object.assign(document.createElement('canvas'), {
      width,
      height,
    })
    const ctx = canvas.getContext('2d')

    if (ctx != null) {
      ctx.fillStyle = 'rgba(255,255,255,1)'
      ctx.fillRect(0, 0, width, height)
    }
    const stream = canvas.captureStream()
    return Object.assign(stream.getVideoTracks()[0], { enabled: false })
  }

  const setRemoteStream = (remoteWebcam: HTMLVideoElement): void => {
    remoteWebcam.srcObject = remoteStream
  }

  const createOffer = async (): Promise<string> => {
    const { id: callDocId } = await addDoc(collection(firestore, 'calls'), {})
    const callDoc = doc(firestore, 'calls', callDocId)
    const offerCandidatesCollection = collection(firestore, 'calls', callDocId, 'offerCandidates')
    const answerCandidatesCollection = collection(firestore, 'calls', callDocId, 'answerCandidates')

    const whiteAndSilence = new MediaStream([white(), silence()])
    whiteAndSilence.getTracks().forEach((track) => {
      pc.addTrack(track, localStream)
    })

    pc.onnegotiationneeded = async () => {
      const offerDescription = await pc.createOffer()
      await pc.setLocalDescription(offerDescription)

      await updateDoc(callDoc, {
        offer: { sdp: offerDescription.sdp, type: offerDescription.type },
      })
    }

    pc.onconnectionstatechange = () => {
      console.info(pc.connectionState)
      dispatch({ type: 'SET_CONNECTIONSTATE', payload: { connectionState: pc.connectionState } })
    }

    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track)
      })
    }

    pc.onicecandidate = (event) => {
      if (event.candidate != null) {
        addDoc(offerCandidatesCollection, event.candidate.toJSON()).catch((err) => console.error(err))
      }
    }

    onSnapshot(callDoc, (snapshot) => {
      const { answer } = snapshot.data() as any
      if (answer !== undefined && pc.remoteDescription == null) {
        const answerDescription = new RTCSessionDescription(answer)
        pc.setRemoteDescription(answerDescription).catch((err) => console.error(err))
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

    const dataChannel = pc.createDataChannel('channel')

    dataChannel.onopen = () => {
      console.info('Data channel opened!')
      dispatch({ type: 'SET_DATACHANNEL', payload: { dataChannel } })
    }

    dataChannel.onmessage = ({ data }) => {
      onMessageReceived(JSON.parse(data))
    }

    return callDocId
  }

  const answerOffer = async (callDocId: string): Promise<void> => {
    const blackSilence = new MediaStream([white(), silence()])
    blackSilence.getTracks().forEach((track) => {
      pc.addTrack(track, localStream)
    })

    const callDoc = doc(firestore, 'calls', callDocId)

    const offerCandidatesCollection = collection(firestore, 'calls', callDocId, 'offerCandidates')
    const answerCandidatesCollection = collection(firestore, 'calls', callDocId, 'answerCandidates')

    let count = 0

    pc.onnegotiationneeded = async () => {
      console.count('here')
      if (count > 3) {
        return
      }

      const { offer } = (await getDoc(callDoc)).data() as any
      await pc.setRemoteDescription(new RTCSessionDescription(offer))

      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      await updateDoc(callDoc, {
        answer: { type: answer.type, sdp: answer.sdp },
      })

      if (count === 0) {
        onSnapshot(offerCandidatesCollection, (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const data = change.doc.data()
              pc.addIceCandidate(new RTCIceCandidate(data)).catch((err) => console.error(err))
            }
          })
        })
      }

      count += 1
    }

    pc.onconnectionstatechange = () => {
      console.info(pc.connectionState)
      dispatch({ type: 'SET_CONNECTIONSTATE', payload: { connectionState: pc.connectionState } })
    }

    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track)
      })
    }
    pc.onicecandidate = (event) => {
      if (event.candidate !== null) {
        addDoc(answerCandidatesCollection, event.candidate.toJSON()).catch((err) => console.error(err))
      }
    }

    pc.ondatachannel = ({ channel }) => {
      console.info('Data channel received!')
      dispatch({ type: 'SET_DATACHANNEL', payload: { dataChannel: channel } })

      channel.onmessage = ({ data }) => {
        onMessageReceived(JSON.parse(data))
      }
    }
  }

  const closeConnection = (): void => {
    pc.close()
    dispatch({ type: 'SET_CONNECTIONSTATE', payload: { connectionState: pc.connectionState } })
  }

  const send = (message: any): void => {
    if (dataChannel != null) {
      dataChannel.send(JSON.stringify(message))
    }
  }

  return { createOffer, answerOffer, setRemoteStream, closeConnection, send }
}

export default useSignal
