import LocalizedClientLink from "../localized-client-link"

type InteractiveLinkProps = {
  href: string
  children?: React.ReactNode
  onClick?: () => void
}

const InteractiveLink = ({
  href,
  children,
  onClick,
  ...props
}: InteractiveLinkProps) => {
  return (
    <LocalizedClientLink
      className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
      href={href}
      onClick={onClick}
      {...props}
    >
      {children}
    </LocalizedClientLink>
  )
}

export default InteractiveLink
