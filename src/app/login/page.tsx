'use client'

import Link from 'next/link'
import { useActionState } from 'react' // or useFormState depending on React version
// Note: Next.js 14 uses useFormState from react-dom which is now useActionState in React 19 or canary.
// create-next-app might install 19. I'll use a simple client wrapper or just standard form action if I want to be safe.
// Actually, I'll use a simple transition for now to keep it robust.
import { useState, useTransition } from 'react'
import { login } from './actions'
import styles from './page.module.css' // Reuse or create new

export default function LoginPage() {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setError(null)
        const formData = new FormData(event.currentTarget)

        startTransition(async () => {
            // @ts-ignore
            const result = await login(formData)
            if (result?.error) {
                setError(result.error)
            }
        })
    }

    return (
        <main className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
            <div className="glass" style={{ padding: '2.5rem', borderRadius: 'var(--radius)', width: '100%', maxWidth: '400px', border: '1px solid hsl(var(--border))' }}>
                <h1 style={{ marginBottom: '0.5rem', fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.025em', textAlign: 'center' }}>Bem-vindo de volta</h1>
                <p style={{ textAlign: 'center', marginBottom: '2rem', color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem' }}>Entre com suas credenciais para acessar.</p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Email</label>
                        <input name="email" type="email" required className="input" placeholder="seu@email.com" style={{ width: '100%' }} />
                    </div>

                    <div>
                        <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Senha</label>
                        <input name="password" type="password" required className="input" placeholder="••••••••" style={{ width: '100%' }} />
                    </div>

                    {error && (
                        <div style={{ padding: '0.75rem', backgroundColor: 'hsl(var(--destructive)/0.1)', color: 'hsl(var(--destructive))', borderRadius: 'var(--radius)', fontSize: '0.875rem', border: '1px solid hsl(var(--destructive)/0.2)' }}>
                            {error}
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary" disabled={isPending} style={{ width: '100%', marginTop: '0.5rem' }}>
                        {isPending ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>

                <p style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>
                    Não tem uma conta? <Link href="/register" style={{ fontWeight: 600, color: 'hsl(var(--primary))', textDecoration: 'none' }}>Registre-se</Link>
                </p>
            </div>
        </main>
    )
}
