'use client'

import Link from 'next/link'
import { Users, FileText, Copy, UserPlus, AlertCircle } from 'lucide-react'

// Mock data for now, or passed from server page
export default function AdminDashboard({ profile, activeCount = 0 }: { profile: any, activeCount?: number }) {
    const companyCode = profile.companies?.code || 'N/A'

    const copyCode = () => {
        navigator.clipboard.writeText(companyCode)
        alert('Código copiado!')
    }

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Painel do Administrador</h1>
                    <p style={{ opacity: 0.7 }}>Visão geral da empresa {profile.companies?.name}</p>
                </div>
            </div>
            {/* Hero Section: Onboarding / Company Code */}
            <div className="glass" style={{
                padding: '2rem',
                borderRadius: 'var(--radius)',
                marginBottom: '2rem',
                background: 'hsl(var(--card))',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                // Removed explicit border since .glass has it, removed linear gradient
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center', textAlign: 'center' }}>
                    <div style={{ padding: '1rem', background: 'hsl(var(--primary)/0.1)', borderRadius: '50%', color: 'hsl(var(--primary))' }}>
                        <UserPlus size={32} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.025em' }}>Adicionar Funcionários</h2>
                        <p style={{ maxWidth: '480px', margin: '0.5rem auto', opacity: 0.7, fontSize: '0.95rem' }}>
                            Compartilhe o código abaixo. Seus funcionários precisarão dele para criar a conta e entrar na empresa.
                        </p>
                    </div>

                    <div
                        onClick={copyCode}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            background: 'hsl(var(--secondary))',
                            padding: '1rem 2rem',
                            borderRadius: 'var(--radius)',
                            border: '1px dashed hsl(var(--primary))',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            position: 'relative'
                        }}
                        title="Clique para copiar"
                    >
                        <span style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--font-inter)', letterSpacing: '0.1em', color: 'hsl(var(--foreground))' }}>
                            {companyCode}
                        </span>
                        <Copy size={20} className="text-primary" />
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid hsl(var(--border))' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <div style={{ padding: '0.5rem', background: 'hsla(142, 70%, 40%, 0.1)', borderRadius: 'var(--radius)', color: 'hsl(142, 70%, 40%)' }}>
                            <Users size={20} />
                        </div>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Ativos Agora</span>
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 700, lineHeight: 1, letterSpacing: '-0.03em' }}>{activeCount}</div>
                    <p style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))', marginTop: '0.5rem' }}>Funcionários trabalhando</p>
                </div>

                <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <div style={{ padding: '0.5rem', background: 'hsl(var(--destructive)/0.1)', borderRadius: 'var(--radius)', color: 'hsl(var(--destructive))' }}>
                            <AlertCircle size={20} />
                        </div>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Inconsistências</span>
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 700, lineHeight: 1, letterSpacing: '-0.03em' }}>0</div>
                    <p style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))', marginTop: '0.5rem' }}>Precisam de atenção</p>
                </div>

                {/* Shortcut */}
                <Link href="/dashboard/employees" className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius)', textDecoration: 'none', color: 'inherit', transition: 'all 0.2s', border: '1px solid hsl(var(--border))' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <div style={{ padding: '0.5rem', background: 'hsl(var(--primary)/0.1)', borderRadius: 'var(--radius)', color: 'hsl(var(--primary))' }}>
                            <Users size={20} />
                        </div>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Gerenciar Equipe</span>
                    </div>
                    <p style={{ opacity: 0.7, fontSize: '0.9rem', lineHeight: 1.5 }}>Ver lista completa de funcionários e editar permissões.</p>
                </Link>
            </div>

        </div>
    )
}
