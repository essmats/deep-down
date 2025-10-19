"use client"

import { useState, forwardRef, useImperativeHandle, useRef } from "react"
import { Pencil, RefreshCw, Check, X, Square } from "lucide-react"
import Message from "./Message"
import Composer from "./Composer"
import { cls, timeAgo } from "./utils"

const HTML_CODE_BLOCK_REGEX = /```(?:html?|markup|tailwindcss|xml)\s*([\s\S]*?)```/i

function extractHtmlArtifact(text) {
  if (!text) return null

  const codeBlockMatch = text.match(HTML_CODE_BLOCK_REGEX)
  if (codeBlockMatch && codeBlockMatch[1]) {
    return codeBlockMatch[1].trim()
  }

  const trimmed = text.trim()
  if (!trimmed) return null

  const looksLikeHtml =
    trimmed.startsWith("<!DOCTYPE html") ||
    trimmed.startsWith("<html") ||
    trimmed.startsWith("<div") ||
    trimmed.startsWith("<section") ||
    trimmed.startsWith("<main") ||
    trimmed.startsWith("<body")

  if (looksLikeHtml) {
    return trimmed
  }

  return null
}

function ThinkingMessage({ onPause }) {
  return (
    <Message role="assistant">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s]"></div>
          <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s]"></div>
          <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400"></div>
        </div>
        <span className="text-sm text-zinc-500">AI is thinking...</span>
        <button
          onClick={onPause}
          className="ml-auto inline-flex items-center gap-1 rounded-full border border-zinc-300 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          <Square className="h-3 w-3" /> Pause
        </button>
      </div>
    </Message>
  )
}

