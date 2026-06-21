import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react'

interface ChatContextValue {
  pageContext: string
  setPageContext: (text: string) => void
  sendMessage: (text: string) => void
  onSend: ((text: string) => void) | null
  setOnSend: (fn: ((text: string) => void) | null) => void
}

const ChatContext = createContext<ChatContextValue>({
  pageContext: '',
  setPageContext: () => {},
  sendMessage: () => {},
  onSend: null,
  setOnSend: () => {},
})

export function ChatProvider({ children }: { children: ReactNode }) {
  const [pageContext, setPageContext] = useState('')
  const onSendRef = useRef<((text: string) => void) | null>(null)

  const setOnSend = useCallback((fn: ((text: string) => void) | null) => {
    onSendRef.current = fn
  }, [])

  const sendMessage = useCallback((text: string) => {
    onSendRef.current?.(text)
  }, [])

  return (
    <ChatContext.Provider value={{ pageContext, setPageContext, sendMessage, onSend: null, setOnSend }}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChatContext() {
  return useContext(ChatContext)
}

export function usePageContext(text: string) {
  const { setPageContext } = useChatContext()
  const update = useCallback(() => setPageContext(text), [text, setPageContext])
  return update
}
