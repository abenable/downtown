import Spinner from "@modules/common/icons/spinner"

export default function Loading() {
  return (
    <div className="flex items-center justify-center w-full min-h-[320px]">
      <Spinner size={36} />
    </div>
  )
}
