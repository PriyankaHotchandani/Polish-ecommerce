'use client'

import { useState } from 'react'
import { useLocaleMessages } from '@/contexts/LocaleContext'

interface ProductImageGalleryProps {
    images: string[]
    title: string
}

export default function ProductImageGallery({ images, title }: ProductImageGalleryProps) {
    const [selectedImage, setSelectedImage] = useState(0)
    const [zoomOrigin, setZoomOrigin] = useState('50% 50%')
    const { messages } = useLocaleMessages()

    if (!images || images.length === 0) {
        return (
            <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-400">{messages.gallery.noImageAvailable}</span>
            </div>
        )
    }

    return (
        <div>
            {/* Main Image */}
            <div
                className="aspect-square bg-gray-200 rounded-lg overflow-hidden relative group"
                onMouseMove={(event) => {
                    const rect = event.currentTarget.getBoundingClientRect()
                    const x = ((event.clientX - rect.left) / rect.width) * 100
                    const y = ((event.clientY - rect.top) / rect.height) * 100
                    setZoomOrigin(`${x}% ${y}%`)
                }}
                onMouseLeave={() => setZoomOrigin('50% 50%')}
            >
                <img
                    src={images[selectedImage]}
                    alt={`${title} - Image ${selectedImage + 1}`}
                    className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-150"
                    style={{ transformOrigin: zoomOrigin }}
                />

                {/* Navigation arrows for multiple images */}
                {images.length > 1 && (
                    <>
                        <button
                            onClick={() => setSelectedImage((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label={messages.gallery.previousImage}
                        >
                            <svg className="w-6 h-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button
                            onClick={() => setSelectedImage((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label={messages.gallery.nextImage}
                        >
                            <svg className="w-6 h-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </>
                )}

                {/* Image counter */}
                {images.length > 1 && (
                    <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                        {selectedImage + 1} / {images.length}
                    </div>
                )}
            </div>

            {/* Thumbnail Gallery */}
            {images.length > 1 && (
                <div className="mt-4 grid grid-cols-4 gap-4">
                    {images.map((url: string, index: number) => (
                        <button
                            key={index}
                            onClick={() => setSelectedImage(index)}
                            className={`aspect-square bg-gray-200 rounded-md overflow-hidden border-2 transition-all ${selectedImage === index
                                ? 'border-slate-900 ring-2 ring-slate-900/70 ring-offset-2'
                                : 'border-transparent hover:border-gray-300'
                                }`}
                        >
                            <img
                                src={url}
                                alt={`${title} thumbnail ${index + 1}`}
                                className="w-full h-full object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
