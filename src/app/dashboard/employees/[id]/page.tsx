import { createClient } from '@/utils/supabase/server'
import { calculateInconsistencies, Schedule } from '@/utils/time-calculations'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, AlertTriangle } from 'lucide-react'
import { format, isSameDay } from 'date-fns'
import EditScheduleForm from './EditScheduleForm'

export const dynamic = 'force-dynamic'

export default async function EmployeeDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // 1. Verify Admin Access
    const { data: adminProfile } = await supabase.from('profiles').select('role, company_id').eq('id', user.id).single()
    if (adminProfile?.role !== 'admin') redirect('/dashboard')

    // 2. Fetch Employee Data
    const { data: employee, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()

    if (error) return <div className="p-8 text-red-500">Erro ao carregar: {error.message}</div>
    if (!employee) return <div className="p-8">Funcionário não encontrado (ID: {id})</div>

    // 3. Fetch History
    const { data: history } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', employee.id)
        .order('timestamp', { ascending: false })
        .limit(20)

    // Default Schedule Values
    const schedule = (employee.work_schedule as any) as Schedule

    // Calculate Inconsistencies for TODAY
    const todayEntries = history?.filter(e => isSameDay(new Date(e.timestamp), new Date())) || []

    let todayIssues: any[] = []
    if (schedule && schedule.work_days?.includes(new Date().getDay())) {
        todayIssues = calculateInconsistencies(schedule, todayEntries, new Date(), new Date(), employee.created_at)
    }

    return (
        <div className="animate-fade-in">
            <Link href="/dashboard/employees" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', opacity: 0.7, textDecoration: 'none', color: 'inherit' }}>
                <ArrowLeft size={16} /> Voltar para Lista
            </Link>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1 }}>{employee.full_name}</h1>
                    <p style={{ opacity: 0.7, fontSize: '1.1rem', marginTop: '0.25rem' }}>{employee.email}</p>

                    {/* Admin Photo Upload - REMOVED AS PER USER REQUEST */}
                    {/* Display Initials Only */}
                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background: 'hsl(var(--muted))',
                        border: '1px solid hsl(var(--border))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        color: 'hsl(var(--muted-foreground))',
                        marginTop: '1rem'
                    }}>
                        {employee.full_name?.charAt(0)}
                    </div>
                </div>
                {/* Status Badges */}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <span style={{ padding: '0.35rem 1rem', borderRadius: '999px', background: 'hsl(var(--primary)/0.1)', color: 'hsl(var(--primary))', fontSize: '0.875rem', fontWeight: 600 }}>
                        {employee.role === 'admin' ? 'Administrador' : 'Funcionário'}
                    </span>
                    <span style={{ padding: '0.35rem 1rem', borderRadius: '999px', background: employee.status === 'active' ? 'hsla(142, 70%, 40%, 0.1)' : 'hsla(0, 84%, 60%, 0.1)', color: employee.status === 'active' ? 'hsl(142, 70%, 40%)' : 'hsl(0, 84%, 60%)', fontSize: '0.875rem', fontWeight: 600 }}>
                        {employee.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                </div>
            </div>

            {/* ALERT SECTION FOR TODAY */}
            {todayIssues.length > 0 && (
                <div style={{ padding: '1rem 1.5rem', background: 'hsl(0, 84%, 60%)', color: 'white', borderRadius: '1rem', marginBottom: '2rem', boxShadow: '0 4px 10px hsla(0, 84%, 60%, 0.3)' }}>
                    <h3 style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertTriangle size={20} /> Atenção: Ocorrências Hoje
                    </h3>
                    <ul style={{ marginTop: '0.5rem', listStyle: 'none', padding: 0 }}>
                        {todayIssues.map((issue, idx) => (
                            <li key={idx} style={{ fontSize: '0.95rem', opacity: 0.95 }}>
                                • {issue.details}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem', alignItems: 'start' }}>

                {/* LEFT COLUMN: CONFIGURATION */}
                <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius)', height: 'fit-content', border: '1px solid hsl(var(--border))' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'hsl(var(--muted-foreground))' }}>
                        <Clock size={18} /> Configuração de Jornada
                    </h2>

                    <EditScheduleForm employeeId={employee.id} initialSchedule={schedule} />
                </div>

                {/* RIGHT COLUMN: HISTORY */}
                <div className="glass" style={{ padding: '0', borderRadius: 'var(--radius)', border: '1px solid hsl(var(--border))', overflow: 'hidden' }}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid hsl(var(--border))', background: 'hsl(var(--muted))' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'hsl(var(--muted-foreground))', margin: 0 }}>
                            <Calendar size={18} /> Histórico Recente
                        </h2>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'hsl(var(--secondary)/0.5)', borderBottom: '1px solid hsl(var(--border))', textAlign: 'left' }}>
                                <th style={{ padding: '0.75rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase' }}>Data</th>
                                <th style={{ padding: '0.75rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase' }}>Evento</th>
                                <th style={{ padding: '0.75rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase' }}>Hora</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history?.map((entry) => (
                                <tr key={entry.id} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', color: 'hsl(var(--muted-foreground))' }}>{format(new Date(entry.timestamp), 'dd/MM/yyyy')}</td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <span style={{
                                            padding: '0.2rem 0.6rem',
                                            borderRadius: '999px',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            background: entry.entry_type === 'entry' ? 'hsla(142, 70%, 40%, 0.1)' :
                                                entry.entry_type === 'exit' ? 'hsla(0, 84%, 60%, 0.1)' : 'hsla(35, 90%, 50%, 0.1)',
                                            color: entry.entry_type === 'entry' ? 'hsl(142, 70%, 40%)' :
                                                entry.entry_type === 'exit' ? 'hsl(0, 84%, 60%)' : 'hsl(35, 90%, 50%)'
                                        }}>
                                            {entry.entry_type.replace('_', ' ').toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', fontFamily: 'var(--font-inter)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{format(new Date(entry.timestamp), 'HH:mm')}</td>
                                </tr>
                            ))}
                            {!history?.length && <tr><td colSpan={3} style={{ padding: '3rem', textAlign: 'center', opacity: 0.5 }}>Sem registros recentes.</td></tr>}
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    )
}
