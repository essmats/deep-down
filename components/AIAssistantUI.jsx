"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Calendar, LayoutGrid, MoreHorizontal } from "lucide-react"
import Sidebar from "./Sidebar"
import Header from "./Header"
import ChatPane from "./ChatPane"
import GhostIconButton from "./GhostIconButton"
import ThemeToggle from "./ThemeToggle"
import { INITIAL_CONVERSATIONS, INITIAL_TEMPLATES, INITIAL_FOLDERS } from "./mockData"
import { loadSettings, saveSettings } from "./SettingsManager"
import { DEFAULT_TEXT_MODEL_ID, DEFAULT_IMAGE_MODEL_ID } from "../lib/pollinationsCatalog"

const CONVERSATIONS_STORAGE_KEY = "chatbot-conversations"
const SELECTED_CONVERSATION_STORAGE_KEY = "chatbot-selected-conversation"
const FOLDERS_STORAGE_KEY = "chatbot-folders"
const TEMPLATES_STORAGE_KEY = "chatbot-templates"

export default function AIAssistantUI() {
  const [theme, setTheme] = useState(() => {
    const saved = typeof window !== "undefined" && localStorage.getItem("theme")
    if (saved) return saved
    if (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches)
      return "dark"
    return "light"
  })

  useEffect(() => {
    try {
      if (theme === "dark") document.documentElement.classList.add("dark")
      else document.documentElement.classList.remove("dark")
      document.documentElement.setAttribute("data-theme", theme)
      document.documentElement.style.colorScheme = theme
      localStorage.setItem("theme", theme)
    } catch {}
  }, [theme])

  useEffect(() => {
    try {
      const media = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)")
      if (!media) return
      const listener = (e) => {
        const saved = localStorage.getItem("theme")
        if (!saved) setTheme(e.matches ? "dark" : "light")
      }
      media.addEventListener("change", listener)
      return () => media.removeEventListener("change", listener)
    } catch {}
  }, [])

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const raw = localStorage.getItem("sidebar-collapsed")
      return raw ? JSON.parse(raw) : { pinned: true, recent: false, folders: true, templates: true }
    } catch {
      return { pinned: true, recent: false, folders: true, templates: true }
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem("sidebar-collapsed", JSON.stringify(collapsed))
    } catch {}
  }, [collapsed])

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem("sidebar-collapsed-state")
      return saved ? JSON.parse(saved) : false
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem("sidebar-collapsed-state", JSON.stringify(sidebarCollapsed))
    } catch {}
  }, [sidebarCollapsed])

  const [conversations, setConversations] = useState(INITIAL_CONVERSATIONS)
  const [selectedId, setSelectedId] = useState(null)
  const [templates, setTemplates] = useState(INITIAL_TEMPLATES)
  const [folders, setFolders] = useState(INITIAL_FOLDERS)

  const hydrationRef = useRef(false)
  const [hasRestoredState, setHasRestoredState] = useState(false)

  const createNewChat = useCallback(() => {
    const id = Math.random().toString(36).slice(2)
    const item = {
      id,
      title: "New Chat",
      updatedAt: new Date().toISOString(),
      messageCount: 0,
      preview: "Say hello to start...",
      pinned: false,
      folder: "Work Projects",
      messages: [], // Ensure messages array is empty for new chats
    }
    setConversations((prev) => [item, ...prev])
    setSelectedId(id)
    setSidebarOpen(false)
  }, [setConversations, setSelectedId, setSidebarOpen])

  useEffect(() => {
    if (typeof window === "undefined") return
    let restoredConversations = null
    try {
      const storedConversations = localStorage.getItem(CONVERSATIONS_STORAGE_KEY)
      if (storedConversations) {
        const parsed = JSON.parse(storedConversations)
        if (Array.isArray(parsed)) {
          restoredConversations = parsed
          setConversations(parsed)
        }
      }

      const storedFolders = localStorage.getItem(FOLDERS_STORAGE_KEY)
      if (storedFolders) {
        const parsedFolders = JSON.parse(storedFolders)
        if (Array.isArray(parsedFolders) && parsedFolders.length > 0) {
          setFolders(parsedFolders)
        }
      }

      const storedTemplates = localStorage.getItem(TEMPLATES_STORAGE_KEY)
      if (storedTemplates) {
        const parsedTemplates = JSON.parse(storedTemplates)
        if (Array.isArray(parsedTemplates) && parsedTemplates.length > 0) {
          setTemplates(parsedTemplates)
        }
      }

      const storedSelected = localStorage.getItem(SELECTED_CONVERSATION_STORAGE_KEY)
      if (storedSelected && restoredConversations?.some((c) => c.id === storedSelected)) {
        setSelectedId(storedSelected)
      }
    } catch (error) {
      console.error("[v0] Failed to restore chat memory:", error)
    } finally {
      hydrationRef.current = true
      setHasRestoredState(true)
    }
  }, [])

  useEffect(() => {
    if (!hydrationRef.current) return
    try {
      localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(conversations))
    } catch (error) {
      console.error("[v0] Failed to persist conversations:", error)
    }
  }, [conversations])

  useEffect(() => {
    if (!hydrationRef.current) return
    try {
      if (selectedId) localStorage.setItem(SELECTED_CONVERSATION_STORAGE_KEY, selectedId)
      else localStorage.removeItem(SELECTED_CONVERSATION_STORAGE_KEY)
    } catch (error) {
      console.error("[v0] Failed to persist selected conversation:", error)
    }
  }, [selectedId])

  useEffect(() => {
    if (!hydrationRef.current) return
    try {
      localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(folders))
    } catch (error) {
      console.error("[v0] Failed to persist folders:", error)
    }
  }, [folders])

  useEffect(() => {
    if (!hydrationRef.current) return
    try {
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates))
    } catch (error) {
      console.error("[v0] Failed to persist templates:", error)
    }
  }, [templates])

  useEffect(() => {
    if (!hasRestoredState) return
    if (conversations.length === 0) {
      createNewChat()
      return
    }
    if (!selectedId || !conversations.some((c) => c.id === selectedId)) {
      setSelectedId(conversations[0].id)
    }
  }, [hasRestoredState, conversations, selectedId, createNewChat])

  const [query, setQuery] = useState("")
  const searchRef = useRef(null)

  const [isThinking, setIsThinking] = useState(false)
  const [thinkingConvId, setThinkingConvId] = useState(null)

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
        e.preventDefault()
        createNewChat()
      }
      if (!e.metaKey && !e.ctrlKey && e.key === "/") {
        const tag = document.activeElement?.tagName?.toLowerCase()
        if (tag !== "input" && tag !== "textarea") {
          e.preventDefault()
          searchRef.current?.focus()
        }
      }
      if (e.key === "Escape" && sidebarOpen) setSidebarOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [sidebarOpen, conversations, createNewChat])

  const filtered = useMemo(() => {
    if (!query.trim()) return conversations
    const q = query.toLowerCase()
    return conversations.filter((c) => c.title.toLowerCase().includes(q) || c.preview.toLowerCase().includes(q))
  }, [conversations, query])

  const pinned = filtered.filter((c) => c.pinned).sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))

  const recent = filtered
    .filter((c) => !c.pinned)
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .slice(0, 10)

  const folderCounts = React.useMemo(() => {
    const map = Object.fromEntries(folders.map((f) => [f.name, 0]))
    for (const c of conversations) if (map[c.folder] != null) map[c.folder] += 1
    return map
  }, [conversations, folders])

  function togglePin(id) {
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c)))
  }

  function createFolder() {
    const name = prompt("Folder name")
    if (!name) return
    if (folders.some((f) => f.name.toLowerCase() === name.toLowerCase())) return alert("Folder already exists.")
    setFolders((prev) => [...prev, { id: Math.random().toString(36).slice(2), name }])
  }

  function sendMessage(convId, content) {
    if (!content.trim()) return
    const now = new Date().toISOString()
    const userMsg = { id: Math.random().toString(36).slice(2), role: "user", content, createdAt: now }
    const targetConv = conversations.find((c) => c.id === convId)
    const existingMessages = Array.isArray(targetConv?.messages) ? targetConv.messages : []
    const nextMessages = [...existingMessages, userMsg]

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== convId) return c
        return {
          ...c,
          messages: nextMessages,
          updatedAt: now,
          messageCount: nextMessages.length,
          preview: content.slice(0, 80),
        }
      }),
    )

    setIsThinking(true)
    setThinkingConvId(convId)

    const currentConvId = convId

    handleAPICall(currentConvId, content, nextMessages)
  }

  async function handleAPICall(convId, prompt, messageHistory = []) {
    try {
      const { callTextAPI, callImageAPI } = await import("./APIClient")

      // Determine if user wants image or text generation
      const isImageRequest =
        prompt.toLowerCase().includes("image") ||
        prompt.toLowerCase().includes("generate") ||
        prompt.toLowerCase().includes("draw") ||
        prompt.toLowerCase().includes("create picture")

      let assistantResponse = {
        content: "",
        imageUrl: null,
        imageDirect: false,
        audioUrl: null,
        audioMime: null,
      }

      if (isImageRequest) {
        const imageResult = await callImageAPI(
          prompt,
          settings.defaultImageModel || DEFAULT_IMAGE_MODEL_ID,
          settings.imageAPIEndpoint || "https://image.pollinations.ai/prompt",
        )
        assistantResponse = {
          content: "Here is the image I generated:",
          imageUrl: imageResult?.url || null,
          imageDirect: Boolean(imageResult?.direct),
          audioUrl: null,
          audioMime: null,
        }
      } else {
        const limitedHistory = (messageHistory || []).slice(-20)
        const textResult = await callTextAPI({
          prompt,
          model: settings.defaultTextModel || DEFAULT_TEXT_MODEL_ID,
          endpoint: settings.textAPIEndpoint || "https://text.pollinations.ai/openai",
          messages: limitedHistory.map((msg) => ({
            role: msg.role === "assistant" || msg.role === "system" ? msg.role : "user",
            content: msg.content ?? "",
          })),
        })
        assistantResponse = {
          content: textResult?.content || "",
          imageUrl: null,
          imageDirect: false,
          audioUrl: textResult?.audioUrl || null,
          audioMime: textResult?.audioMime || null,
        }
      }

      setIsThinking(false)
      setThinkingConvId(null)

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== convId) return c
          const asstMsg = {
            id: Math.random().toString(36).slice(2),
            role: "assistant",
            content: assistantResponse.content || "",
            imageUrl: assistantResponse.imageUrl,
            imageDirect: assistantResponse.imageDirect,
            audioUrl: assistantResponse.audioUrl,
            audioMime: assistantResponse.audioMime,
            createdAt: new Date().toISOString(),
          }
          const msgs = [...(c.messages || []), asstMsg]
          return {
            ...c,
            messages: msgs,
            updatedAt: new Date().toISOString(),
            messageCount: msgs.length,
            preview: assistantResponse.imageUrl
              ? "[Image Generated]"
              : assistantResponse.audioUrl
                ? "[Audio Generated]"
                : (assistantResponse.content || "").slice(0, 80),
          }
        }),
      )
    } catch (error) {
      console.error("[v0] API call failed:", error)
      setIsThinking(false)
      setThinkingConvId(null)

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== convId) return c
          const errorMsg = {
            id: Math.random().toString(36).slice(2),
            role: "assistant",
            content: `Error: ${error.message || "Failed to get response from API"}`,
            createdAt: new Date().toISOString(),
          }
          const msgs = [...(c.messages || []), errorMsg]
          return {
            ...c,
            messages: msgs,
            updatedAt: new Date().toISOString(),
            messageCount: msgs.length,
            preview: errorMsg.content.slice(0, 80),
          }
        }),
      )
    }
  }

  function editMessage(convId, messageId, newContent) {
    const now = new Date().toISOString()
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== convId) return c
        const msgs = (c.messages || []).map((m) =>
          m.id === messageId ? { ...m, content: newContent, editedAt: now } : m,
        )
        return {
          ...c,
          messages: msgs,
          preview: msgs[msgs.length - 1]?.content?.slice(0, 80) || c.preview,
        }
      }),
    )
  }

  function resendMessage(convId, messageId) {
    const conv = conversations.find((c) => c.id === convId)
    const msg = conv?.messages?.find((m) => m.id === messageId)
    if (!msg) return
    sendMessage(convId, msg.content)
  }

  function pauseThinking() {
    setIsThinking(false)
    setThinkingConvId(null)
  }

  function handleUseTemplate(template) {
    // This will be passed down to the Composer component
    // The Composer will handle inserting the template content
    if (composerRef.current) {
      composerRef.current.insertTemplate(template.content)
    }
  }

  const composerRef = useRef(null)

  const selected = conversations.find((c) => c.id === selectedId) || null

  const [settings, setSettings] = useState(() => {
    try {
      return loadSettings()
    } catch {
      return {}
    }
  })

  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  return (
    <div className="h-screen w-full bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="md:hidden sticky top-0 z-40 flex items-center gap-2 border-b border-zinc-200/60 bg-white/80 px-3 py-2 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/70">
        <div className="ml-1 flex items-center gap-2 text-sm font-semibold tracking-tight">
          <span className="inline-flex h-4 w-4 items-center justify-center">✱</span> AI Assistant
        </div>
        <div className="ml-auto flex items-center gap-2">
          <GhostIconButton label="Schedule">
            <Calendar className="h-4 w-4" />
          </GhostIconButton>
          <GhostIconButton label="Apps">
            <LayoutGrid className="h-4 w-4" />
          </GhostIconButton>
          <GhostIconButton label="More">
            <MoreHorizontal className="h-4 w-4" />
          </GhostIconButton>
          <ThemeToggle theme={theme} setTheme={setTheme} />
        </div>
      </div>

      <div className="mx-auto flex h-[calc(100vh-0px)] max-w-[1400px]">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          theme={theme}
          setTheme={setTheme}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          conversations={conversations}
          pinned={pinned}
          recent={recent}
          folders={folders}
          folderCounts={folderCounts}
          selectedId={selectedId}
          onSelect={(id) => setSelectedId(id)}
          togglePin={togglePin}
          query={query}
          setQuery={setQuery}
          searchRef={searchRef}
          createFolder={createFolder}
          createNewChat={createNewChat}
          templates={templates}
          setTemplates={setTemplates}
          onUseTemplate={handleUseTemplate}
        />

        <main className="relative flex min-w-0 flex-1 flex-col">
          <Header
            createNewChat={createNewChat}
            sidebarCollapsed={sidebarCollapsed}
            setSidebarOpen={setSidebarOpen}
            settings={settings}
            onSettingsChange={setSettings}
          />
          <ChatPane
            ref={composerRef}
            conversation={selected}
            onSend={(content) => selected && sendMessage(selected.id, content)}
            onEditMessage={(messageId, newContent) => selected && editMessage(selected.id, messageId, newContent)}
            onResendMessage={(messageId) => selected && resendMessage(selected.id, messageId)}
            isThinking={isThinking && thinkingConvId === selected?.id}
            onPauseThinking={pauseThinking}
          />
        </main>
      </div>
    </div>
  )
}
