import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

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

    const { data: employees } = await supabase
        .from('profiles')
        .select('*')
        .eq('company_id', profile.CompanyId)
        .order('full_name')

    return (
        <div className="container" style={{ maxWidth: '1200px' }}>
            <h1 style={{ marginBottom: '2rem', fontSize: '1.875rem', fontWeight: 700, letterSpacing: '-0.025em' }}>Funcionários</h1>

            <div className="glass" style={{ overflowX: 'auto', borderRadius: 'var(--radius)', padding: '0', border: '1px solid hsl(var(--border))' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: 'hsl(var(--muted))' }}>
                        <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                            <th style={{ padding: '0.75rem 1.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))' }}>Nome</th>
                            <th style={{ padding: '0.75rem 1.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))' }}>Email</th>
                            <th style={{ padding: '0.75rem 1.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))' }}>Função</th>
                            <th style={{ padding: '0.75rem 1.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees?.map((emp) => (
                            <tr key={emp.id} style={{ borderBottom: '1px solid hsl(var(--border))', transition: 'background 0.2s' }}>
                                <td style={{ padding: '1rem 1.5rem' }}>
                                    <Link href={`/dashboard/employees/${emp.id}`} style={{ fontWeight: 500, color: 'hsl(var(--foreground))', textDecoration: 'none' }}>
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
                                        background: emp.role === 'admin' ? 'hsl(var(--primary)/0.1)' : 'hsl(var(--secondary))',
                                        color: emp.role === 'admin' ? 'hsl(var(--primary))' : 'hsl(var(--secondary-foreground))'
                                    }}>
                                        {emp.role === 'admin' ? 'Administrador' : 'Funcionário'}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem' }}>
                                    {emp.status === 'active' ? (
                                        <span style={{ color: 'hsl(142, 70%, 40%)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor' }}></span> Excluir
                                        </span>
                                    ) : (
                                        <span style={{ color: 'hsl(var(--muted-foreground))', fontWeight: 500 }}>Inativo</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {employees?.length === 0 && (
                            <tr>
                                <td colSpan={4} style={{ padding: '4rem', textAlign: 'center', opacity: 0.5 }}>Nenhum funcionário encontrado.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
