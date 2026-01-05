import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import ThemeToggle from '@/components/ThemeToggle'
import styles from './profile.module.css'

export default async function ProfilePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('*, companies(name, code)')
        .eq('id', user.id)
        .single()

    const { data: history } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(10)

    return (
        <div className="container" style={{ maxWidth: '800px' }}>
            <h1 style={{ marginBottom: '2rem' }}>Meu Perfil</h1>

            <div className="glass" style={{ padding: '2rem', borderRadius: '1rem', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid hsla(var(--foreground)/0.1)', paddingBottom: '0.5rem' }}>Configurações</h2>
                <div style={{ maxWidth: '300px' }}>
                    <ThemeToggle />
                </div>
            </div>

            <div className="glass" style={{ padding: '2rem', borderRadius: '1rem', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid hsla(var(--foreground)/0.1)', paddingBottom: '0.5rem' }}>Dados Pessoais</h2>

                <div className={styles.gridContainer}>
                    <div>
                        <label style={{ fontSize: '0.85rem', opacity: 0.7 }}>Nome Completo</label>
                        <div style={{ fontWeight: 500 }}>{profile?.full_name}</div>
                    </div>
                    <div>
                        <label style={{ fontSize: '0.85rem', opacity: 0.7 }}>Email</label>
                        <div style={{ fontWeight: 500 }}>{profile?.email}</div>
                    </div>
                    <div>
                        <label style={{ fontSize: '0.85rem', opacity: 0.7 }}>Empresa</label>
                        <div style={{ fontWeight: 500 }}>{(profile?.companies as any)?.name}</div>
                    </div>
                    <div>
                        <label style={{ fontSize: '0.85rem', opacity: 0.7 }}>Função</label>
                        <div style={{ fontWeight: 500, textTransform: 'capitalize' }}>{profile?.role}</div>
                    </div>
                    <div>
                        <label style={{ fontSize: '0.85rem', opacity: 0.7 }}>Status</label>
                        <div style={{ fontWeight: 500, textTransform: 'capitalize' }}>{profile?.status}</div>
                    </div>
                </div>
            </div>

            <div className="glass" style={{ padding: '2rem', borderRadius: '1rem', marginBottom: '2rem', border: '1px solid hsla(0, 84%, 60%, 0.2)' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'hsl(0, 84%, 60%)' }}>Zona de Perigo</h2>
                <p style={{ marginBottom: '1.5rem', opacity: 0.8 }}>Se você deseja entrar em outra empresa, precisa sair da atual primeiro.</p>

                <form action={async () => {
                    'use server'
                    const { leaveCompany } = await import('./actions')
                    await leaveCompany()
                }}>
                    <button
                        type="submit"
                        className="btn"
                        style={{
                            background: 'hsl(0, 84%, 60%)',
                            color: 'white',
                            fontWeight: 600
                        }}
                    >
                        Sair da Empresa / Trocar Empresa
                    </button>
                </form>
            </div>

            <div className="glass" style={{ padding: '2rem', borderRadius: '1rem' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid hsla(var(--foreground)/0.1)', paddingBottom: '0.5rem' }}>Histórico Recente</h2>

                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                        {history?.map((entry) => (
                            <tr key={entry.id} style={{ borderBottom: '1px solid hsla(var(--foreground)/0.05)' }}>
                                <td style={{ padding: '0.75rem 0' }}>
                                    {format(new Date(entry.timestamp), 'dd/MM/yyyy HH:mm')}
                                </td>
                                <td style={{ padding: '0.75rem 0', fontWeight: 500 }}>
                                    {entry.entry_type === 'entry' && 'Entrada'}
                                    {entry.entry_type === 'exit' && 'Saída'}
                                    {entry.entry_type === 'break_start' && 'Início de Pausa'}
                                    {entry.entry_type === 'break_end' && 'Fim de Pausa'}
                                </td>
                            </tr>
                        ))}
                        {!history?.length && <tr><td style={{ padding: '1rem', textAlign: 'center', opacity: 0.5 }}>Sem registros recentes.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div >
    )
}
