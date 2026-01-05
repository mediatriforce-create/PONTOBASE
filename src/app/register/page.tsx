'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { signup } from './actions'

export default function RegisterPage() {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setError(null)
        const formData = new FormData(event.currentTarget)

        startTransition(async () => {
            // @ts-ignore
            const result = await signup(formData)
            if (result?.error) {
                setError(result.error)
            }
        })
    }

    if (success) {
        return (
            <main className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <div className="glass" style={{ padding: '2.5rem', borderRadius: 'var(--radius)', width: '100%', maxWidth: '400px', textAlign: 'center', border: '1px solid hsl(var(--border))' }}>
                    <div style={{ width: '3rem', height: '3rem', background: 'hsl(var(--primary)/0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'hsl(var(--primary))' }}>
                        ✉️
                    </div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Verifique seu Email</h1>
                    <p style={{ fontSize: '0.9rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.5 }}>Enviamos um link de confirmação para o seu email.</p>
                    <Link href="/login" className="btn btn-primary" style={{ marginTop: '2rem', width: '100%' }}>
                        Voltar para Login
                    </Link>
                </div>
            </main>
        )
    }

    return (
        <main className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
            <div className="glass" style={{ padding: '2.5rem', borderRadius: 'var(--radius)', width: '100%', maxWidth: '400px', border: '1px solid hsl(var(--border))' }}>
                <h1 style={{ marginBottom: '0.5rem', fontSize: '1.5rem', fontWeight: 700, textAlign: 'center', letterSpacing: '-0.025em' }}>Criar Conta</h1>
                <p style={{ textAlign: 'center', marginBottom: '2rem', color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem' }}>Comece a usar o PontoBase agora mesmo.</p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Nome Completo</label>
                        <input name="fullName" type="text" required className="input" placeholder="Seu nome" style={{ width: '100%' }} />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Email</label>
                        <input name="email" type="email" required className="input" placeholder="seu@email.com" style={{ width: '100%' }} />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Senha</label>
                        <input name="password" type="password" required className="input" placeholder="••••••••" minLength={6} style={{ width: '100%' }} />
                    </div>

                    {error && (
                        <div style={{ padding: '0.75rem', backgroundColor: 'hsl(var(--destructive)/0.1)', color: 'hsl(var(--destructive))', borderRadius: 'var(--radius)', fontSize: '0.875rem', border: '1px solid hsl(var(--destructive)/0.2)' }}>
                            {error}
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary" disabled={isPending} style={{ width: '100%', marginTop: '0.5rem' }}>
                        {isPending ? 'Criando...' : 'Criar Conta'}
                    </button>
                </form>

                <p style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>
                    Já tem uma conta? <Link href="/login" style={{ fontWeight: 600, color: 'hsl(var(--primary))', textDecoration: 'none' }}>Entre aqui</Link>
                </p>
            </div>
        </main>
    )
}
