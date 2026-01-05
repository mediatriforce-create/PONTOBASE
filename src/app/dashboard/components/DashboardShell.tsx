'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LogOut, LayoutDashboard, Clock, Users, Settings, FileText, AlertTriangle, Calendar, Menu, X } from 'lucide-react'
import styles from '../dashboard.module.css'

export default function DashboardShell({
    children,
    profile
}: {
    children: React.ReactNode
    profile: any
}) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    return (
        <div className={styles.layout}>
            {/* Mobile Header */}
            <header className={styles.mobileHeader}>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className={styles.menuBtn}
                    aria-label="Toggle Menu"
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
                <span className={styles.mobileLogo}>PONTOBASE</span>
            </header>

            {/* Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div
                    className={styles.overlay}
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`${styles.sidebar} ${isMobileMenuOpen ? styles.sidebarOpen : ''}`}>
                <div className={styles.sidebarHeader}>
                    <h2 className={styles.companyName}>{profile.companies?.name}</h2>
                    {profile.role === 'admin' && (
                        <span className={styles.companyCode}>Cod: {profile.companies?.code}</span>
                    )}
                </div>

                <nav className={styles.nav}>
                    <Link href="/dashboard" className={styles.navItem} onClick={() => setIsMobileMenuOpen(false)}>
                        <LayoutDashboard size={20} />
                        <span>Dashboard</span>
                    </Link>

                    {profile.role !== 'admin' && (
                        <>
                            <Link href="/dashboard/time-clock" className={styles.navItem} onClick={() => setIsMobileMenuOpen(false)}>
                                <Clock size={20} />
                                <span>Meu Ponto</span>
                            </Link>
                            <Link href="/dashboard/schedule" className={styles.navItem} onClick={() => setIsMobileMenuOpen(false)}>
                                <Calendar size={20} />
                                <span>Minha Escala</span>
                            </Link>
                        </>
                    )}

                    {profile.role === 'admin' && (
                        <>
                            <Link href="/dashboard/employees" className={styles.navItem} onClick={() => setIsMobileMenuOpen(false)}>
                                <Users size={20} />
                                <span>Funcionários</span>
                            </Link>
                            <Link href="/dashboard/inconsistencies" className={styles.navItem} onClick={() => setIsMobileMenuOpen(false)}>
                                <AlertTriangle size={20} />
                                <span>Inconsistências</span>
                            </Link>
                            <Link href="/dashboard/audit" className={styles.navItem} onClick={() => setIsMobileMenuOpen(false)}>
                                <FileText size={20} />
                                <span>Auditoria</span>
                            </Link>
                        </>
                    )}

                    <Link href="/dashboard/profile" className={styles.navItem} onClick={() => setIsMobileMenuOpen(false)}>
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
