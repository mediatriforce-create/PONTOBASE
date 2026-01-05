'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateWorkSchedule(employeeId: string, formData: FormData) {
    const supabase = await createClient()

    // Check Admin permission
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: adminProfile } = await supabase
        .from('profiles')
        .select('role, company_id')
        .eq('id', user.id)
        .single()

    if (adminProfile?.role !== 'admin') return { error: 'Apenas administradores podem realizar esta ação.' }

    // Extract Schedule Data
    const dailyHours = Number(formData.get('dailyHours'))
    const startTime = formData.get('startTime') as string
    const workDays = formData.getAll('workDays').map(Number) // 1,2,3...
    const scheduleType = formData.get('scheduleType')
    const tolerance = Number(formData.get('tolerance'))

    if (!dailyHours || !startTime) return { error: 'Preencha todos os campos obrigatórios.' }

    const schedule = {
        daily_hours: dailyHours,
        start_time: startTime,
        work_days: workDays,
        schedule_type: scheduleType,
        tolerance_minutes: tolerance
    }

    // Update Target Profile
    // Ensure target employee is in same company
    const { error } = await supabase
        .from('profiles')
        .update({ work_schedule: schedule })
        .eq('id', employeeId)
        .eq('company_id', adminProfile.company_id)

    if (error) return { error: 'Erro ao atualizar: ' + error.message }

    revalidatePath(`/dashboard/employees/${employeeId}`)
    return { success: true }
}

export async function updateEmployeeAvatar(employeeId: string, formData: FormData) {
    const supabase = await createClient()

    // Check Admin permission
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: adminProfile } = await supabase
        .from('profiles')
        .select('role, company_id')
        .eq('id', user.id)
        .single()

    if (adminProfile?.role !== 'admin') return { error: 'Apenas administradores podem realizar esta ação.' }

    const file = formData.get('photo') as File
    if (!file || file.size === 0) {
        return { error: 'Por favor selecione uma imagem.' }
    }

    // Basic validation
    if (file.size > 2 * 1024 * 1024) return { error: 'A imagem deve ter no máximo 2MB.' }
    if (!file.type.startsWith('image/')) return { error: 'Apenas arquivos de imagem são permitidos.' }

    const fileExt = file.name.split('.').pop()
    const fileName = `${employeeId}-${Date.now()}.${fileExt}` // Use employeeId in filename
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

    // Update Target Profile
    const { error: dbError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', employeeId)
        .eq('company_id', adminProfile.company_id) // Security check

    if (dbError) return { error: dbError.message }

    revalidatePath(`/dashboard/employees/${employeeId}`)
    return { success: true }
}
