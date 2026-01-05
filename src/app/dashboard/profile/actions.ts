'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function updateAvatar(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const photoUrl = formData.get('photoUrl') as string

    const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: photoUrl })
        .eq('id', user.id)

    if (error) return { error: error.message }

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
