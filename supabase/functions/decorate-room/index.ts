/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
declare const Deno: {
  env: {
    get(key: string): string | undefined
  }
}
// @ts-ignore Module resolution is handled by the Deno runtime
import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
// @ts-ignore Module resolution is handled by the Deno runtime
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.4?dts"

const DEFAULT_DECORATION_PROMPT = `You are a professional interior designer AI specialized in virtual staging.

Your task: Add stylish, realistic furniture and decorations to this empty room photo.

CRITICAL RULES - Room Structure:
- DO NOT change the room's shape, walls, ceiling, or floor
- DO NOT modify windows, doors, radiators, or any architectural elements
- DO NOT change wall colors or floor materials
- Keep the exact same perspective and camera angle
- Preserve all existing room dimensions

Furniture & Decoration Guidelines:
- Add modern, elegant furniture that fits the room's size and style
- Place items in logical, practical positions
- Use a cohesive, harmonious color palette
- Add appropriate lighting fixtures if the room needs them
- Include tasteful decorations (plants, artwork, curtains, rugs)
- Ensure furniture scale matches room proportions

Style:
- Modern and minimalist OR classic and elegant (choose based on room architecture)
- Professional real estate staging quality
- Photo-realistic rendering
- Natural, inviting atmosphere
- Well-balanced composition

Quality Requirements:
- High-resolution, magazine-quality result
- Natural lighting and shadows
- Realistic materials and textures
- No artificial or cartoonish elements

The result must look like a professionally staged, furnished room that could be used in a real estate listing.
IMPORTANT: The empty room must look filled with furniture, but the room itself (walls, floor, windows, doors) must remain EXACTLY the same.`

const MODEL_IDENTIFIER = "gpt-image-1"
const OPENAI_ENDPOINT = "https://api.openai.com/v1/images/edits"

// FAL.AI Model Endpoints
const FAL_AI_ENDPOINTS: Record<string, string> = {
  'fal-ai/flux-pro': 'https://fal.run/fal-ai/flux-pro',
  'fal-ai/reve/remix': 'https://queue.fal.run/fal-ai/reve/remix',
  'fal-ai/nano-banana-pro/edit': 'https://fal.run/fal-ai/nano-banana-pro/edit'
}

const supabaseUrl = Deno.env.get("SUPABASE_URL")
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")
const openAiApiKey = Deno.env.get("OPENAI_API_KEY")
const falAiApiKey = Deno.env.get("FAL_AI_API_KEY")

if (!supabaseUrl || !supabaseServiceRoleKey || !supabaseAnonKey) {
  console.error("❌ Missing Supabase configuration in edge function")
  throw new Error("Supabase credentials are not configured")
}

const serverClient = createClient(supabaseUrl, supabaseServiceRoleKey)

const decodeBase64 = (base64: string) => {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

const encodeBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer)
  const chunkSize = 0x8000 // 32KB chunks to avoid stack overflow
  let binary = ''

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    binary += String.fromCharCode(...chunk)
  }

  return btoa(binary)
}

