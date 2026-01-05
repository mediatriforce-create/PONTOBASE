import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'

export default async function AuditPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('profiles').select('Role:role, CompanyId:company_id').eq('id', user.id).single()

    if (profile?.Role !== 'admin') {
        return <div className="container">Acesso negado.</div>
    }

    const { data: logs } = await supabase
        .from('audit_logs')
        .select('*, profiles(full_name)')
        .eq('company_id', profile.CompanyId)
        .order('created_at', { ascending: false })
        .limit(50)

    return (
        <div className="container" style={{ maxWidth: '1000px' }}>
            <h1 style={{ marginBottom: '2rem', fontSize: '1.875rem', fontWeight: 700, letterSpacing: '-0.025em' }}>Auditoria</h1>

            <div className="glass" style={{ borderRadius: 'var(--radius)', padding: '0', overflow: 'hidden', border: '1px solid hsl(var(--border))' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: 'hsl(var(--muted))' }}>
                        <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                            <th style={{ padding: '0.75rem 1.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase' }}>Data/Hora</th>
                            <th style={{ padding: '0.75rem 1.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase' }}>Usuário</th>
                            <th style={{ padding: '0.75rem 1.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase' }}>Ação</th>
                            <th style={{ padding: '0.75rem 1.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase' }}>Detalhes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs?.map((log) => (
                            <tr key={log.id} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                                <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', fontFamily: 'var(--font-inter)', fontVariantNumeric: 'tabular-nums' }}>
                                    {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss')}
                                </td>
                                <td style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>
                                    {(log.profiles as any)?.full_name || 'Sistema'}
                                </td>
                                <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem' }}>
                                    <span style={{ padding: '0.2rem 0.6rem', background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.025em' }}>
                                        {log.action}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontFamily: 'monospace', color: 'hsl(var(--muted-foreground))', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={JSON.stringify(log.details)}>
                                    {JSON.stringify(log.details)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
