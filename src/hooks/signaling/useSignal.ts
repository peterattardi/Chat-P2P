import { addDoc, collection, doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore'
import { useContext, useState } from 'react'
import { firestore } from '../../../firebase'
import { PeerConnectionContext } from '../../contexts'

interface UseSignalProps {
  connectionState: RTCPeerConnectionState
  createOffer: (remoteWebcam: HTMLVideoElement) => Promise<string>
  answerOffer: (callDocId: string, remoteWebcam: HTMLVideoElement) => Promise<void>
}

const useSignal = (): UseSignalProps => {
  const {
    state: { pc, remoteStream, localStream }
  } = useContext(PeerConnectionContext)
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>(pc.connectionState)

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

  const createOffer = async (remoteWebcam: HTMLVideoElement): Promise<string> => {
    const { id: callDocId } = await addDoc(collection(firestore, 'calls'), {})
    const callDoc = doc(firestore, 'calls', callDocId)
    const offerCandidatesCollection = collection(firestore, 'calls', callDocId, 'offerCandidates')
    const answerCandidatesCollection = collection(firestore, 'calls', callDocId, 'answerCandidates')

    remoteWebcam.srcObject = remoteStream

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
      setConnectionState(pc.connectionState)
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
      if (answer !== undefined && answer !== pc.remoteDescription) {
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

    return callDocId
  }

  const answerOffer = async (callDocId: string, remoteWebcam: HTMLVideoElement): Promise<void> => {
    remoteWebcam.srcObject = remoteStream

    const blackSilence = new MediaStream([black(), silence()])
    blackSilence.getTracks().forEach((track) => {
      pc.addTrack(track, localStream)
    })

    const callDoc = doc(firestore, 'calls', callDocId)

    const offerCandidatesCollection = collection(firestore, 'calls', callDocId, 'offerCandidates')
    const answerCandidatesCollection = collection(firestore, 'calls', callDocId, 'answerCandidates')

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
            pc.addIceCandidate(new RTCIceCandidate(data)).catch((err) => console.error(err))
          }
        })
      })
    }

    pc.onconnectionstatechange = () => {
      setConnectionState(pc.connectionState)
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
  }

  return { createOffer, answerOffer, connectionState }
}

export default useSignal
