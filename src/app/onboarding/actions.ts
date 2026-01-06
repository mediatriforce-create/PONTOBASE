'use server'

import { createClient } from '@/utils/supabase/server'

import { revalidatePath } from 'next/cache'

export async function createCompany(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Usuário não autenticado' }

    const name = formData.get('companyName') as string
    if (!name) return { error: 'Nome da empresa é obrigatório' }

    // Generate a simple code: First 3 chars of name + 4 random hex
    const code = (name.substring(0, 3).toUpperCase() + Math.random().toString(16).substring(2, 6).toUpperCase()).replace(/[^A-Z0-9]/g, 'X')

    // Transaction-like logic (RLS policies must allow this)
    // 1. Create Company
    const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({ name, code })
        .select()
        .single()

    if (companyError) return { error: 'Erro ao criar empresa: ' + companyError.message }

    // 2. Update Profile (Use UPSERT to ensure it works even if profile was missing)
    const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
            id: user.id,
            company_id: company.id,
            role: 'admin',
            email: user.email,
            full_name: user.user_metadata?.full_name || 'Admin',
            status: 'active'
        })

    if (profileError) return { error: 'Erro ao atualizar perfil: ' + profileError.message }

    revalidatePath('/dashboard')
    // Return success to let client handle redirect safely
    return { success: true }
}

export async function joinCompany(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Usuário não autenticado' }

    const code = formData.get('companyCode') as string
    if (!code) return { error: 'Código da empresa é obrigatório' }

    // 1. Find Company (Use RPC to bypass RLS, as we are not a member yet)
    const { data: companyId, error: companyError } = await supabase
        .rpc('get_company_by_code', { code_input: code })

    if (companyError || !companyId) return { error: 'Empresa não encontrada com este código' }

    // 2. Update Profile (Upsert)
    const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
            id: user.id,
            company_id: companyId, // Result from RPC is just the ID
            role: 'employee',
            email: user.email,
            full_name: user.user_metadata?.full_name || 'Funcionário',
            status: 'active'
        })

    if (profileError) return { error: 'Erro ao entrar na empresa: ' + profileError.message }

    revalidatePath('/dashboard')
    return { success: true }
}
