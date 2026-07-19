'use client'

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

interface ConfirmOptions {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | null>(null)

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext)
  if (!ctx) {
    throw new Error('useConfirm must be used inside <ConfirmProvider>')
  }
  return ctx
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<{
    options: ConfirmOptions
    resolve: (value: boolean) => void
  } | null>(null)

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      setPending({ options, resolve })
    })
  }, [])

  const close = (result: boolean) => {
    pending?.resolve(result)
    setPending(null)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      {pending && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onClick={() => close(false)}
        >
          <div
            className="bg-white rounded-2xl border border-border p-6 w-full max-w-sm shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {pending.options.title && (
              <h3 className="text-lg font-semibold text-text-dark mb-2">
                {pending.options.title}
              </h3>
            )}
            <p className="text-sm text-text-grey mb-6">{pending.options.message}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => close(false)}
                className="px-4 py-2 rounded-lg text-sm border border-border text-text-dark hover:bg-gray-50"
              >
                {pending.options.cancelLabel || 'Cancel'}
              </button>
              <button
                onClick={() => close(true)}
                className={`px-4 py-2 rounded-lg text-sm text-white ${
                  pending.options.danger ? 'bg-red-600' : 'bg-teal-600'
                }`}
              >
                {pending.options.confirmLabel || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}
