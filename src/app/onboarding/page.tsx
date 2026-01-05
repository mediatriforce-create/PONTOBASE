'use client'

import { useState } from 'react'
import { createCompany, joinCompany } from './actions'

export default function OnboardingPage() {
    const [mode, setMode] = useState<'create' | 'join'>('join')
    const [error, setError] = useState<string | null>(null)

    // Note: Using simple form submission for now, could upgrade to useTransition

    return (
        <main className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
            <div className="glass" style={{ padding: '2rem', borderRadius: '1rem', width: '100%', maxWidth: '500px' }}>
                <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', textAlign: 'center' }}>Bem-vindo ao PONTOBASE</h1>
                <p style={{ textAlign: 'center', marginBottom: '2rem', opacity: 0.8 }}>Para começar, você precisa estar vinculado a uma empresa.</p>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', padding: '0.25rem', background: 'hsla(var(--foreground)/0.05)', borderRadius: '0.5rem' }}>
                    <button
                        onClick={() => setMode('join')}
                        className="btn"
                        style={{
                            flex: 1,
                            background: mode === 'join' ? 'hsl(var(--card))' : 'transparent',
                            boxShadow: mode === 'join' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                        }}
                    >
                        Entrar em existente
                    </button>
                    <button
                        onClick={() => setMode('create')}
                        className="btn"
                        style={{
                            flex: 1,
                            background: mode === 'create' ? 'hsl(var(--card))' : 'transparent',
                            boxShadow: mode === 'create' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                        }}
                    >
                        Criar nova empresa
                    </button>
                </div>

                {mode === 'join' ? (
                    <form action={async (formData) => {
                        const res = await joinCompany(formData)
                        if (res?.error) setError(res.error)
                    }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Código da Empresa</label>
                            <input name="companyCode" className="input" placeholder="Ex: ACME-1A2B" required />
                            <p style={{ fontSize: '0.75rem', marginTop: '0.25rem', opacity: 0.7 }}>Peça este código ao administrador da empresa.</p>
                        </div>
                        <button className="btn btn-primary" type="submit">Entrar na Empresa</button>
                    </form>
                ) : (
                    <form action={async (formData) => {
                        const res = await createCompany(formData)
                        if (res?.error) setError(res.error)
                    }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Nome da Empresa</label>
                            <input name="companyName" className="input" placeholder="Minha Empresa S.A." required />
                        </div>
                        <button className="btn btn-primary" type="submit">Criar Empresa</button>
                    </form>
                )}

                {error && (
                    <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'hsla(0, 84%, 60%, 0.1)', color: 'hsl(0, 84%, 60%)', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
                        {error}
                    </div>
                )}
            </div>
        </main>
    )
}
