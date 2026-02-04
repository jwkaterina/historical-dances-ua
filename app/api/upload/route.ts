import { type NextRequest, NextResponse } from "next/server"

// This endpoint creates a signed upload URL for Supabase Storage
// The client will then upload directly to Supabase using this URL
export async function POST(request: NextRequest) {
  try {
    const { filename, contentType, fileSize } = await request.json()

    if (!filename || !contentType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate file type
    const isVideo = contentType.startsWith("video/")
    const isAudio = contentType.startsWith("audio/")

    if (!isVideo && !isAudio) {
      return NextResponse.json(
        { error: "Only video and audio files are allowed" },
        { status: 400 }
      )
    }

    // Check file size (100MB limit)
    const MAX_SIZE = 100 * 1024 * 1024
    if (fileSize && fileSize > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 100MB" },
        { status: 413 }
      )
    }

    const bucketName = isAudio ? "audio" : "videos"

    // Generate safe filename
    const ext = filename.split(".").pop() || (isAudio ? "mp3" : "mp4")
    const sanitizedName = filename
      .replace(/\.[^/.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-") || "file"
    const storagePath = `${Date.now()}-${sanitizedName}.${ext}`

    // Create signed upload URL using Supabase REST API
    const signedUrlResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/upload/sign/${bucketName}/${storagePath}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      }
    )

    if (!signedUrlResponse.ok) {
      const errorText = await signedUrlResponse.text()
      console.error("[v0] Failed to create signed URL:", errorText)
      throw new Error("Failed to create upload URL")
    }

    const { url: signedUrl } = await signedUrlResponse.json()

    // Construct the full upload URL and the final public URL
    const uploadUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1${signedUrl}`
    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucketName}/${storagePath}`

    return NextResponse.json({
      uploadUrl,
      publicUrl,
      storagePath,
      bucketName,
    })
  } catch (error) {
    console.error("[v0] Upload error:", String(error))
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    )
  }
}
