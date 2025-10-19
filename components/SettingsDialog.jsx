"use client"

import { useState, useEffect, useMemo } from "react"
import { X, Settings, Palette, Zap, Code, Plus, Trash2, Copy, Check } from "lucide-react"
import { cls } from "./utils"
import {
  POLLINATIONS_TEXT_MODELS,
  POLLINATIONS_IMAGE_MODELS,
  DEFAULT_TEXT_MODEL_ID,
  DEFAULT_IMAGE_MODEL_ID,
} from "../lib/pollinationsCatalog"

const MODELS = {
  text: POLLINATIONS_TEXT_MODELS,
  image: POLLINATIONS_IMAGE_MODELS,
}

export default function SettingsDialog({ isOpen, onClose, settings, onSettingsChange }) {
  const [activeTab, setActiveTab] = useState("general")
  const [localSettings, setLocalSettings] = useState(settings)
  const [copiedId, setCopiedId] = useState(null)

  const activeTextModel = useMemo(() => {
    const modelId = localSettings.defaultTextModel || DEFAULT_TEXT_MODEL_ID
    return POLLINATIONS_TEXT_MODELS.find((model) => model.id === modelId) || POLLINATIONS_TEXT_MODELS[0]
  }, [localSettings.defaultTextModel])

  const activeImageModel = useMemo(() => {
    const modelId = localSettings.defaultImageModel || DEFAULT_IMAGE_MODEL_ID
    return POLLINATIONS_IMAGE_MODELS.find((model) => model.id === modelId) || POLLINATIONS_IMAGE_MODELS[0]
  }, [localSettings.defaultImageModel])

  const formatList = (arr, fallback = "None") => (Array.isArray(arr) && arr.length ? arr.join(", ") : fallback)

  useEffect(() => {
    setLocalSettings(settings)
  }, [settings])

  const handleSettingChange = (key, value) => {
    const updated = { ...localSettings, [key]: value }
    setLocalSettings(updated)
    onSettingsChange(updated)
  }

  const handleAddCustomAPI = () => {
    const name = prompt("API Name (e.g., 'My Custom API')")
    if (!name) return
    const endpoint = prompt("API Endpoint URL")
    if (!endpoint) return
    const key = prompt("API Key (optional)")

    const newAPI = {
      id: Math.random().toString(36).slice(2),
      name,
      endpoint,
      key: key || "",
      type: "custom",
    }

    const updated = {
      ...localSettings,
      customAPIs: [...(localSettings.customAPIs || []), newAPI],
    }
    setLocalSettings(updated)
    onSettingsChange(updated)
  }

  const handleRemoveCustomAPI = (id) => {
    const updated = {
      ...localSettings,
      customAPIs: (localSettings.customAPIs || []).filter((api) => api.id !== id),
    }
    setLocalSettings(updated)
    onSettingsChange(updated)
  }

  const handleAddMCP = () => {
    const name = prompt("MCP Name")
    if (!name) return
    const command = prompt("MCP Command")
    if (!command) return

    const newMCP = {
      id: Math.random().toString(36).slice(2),
      name,
      command,
      enabled: true,
    }

    const updated = {
      ...localSettings,
      mcps: [...(localSettings.mcps || []), newMCP],
    }
    setLocalSettings(updated)
    onSettingsChange(updated)
  }

  const handleRemoveMCP = (id) => {
    const updated = {
      ...localSettings,
      mcps: (localSettings.mcps || []).filter((mcp) => mcp.id !== id),
    }
    setLocalSettings(updated)
    onSettingsChange(updated)
  }

  const handleToggleMCP = (id) => {
    const updated = {
      ...localSettings,
      mcps: (localSettings.mcps || []).map((mcp) => (mcp.id === id ? { ...mcp, enabled: !mcp.enabled } : mcp)),
    }
    setLocalSettings(updated)
    onSettingsChange(updated)
  }

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const shuffleModel = (type) => {
    const models = MODELS[type]
    const randomModel = models[Math.floor(Math.random() * models.length)]
    handleSettingChange(type === "text" ? "defaultTextModel" : "defaultImageModel", randomModel.id)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative h-[90vh] w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Settings</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-200 px-6 dark:border-zinc-800">
          {[
            { id: "general", label: "General", icon: Settings },
            { id: "appearance", label: "Appearance", icon: Palette },
            { id: "advanced", label: "Advanced", icon: Zap },
            { id: "integrations", label: "Integrations", icon: Code },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cls(
                "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                activeTab === id
                  ? "border-zinc-900 text-zinc-900 dark:border-white dark:text-white"
                  : "border-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* General Tab */}
          {activeTab === "general" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Theme</label>
                <select
                  value={localSettings.theme || "system"}
                  onChange={(e) => handleSettingChange("theme", e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Font Size</label>
                <select
                  value={localSettings.fontSize || "medium"}
                  onChange={(e) => handleSettingChange("fontSize", e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Animation Speed</label>
                <select
                  value={localSettings.animationSpeed || "normal"}
                  onChange={(e) => handleSettingChange("animationSpeed", e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <option value="slow">Slow</option>
                  <option value="normal">Normal</option>
                  <option value="fast">Fast</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Reduce Motion</label>
                <input
                  type="checkbox"
                  checked={localSettings.reduceMotion || false}
                  onChange={(e) => handleSettingChange("reduceMotion", e.target.checked)}
                  className="h-4 w-4 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Show Timestamps</label>
                <input
                  type="checkbox"
                  checked={localSettings.showTimestamps || false}
                  onChange={(e) => handleSettingChange("showTimestamps", e.target.checked)}
                  className="h-4 w-4 rounded"
                />
              </div>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === "appearance" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Chat Width</label>
                <select
                  value={localSettings.chatWidth || "medium"}
                  onChange={(e) => handleSettingChange("chatWidth", e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <option value="compact">Compact</option>
                  <option value="medium">Medium</option>
                  <option value="wide">Wide</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Message Bubble Shape</label>
                <select
                  value={localSettings.bubbleShape || "rounded"}
                  onChange={(e) => handleSettingChange("bubbleShape", e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <option value="rounded">Rounded</option>
                  <option value="square">Square</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Message Density</label>
                <select
                  value={localSettings.messageDensity || "normal"}
                  onChange={(e) => handleSettingChange("messageDensity", e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <option value="compact">Compact</option>
                  <option value="normal">Normal</option>
                  <option value="spacious">Spacious</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Accent Color</label>
                <div className="flex gap-2">
                  {["blue", "purple", "green", "orange", "red"].map((color) => (
                    <button
                      key={color}
                      onClick={() => handleSettingChange("accentColor", color)}
                      className={cls(
                        "h-8 w-8 rounded-full border-2 transition-all",
                        localSettings.accentColor === color
                          ? "border-zinc-900 dark:border-white"
                          : "border-transparent",
                        {
                          "bg-blue-500": color === "blue",
                          "bg-purple-500": color === "purple",
                          "bg-green-500": color === "green",
                          "bg-orange-500": color === "orange",
                          "bg-red-500": color === "red",
                        },
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Advanced Tab */}
          {activeTab === "advanced" && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">Default Text Model</label>
                  <button
                    onClick={() => shuffleModel("text")}
                    className="text-xs px-2 py-1 rounded bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                  >
                    🔀 Shuffle
                  </button>
                </div>
                <select
                  value={localSettings.defaultTextModel || DEFAULT_TEXT_MODEL_ID}
                  onChange={(e) => handleSettingChange("defaultTextModel", e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
                >
                  {MODELS.text.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name} ({model.provider})
                    </option>
                  ))}
                </select>
                {activeTextModel && (
                  <div className="mt-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{activeTextModel.name}</p>
                        <p className="text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                          {activeTextModel.provider}
                        </p>
                      </div>
                      {activeTextModel.tier && (
                        <span className="inline-flex rounded-full bg-zinc-200 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                          {activeTextModel.tier}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 leading-relaxed text-zinc-600 dark:text-zinc-300">
                      {activeTextModel.description}
                    </p>
                    <div className="mt-3 grid gap-1 text-[11px]">
                      <div>
                        <span className="font-medium text-zinc-700 dark:text-zinc-200">Input:</span>{" "}
                        {formatList(activeTextModel.input, "text")}
                      </div>
                      <div>
                        <span className="font-medium text-zinc-700 dark:text-zinc-200">Output:</span>{" "}
                        {formatList(activeTextModel.output, "text")}
                      </div>
                      <div>
                        <span className="font-medium text-zinc-700 dark:text-zinc-200">Tools:</span>{" "}
                        {activeTextModel.tools ? "Available" : "Not available"}
                      </div>
                      <div>
                        <span className="font-medium text-zinc-700 dark:text-zinc-200">Reasoning:</span>{" "}
                        {activeTextModel.reasoning ? "Enhanced" : "Standard"}
                      </div>
                      <div>
                        <span className="font-medium text-zinc-700 dark:text-zinc-200">Vision:</span>{" "}
                        {activeTextModel.vision ? "Yes" : "No"}
                      </div>
                      <div>
                        <span className="font-medium text-zinc-700 dark:text-zinc-200">Audio:</span>{" "}
                        {activeTextModel.audio ? "Yes" : "No"}
                      </div>
                      {activeTextModel.voices && activeTextModel.voices.length > 0 && (
                        <div>
                          <span className="font-medium text-zinc-700 dark:text-zinc-200">Voices:</span>{" "}
                          {formatList(activeTextModel.voices)}
                        </div>
                      )}
                      <div>
                        <span className="font-medium text-zinc-700 dark:text-zinc-200">Community:</span>{" "}
                        {activeTextModel.community ? "Yes" : "No"}
                      </div>
                      {activeTextModel.aliases && activeTextModel.aliases.length > 0 && (
                        <div>
                          <span className="font-medium text-zinc-700 dark:text-zinc-200">Aliases:</span>{" "}
                          {formatList(activeTextModel.aliases)}
                        </div>
                      )}
                      {activeTextModel.uncensored && (
                        <div className="font-medium text-red-500 dark:text-red-400">Uncensored responses</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">Default Image Model</label>
                  <button
                    onClick={() => shuffleModel("image")}
                    className="text-xs px-2 py-1 rounded bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                  >
                    🔀 Shuffle
                  </button>
                </div>
                <select
                  value={localSettings.defaultImageModel || DEFAULT_IMAGE_MODEL_ID}
                  onChange={(e) => handleSettingChange("defaultImageModel", e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
                >
                  {MODELS.image.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name} ({model.provider})
                    </option>
                  ))}
                </select>
                {activeImageModel && (
                  <div className="mt-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300">
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{activeImageModel.name}</p>
                    <p className="text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      {activeImageModel.provider}
                    </p>
                    <p className="mt-2 leading-relaxed text-zinc-600 dark:text-zinc-300">
                      {activeImageModel.description}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Max File Size (MB)</label>
                <input
                  type="number"
                  value={localSettings.maxFileSize || 10}
                  onChange={(e) => handleSettingChange("maxFileSize", Number.parseInt(e.target.value))}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
                  min="1"
                  max="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Default Text API Endpoint</label>
                <input
                  type="text"
                  value={localSettings.textAPIEndpoint || "https://text.pollinations.ai/openai"}
                  onChange={(e) => handleSettingChange("textAPIEndpoint", e.target.value)}
                  placeholder="https://text.pollinations.ai/openai"
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Default Image API Endpoint</label>
                <input
                  type="text"
                  value={localSettings.imageAPIEndpoint || "https://image.pollinations.ai/prompt"}
                  onChange={(e) => handleSettingChange("imageAPIEndpoint", e.target.value)}
                  placeholder="https://image.pollinations.ai/prompt"
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
                />
              </div>
            </div>
          )}

          {/* Integrations Tab */}
          {activeTab === "integrations" && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">Custom APIs</h3>
                  <button
                    onClick={handleAddCustomAPI}
                    className="inline-flex items-center gap-1 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add API
                  </button>
                </div>

                <div className="space-y-2">
                  {(localSettings.customAPIs || []).map((api) => (
                    <div key={api.id} className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{api.name}</p>
                          <p className="text-xs text-zinc-500 truncate">{api.endpoint}</p>
                          {api.key && <p className="text-xs text-zinc-500 mt-1">Key: {api.key.slice(0, 10)}...</p>}
                        </div>
                        <div className="flex gap-1 ml-2">
                          <button
                            onClick={() => copyToClipboard(api.endpoint, api.id)}
                            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                          >
                            {copiedId === api.id ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleRemoveCustomAPI(api.id)}
                            className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(localSettings.customAPIs || []).length === 0 && (
                    <p className="text-sm text-zinc-500">No custom APIs added yet.</p>
                  )}
                </div>
              </div>

              <div className="border-t border-zinc-200 pt-6 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">Model Context Protocol (MCP)</h3>
                  <button
                    onClick={handleAddMCP}
                    className="inline-flex items-center gap-1 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add MCP
                  </button>
                </div>

                <div className="space-y-2">
                  {(localSettings.mcps || []).map((mcp) => (
                    <div
                      key={mcp.id}
                      className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800 flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{mcp.name}</p>
                        <p className="text-xs text-zinc-500">{mcp.command}</p>
                      </div>
                      <div className="flex gap-2 ml-2">
                        <input
                          type="checkbox"
                          checked={mcp.enabled}
                          onChange={() => handleToggleMCP(mcp.id)}
                          className="h-4 w-4 rounded"
                        />
                        <button
                          onClick={() => handleRemoveMCP(mcp.id)}
                          className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {(localSettings.mcps || []).length === 0 && (
                    <p className="text-sm text-zinc-500">No MCPs added yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-200 px-6 py-4 dark:border-zinc-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
