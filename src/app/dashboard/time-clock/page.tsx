'use client'

import { useState, useEffect, useTransition } from 'react'
import { registerTimeEntry } from './actions'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function TimeClockPage() {
    const [time, setTime] = useState<Date | null>(null)
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        setTime(new Date())
        const timer = setInterval(() => setTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    const handleRegister = (type: 'entry' | 'exit' | 'break_start' | 'break_end') => {
        setError(null)
        startTransition(async () => {
            const res = await registerTimeEntry(type)
            if (res?.error) setError(res.error)
        })
    }

    if (!time) return null // Hydration fix (render nothing server side if needed, or skeleton)

    return (
        <div className="container" style={{ maxWidth: '800px' }}>
            <h1 style={{ marginBottom: '2rem', fontSize: '1.5rem' }}>Meu Ponto</h1>

            <div className="glass" style={{
                padding: 'clamp(1.5rem, 5vw, 3rem)', // Reduced responsive padding
                borderRadius: '1.5rem',
                textAlign: 'center',
                marginBottom: '2rem',
                width: '100%',
                overflow: 'hidden' // Prevent spill
            }}>
                <div style={{
                    fontSize: 'clamp(2rem, 13vw, 5rem)', // Slightly smaller min, slightly flexible viewport
                    fontWeight: '800',
                    fontFamily: 'monospace',
                    letterSpacing: '-0.05em',
                    lineHeight: 1,
                    whiteSpace: 'nowrap' // Prevent wrapping
                }}>
                    {format(time, 'HH:mm:ss')}
                </div>
                <div style={{ fontSize: '1.25rem', color: 'hsla(var(--foreground)/0.6)', marginTop: '0.5rem' }}>
                    {format(time, "EEEE, d 'de' MMMM", { locale: ptBR })}
                </div>
            </div>

            {error && (
                <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: 'hsla(0, 84%, 60%, 0.1)', color: 'hsl(0, 84%, 60%)', borderRadius: '0.5rem', textAlign: 'center' }}>
                    {error}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <button
                    onClick={() => handleRegister('entry')}
                    disabled={isPending}
                    className="btn btn-primary"
                    style={{ height: '5rem', fontSize: '1.25rem' }}
                >
                    {isPending ? 'Registrando...' : 'Registrar Entrada'}
                </button>
                <button
                    onClick={() => handleRegister('exit')}
                    disabled={isPending}
                    className="btn btn-outline"
                    style={{ height: '5rem', fontSize: '1.25rem', borderColor: 'hsl(0, 84%, 60%)', color: 'hsl(0, 84%, 60%)' }}
                >
                    {isPending ? 'Registrando...' : 'Registrar Saída'}
                </button>
                <button
                    onClick={() => handleRegister('break_start')}
                    disabled={isPending}
                    className="btn btn-outline"
                >
                    Iniciar Pausa
                </button>
                <button
                    onClick={() => handleRegister('break_end')}
                    disabled={isPending}
                    className="btn btn-outline"
                >
                    Voltar da Pausa
                </button>
            </div>

            <div style={{ marginTop: '3rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>Histórico Hoje</h3>
                <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>Os registros aparecerão aqui (Funcionalidade de listagem em desenvolvimento).</p>
            </div>
        </div>
    )
}
