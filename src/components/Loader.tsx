export function Loader({ size = 40 }: { size?: number }) {
  return <div className="loader" style={{ width: size }} />
}

export function FullScreenLoader() {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-white/70">
      <Loader />
    </div>
  )
}
