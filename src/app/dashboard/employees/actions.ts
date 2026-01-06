'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function removeEmployee(employeeId: string) {
    const supabase = await createClient()

    // Check Admin permission
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: adminProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (adminProfile?.role !== 'admin') return { error: 'Apenas administradores podem realizar esta ação.' }

    // PERFORM DELETE
    // Note: Due to foreign keys, we might need to cascade or specific logic.
    // The user said "Tirar" (Remove).
    // Safest is to Delete Profile -> Trigger cleans auth user? Or just Profile.
    // Given the previous `full_reset` script, a delete on profiles cascades to time_entries.
    // However, deleting the Auth User is harder from here without Service Role.
    // We will delete the PROFILE row, which effectively removes them from this list.
    // If we can't delete auth user, they might be stuck, but for this app's logic (viewing employees),
    // deleting the profile is sufficient.

    const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', employeeId)

    if (error) {
        return { error: 'Erro ao remover funcionário: ' + error.message }
    }

    revalidatePath('/dashboard/employees')
    return { success: true }
}
