'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import Link from 'next/link'
import { AlertTriangle, Clock, CalendarX, ChevronDown, ChevronRight, User } from 'lucide-react'

// Define types based on what we pass from page.tsx
type Issue = {
    type: string
    date: Date
    minutes?: number
    details?: string
}

type ReportItem = {
    employee: any
    issues: Issue[]
}

export default function InconsistencyList({ report }: { report: ReportItem[] }) {
    const [expandedId, setExpandedId] = useState<string | null>(null)

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id)
    }

    if (report.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '4rem', opacity: 0.5 }}>
                <AlertTriangle size={48} style={{ marginBottom: '1rem' }} />
                <h3>Nenhuma inconsistência encontrada nos últimos 30 dias.</h3>
                <p>Sua equipe está de parabéns!</p>
            </div>
        )
    }

    return (
        <div style={{ display: 'grid', gap: '1rem' }}>
            {report.map((item) => {
                const isExpanded = expandedId === item.employee.id
                return (
                    <div key={item.employee.id} className="glass" style={{ padding: '0', borderRadius: '0.75rem', overflow: 'hidden' }}>
                        {/* Summary Header (Clickable) */}
                        <div
                            onClick={() => toggleExpand(item.employee.id)}
                            style={{
                                padding: '1.25rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                cursor: 'pointer',
                                background: isExpanded ? 'hsla(var(--muted)/0.5)' : 'transparent',
                                transition: 'background 0.2s'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: 'hsl(var(--muted))',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 700,
                                    color: 'hsl(var(--muted-foreground))'
                                }}>
                                    {item.employee.avatar_url ? (
                                        <img src={item.employee.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                    ) : (
                                        item.employee.full_name?.charAt(0)
                                    )}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '1rem' }}>{item.employee.full_name}</div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>{item.employee.role}</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <span style={{
                                    fontSize: '0.8rem',
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '999px',
                                    background: 'hsla(0, 84%, 60%, 0.1)',
                                    color: 'hsl(0, 84%, 60%)',
                                    fontWeight: 600
                                }}>
                                    {item.issues.length} Ocorrências
                                </span>
                                {isExpanded ? <ChevronDown size={20} className="text-muted-foreground" /> : <ChevronRight size={20} className="text-muted-foreground" />}
                            </div>
                        </div>

                        {/* Expanded Details Table */}
                        {isExpanded && (
                            <div style={{ padding: '0 1.25rem 1.25rem', animation: 'fadeIn 0.2s' }}>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid hsla(var(--foreground)/0.1)', color: 'hsl(var(--muted-foreground))', textAlign: 'left' }}>
                                                <th style={{ padding: '0.75rem', fontWeight: 600 }}>Data</th>
                                                <th style={{ padding: '0.75rem', fontWeight: 600 }}>Tipo</th>
                                                <th style={{ padding: '0.75rem', fontWeight: 600 }}>Detalhes</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {item.issues.map((issue, idx) => (
                                                <tr key={idx} style={{ borderBottom: '1px solid hsla(var(--foreground)/0.05)' }}>
                                                    <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontWeight: 500 }}>
                                                        {format(new Date(issue.date), 'dd/MM/yyyy')}
                                                    </td>
                                                    <td style={{ padding: '0.75rem' }}>
                                                        <span style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '0.5rem',
                                                            fontWeight: 600,
                                                            color: issue.type === 'ABSENT' ? 'hsl(0, 84%, 60%)' : 'hsl(35, 90%, 50%)'
                                                        }}>
                                                            {issue.type === 'ABSENT' ? <CalendarX size={16} /> : <Clock size={16} />}
                                                            {issue.type === 'ABSENT' ? 'FALTA' :
                                                                issue.type === 'LATE' ? 'ATRASO' :
                                                                    issue.type === 'MISSING_EXIT' ? 'SEM SAÍDA' : issue.type}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '0.75rem', opacity: 0.8 }}>
                                                        {issue.details}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div style={{ marginTop: '1rem', textAlign: 'right' }}>
                                    <Link href={`/dashboard/employees/${item.employee.id}`} className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
                                        Ver Perfil Completo
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
