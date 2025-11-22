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
// @ts-ignore Canvas for Deno
import { createCanvas, loadImage } from "https://deno.land/x/canvas@v1.4.1/mod.ts"

const supabaseUrl = Deno.env.get("SUPABASE_URL")
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")

if (!supabaseUrl || !supabaseServiceRoleKey || !supabaseAnonKey) {
  console.error("❌ Missing Supabase configuration in edge function")
  throw new Error("Supabase credentials are not configured")
}

const serverClient = createClient(supabaseUrl, supabaseServiceRoleKey)

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const errorResponse = (status: number, message: string, details?: Record<string, unknown>) => {
  console.error("❌ add-watermark error", { status, message, details })
  return new Response(JSON.stringify({ error: message, details }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  })
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders })
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
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
    opacity?: number
    logoUrl?: string
  }

  try {
    payload = await req.json()
  } catch (parseError) {
    return errorResponse(400, "Invalid JSON body", { parseError })
  }

  const { imageId, position = 'bottom-right', opacity = 0.3, logoUrl } = payload

  if (!imageId) {
    return errorResponse(400, "imageId is required")
  }

  if (!logoUrl) {
    return errorResponse(400, "logoUrl is required - upload your company logo in Settings first")
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

  const startMs = Date.now()

  try {
    // Get image record
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

    console.log(`🎨 Adding watermark to image: ${imageRecord.name}`)

    // Download source image (use enhanced version if available, otherwise original)
    const sourceUrl = imageRecord.enhanced_url || imageRecord.original_url
    const sourceResponse = await fetch(sourceUrl)

    if (!sourceResponse.ok) {
      throw new Error(`Failed to download source image: ${sourceResponse.status}`)
    }

    const sourceArrayBuffer = await sourceResponse.arrayBuffer()

    // Download logo
    const logoResponse = await fetch(logoUrl)
    if (!logoResponse.ok) {
      throw new Error(`Failed to download logo: ${logoResponse.status}`)
    }

    const logoArrayBuffer = await logoResponse.arrayBuffer()

    // Load images into canvas
    const sourceImage = await loadImage(new Uint8Array(sourceArrayBuffer))
    const logoImage = await loadImage(new Uint8Array(logoArrayBuffer))

    // Create canvas with source image dimensions
    const canvas = createCanvas(sourceImage.width(), sourceImage.height())
    const ctx = canvas.getContext("2d")

    // Draw source image
    ctx.drawImage(sourceImage, 0, 0)

    // Calculate logo size (10% of image width, maintaining aspect ratio)
    const logoWidth = Math.floor(sourceImage.width() * 0.10)
    const logoHeight = Math.floor((logoImage.height() / logoImage.width()) * logoWidth)

    // Calculate position
    const padding = 20 // pixels from edge
    let x = 0
    let y = 0

    switch (position) {
      case 'bottom-right':
        x = sourceImage.width() - logoWidth - padding
        y = sourceImage.height() - logoHeight - padding
        break
      case 'bottom-left':
        x = padding
        y = sourceImage.height() - logoHeight - padding
        break
      case 'top-right':
        x = sourceImage.width() - logoWidth - padding
        y = padding
        break
      case 'top-left':
        x = padding
        y = padding
        break
    }

    // Set opacity and draw logo
    ctx.globalAlpha = opacity
    ctx.drawImage(logoImage, x, y, logoWidth, logoHeight)
    ctx.globalAlpha = 1.0

    // Convert canvas to blob
    const watermarkedBlob = await canvas.toBlob()

    // Upload to Supabase Storage
    const watermarkedPath = `${user.id}/${imageRecord.folder_id}/watermarked-${crypto.randomUUID()}.png`

    const { error: uploadError } = await serverClient
      .storage
      .from("images")
      .upload(watermarkedPath, watermarkedBlob, {
        contentType: "image/png",
        cacheControl: "3600",
        upsert: false
      })

    if (uploadError) {
      throw new Error(`Failed to upload watermarked image: ${uploadError.message}`)
    }

    // Get public URL
    const {
      data: { publicUrl: watermarkedUrl }
    } = serverClient.storage
      .from("images")
      .getPublicUrl(watermarkedPath)

    // Watermark settings
    const watermarkSettings = {
      position,
      opacity,
      logoUrl,
      appliedAt: new Date().toISOString()
    }

    // Update image record
    const {
      data: updatedImage,
      error: updateError
    } = await serverClient
      .from("images")
      .update({
        watermarked_url: watermarkedUrl,
        watermark_settings: watermarkSettings
      })
      .eq("id", imageId)
      .select()
      .single()

    if (updateError) {
      throw new Error(`Failed to update image record: ${updateError.message}`)
    }

    const durationMs = Date.now() - startMs
    console.log(`✅ Watermark added successfully in ${durationMs}ms`)

    return new Response(
      JSON.stringify({
        image: updatedImage,
        watermarkedUrl,
        settings: watermarkSettings,
        durationMs
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("❌ add-watermark processing failure", error)

    const errorMessage = error instanceof Error ? error.message : "Unknown error"

    return errorResponse(500, errorMessage)
  }
})
