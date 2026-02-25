'use client'

import { useState, useRef, useCallback } from 'react'
import { uploadImage, validateImageFile, deleteImage } from '@/utils/uploadImage'

interface ImageUploadProps {
    value: string[] // Array of image URLs
    onChange: (urls: string[]) => void
    maxImages?: number
}

export default function ImageUpload({ value = [], onChange, maxImages = 5 }: ImageUploadProps) {
    const [uploading, setUploading] = useState(false)
    const [dragActive, setDragActive] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const handleFiles = useCallback(async (files: FileList) => {
        setError(null)

        // Check if we can add more images
        const remainingSlots = maxImages - value.length
        if (remainingSlots <= 0) {
            setError(`Maximum ${maxImages} images allowed`)
            return
        }

        const filesToUpload = Array.from(files).slice(0, remainingSlots)

        // Validate files
        for (const file of filesToUpload) {
            const validationError = validateImageFile(file)
            if (validationError) {
                setError(validationError)
                return
            }
        }

        setUploading(true)

        try {
            const uploadPromises = filesToUpload.map(file => uploadImage(file))
            const results = await Promise.all(uploadPromises)
            const newUrls = results.map(result => result.url)
            onChange([...value, ...newUrls])
        } catch (err: any) {
            setError(err.message || 'Upload failed')
        } finally {
            setUploading(false)
        }
    }, [value, onChange, maxImages])

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files)
        }
    }, [handleFiles])

    const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true)
        } else if (e.type === 'dragleave') {
            setDragActive(false)
        }
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files)
        }
    }

    const handleRemove = (index: number) => {
        const newUrls = value.filter((_, i) => i !== index)
        onChange(newUrls)
    }

    const canAddMore = value.length < maxImages

    return (
        <div className="space-y-4">
            {/* Upload Area */}
            {canAddMore && (
                <div
                    onDrop={handleDrop}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${dragActive ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-green-400'
                        } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => !uploading && inputRef.current?.click()}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                        multiple
                        onChange={handleChange}
                        disabled={uploading}
                        className="hidden"
                    />

                    {uploading ? (
                        <div className="flex flex-col items-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mb-3"></div>
                            <p className="text-sm text-gray-600">Uploading...</p>
                        </div>
                    ) : (
                        <>
                            <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <p className="text-sm text-gray-700 font-medium mb-1">
                                Click to upload or drag and drop
                            </p>
                            <p className="text-xs text-gray-500">
                                JPEG, PNG, WebP, GIF (max 5MB)
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {value.length}/{maxImages} images uploaded
                            </p>
                        </>
                    )}
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800">{error}</p>
                </div>
            )}

            {/* Image Preview Grid */}
            {value.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {value.map((url, index) => (
                        <div key={index} className="relative group">
                            <img
                                src={url}
                                alt={`Upload ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg border border-gray-200"
                            />
                            <button
                                type="button"
                                onClick={() => handleRemove(index)}
                                className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                                {index === 0 ? 'Primary' : `Image ${index + 1}`}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Helper Text */}
            <p className="text-xs text-gray-500">
                The first image will be used as the primary product image.
            </p>
        </div>
    )
}
