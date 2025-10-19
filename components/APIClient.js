export async function callTextAPI({
  prompt,
  model,
  endpoint = "https://text.pollinations.ai/openai",
  messages = [],
  systemPrompt,
  maxTokens = 1000,
} = {}) {
  try {
    const sanitizedMessages = Array.isArray(messages)
      ? messages
          .filter((msg) => msg && typeof msg.content === "string" && msg.content.trim().length)
          .map((msg) => ({
            role: msg.role === "assistant" || msg.role === "system" ? msg.role : "user",
            content: msg.content.trim(),
          }))
      : []

    const history = []

    if (systemPrompt?.trim()) {
      history.push({ role: "system", content: systemPrompt.trim() })
    }

    history.push(...sanitizedMessages)

    if (!history.length && prompt?.trim()) {
      history.push({ role: "user", content: prompt.trim() })
    }

    if (!history.length) {
      throw new Error("Prompt is required")
    }

    const lastUserMessage = [...history].reverse().find((msg) => msg.role === "user")
    const finalPrompt = prompt?.trim() || lastUserMessage?.content || ""

    const resolvedEndpoint = endpoint?.trim() || "https://text.pollinations.ai/openai"
    const isTemplateEndpoint = /{prompt}/i.test(resolvedEndpoint)
    const defaultModel = model || "openai"
    const modelIsAudio = defaultModel.includes("audio")

    const serializeHistory = () =>
      history
        .map((msg) => {
          const label = msg.role === "assistant" ? "Assistant" : msg.role === "system" ? "System" : "User"
          return `${label}: ${msg.content}`
        })
        .join("\n\n")

    async function parseTextResponse(response) {
      if (!response.ok) {
        const errorData = await response.text()
        console.error("[v0] API Response:", response.status, errorData)
        throw new Error(`API error: ${response.status}`)
      }

      const contentType = response.headers.get("content-type") || ""
      if (contentType.startsWith("audio/")) {
        const blob = await response.blob()
        if (typeof window !== "undefined" && window.URL?.createObjectURL) {
          return {
            content: "Generated an audio response.",
            audioUrl: window.URL.createObjectURL(blob),
            audioMime: contentType,
          }
        }

        const arrayBuffer = await blob.arrayBuffer()
        let base64 = ""
        if (typeof Buffer !== "undefined") {
          base64 = Buffer.from(arrayBuffer).toString("base64")
        } else if (typeof btoa === "function") {
          let binary = ""
          const bytes = new Uint8Array(arrayBuffer)
          bytes.forEach((b) => {
            binary += String.fromCharCode(b)
          })
          base64 = btoa(binary)
        }
        const dataUrl = `data:${contentType || "audio/mpeg"};base64,${base64}`
        return {
          content: "Generated an audio response.",
          audioUrl: dataUrl,
          audioMime: contentType || "audio/mpeg",
        }
      }

      if (contentType.includes("application/json")) {
        const data = await response.json()
        const textContent =
          data.choices?.[0]?.message?.content ??
          data.output ??
          data.response ??
          data.text ??
          data.result ??
          ""
        return {
          content: textContent || "No response received",
        }
      }

      const text = await response.text()
      return {
        content: text || "No response received",
      }
    }

    if (isTemplateEndpoint) {
      const serialized = serializeHistory() || finalPrompt
      const endpointWithProtocol = resolvedEndpoint.startsWith("http")
        ? resolvedEndpoint
        : `https://${resolvedEndpoint}`
      const substituted = endpointWithProtocol
        .replace(/{prompt}/gi, encodeURIComponent(serialized))
        .replace(/%7Bprompt%7D/gi, encodeURIComponent(serialized))

      const url = new URL(substituted)
      if (defaultModel && !url.searchParams.has("model") && defaultModel !== "openai") {
        url.searchParams.set("model", defaultModel)
      }

      const response = await fetch(url.toString(), {
        method: "GET",
      })
      return parseTextResponse(response)
    }

    const target = resolvedEndpoint.startsWith("http") ? resolvedEndpoint : `https://${resolvedEndpoint}`
    const url = new URL(target)
    const isOpenAICompatible = url.pathname.includes("/openai")

    const shouldUsePost = isOpenAICompatible || (!modelIsAudio && history.length > 1)

    if (!shouldUsePost) {
      const base = target.replace(/\/+$/, "")
      const serialized = serializeHistory() || finalPrompt
      const resultUrl = new URL(`${base}/${encodeURIComponent(serialized)}`)
      if (defaultModel && !resultUrl.searchParams.has("model") && defaultModel !== "openai") {
        resultUrl.searchParams.set("model", defaultModel)
      }
      const response = await fetch(resultUrl.toString(), {
        method: "GET",
      })
      return parseTextResponse(response)
    }

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: defaultModel,
        messages: history,
        max_tokens: maxTokens,
      }),
    })

    return parseTextResponse(response)
  } catch (error) {
    console.error("[v0] Text API error:", error)
    throw error
  }
}

