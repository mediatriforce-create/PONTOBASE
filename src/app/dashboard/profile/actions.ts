'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function updateAvatar(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const file = formData.get('photo') as File
    if (!file || file.size === 0) {
        return { error: 'Por favor selecione uma imagem.' }
    }

    // Basic validation
    if (file.size > 2 * 1024 * 1024) return { error: 'A imagem deve ter no máximo 2MB.' }
    if (!file.type.startsWith('image/')) return { error: 'Apenas arquivos de imagem são permitidos.' }

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    const filePath = `${fileName}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

    if (uploadError) {
        console.error('Upload error:', uploadError)
        return { error: 'Erro ao fazer upload da imagem.' }
    }

    // Get Public URL
    const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

    // Update Profile
    const { error: dbError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)

    if (dbError) return { error: dbError.message }

    revalidatePath('/dashboard/profile')
    return { success: true }
}

export async function leaveCompany() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Update profile: remove company_id and reset role to employee
    const { error } = await supabase
        .from('profiles')
        .update({ company_id: null, role: 'employee' })
        .eq('id', user.id)

    if (error) return { error: error.message }

    // Redirect to onboarding (this will throw a NEXT_REDIRECT error which is handled by Next.js)
    redirect('/onboarding')
}