const nowMs = () => (typeof performance !== "undefined" ? performance.now() : Date.now())

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const errorResponse = (status: number, message: string, details?: Record<string, unknown>) => {
  console.error("❌ decorate-room error", { status, message, details })
  return new Response(JSON.stringify({ error: message, details }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  })
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return errorResponse(405, "Method not allowed")
  }

  const authHeader = req.headers.get("Authorization")
  if (!authHeader) {
    return errorResponse(401, "Missing Authorization header")
  }

  let payload: {
    imageId?: string
    aiModelId?: string
    promptOverride?: string
  }

  try {
    payload = await req.json()
  } catch (parseError) {
    return errorResponse(400, "Invalid JSON body", { parseError })
  }

  const { imageId, aiModelId, promptOverride } = payload

  if (!imageId) {
    return errorResponse(400, "imageId is required")
  }

  const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: authHeader }
    }
  })

  const {
    data: { user },
    error: authError
  } = await anonClient.auth.getUser()

  if (authError || !user) {
    return errorResponse(401, "Unauthorized", { authError })
  }

  // CHECK USER CREDITS
  const { data: profileData, error: profileError } = await serverClient
    .from("profiles")
    .select("credits_remaining")
    .eq("id", user.id)
    .single()

  if (profileError) {
    return errorResponse(500, "Failed to check user credits", { profileError })
  }

  const creditsRequired = 1.5 // Room decoration costs 1.5 credits (more complex than simple enhancement)
  const currentBalance = profileData?.credits_remaining || 0

  if (currentBalance < creditsRequired) {
    return errorResponse(402, "Insufficient credits", {
      required: creditsRequired,
      available: currentBalance,
      message: "You don't have enough credits to decorate this room. Room decoration costs 1.5 credits."
    })
  }

  // DEDUCT CREDITS
  const { data: deductResult, error: deductError } = await serverClient
    .rpc("deduct_user_credits", {
      p_user_id: user.id,
      p_amount: creditsRequired
    })

  if (deductError || !deductResult) {
    return errorResponse(500, "Failed to deduct credits", { deductError })
  }

  console.log(`✅ Credits deducted: ${creditsRequired} (remaining: ${currentBalance - creditsRequired})`)

  const decorationStartMs = nowMs()

  const {
    data: imageRecord,
    error: imageError
  } = await serverClient
    .from("images")
    .select("*")
    .eq("id", imageId)
    .single()

  if (imageError || !imageRecord) {
    return errorResponse(404, "Image not found", { imageError })
  }

  if (imageRecord.user_id !== user.id) {
    return errorResponse(403, "You do not have access to this image")
  }

  let modelQuery = serverClient
    .from("ai_models")
    .select("id, model_identifier, display_name, provider, settings")
    .eq("is_active", true)

  if (aiModelId) {
    modelQuery = modelQuery.eq("id", aiModelId)
  } else {
    modelQuery = modelQuery.eq("model_identifier", MODEL_IDENTIFIER)
  }

  const {
    data: aiModelRecord,
    error: aiModelError
  } = await modelQuery.maybeSingle()

  if (aiModelError || !aiModelRecord) {
    return errorResponse(400, "AI model not found or inactive", { aiModelError, aiModelId })
  }

  const prompt = promptOverride?.trim().length
    ? promptOverride
    : (typeof aiModelRecord?.settings?.decoration_prompt === "string"
      ? aiModelRecord.settings.decoration_prompt
      : DEFAULT_DECORATION_PROMPT)

  // Update image status to processing
  await serverClient
    .from("images")
    .update({ status: "processing" })
    .eq("id", imageId)

  const logInsertPayload = {
    user_id: user.id,
    image_id: imageId,
    ai_model_id: aiModelRecord.id,
    status: "processing",
    started_at: new Date().toISOString(),
    parameters: {
      prompt,
      model: aiModelRecord.model_identifier,
      operation: "room_decoration"
    }
  }

  const {
    data: decorationLog,
    error: logInsertError
  } = await serverClient
    .from("enhancement_logs")
    .insert(logInsertPayload)
    .select()
    .single()

  if (logInsertError) {
    return errorResponse(500, "Failed to create decoration log", { logInsertError })
  }

  try {
    const sourceImageResponse = await fetch(imageRecord.original_url)

    if (!sourceImageResponse.ok) {
      throw new Error(`Failed to download source image: ${sourceImageResponse.status}`)
    }

    const sourceArrayBuffer = await sourceImageResponse.arrayBuffer()
    const sourceMime = imageRecord.mime_type || sourceImageResponse.headers.get("content-type") || "image/png"
    const sourceExtension = sourceMime.split("/")[1] || "png"
    const sourceFileName = `source.${sourceExtension}`

    // Determine provider based on model
    const provider = aiModelRecord.provider || 'openai'
    let decoratedBase64: string

    if (provider === 'fal-ai') {
      // FAL.AI Integration
      if (!falAiApiKey) {
        throw new Error("FAL_AI_API_KEY is not configured")
      }

      // Get the correct endpoint for the model
      const falEndpoint = FAL_AI_ENDPOINTS[aiModelRecord.model_identifier]
      if (!falEndpoint) {
        throw new Error(`Unsupported FAL.AI model: ${aiModelRecord.model_identifier}`)
      }

      console.log(`🎨 Using FAL.AI ${aiModelRecord.display_name} for room decoration`)

      // Convert image to base64 for FAL.AI using chunk-based encoding
      const base64Image = encodeBase64(sourceArrayBuffer)
      const dataUrl = `data:${sourceMime};base64,${base64Image}`

      const falPayload: Record<string, unknown> = {
        prompt: prompt,
        num_images: 1,
        enable_safety_checker: aiModelRecord.settings?.enable_safety_checker ?? true,
        output_format: aiModelRecord.settings?.output_format || "png"
      }

      // Different models use different parameter names for the input image
      if (aiModelRecord.model_identifier === 'fal-ai/reve/remix' ||
          aiModelRecord.model_identifier === 'fal-ai/nano-banana-pro/edit') {
        falPayload.image_urls = [dataUrl]
      } else {
        falPayload.image_url = dataUrl
      }

      // Add model-specific settings
      if (aiModelRecord.settings?.image_size) {
        falPayload.image_size = aiModelRecord.settings.image_size
      }
      if (aiModelRecord.settings?.num_inference_steps) {
        falPayload.num_inference_steps = aiModelRecord.settings.num_inference_steps
      }
      if (aiModelRecord.settings?.guidance_scale) {
        falPayload.guidance_scale = aiModelRecord.settings.guidance_scale
      }
      if (aiModelRecord.settings?.strength !== undefined) {
        falPayload.strength = aiModelRecord.settings.strength
      }

      const falResponse = await fetch(falEndpoint, {
        method: "POST",
        headers: {
          "Authorization": `Key ${falAiApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(falPayload)
      })

      if (!falResponse.ok) {
        const errorText = await falResponse.text()
        throw new Error(`FAL.AI API error (${falResponse.status}): ${errorText}`)
      }

      const falResult = await falResponse.json()
      console.log("📦 FAL.AI initial response keys:", Object.keys(falResult))

      // Handle both sync and async (queue) responses
      let imageUrl: string | undefined

      if (falResult.images && falResult.images.length > 0) {
        imageUrl = falResult.images[0].url
        console.log("✅ Sync response - got image URL immediately")
      } else if (falResult.image && falResult.image.url) {
        imageUrl = falResult.image.url
        console.log("✅ Sync response (alt format) - got image URL immediately")
      } else if (falResult.status_url || falResult.request_id) {
        console.log("📊 FAL.AI request queued, polling for completion...")
        const statusUrl = falResult.status_url
        const maxAttempts = 120
        let attempts = 0

        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000))
          attempts++

          const statusResponse = await fetch(statusUrl, {
            headers: { "Authorization": `Key ${falAiApiKey}` }
          })

          if (!statusResponse.ok) {
            throw new Error(`Failed to check FAL.AI status: ${statusResponse.status}`)
          }

          const statusResult = await statusResponse.json()
          console.log(`⏳ FAL.AI status check ${attempts}s: ${statusResult.status}`)

          if (statusResult.status === "COMPLETED") {
            console.log(`📊 Completed response keys:`, Object.keys(statusResult))

            if (statusResult.response_url) {
              console.log(`🔗 Fetching result from response_url...`)
              const resultResponse = await fetch(statusResult.response_url, {
                headers: { "Authorization": `Key ${falAiApiKey}` }
              })

              if (!resultResponse.ok) {
                throw new Error(`Failed to fetch result from response_url: ${resultResponse.status}`)
              }

              const resultData = await resultResponse.json()
              console.log(`📦 Result data keys:`, Object.keys(resultData))
              imageUrl = resultData.images?.[0]?.url || resultData.image?.url
            } else {
              imageUrl = statusResult.images?.[0]?.url ||
                        statusResult.image?.url ||
                        statusResult.data?.images?.[0]?.url ||
                        statusResult.data?.image?.url
            }

            console.log(`✅ FAL.AI processing completed after ${attempts} seconds`)
            console.log(`🖼️ Image URL extracted: ${imageUrl ? 'YES' : 'NO'}`)
            if (!imageUrl) {
              console.error(`❌ COMPLETED but no image URL. Response keys:`, Object.keys(statusResult))
            }
            break
          } else if (statusResult.status === "FAILED") {
            const errorDetails = statusResult.error || statusResult.logs || 'Unknown error'
            console.error(`❌ FAL.AI processing failed:`, errorDetails)
            throw new Error(`FAL.AI processing failed: ${errorDetails}`)
          }
        }

        if (!imageUrl) {
          throw new Error(`FAL.AI processing timed out after ${attempts} seconds`)
        }
      }

      if (!imageUrl) {
        throw new Error("FAL.AI API did not return any image data")
      }

      const decoratedImageResponse = await fetch(imageUrl)
      if (!decoratedImageResponse.ok) {
        throw new Error(`Failed to download decorated image from FAL.AI: ${decoratedImageResponse.status}`)
      }

      const decoratedArrayBuffer = await decoratedImageResponse.arrayBuffer()
      decoratedBase64 = encodeBase64(decoratedArrayBuffer)

    } else {
      // OpenAI Integration (default)
      if (!openAiApiKey) {
        throw new Error("OPENAI_API_KEY is not configured")
      }

      console.log("🤖 Using OpenAI GPT-Image-1 for room decoration")

      const formData = new FormData()
      formData.append("model", "gpt-image-1")
      formData.append("prompt", prompt)
      formData.append("image", new File([sourceArrayBuffer], sourceFileName, { type: sourceMime }))

      const openAiResponse = await fetch(OPENAI_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openAiApiKey}`
        },
        body: formData
      })

      if (!openAiResponse.ok) {
        const errorText = await openAiResponse.text()
        throw new Error(`OpenAI API error (${openAiResponse.status}): ${errorText}`)
      }

      const openAiPayload = await openAiResponse.json()
      decoratedBase64 = openAiPayload?.data?.[0]?.b64_json

      if (!decoratedBase64) {
        throw new Error("OpenAI API did not return any image data")
      }
    }

    // Decode base64 to binary
    const decoratedBytes = decodeBase64(decoratedBase64)
    const decoratedBlob = new Blob([decoratedBytes], { type: "image/png" })

    const decoratedPath = `${user.id}/${imageRecord.folder_id}/decorated-${crypto.randomUUID()}.png`

    const { error: uploadError } = await serverClient
      .storage
      .from("images")
      .upload(decoratedPath, decoratedBlob, {
        contentType: "image/png",
        cacheControl: "3600",
        upsert: false
      })

    if (uploadError) {
      throw new Error(`Failed to upload decorated image: ${uploadError.message}`)
    }

    const {
      data: { publicUrl: decoratedUrl }
    } = serverClient.storage
      .from("images")
      .getPublicUrl(decoratedPath)

    const updatePayload = {
      enhanced_url: decoratedUrl,
      status: "enhanced",
      metadata: {
        ...(imageRecord.metadata ?? {}),
        decoration: {
          ...(imageRecord.metadata?.decoration ?? {}),
          model: aiModelRecord.model_identifier,
          updated_at: new Date().toISOString(),
          operation: "room_decoration"
        }
      }
    }

    const {
      data: updatedImage,
      error: updateError
    } = await serverClient
      .from("images")
      .update(updatePayload)
      .eq("id", imageId)
      .select()
      .single()

    if (updateError) {
      throw new Error(`Failed to update image record: ${updateError.message}`)
    }

    const decorationDurationMs = Math.round(nowMs() - decorationStartMs)

    const logMetadata = {
      ...(decorationLog.metadata ?? {}),
      model_identifier: aiModelRecord.model_identifier,
      provider: provider,
      operation: "room_decoration"
    }

    const {
      data: completedLog,
      error: logUpdateError
    } = await serverClient
      .from("enhancement_logs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        duration_ms: decorationDurationMs,
        result_url: decoratedUrl,
        metadata: logMetadata
      })
      .eq("id", decorationLog.id)
      .select()
      .single()

    if (logUpdateError) {
      console.warn("⚠️ Failed to update decoration log", logUpdateError)
    }

    return new Response(
      JSON.stringify({
        image: updatedImage,
        log: completedLog ?? decorationLog,
        decoratedUrl
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("❌ decorate-room processing failure", error)

    const errorMessage = error instanceof Error ? error.message : "Unknown error"

    // REFUND CREDITS on failure
    try {
      await serverClient.rpc("refund_user_credits", {
        p_user_id: user.id,
        p_amount: creditsRequired
      })
      console.log(`💰 Credits refunded: ${creditsRequired}`)
    } catch (refundError) {
      console.error("⚠️ Failed to refund credits:", refundError)
    }

    await serverClient
      .from("images")
      .update({ status: "failed" })
      .eq("id", imageId)

    await serverClient
      .from("enhancement_logs")
      .update({
        status: "failed",
        completed_at: new Date().toISOString(),
        error_message: errorMessage,
        cost_credits: 0.0
      })
      .eq("id", decorationLog.id)

    return errorResponse(500, errorMessage)
  }
})
