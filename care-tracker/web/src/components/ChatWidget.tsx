import { useState, useRef, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { MessageCircle, X, Send, Loader2, Key, Eye, EyeOff, RotateCcw, ChevronDown } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { useChatContext } from '@/context/ChatContext'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number }
}

const pageNames: Record<string, string> = {
  '/today': 'Today (dashboard)',
  '/family-guide': 'Family Care Guide',
  '/medications': 'Medications',
  '/vitals': 'Vitals',
  '/glucose': 'Glucose',
  '/labs': 'Labs',
  '/wounds': 'Wounds',
  '/symptoms': 'Symptoms',
  '/appointments': 'Appointments',
  '/action-items': 'Action Items',
  '/weekly-summary': 'Weekly Summary',
  '/emergency': 'Emergency',
}

const STORAGE_KEY = 'care-tracker-deepseek-key'

function loadKey(): string {
  try { return localStorage.getItem(STORAGE_KEY) || '' } catch { return '' }
}
function saveKey(k: string) {
  try { localStorage.setItem(STORAGE_KEY, k) } catch {}
}
function removeKey() {
  try { localStorage.removeItem(STORAGE_KEY) } catch {}
}

function getJwt(): string | null {
  try {
    const stored = localStorage.getItem('care-tracker-auth')
    if (stored) {
      const { token } = JSON.parse(stored)
      return token || null
    }
  } catch {}
  return null
}