const ChatPane = forwardRef(function ChatPane(
  { conversation, onSend, onEditMessage, onResendMessage, isThinking, onPauseThinking },
  ref,
) {
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft] = useState("")
  const [busy, setBusy] = useState(false)
  const [openPreviews, setOpenPreviews] = useState({})
  const composerRef = useRef(null)

  useImperativeHandle(
    ref,
    () => ({
      insertTemplate: (templateContent) => {
        composerRef.current?.insertTemplate(templateContent)
      },
    }),
    [],
  )

  if (!conversation) return null

  const tags = ["Certified", "Personalized", "Experienced", "Helpful"]
  const messages = Array.isArray(conversation.messages) ? conversation.messages : []
  const count = messages.length || conversation.messageCount || 0

  function startEdit(m) {
    setEditingId(m.id)
    setDraft(m.content)
  }
  function cancelEdit() {
    setEditingId(null)
    setDraft("")
  }
  function saveEdit() {
    if (!editingId) return
    onEditMessage?.(editingId, draft)
    cancelEdit()
  }
  function saveAndResend() {
    if (!editingId) return
    onEditMessage?.(editingId, draft)
    onResendMessage?.(editingId)
    cancelEdit()
  }

  const togglePreview = (messageId) => {
    setOpenPreviews((prev) => ({
      ...prev,
      [messageId]: !prev[messageId],
    }))
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-6 sm:px-8">
        <div className="mb-2 text-3xl font-serif tracking-tight sm:text-4xl md:text-5xl">
          <span className="block leading-[1.05] font-sans text-2xl">{conversation.title}</span>
        </div>
        <div className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
          Updated {timeAgo(conversation.updatedAt)} · {count} messages
        </div>

        <div className="mb-6 flex flex-wrap gap-2 border-b border-zinc-200 pb-5 dark:border-zinc-800">
          {tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-700 dark:border-zinc-800 dark:text-zinc-200"
            >
              {t}
            </span>
          ))}
        </div>

        {messages.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 p-6 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            No messages yet. Say hello to start.
          </div>
        ) : (
          <>
            {messages.map((m) => {
              const isImageMessage = Boolean(m.imageUrl)
              const isAudioMessage = Boolean(m.audioUrl)
              const htmlPreview = m.role === "assistant" ? extractHtmlArtifact(m.content) : null
              const previewOpen = htmlPreview && openPreviews[m.id]
              return (
                <div key={m.id} className="space-y-2">
                {editingId === m.id ? (
                  <div className={cls("rounded-2xl border p-2", "border-zinc-200 dark:border-zinc-800")}>
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      className="w-full resize-y rounded-xl bg-transparent p-2 text-sm outline-none"
                      rows={3}
                    />
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={saveEdit}
                        className="inline-flex items-center gap-1 rounded-full bg-zinc-900 px-3 py-1.5 text-xs text-white dark:bg-white dark:text-zinc-900"
                      >
                        <Check className="h-3.5 w-3.5" /> Save
                      </button>
                      <button
                        onClick={saveAndResend}
                        className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs"
                      >
                        <RefreshCw className="h-3.5 w-3.5" /> Save & Resend
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs"
                      >
                        <X className="h-3.5 w-3.5" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <Message role={m.role}>
                      {isImageMessage || isAudioMessage ? (
                        <div className="space-y-3">
                          {m.content && <div className="whitespace-pre-wrap">{m.content}</div>}
                          {isImageMessage && (
                            <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={m.imageUrl}
                                alt={m.content || "Generated image"}
                                className="h-auto w-full max-w-[480px] object-cover"
                                decoding="async"
                              />
                            </div>
                          )}
                          {isImageMessage && (
                            <div className="text-xs text-zinc-500 dark:text-zinc-400">
                              <a
                                href={m.imageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline underline-offset-2"
                              >
                                Open image in new tab
                              </a>
                              {!m.imageDirect && " · Preview rendered locally"}
                            </div>
                          )}
                          {isAudioMessage && (
                            <div className="space-y-1">
                              <audio
                                controls
                                src={m.audioUrl}
                                className="w-full max-w-[360px]"
                                preload="none"
                              />
                              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                                <a
                                  href={m.audioUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="underline underline-offset-2"
                                >
                                  Download audio
                                </a>
                                {m.audioMime && ` · ${m.audioMime}`}
                              </div>
                            </div>
                          )}
                          {htmlPreview && (
                            <div className="space-y-2">
                              <button
                                onClick={() => togglePreview(m.id)}
                                className="inline-flex items-center gap-1 rounded-full border border-zinc-300 px-3 py-1 text-xs text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                              >
                                {previewOpen ? "Hide Preview" : "Show Preview"}
                              </button>
                              {previewOpen && (
                                <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                                  <iframe
                                    srcDoc={htmlPreview}
                                    title="HTML Preview"
                                    className="h-[360px] w-full border-0"
                                    sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-modals"
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="whitespace-pre-wrap">{m.content}</div>
                          {htmlPreview && (
                            <div className="space-y-2">
                              <button
                                onClick={() => togglePreview(m.id)}
                                className="inline-flex items-center gap-1 rounded-full border border-zinc-300 px-3 py-1 text-xs text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                              >
                                {previewOpen ? "Hide Preview" : "Show Preview"}
                              </button>
                              {previewOpen && (
                                <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                                  <iframe
                                    srcDoc={htmlPreview}
                                    title="HTML Preview"
                                    className="h-[360px] w-full border-0"
                                    sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-modals"
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    {m.role === "user" && (
                      <div className="mt-1 flex gap-2 text-[11px] text-zinc-500">
                        <button className="inline-flex items-center gap-1 hover:underline" onClick={() => startEdit(m)}>
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button
                          className="inline-flex items-center gap-1 hover:underline"
                          onClick={() => onResendMessage?.(m.id)}
                        >
                          <RefreshCw className="h-3.5 w-3.5" /> Resend
                        </button>
                      </div>
                    )}
                  </Message>
                )}
              </div>
              )
            })}
            {isThinking && <ThinkingMessage onPause={onPauseThinking} />}
          </>
        )}
      </div>

      <Composer
        ref={composerRef}
        conversation={conversation}
        onSend={async (text, attachments) => {
          if (!text.trim()) return
          setBusy(true)
          await onSend?.(text, attachments)
          setBusy(false)
        }}
        busy={busy}
      />
    </div>
  )
})

export default ChatPane
