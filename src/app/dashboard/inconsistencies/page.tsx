import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { calculateInconsistencies, Schedule } from '@/utils/time-calculations'
import { subDays } from 'date-fns'
import InconsistencyList from './InconsistencyList'

export const dynamic = 'force-dynamic'

export default async function InconsistenciesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('profiles').select('Role:role, CompanyId:company_id').eq('id', user.id).single()
    if (profile?.Role !== 'admin') {
        return <div className="container">Acesso negado.</div>
    }

    // Fetch all employees
    const { data: employees } = await supabase
        .from('profiles')
        .select('*')
        .eq('company_id', profile.CompanyId)
        .neq('role', 'admin') // Usually admins don't track punches, or we can include them. Let's exclude for now.

    // Fetch entries for last 30 days
    const END_DATE = new Date()
    const START_DATE = subDays(END_DATE, 30)

    const { data: entries } = await supabase
        .from('time_entries')
        .select('*')
        .eq('company_id', profile.CompanyId)
        .gte('timestamp', START_DATE.toISOString())
        .lte('timestamp', END_DATE.toISOString())

    // Process Inconsistencies
    const report = employees?.map(emp => {
        const empEntries = entries?.filter(e => e.user_id === emp.id) || []
        const schedule = (emp.work_schedule as any) as Schedule // removed fallback default

        const issues = calculateInconsistencies(schedule, empEntries, START_DATE, subDays(new Date(), 1), emp.created_at) // Up to yesterday to avoid "Absent" for today if simply not arrived yet.

        // Special check for TODAY's lateness (if already arrived)
        const todayEntry = calculateInconsistencies(schedule, empEntries, new Date(), new Date())
        // Filter only LATE for today (cannot be absent yet unless end of day)
        const todayLate = todayEntry.filter(i => i.type === 'LATE')

        return {
            employee: emp,
            issues: [...issues, ...todayLate]
        }
    }).filter(r => r.issues.length > 0) || []

    return (
        <div className="container" style={{ maxWidth: '1000px' }}>
            <h1 style={{ marginBottom: '2rem' }}>Relatório de Inconsistências</h1>
            <p style={{ marginBottom: '2rem', opacity: 0.7 }}>Abaixo estão listado os atrasos e faltas dos últimos 30 dias. Clique no funcionário para ver detalhes.</p>

            <InconsistencyList report={report} />
        </div>
    )
}
