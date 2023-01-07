interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  buttonType?: 'primary' | 'secondary' | 'tertiary'
  small?: boolean
}

const Button = (props: ButtonProps): JSX.Element => {
  const { buttonType = 'primary', small = false, className, ...htmlProps } = props

  const styleClassName = (() => {
    switch (buttonType) {
      case 'primary':
        return 'rounded-md bg-black text-white hover:opacity-80 active:opacity-100'
      case 'secondary':
        return 'border-[2px] border-black rounded-md hover:bg-black hover:ring-none hover:text-white'
      case 'tertiary':
        return 'hover:underline'

      default:
        return ''
    }
  })()

  const sizeClassName = (() => {
    return !small ? 'h-[48px] px-[32px] text-[16px]' : 'h-[32px] px-[12px] text-[14px]'
  })()

  return (
    <button
      className={`${styleClassName} ${className ?? ''} ${sizeClassName} transition-all duration-200 w-min whitespace-nowrap ${
        htmlProps.disabled ? 'pointer-events-none opacity-40' : ''
      }`}
      {...htmlProps}
    />
  )
}

export default Button
