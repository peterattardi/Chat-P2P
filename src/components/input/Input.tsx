interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

const Input = (props: InputProps): JSX.Element => {
  const { label, error, className, ...htmlProps } = props
  return (
    <div className={`${className ?? ''} flex flex-col space-y-[8px] relative`}>
      <span className='text-[14px] tracking-wide'>{label}</span>
      <input className='rounded-md border border-black outline-none h-[48px] px-[24px]' {...htmlProps} />
      {error != null && <span className=' absolute top-full left-0 text-[14px] tracking-wide text-red-600'>{error}</span>}
    </div>
  )
}

export default Input
