'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function registerTimeEntry(type: 'entry' | 'exit' | 'break_start' | 'break_end') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Get Profile for Company ID
    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
    if (!profile) return { error: 'Profile not found' }

    // 1. Validate Sequence (Optional but good)
    // Get last entry today
    const TODAY_START = new Date()
    TODAY_START.setHours(0, 0, 0, 0)

    // 1. Fetch TODAY'S entries to check limits
    const { data: dayEntries } = await supabase
        .from('time_entries')
        .select('entry_type')
        .eq('user_id', user.id)
        .gte('timestamp', TODAY_START.toISOString())
        .order('timestamp', { ascending: true }) // Oldest first

    const hasEntry = dayEntries?.some(e => e.entry_type === 'entry')
    const hasExit = dayEntries?.some(e => e.entry_type === 'exit')

    // Get last event for sequence check
    const lastEntry = dayEntries && dayEntries.length > 0 ? dayEntries[dayEntries.length - 1] : null
    const lastType = lastEntry?.entry_type

    // STRICT RULES
    if (type === 'entry') {
        if (hasEntry) return { error: '❌ Entrada já registrada hoje! Apenas uma entrada permitida por dia.' }
    }

    if (hasExit) {
        return { error: '⛔ Jornada encerrada! Não é possível fazer novos registros hoje.' }
    }

    // SEQUENCE CHECKS
    if (type === 'exit') {
        if (!lastType || lastType === 'exit') return { error: 'Você não está trabalhando.' }
    }
    if (type === 'break_start') {
        if (!lastType || lastType !== 'entry' && lastType !== 'break_end') return { error: 'Você precisa estar trabalhando para pausar.' }
    }
    if (type === 'break_end') {
        if (lastType !== 'break_start') return { error: 'Você não está em pausa.' }
    }

    // 2. Insert
    const { error } = await supabase.from('time_entries').insert({
        user_id: user.id,
        company_id: profile.company_id,
        entry_type: type,
        timestamp: new Date().toISOString()
    })

    if (error) return { error: error.message }

    // 3. Log Audit
    await supabase.from('audit_logs').insert({
        company_id: profile.company_id,
        actor_id: user.id,
        action: `TIME_REGISTER_${type.toUpperCase()}`,
        details: JSON.stringify({ timestamp: new Date() })
    })

    revalidatePath('/dashboard/time-clock')
    revalidatePath('/dashboard')
    return { success: true }
}
