import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Trash2, User, Mail, Briefcase, Activity } from 'lucide-react'
import { isSameDay } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function EmployeesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Get Admin Company
    const { data: profile } = await supabase.from('profiles').select('Role:role, CompanyId:company_id').eq('id', user.id).single()

    if (profile?.Role !== 'admin') {
        return <div className="container">Acesso negado. Apenas administradores podem ver esta página.</div>
    }

    // Fetch Employees (Exclude Admins)
    const { data: employees } = await supabase
        .from('profiles')
        .select('*')
        .eq('company_id', profile.CompanyId)
        .neq('role', 'admin') // Filter out admins
        .order('full_name')

    // Fetch Status (Latest Entry Logic)
    // We need to know if they are "Working" right now.
    // Logic: Look at their last entry TODAY. If type == 'entry' -> Working. If 'exit' -> Not working.
    // If no entry today -> Not working.

    // Optimisation: Fetch all entries for today for these employees
    const employeeIds = employees?.map(e => e.id) || []

    let statusMap: Record<string, string> = {}

    if (employeeIds.length > 0) {
        const { data: todayEntries } = await supabase
            .from('time_entries')
            .select('user_id, entry_type, timestamp')
            .in('user_id', employeeIds)
            .gte('timestamp', new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
            .order('timestamp', { ascending: true }) // Process in order to find last state

        if (todayEntries) {
            todayEntries.forEach(entry => {
                // Determine current state based on last entry
                // Simple logic: If last was entry -> Working. Last was exit -> Not.
                // Since we iterate in order, the last one overwrites.
                if (entry.entry_type === 'entry' || entry.entry_type === 'break_end') {
                    statusMap[entry.user_id] = 'working'
                } else {
                    statusMap[entry.user_id] = 'stopped'
                }
            })
        }
    }

    return (
        <div className="container" style={{ maxWidth: '1200px' }}>
            <h1 style={{ marginBottom: '2rem', fontSize: '1.875rem', fontWeight: 700, letterSpacing: '-0.025em' }}>Funcionários</h1>

            <div className="glass" style={{ overflowX: 'auto', borderRadius: 'var(--radius)', padding: '0', border: '1px solid hsl(var(--border))' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: 'hsl(var(--muted))' }}>
                        <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                            <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase' }}>Nome</th>
                            <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase' }}>Email</th>
                            <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase' }}>Função</th>
                            <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase' }}>Status Atual</th>
                            <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', textAlign: 'right' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees?.map((emp) => {
                            const isWorking = statusMap[emp.id] === 'working'

                            return (
                                <tr key={emp.id} style={{ borderBottom: '1px solid hsl(var(--border))', transition: 'background 0.2s' }}>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <Link href={`/dashboard/employees/${emp.id}`} style={{ fontWeight: 600, color: 'hsl(var(--foreground))', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'hsl(var(--muted))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))' }}>
                                                {emp.full_name?.charAt(0)}
                                            </div>
                                            {emp.full_name || 'Sem nome'}
                                        </Link>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', color: 'hsl(var(--muted-foreground))' }}>{emp.email}</td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '999px',
                                            fontSize: '0.75rem',
                                            fontWeight: 500,
                                            background: 'hsl(var(--secondary))',
                                            color: 'hsl(var(--secondary-foreground))',
                                            textTransform: 'capitalize'
                                        }}>
                                            {emp.role === 'employee' ? 'Funcionário' : emp.role}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem' }}>
                                        <span style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            fontWeight: 600,
                                            color: isWorking ? 'hsl(142, 70%, 40%)' : 'hsl(var(--muted-foreground))',
                                            background: isWorking ? 'hsla(142, 70%, 40%, 0.1)' : 'hsl(var(--muted))',
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '999px',
                                            fontSize: '0.75rem'
                                        }}>
                                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }}></span>
                                            {isWorking ? 'Trabalhando' : 'Não trabalhando'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                        <form action={async () => {
                                            'use server'
                                            // Import inline to avoid circular deps if any, though standard import is fine
                                            const { removeEmployee } = await import('./actions')
                                            await removeEmployee(emp.id)
                                        }}>
                                            <button
                                                type="submit"
                                                className="btn btn-ghost"
                                                style={{ color: 'hsl(0, 84%, 60%)', padding: '0.5rem', height: 'auto' }}
                                                title="Remover Funcionário"
                                                onClick={() => {
                                                    // This is a server component, so no onClick alert effectively here without client component wrap. 
                                                    // But form submission works.
                                                }}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </form>
                                    </td>
                                </tr>
                            )
                        })}
                        {employees?.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{ padding: '4rem', textAlign: 'center', opacity: 0.5 }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                        <User size={48} strokeWidth={1} />
                                        <span>Nenhum funcionário encontrado.</span>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
