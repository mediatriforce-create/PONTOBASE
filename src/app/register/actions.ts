'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('fullName') as string

    if (!email || !password || !fullName) {
        return { error: 'Todos os campos são obrigatórios' }
    }

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
            },
        },
    })

    if (error) {
        return { error: error.message }
    }

    // Try to login immediately (works if Auto-Confirm trigger is active or Email Verification disabled)
    if (!data.session) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
        })

        if (signInError) {
            // If strictly enforced, we might still fail here.
            // But usually the trigger fixes it.
            return { error: 'Conta criada, mas erro ao logar: ' + signInError.message }
        }
    }

    redirect('/dashboard')
}
