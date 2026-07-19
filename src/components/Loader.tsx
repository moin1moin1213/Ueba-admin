export function Loader() {
  return <div className="loader" />
}

export function FullScreenLoader() {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-white/70">
      <Loader />
    </div>
  )
}