export async function callImageAPI(prompt, model, endpoint = "https://image.pollinations.ai/prompt") {
  try {
    if (!prompt?.trim()) {
      throw new Error("Prompt is required")
    }

    const resolvedEndpoint = endpoint?.trim() || "https://image.pollinations.ai/prompt"
    const endpointUrl = resolvedEndpoint.startsWith("http") ? resolvedEndpoint : `https://${resolvedEndpoint}`
    const isPollinationsHost = (() => {
      try {
        const url = new URL(endpointUrl)
        return url.hostname.endsWith("pollinations.ai")
      } catch {
        return false
      }
    })()

    if (isPollinationsHost) {
      const hasPlaceholder = /{prompt}|%s/i.test(endpointUrl)
      const base = hasPlaceholder ? endpointUrl : endpointUrl.replace(/\/+$/, "")
      const encodedPrompt = encodeURIComponent(prompt)
      const rawUrl = hasPlaceholder
        ? base.replace(/{prompt}/gi, encodedPrompt).replace(/%s/g, encodedPrompt)
        : `${base}/${encodedPrompt}`
      const url = new URL(rawUrl)
      if (model && !url.searchParams.has("model")) {
        url.searchParams.set("model", model)
      }

      const response = await fetch(url.toString(), {
        method: "GET",
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error("[v0] Image API Response:", response.status, errorData)
        throw new Error(`API error: ${response.status}`)
      }

      const contentType = response.headers.get("content-type") || ""
      if (contentType.startsWith("image/")) {
        if (typeof window !== "undefined" && window.URL?.createObjectURL) {
          const blob = await response.blob()
          const objectUrl = window.URL.createObjectURL(blob)
          return { url: objectUrl, direct: true }
        }

        const arrayBuffer = await response.arrayBuffer()
        const base64 = Buffer.from(arrayBuffer).toString("base64")
        return { url: `data:${contentType};base64,${base64}`, direct: true }
      }

      const data = await response.json()
      const imageUrl = data.url || data.data?.[0]?.url
      return { url: imageUrl || url.toString(), direct: true }
    }

    const response = await fetch(endpointUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model || "flux",
        prompt,
        width: 1024,
        height: 1024,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("[v0] API Response:", response.status, errorData)
      throw new Error(`API error: ${response.status}`)
    }

    const contentType = response.headers.get("content-type") || ""
    if (contentType.includes("application/json")) {
      const data = await response.json()
      const imageUrl = data.data?.[0]?.url || data.url
      return { url: imageUrl || "", direct: false }
    }

    const blob = await response.blob()
    if (typeof window !== "undefined" && window.URL?.createObjectURL) {
      const objectUrl = window.URL.createObjectURL(blob)
      return { url: objectUrl, direct: false }
    }

    const arrayBuffer = await blob.arrayBuffer()
    let base64 = ""
    if (typeof Buffer !== "undefined") {
      base64 = Buffer.from(arrayBuffer).toString("base64")
    } else if (typeof btoa === "function") {
      const bytes = new Uint8Array(arrayBuffer)
      let binary = ""
      bytes.forEach((b) => {
        binary += String.fromCharCode(b)
      })
      base64 = btoa(binary)
    }
    const mime = contentType || "image/png"
    return { url: `data:${mime};base64,${base64}`, direct: false }
  } catch (error) {
    console.error("[v0] Image API error:", error)
    throw error
  }
}

export async function callCustomAPI(endpoint, apiKey, prompt, method = "POST") {
  try {
    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
    }

    if (apiKey) {
      options.headers["Authorization"] = `Bearer ${apiKey}`
    }

    if (method === "POST") {
      options.body = JSON.stringify({ prompt })
    }

    const response = await fetch(endpoint, options)
    if (!response.ok) throw new Error(`API error: ${response.status}`)

    const data = await response.json()
    return data
  } catch (error) {
    console.error("[v0] Custom API error:", error)
    throw error
  }
}
