'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function createCompany(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

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

    // 2. Update Profile
    // Note: RLS 'Admins can update company members' might block this if I am not admin yet?
    // I have a policy: "Users can update own profile" -> using (id = auth.uid())
    // So I can update my own company_id and role.
    const { error: profileError } = await supabase
        .from('profiles')
        .update({ company_id: company.id, role: 'admin' })
        .eq('id', user.id)

    if (profileError) return { error: 'Erro ao atualizar perfil: ' + profileError.message }

    redirect('/dashboard')
}

export async function joinCompany(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const code = formData.get('companyCode') as string
    if (!code) return { error: 'Código da empresa é obrigatório' }

    // 1. Find Company
    const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('id')
        .eq('code', code)
        .single()

    if (companyError || !company) return { error: 'Empresa não encontrada com este código' }

    // 2. Update Profile
    const { error: profileError } = await supabase
        .from('profiles')
        .update({ company_id: company.id, role: 'employee' })
        .eq('id', user.id)

    if (profileError) return { error: 'Erro ao entrar na empresa: ' + profileError.message }

    redirect('/dashboard')
}
