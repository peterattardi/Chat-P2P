import React from 'react'

interface VideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {}

const Video = React.forwardRef((props: VideoProps, ref: React.ForwardedRef<HTMLVideoElement>) => {
  const { className, ...htmlProps } = props

  return (
    <video className={`${className ?? ''} object-cover rounded-md border-[2px] border-black w-[50vw] h-[50vh]`} ref={ref} {...htmlProps} playsInline autoPlay controls={false} />
  )
})

export default Video
