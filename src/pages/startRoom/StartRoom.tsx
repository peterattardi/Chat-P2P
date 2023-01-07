import { Button, Input } from '../../components'
import Layout from '../Layout'

const StartRoom = (): JSX.Element => {
  return (
    <Layout>
      <section className='flex flex-col justify-center items-center min-h-screen space-y-[200px]'>
        <Button>Create room</Button>
        <form className='flex justify-center space-x-[32px] items-end'>
          <Input placeholder='Room id' label='Room ID' />
          <Button buttonType='secondary'>Join</Button>
        </form>
      </section>
    </Layout>
  )
}

export default StartRoom
