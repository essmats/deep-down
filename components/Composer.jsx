"use client"

import { useRef, useState, forwardRef, useImperativeHandle, useEffect } from "react"
import { Send, Loader2, Plus, Mic, X, Download } from "lucide-react"
import ComposerActionsPopover from "./ComposerActionsPopover"
import { cls } from "./utils"

const Composer = forwardRef(function Composer({ onSend, busy, conversation }, ref) {
  const [value, setValue] = useState("")
  const [sending, setSending] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [lineCount, setLineCount] = useState(1)
  const [attachments, setAttachments] = useState([])
  const inputRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (inputRef.current) {
      const textarea = inputRef.current
      const lineHeight = 20
      const minHeight = 40

      textarea.style.height = "auto"
      const scrollHeight = textarea.scrollHeight
      const calculatedLines = Math.max(1, Math.floor((scrollHeight - 16) / lineHeight))

      setLineCount(calculatedLines)

      if (calculatedLines <= 12) {
        textarea.style.height = `${Math.max(minHeight, scrollHeight)}px`
        textarea.style.overflowY = "hidden"
      } else {
        textarea.style.height = `${minHeight + 11 * lineHeight}px`
        textarea.style.overflowY = "auto"
      }
    }
  }, [value])

  useImperativeHandle(
    ref,
    () => ({
      insertTemplate: (templateContent) => {
        setValue((prev) => {
          const newValue = prev ? `${prev}\n\n${templateContent}` : templateContent
          setTimeout(() => {
            inputRef.current?.focus()
            const length = newValue.length
            inputRef.current?.setSelectionRange(length, length)
          }, 0)
          return newValue
        })
      },
      focus: () => {
        inputRef.current?.focus()
      },
    }),
    [],
  )

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || [])
    const maxSize = 10 * 1024 * 1024 // 10MB default

    files.forEach((file) => {
      if (file.size > maxSize) {
        alert(`File ${file.name} exceeds 10MB limit`)
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        const attachment = {
          id: Math.random().toString(36).slice(2),
          name: file.name,
          type: file.type,
          size: file.size,
          data: event.target?.result,
        }
        setAttachments((prev) => [...prev, attachment])
      }
      reader.readAsDataURL(file)
    })

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removeAttachment = (id) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id))
  }

  const handleExportChat = () => {
    if (!conversation?.messages || conversation.messages.length === 0) {
      alert("No messages to export")
      return
    }

    const content = conversation.messages
      .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
      .join("\n\n")

    const element = document.createElement("a")
    element.setAttribute("href", `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`)
    element.setAttribute("download", `chat-${conversation.id || "export"}.txt`)
    element.style.display = "none"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  async function handleSend() {
    if (!value.trim() || sending) return
    setSending(true)
    try {
      await onSend?.(value, attachments)
      setValue("")
      setAttachments([])
      inputRef.current?.focus()
    } finally {
      setSending(false)
    }
  }

  const hasContent = value.length > 0

  return (
    <div className="border-t border-zinc-200/60 p-4 dark:border-zinc-800">
      {attachments.length > 0 && (
        <div className="mx-auto max-w-3xl mb-3 flex flex-wrap gap-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-900"
            >
              <span className="truncate max-w-[150px]">{attachment.name}</span>
              <button
                onClick={() => removeAttachment(attachment.id)}
                className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div
        className={cls(
          "mx-auto flex flex-col rounded-2xl border bg-white shadow-sm dark:bg-zinc-950 transition-all duration-200",
          "max-w-3xl border-zinc-300 dark:border-zinc-700 p-3",
        )}
      >
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="How can I help you today?"
            rows={1}
            className={cls(
              "w-full resize-none bg-transparent text-sm outline-none placeholder:text-zinc-400 transition-all duration-200",
              "px-0 py-2 min-h-[40px] text-left",
            )}
            style={{
              height: "auto",
              overflowY: lineCount > 12 ? "auto" : "hidden",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
          />
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1">
            <ComposerActionsPopover onFileSelect={handleFileSelect}>
              <button
                className="inline-flex shrink-0 items-center justify-center rounded-full p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-colors"
                title="Add attachment"
              >
                <Plus className="h-4 w-4" />
              </button>
            </ComposerActionsPopover>
            {conversation?.messages && conversation.messages.length > 0 && (
              <button
                onClick={handleExportChat}
                className="inline-flex shrink-0 items-center justify-center rounded-full p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-colors"
                title="Export chat"
              >
                <Download className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              className="inline-flex items-center justify-center rounded-full p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-colors"
              title="Voice input"
            >
              <Mic className="h-4 w-4" />
            </button>
            <button
              onClick={handleSend}
              disabled={sending || busy || !value.trim()}
              className={cls(
                "inline-flex shrink-0 items-center gap-2 rounded-full bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:bg-white dark:text-zinc-900",
                (sending || busy || !value.trim()) && "opacity-50 cursor-not-allowed",
              )}
            >
              {sending || busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-2 max-w-3xl px-1 text-[11px] text-zinc-500 dark:text-zinc-400">
        Press{" "}
        <kbd className="rounded border border-zinc-300 bg-zinc-50 px-1 dark:border-zinc-600 dark:bg-zinc-800">
          Enter
        </kbd>{" "}
        to send ·{" "}
        <kbd className="rounded border border-zinc-300 bg-zinc-50 px-1 dark:border-zinc-600 dark:bg-zinc-800">
          Shift
        </kbd>
        +
        <kbd className="rounded border border-zinc-300 bg-zinc-50 px-1 dark:border-zinc-600 dark:bg-zinc-800">
          Enter
        </kbd>{" "}
        for newline
      </div>

      <input ref={fileInputRef} type="file" multiple onChange={handleFileSelect} className="hidden" accept="*/*" />
    </div>
  )
})

export default Composer
