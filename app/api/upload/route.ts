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
    const isImage = contentType.startsWith("image/")

    if (!isVideo && !isAudio && !isImage) {
      return NextResponse.json(
        { error: "Only video, audio, and image files are allowed" },
        { status: 400 }
      )
    }

    // Check file size (100MB for video, 20MB for audio, 10MB for images)
    let MAX_SIZE = 100 * 1024 * 1024
    if (isAudio) MAX_SIZE = 20 * 1024 * 1024
    if (isImage) MAX_SIZE = 10 * 1024 * 1024

    if (fileSize && fileSize > MAX_SIZE) {
      const maxSizeMB = isImage ? "10MB" : isAudio ? "20MB" : "100MB"
      return NextResponse.json(
        { error: `File too large. Maximum size is ${maxSizeMB}` },
        { status: 413 }
      )
    }

    const bucketName = isAudio ? "audio" : isVideo ? "videos" : "images"

    // Generate safe filename
    const ext = filename.split(".").pop() || (isAudio ? "mp3" : isVideo ? "mp4" : "jpg")
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
