"use client"
import { MoreHorizontal, Menu, ChevronDown, Settings } from "lucide-react"
import { useMemo, useState } from "react"
import GhostIconButton from "./GhostIconButton"
import SettingsDialog from "./SettingsDialog"
import { POLLINATIONS_TEXT_MODELS, DEFAULT_TEXT_MODEL_ID } from "../lib/pollinationsCatalog"

export default function Header({ sidebarCollapsed, setSidebarOpen, settings, onSettingsChange }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const selectedModel = useMemo(() => {
    const modelId = settings?.defaultTextModel || DEFAULT_TEXT_MODEL_ID
    return POLLINATIONS_TEXT_MODELS.find((model) => model.id === modelId) || POLLINATIONS_TEXT_MODELS[0]
  }, [settings?.defaultTextModel])

  const badgeFor = (source) => {
    if (!source) return "AI"
    const clean = source.replace(/[^A-Za-z0-9]/g, "")
    return (clean.slice(0, 2) || "AI").toUpperCase()
  }

  const handleModelSelect = (modelId) => {
    if (!onSettingsChange) return
    const next = { ...(settings || {}), defaultTextModel: modelId }
    onSettingsChange(next)
    setIsDropdownOpen(false)
  }

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center gap-2 border-b border-zinc-200/60 bg-white/80 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/70">
        {sidebarCollapsed && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden inline-flex items-center justify-center rounded-lg p-2 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-zinc-800"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <div className="hidden md:flex relative">
          <button
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="inline-flex items-center gap-3 rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold tracking-tight hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-800"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold uppercase tracking-wide text-white dark:bg-white dark:text-zinc-900">
              {badgeFor(selectedModel?.provider || selectedModel?.name)}
            </div>
            <div className="flex flex-col items-start leading-tight">
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {selectedModel?.name || "Select Model"}
              </span>
              <span className="text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {selectedModel?.provider || ""}
              </span>
            </div>
            <ChevronDown className="h-4 w-4" />
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-72 max-h-[360px] overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950 z-50">
              {POLLINATIONS_TEXT_MODELS.map((model, index) => {
                const isSelected = model.id === selectedModel?.id
                return (
                  <button
                    key={model.id}
                    onClick={() => handleModelSelect(model.id)}
                    className={`w-full px-3 py-3 text-left transition-colors ${
                      isSelected ? "bg-zinc-100 dark:bg-zinc-800" : "hover:bg-zinc-100 dark:hover:bg-zinc-900"
                    } ${index !== 0 ? "border-t border-zinc-100 dark:border-zinc-800/70" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1 flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-semibold uppercase tracking-wide text-white dark:bg-white dark:text-zinc-900">
                        {badgeFor(model.provider || model.name)}
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{model.name}</span>
                          {model.tier && (
                            <span className="inline-flex rounded-full bg-zinc-200 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                              {model.tier}
                            </span>
                          )}
                          {model.community && (
                            <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
                              Community
                            </span>
                          )}
                          {model.uncensored && (
                            <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-red-600 dark:bg-red-900/40 dark:text-red-200">
                              Uncensored
                            </span>
                          )}
                          {model.audio && (
                            <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">
                              Audio
                            </span>
                          )}
                          {model.reasoning && (
                            <span className="inline-flex rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-purple-700 dark:bg-purple-900/40 dark:text-purple-200">
                              Reasoning
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">{model.provider}</p>
                        <p className="mt-1 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                          {model.description}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="inline-flex items-center justify-center rounded-lg p-2 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-zinc-800"
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
          <GhostIconButton label="More">
            <MoreHorizontal className="h-4 w-4" />
          </GhostIconButton>
        </div>
      </div>

      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSettingsChange={onSettingsChange}
      />
    </>
  )
}
