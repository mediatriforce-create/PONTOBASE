'use client'

import { useTheme } from '@/app/providers'
import { Moon, Sun } from 'lucide-react'

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme()

    return (
        <button
            onClick={toggleTheme}
            className="btn btn-outline"
            style={{
                width: '100%',
                justifyContent: 'space-between',
                padding: '1rem',
                borderRadius: '0.5rem' // Explicitly match input style or global radius
            }}
        >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                <span>{theme === 'light' ? 'Ativar Modo Escuro' : 'Ativar Modo Claro'}</span>
            </span>
            <div style={{
                width: '2.5rem',
                height: '1.25rem',
                background: theme === 'dark' ? 'hsl(var(--primary))' : 'hsl(var(--input))',
                borderRadius: '999px',
                position: 'relative',
                transition: 'background 0.3s'
            }}>
                <div style={{
                    width: '1rem',
                    height: '1rem',
                    background: 'white',
                    borderRadius: '50%',
                    position: 'absolute',
                    top: '0.125rem',
                    left: theme === 'dark' ? 'calc(100% - 1.125rem)' : '0.125rem',
                    transition: 'left 0.3s',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                }} />
            </div>
        </button>
    )
}
