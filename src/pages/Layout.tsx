import { PropsWithChildren } from 'react'

const Layout = ({ children }: PropsWithChildren): JSX.Element => {
  return (
    <main className='w-full min-h-screen overflow-hidden xl:px-[104px] md:px-[72px] px-[16px] py-[120px]'>
      <section id='application' className='max-w-[1920px] mx-auto'>
        {children}
      </section>
    </main>
  )
}

export default Layout
