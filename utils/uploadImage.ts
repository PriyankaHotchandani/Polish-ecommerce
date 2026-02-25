import { createClient } from '@/utils/supabase/client'

export interface UploadResult {
    url: string
    path: string
}

export async function uploadImage(file: File): Promise<UploadResult> {
    const supabase = createClient()

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
    const filePath = `${fileName}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
        })

    if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`)
    }

    // Get public URL
    const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

    if (!data.publicUrl) {
        throw new Error('Failed to get public URL')
    }

    return {
        url: data.publicUrl,
        path: filePath
    }
}

export async function deleteImage(path: string): Promise<void> {
    const supabase = createClient()

    const { error } = await supabase.storage
        .from('product-images')
        .remove([path])

    if (error) {
        throw new Error(`Delete failed: ${error.message}`)
    }
}

export function validateImageFile(file: File): string | null {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    const maxSize = 5 * 1024 * 1024 // 5MB

    if (!allowedTypes.includes(file.type)) {
        return 'Invalid file type. Please upload JPEG, PNG, WebP, or GIF images.'
    }

    if (file.size > maxSize) {
        return 'File size exceeds 5MB limit.'
    }

    return null
}
