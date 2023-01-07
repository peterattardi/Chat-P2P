import { useNavigate } from 'react-router-dom'
import { Button } from '../../components'
import { useSignal } from '../../hooks'
import Layout from '../Layout'

const StartRoom = (): JSX.Element => {
  const { createOffer } = useSignal()
  const navigate = useNavigate()

  const handleCreateRoom = (): void => {
    createOffer()
      .then((callId) => navigate(`/${callId}`, { state: { offer: true } }))
      .catch((err) => console.error(err))
  }

  // const handleAnswerOffer = (event: BaseSyntheticEvent): void => {
  //   event.preventDefault()
  //   const id = event.target[0].value as string

  //   answerOffer(id)
  //     .then(() => navigate(`/${id}`))
  //     .catch((err) => console.error(err))
  // }

  return (
    <Layout>
      <section className='w-full flex flex-col justify-center items-center space-y-[64px] min-h-[calc(100vh-240px)]'>
        <h1 className='text-[3vh] font-bold'>Welcome to Chat P2P</h1>
        <section className='flex flex-col justify-center items-center space-y-[100px] pt-[60px]'>
          <p className='tracking-wide text-center'>
            Click the botton below to create a new room 📺
            <br />
            <br />
            After you are in, copy and paste the url in another tab or give it to a friend ✨
          </p>
          <Button type='button' onClick={handleCreateRoom}>
            Create room
          </Button>

          <p className='tracking-wide text-center'>Once you are both joined, open the webcam and start chatting!</p>
          {/* <form className='flex justify-center space-x-[32px] items-end' onSubmit={handleAnswerOffer}>
            <Input placeholder='Room id' label='Room ID' />
            <Button buttonType='secondary'>Join</Button>
          </form> */}
        </section>
      </section>
    </Layout>
  )
}

export default StartRoom
