import {
  DEFAULT_TEXT_MODEL_ID,
  DEFAULT_IMAGE_MODEL_ID,
  POLLINATIONS_TEXT_MODELS,
  POLLINATIONS_IMAGE_MODELS,
} from "../lib/pollinationsCatalog"

// Utility functions for managing settings in local storage

const TEXT_MODEL_IDS = new Set(POLLINATIONS_TEXT_MODELS.map((model) => model.id))
const IMAGE_MODEL_IDS = new Set(POLLINATIONS_IMAGE_MODELS.map((model) => model.id))

const DEFAULT_SETTINGS = {
  theme: "system",
  fontSize: "medium",
  animationSpeed: "normal",
  reduceMotion: false,
  showTimestamps: false,
  chatWidth: "medium",
  bubbleShape: "rounded",
  messageDensity: "normal",
  accentColor: "blue",
  defaultTextModel: DEFAULT_TEXT_MODEL_ID,
  defaultImageModel: DEFAULT_IMAGE_MODEL_ID,
  maxFileSize: 10,
  textAPIEndpoint: "https://text.pollinations.ai/openai",
  imageAPIEndpoint: "https://image.pollinations.ai/prompt",
  customAPIs: [],
  mcps: [],
}

export function loadSettings() {
  try {
    const saved = localStorage.getItem("chatbot-settings")
    const parsed = saved ? JSON.parse(saved) : {}
    const merged = { ...DEFAULT_SETTINGS, ...parsed }

    if (!TEXT_MODEL_IDS.has(merged.defaultTextModel)) {
      merged.defaultTextModel = DEFAULT_SETTINGS.defaultTextModel
    }

    if (!IMAGE_MODEL_IDS.has(merged.defaultImageModel)) {
      merged.defaultImageModel = DEFAULT_SETTINGS.defaultImageModel
    }

    if (merged.textAPIEndpoint === "https://text.pollinations.ai") {
      merged.textAPIEndpoint = DEFAULT_SETTINGS.textAPIEndpoint
    }

    if (merged.imageAPIEndpoint === "https://image.pollinations.ai") {
      merged.imageAPIEndpoint = DEFAULT_SETTINGS.imageAPIEndpoint
    }

    return merged
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem("chatbot-settings", JSON.stringify(settings))
  } catch {
    console.error("Failed to save settings")
  }
}

export function getSettingValue(key, defaultValue = null) {
  const settings = loadSettings()
  return settings[key] ?? defaultValue
}

export function updateSetting(key, value) {
  const settings = loadSettings()
  settings[key] = value
  saveSettings(settings)
  return settings
}
