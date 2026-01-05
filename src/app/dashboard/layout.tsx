import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LogOut, LayoutDashboard, Clock, Users, Settings, FileText, AlertTriangle, Calendar } from 'lucide-react'
import styles from './dashboard.module.css'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*, companies(name, code)')
        .eq('id', user.id)
        .single()

    if (!profile || !profile.company_id) {
        redirect('/onboarding')
    }

    return (
        <div className={styles.layout}>
            <aside className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <h2 className={styles.companyName}>{(profile.companies as any)?.name}</h2>
                    {profile.role === 'admin' && (
                        <span className={styles.companyCode}>Cod: {(profile.companies as any)?.code}</span>
                    )}
                </div>

                <nav className={styles.nav}>
                    <Link href="/dashboard" className={styles.navItem}>
                        <LayoutDashboard size={20} />
                        <span>Dashboard</span>
                    </Link>

                    {profile.role !== 'admin' && (
                        <>
                            <Link href="/dashboard/time-clock" className={styles.navItem}>
                                <Clock size={20} />
                                <span>Meu Ponto</span>
                            </Link>
                            <Link href="/dashboard/schedule" className={styles.navItem}>
                                <Calendar size={20} />
                                <span>Minha Escala</span>
                            </Link>
                        </>
                    )}

                    {profile.role === 'admin' && (
                        <>
                            <Link href="/dashboard/employees" className={styles.navItem}>
                                <Users size={20} />
                                <span>Funcionários</span>
                            </Link>
                            <Link href="/dashboard/inconsistencies" className={styles.navItem}>
                                <AlertTriangle size={20} />
                                <span>Inconsistências</span>
                            </Link>
                            <Link href="/dashboard/audit" className={styles.navItem}>
                                <FileText size={20} />
                                <span>Auditoria</span>
                            </Link>
                        </>
                    )}


                    <Link href="/dashboard/profile" className={styles.navItem}>
                        <Settings size={20} />
                        <span>Meu Perfil</span>
                    </Link>
                </nav>

                <div className={styles.sidebarFooter}>
                    <div className={styles.userInfo}>
                        <div className={styles.userName}>{profile.full_name}</div>
                        <div className={styles.userRole}>{profile.role === 'admin' ? 'Administrador' : 'Funcionário'}</div>
                    </div>
                    <form action="/auth/signout" method="post">
                        <button className={styles.logoutBtn}>
                            <LogOut size={20} />
                        </button>
                    </form>
                </div>
            </aside>

            <main className={styles.main}>
                {children}
            </main>
        </div>
    )
}
