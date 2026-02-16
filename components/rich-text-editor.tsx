'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import { Button } from '@/components/ui/button'
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ImageIcon,
  Undo,
  Redo
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useState, useEffect } from 'react'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
}

export function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const [imageUrl, setImageUrl] = useState('')
  const [showImageInput, setShowImageInput] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null)
  const [imageWidth, setImageWidth] = useState('')

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            width: {
              default: null,
              parseHTML: element => element.getAttribute('width'),
              renderHTML: attributes => {
                if (!attributes.width) return {}
                return { width: attributes.width }
              },
            },
            height: {
              default: null,
              parseHTML: element => element.getAttribute('height'),
              renderHTML: attributes => {
                if (!attributes.height) return {}
                return { height: attributes.height }
              },
            },
            style: {
              default: null,
              parseHTML: element => element.getAttribute('style'),
              renderHTML: attributes => {
                if (!attributes.style) return {}
                return { style: attributes.style }
              },
            },
          }
        },
      }).configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'resizable-image',
        },
      }),
      Link.configure({
        openOnClick: false,
      }),
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'tiptap focus:outline-none min-h-[300px] max-w-none p-4 border-0',
      },
    },
  })

  // Add click handler to make images resizable
  useEffect(() => {
    if (!editor) return

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement

      // Don't process if clicking on resize handle
      if (target.classList.contains('resize-handle')) return

      if (target.tagName === 'IMG') {
        const img = target as HTMLImageElement
        setSelectedImage(img)
        setImageWidth(img.style.width || img.width.toString())

        // Remove previously selected images and handles
        const allImages = document.querySelectorAll('.tiptap img')
        allImages.forEach(img => {
          img.classList.remove('selected-image')
          const wrapper = img.parentElement
          if (wrapper?.classList.contains('image-wrapper')) {
            wrapper.querySelectorAll('.resize-handle').forEach(h => h.remove())
          }
        })

        // Mark this image as selected and add resize handles
        target.classList.add('selected-image')
        addResizeHandles(img)
      } else {
        // Click outside image, deselect all
        setSelectedImage(null)
        setImageWidth('')
        const allImages = document.querySelectorAll('.tiptap img')
        allImages.forEach(img => {
          img.classList.remove('selected-image')
          const wrapper = img.parentElement
          if (wrapper?.classList.contains('image-wrapper')) {
            wrapper.querySelectorAll('.resize-handle').forEach(h => h.remove())
          }
        })
      }
    }

    const editorElement = document.querySelector('.tiptap')
    editorElement?.addEventListener('click', handleClick)

    return () => {
      editorElement?.removeEventListener('click', handleClick)
    }
  }, [editor])

  const addResizeHandles = (img: HTMLImageElement) => {
    // Wrap image if not already wrapped
    let wrapper = img.parentElement
    if (!wrapper || !wrapper.classList.contains('image-wrapper')) {
      wrapper = document.createElement('div')
      wrapper.className = 'image-wrapper'
      img.parentNode?.insertBefore(wrapper, img)
      wrapper.appendChild(img)
    }

    // Remove existing handles
    wrapper.querySelectorAll('.resize-handle').forEach(h => h.remove())

    // Add corner resize handles
    const positions = ['nw', 'ne', 'sw', 'se']
    positions.forEach(pos => {
      const handle = document.createElement('div')
      handle.className = `resize-handle resize-${pos}`
      handle.addEventListener('mousedown', (e) => handleResizeStart(e, img, pos))
      wrapper?.appendChild(handle)
    })
  }

  const handleResizeStart = (e: MouseEvent, img: HTMLImageElement, position: string) => {
    e.preventDefault()
    e.stopPropagation()

    const startX = e.clientX
    const startY = e.clientY
    const startWidth = img.offsetWidth
    const startHeight = img.offsetHeight
    const aspectRatio = startWidth / startHeight

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX
      const deltaY = e.clientY - startY

      let newWidth = startWidth
      let newHeight = startHeight

      // Calculate new dimensions based on handle position
      if (position.includes('e')) {
        newWidth = startWidth + deltaX
      } else if (position.includes('w')) {
        newWidth = startWidth - deltaX
      }

      // Maintain aspect ratio
      newHeight = newWidth / aspectRatio

      if (newWidth > 50) {
        img.style.width = `${newWidth}px`
        img.style.height = 'auto'
        setImageWidth(`${newWidth}px`)
      }
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)

      // Update the editor with the new size
      if (editor && img.style.width) {
        const src = img.src
        const { state } = editor
        const { doc } = state

        let pos = -1
        doc.descendants((node, nodePos) => {
          if (node.type.name === 'image' && node.attrs.src === src) {
            pos = nodePos
            return false
          }
        })

        if (pos !== -1) {
          editor
            .chain()
            .focus()
            .setNodeSelection(pos)
            .updateAttributes('image', {
              style: img.style.cssText,
              width: img.style.width
            })
            .run()
        }
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const updateImageSize = (width: string) => {
    if (!selectedImage || !width || !editor) return

    const widthValue = width.endsWith('%') || width.endsWith('px') ? width : `${width}px`

    // Find the image in the editor and update its attributes
    const src = selectedImage.src
    const { state } = editor
    const { doc } = state

    let pos = -1
    doc.descendants((node, nodePos) => {
      if (node.type.name === 'image' && node.attrs.src === src) {
        pos = nodePos
        return false
      }
    })

    if (pos !== -1) {
      editor
        .chain()
        .focus()
        .setNodeSelection(pos)
        .updateAttributes('image', {
          style: `width: ${widthValue}; height: auto;`,
          width: widthValue
        })
        .run()

      // Update the DOM element immediately
      selectedImage.style.width = widthValue
      selectedImage.style.height = 'auto'
    }
  }

  if (!editor) {
    return null
  }

  const addImage = () => {
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run()
      setImageUrl('')
      setShowImageInput(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (10MB limit for images)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image file is too large. Maximum size is 10MB.')
      return
    }

    setIsUploading(true)
    try {
      // Step 1: Get signed upload URL
      const signedUrlResponse = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          fileSize: file.size,
        }),
      })

      if (!signedUrlResponse.ok) {
        const error = await signedUrlResponse.json()
        throw new Error(error.error || 'Failed to get upload URL')
      }

      const { uploadUrl, publicUrl } = await signedUrlResponse.json()

      // Step 2: Upload file to signed URL
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file')
      }

      // Step 3: Insert image into editor
      editor.chain().focus().setImage({ src: publicUrl }).run()
      setShowImageInput(false)
    } catch (error) {
      console.error('Image upload error:', error)
      alert(error instanceof Error ? error.message : 'Failed to upload image')
    } finally {
      setIsUploading(false)
      // Reset file input
      e.target.value = ''
    }
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="border-b bg-muted/50 p-2 flex flex-wrap gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-muted' : ''}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-muted' : ''}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <div className="w-px bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive('heading', { level: 1 }) ? 'bg-muted' : ''}
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'bg-muted' : ''}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor.isActive('heading', { level: 3 }) ? 'bg-muted' : ''}
        >
          <Heading3 className="h-4 w-4" />
        </Button>
        <div className="w-px bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'bg-muted' : ''}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'bg-muted' : ''}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <div className="w-px bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowImageInput(!showImageInput)}
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        <div className="w-px bg-border mx-1" />
        {selectedImage && (
          <>
            <div className="flex items-center gap-1 px-2">
              <span className="text-xs text-muted-foreground">Width:</span>
              <Input
                type="text"
                placeholder="300px or 50%"
                value={imageWidth}
                onChange={(e) => setImageWidth(e.target.value)}
                onBlur={() => updateImageSize(imageWidth)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    updateImageSize(imageWidth)
                  }
                }}
                className="h-7 w-24 text-xs"
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setImageWidth('100%')
                  updateImageSize('100%')
                }}
                className="h-7 px-2 text-xs"
              >
                Full
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setImageWidth('50%')
                  updateImageSize('50%')
                }}
                className="h-7 px-2 text-xs"
              >
                50%
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setImageWidth('300px')
                  updateImageSize('300px')
                }}
                className="h-7 px-2 text-xs"
              >
                300px
              </Button>
            </div>
            <div className="w-px bg-border mx-1" />
          </>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {showImageInput && (
        <div className="border-b bg-muted/30 p-3 space-y-3">
          <div className="flex gap-2">
            <label className="flex-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                disabled={isUploading}
                asChild
              >
                <span>
                  {isUploading ? 'Uploading...' : 'Upload Image'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                </span>
              </Button>
            </label>
            <Button type="button" onClick={() => setShowImageInput(false)} size="sm" variant="ghost">
              Cancel
            </Button>
          </div>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Or enter image URL"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addImage()
                }
              }}
              disabled={isUploading}
            />
            <Button type="button" onClick={addImage} size="sm" disabled={!imageUrl || isUploading}>
              Add
            </Button>
          </div>
        </div>
      )}

      <div className="min-h-[300px]">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
