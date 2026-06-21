import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="fixed bottom-0 right-0 z-50 flex flex-col gap-2 p-4 max-w-sm w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "group pointer-events-auto relative flex w-full items-center justify-between space-x-2 overflow-hidden rounded-md border p-4 pr-6 shadow-lg transition-all animate-in slide-in-from-right-full",
            toast.variant === "destructive"
              ? "border-destructive bg-destructive text-destructive-foreground"
              : "border bg-background text-foreground"
          )}
        >
          <div className="flex-1">
            {toast.title && (
              <div className="text-sm font-semibold">{toast.title}</div>
            )}
            {toast.description && (
              <div className="text-sm opacity-90">{toast.description}</div>
            )}
          </div>
          <button
            onClick={() => dismiss(toast.id)}
            className="absolute right-1 top-1 rounded-md p-1 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 focus:outline-none"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
