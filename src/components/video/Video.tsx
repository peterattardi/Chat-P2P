import React from 'react'

interface VideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {}

const Video = React.forwardRef((props: VideoProps, ref: React.ForwardedRef<HTMLVideoElement>) => {
  const { className, ...htmlProps } = props
  return <video className={`${className} object-cover rounded-md border-[2px] border-black w-full aspect-square`} ref={ref} {...htmlProps} playsInline autoPlay />
})

export default Video
