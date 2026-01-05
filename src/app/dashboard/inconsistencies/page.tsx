import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { calculateInconsistencies, Schedule } from '@/utils/time-calculations'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import Link from 'next/link'
import { AlertTriangle, Clock, CalendarX } from 'lucide-react'

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
    }).filter(r => r.issues.length > 0)

    return (
        <div className="container" style={{ maxWidth: '1000px' }}>
            <h1 style={{ marginBottom: '2rem' }}>Relatório de Inconsistências</h1>
            <p style={{ marginBottom: '2rem', opacity: 0.7 }}>Abaixo estão listado os atrasos e faltas dos últimos 30 dias.</p>

            <div style={{ display: 'grid', gap: '2rem' }}>
                {report?.map((item) => (
                    <div key={item.employee.id} className="glass" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid hsla(var(--foreground)/0.1)', paddingBottom: '0.5rem' }}>
                            <Link href={`/dashboard/employees/${item.employee.id}`} style={{ fontWeight: 700, fontSize: '1.1rem', color: 'hsl(var(--primary))', textDecoration: 'none' }}>
                                {item.employee.full_name}
                            </Link>
                            <span style={{ fontSize: '0.9rem', opacity: 0.6 }}>{item.issues.length} ocorrências</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {item.issues.map((issue, idx) => (
                                <div key={idx} style={{
                                    display: 'flex',
                                    gap: '1rem',
                                    alignItems: 'center',
                                    padding: '0.75rem',
                                    borderRadius: '0.5rem',
                                    background: issue.type === 'ABSENT' ? 'hsla(0, 84%, 60%, 0.05)' : 'hsla(35, 90%, 50%, 0.05)',
                                    borderLeft: `4px solid ${issue.type === 'ABSENT' ? 'hsl(0, 84%, 60%)' : 'hsl(35, 90%, 50%)'}`
                                }}>
                                    <div style={{ width: '2.5rem', textAlign: 'center' }}>
                                        {issue.type === 'ABSENT' ? <CalendarX size={20} color="hsl(0, 84%, 60%)" /> : <Clock size={20} color="hsl(35, 90%, 50%)" />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                            {issue.type === 'ABSENT' ? 'Falta' :
                                                issue.type === 'LATE' ? 'Atraso' :
                                                    issue.type === 'MISSING_EXIT' ? 'Sem registro de saída' : issue.type}
                                        </div>
                                        <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>{issue.details}</div>
                                    </div>
                                    <div style={{ fontSize: '0.9rem', fontFamily: 'monospace', fontWeight: 600 }}>
                                        {format(issue.date, 'dd/MM/yyyy')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {report?.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '4rem', opacity: 0.5 }}>
                        <AlertTriangle size={48} style={{ marginBottom: '1rem' }} />
                        <h3>Nenhuma inconsistência encontrada nos últimos 30 dias.</h3>
                        <p>Sua equipe está de parabéns!</p>
                    </div>
                )}
            </div>
        </div>
    )
}