function fmtTime(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const INPUT_PRICE = 0.27
const OUTPUT_PRICE = 1.10

function calcCost(usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number }): string {
  if (!usage || usage.total_tokens === 0) return ''
  const cost = (usage.prompt_tokens / 1_000_000) * INPUT_PRICE + (usage.completion_tokens / 1_000_000) * OUTPUT_PRICE
  if (cost < 0.0001) return '<$0.0001'
  return `$${cost.toFixed(4)}`
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState('')
  const [apiKey, setApiKey] = useState(loadKey)
  const [showKey, setShowKey] = useState(false)
  const [saved, setSaved] = useState(!!loadKey())
  const [showScrollBtn, setShowScrollBtn] = useState(false)

  const location = useLocation()
  const { pageContext, setOnSend } = useChatContext()

  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isNearBottomRef = useRef(true)
  const pendingRef = useRef<string | null>(null)
  const messagesRef = useRef(messages)
  messagesRef.current = messages
  const apiKeyRef = useRef(apiKey)
  apiKeyRef.current = apiKey
  const openRef = useRef(open)
  openRef.current = open

  const scrollToBottom = useCallback((smooth = false) => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: smooth ? 'smooth' : 'auto' as ScrollBehavior })
  }, [])

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    isNearBottomRef.current = nearBottom
    setShowScrollBtn(!nearBottom)
  }, [])

  // Auto-scroll to bottom only if user is already near the bottom
  useEffect(() => {
    if (isNearBottomRef.current) {
      scrollToBottom(false)
    }
  }, [messages, loading, scrollToBottom])

  useEffect(() => {
    scrollRef.current?.addEventListener('scroll', handleScroll, { passive: true })
    return () => scrollRef.current?.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  const resetTextarea = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [])

  async function doSend(text: string) {
    if (!text.trim()) return
    if (!apiKeyRef.current.trim()) {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Enter your DeepSeek API key above and click **Save Key** first.', timestamp: fmtTime() }])
      return
    }
    setLoading(true)
    const userMsg: Message = { role: 'user', content: text, timestamp: fmtTime() }
    const updated = [...messagesRef.current, userMsg]
    setMessages(updated)
    try {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(getJwt() ? { Authorization: `Bearer ${getJwt()}` } : {}),
        },
        body: JSON.stringify({
          messages: updated.map((m) => ({ role: m.role, content: m.content })),
          page: pageNames[location.pathname] || location.pathname,
          context: pageContext,
          api_key: apiKeyRef.current,
        }),
      })

      if (!res.ok) {
        const err = await res.text()
        setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${res.status}`, timestamp: fmtTime() }])
        return
      }

      if (res.headers.get('content-type')?.includes('application/json')) {
        // Non-streaming fallback (e.g. missing API key)
        const data = await res.json()
        setMessages((prev) => [...prev, { role: 'assistant', content: data.content, timestamp: fmtTime(), usage: data.usage }])
        return
      }

      // Streaming path
      const reader = res.body?.getReader()
      if (!reader) throw new Error('No reader')

      const decoder = new TextDecoder()
      let buffer = ''
      let full = ''
      let finalUsage: any = null
      setStreaming('')

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          try {
            const parsed = JSON.parse(data)
            if (parsed.content) {
              full += parsed.content
              setStreaming(full)
            }
            if (parsed.usage) {
              finalUsage = parsed.usage
            }
            if (parsed.error) {
              setStreaming('')
              setMessages((prev) => [...prev, { role: 'assistant', content: `API error: ${parsed.error}`, timestamp: fmtTime() }])
              return
            }
          } catch {}
        }
      }

      // Commit the complete message
      if (full) {
        setMessages((prev) => [...prev, { role: 'assistant', content: full, timestamp: fmtTime(), usage: finalUsage }])
      }
      setStreaming('')
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, something went wrong.', timestamp: fmtTime() }])
    } finally {
      setLoading(false)
    }
  }

  async function send() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    resetTextarea()
    await doSend(text)
  }

  // Register send function so sparkle buttons can trigger queries
  useEffect(() => {
    setOnSend((text: string) => {
      if (openRef.current) {
        doSend(text)
      } else {
        pendingRef.current = text
        setOpen(true)
      }
    })
    return () => setOnSend(null)
  }, [setOnSend])

  // Auto-send pending message when panel opens
  useEffect(() => {
    if (open && pendingRef.current) {
      const text = pendingRef.current
      pendingRef.current = null
      const timer = setTimeout(() => doSend(text), 150)
      return () => clearTimeout(timer)
    }
  }, [open])

  function handleSave() {
    saveKey(apiKey)
    setSaved(true)
  }

  function handleKeyRemove() {
    setApiKey('')
    setSaved(false)
    removeKey()
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }

  return (
    <>
      {/* Panel — always mounted, animated with CSS transitions */}
      <div
        aria-hidden={!open}
        className={cn(
          'fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] lg:bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] right-2 sm:right-5 z-50 w-[calc(100vw-2rem)] sm:w-[420px] max-h-[calc(100vh-7rem)] h-[580px] bg-background border rounded-xl shadow-2xl flex flex-col transition-all duration-200 origin-bottom-right',
          open
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">AI Assistant</span>
            <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-accent text-muted-foreground hidden sm:inline-block">
              {pageNames[location.pathname] || location.pathname}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMessages([])}
              className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground transition-colors"
              title="Clear chat"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setOpen(false)}
              className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* API Key input */}
        <div className="px-4 py-2 border-b shrink-0 space-y-1.5">
          {!saved ? (
            <>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Key className="h-3 w-3" />
                DeepSeek API Key
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
                  placeholder="sk-..."
                  className="flex-1 bg-muted rounded-md px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/20"
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground transition-colors"
                >
                  {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  disabled={!apiKey.trim()}
                  className="text-xs px-3 py-2 rounded bg-primary text-primary-foreground min-h-[44px] hover:opacity-90 disabled:opacity-40 transition-opacity"
                >
                  Save Key
                </button>
                <span className="text-[11px] text-muted-foreground">Stored in your browser only.</span>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs">
                <Key className="h-3 w-3 text-green-600" />
                <span className="text-green-600 font-medium">Active</span>
                <span className="text-muted-foreground">
                  {apiKey.slice(0, 3)}...{apiKey.slice(-4)}
                </span>
              </span>
              <button
                onClick={handleKeyRemove}
                className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md hover:bg-red-50 text-red-500 shrink-0 transition-colors"
                title="Remove saved key"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 space-y-3 relative"
        >
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <MessageCircle className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">
                Ask about{' '}
                <span className="text-foreground/70 font-medium">
                  {pageNames[location.pathname]?.toLowerCase() || 'the data'}
                </span>
                {' '}— the AI queries the live database.
              </p>
            </div>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                'max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed',
                m.role === 'user'
                  ? 'bg-primary text-primary-foreground ml-auto rounded-br-md'
                  : 'bg-muted text-foreground rounded-bl-md'
              )}
            >
              {m.role === 'assistant' ? (
                <div className="overflow-x-auto">
                  <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 text-sm">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{m.content}</p>
              )}
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[11px] opacity-50">{m.timestamp}</span>
                {m.usage && m.usage.total_tokens > 0 && (
                  <span className="text-[11px] opacity-40">
                    {m.usage.total_tokens} tok{calcCost(m.usage) ? ` · ${calcCost(m.usage)}` : ''}
                  </span>
                )}
              </div>
            </div>
          ))}
          {streaming && (
            <div className="max-w-[85%] rounded-xl rounded-bl-md px-3 py-2 text-sm leading-relaxed bg-muted text-foreground">
              <div className="overflow-x-auto">
                <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 text-sm">
                  <ReactMarkdown>{streaming}</ReactMarkdown>
                </div>
              </div>
              <div className="flex items-center gap-1 mt-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-foreground/40 animate-pulse" />
              </div>
            </div>
          )}
          {loading && (
            <div className="bg-muted rounded-xl rounded-bl-md px-3 py-2 max-w-[85%] flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="text-sm text-muted-foreground">Thinking...</span>
            </div>
          )}

          {/* Scroll-to-bottom button */}
          {showScrollBtn && (
            <button
              onClick={() => { scrollToBottom(true); setShowScrollBtn(false); }}
              className="absolute bottom-3 right-4 z-10 p-3 rounded-full bg-background border shadow-md min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Scroll to bottom"
            >
              <ChevronDown className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Input */}
        <div className="border-t px-3 py-2 flex items-end gap-2 shrink-0">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
            placeholder="Ask about the data... (Shift+Enter for newline)"
            rows={1}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground resize-none max-h-[120px] py-1.5"
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            className="p-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 shrink-0 mb-0.5 transition-opacity min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          bottom: `max(calc(4.25rem + env(safe-area-inset-bottom, 0px)), 1.25rem)`,
          right: '1.25rem',
        }}
        className={cn(
          'fixed z-50 rounded-full p-3.5 shadow-lg transition-all duration-300 lg:bottom-[max(1.25rem,calc(env(safe-area-inset-bottom,16px)+0.25rem))]',
          open
            ? 'bg-green-600 text-white hover:bg-green-700 shadow-green-500/25'
            : 'bg-primary text-primary-foreground hover:shadow-xl'
        )}
      >
        <MessageCircle className={cn('h-5 w-5 transition-transform duration-300', open && 'scale-110')} />
      </button>
    </>
  )
}
