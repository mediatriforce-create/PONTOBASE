import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { format, addDays, startOfWeek, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar } from 'lucide-react'

export default async function SchedulePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

    // Logic for next 7 days
    const schedule = profile?.work_schedule as any
    const nextDays = Array.from({ length: 7 }).map((_, i) => {
        const date = addDays(new Date(), i)
        const dayOfWeek = date.getDay()
        const isWorkDay = schedule?.work_days?.includes(dayOfWeek)
        return { date, isWorkDay }
    })

    return (
        <div className="container" style={{ maxWidth: '800px' }}>
            <h1 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.875rem', fontWeight: 700, letterSpacing: '-0.025em' }}>
                <Calendar size={32} className="text-primary" /> Minha Escala
            </h1>

            <div className="glass" style={{ padding: '0', borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid hsl(var(--border))' }}>
                {!schedule ? (
                    <div style={{ textAlign: 'center', opacity: 0.6, padding: '4rem' }}>
                        Nenhuma escala definida pelo administrador.
                    </div>
                ) : (
                    <>
                        <div style={{ padding: '1.5rem', background: 'hsl(var(--muted))', borderBottom: '1px solid hsl(var(--border))' }}>
                            <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'hsl(var(--muted-foreground))' }}>Resumo da Jornada</h2>
                            <div style={{ display: 'flex', gap: '2rem' }}>
                                <div>
                                    <div style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}>Carga Diária</div>
                                    <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>{schedule.daily_hours} horas</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}>Entrada</div>
                                    <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>{schedule.start_time}</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid' }}>
                            {nextDays.map((day, idx) => (
                                <div key={idx} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '1.25rem 1.5rem',
                                    background: day.isWorkDay ? 'transparent' : 'hsl(var(--secondary)/0.3)',
                                    borderBottom: idx < nextDays.length - 1 ? '1px solid hsl(var(--border))' : 'none',
                                    opacity: day.isWorkDay ? 1 : 0.6
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                        <div style={{
                                            width: '3.5rem',
                                            textAlign: 'center',
                                            fontWeight: 700,
                                            fontSize: '0.9rem',
                                            textTransform: 'uppercase',
                                            color: day.isWorkDay ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                                            lineHeight: 1.2
                                        }}>
                                            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{format(day.date, 'EEE', { locale: ptBR })}</div>
                                            <div style={{ fontSize: '1.5rem' }}>{format(day.date, 'dd')}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '1rem', color: day.isWorkDay ? 'hsl(var(--primary))' : 'inherit' }}>
                                                {day.isWorkDay ? 'Dia de Trabalho' : 'Folga'}
                                            </div>
                                            {day.isWorkDay && (
                                                <div style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}>
                                                    Expediente: {schedule.start_time} - {format(new Date().setHours(parseInt(schedule.start_time.split(':')[0]) + schedule.daily_hours, parseInt(schedule.start_time.split(':')[1])), 'HH:mm')}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {day.isWorkDay && (
                                        <div style={{ padding: '0.4rem 0.8rem', borderRadius: 'var(--radius)', background: 'hsl(var(--primary)/0.1)', color: 'hsl(var(--primary))', fontSize: '0.8rem', fontWeight: 600 }}>
                                            ESCALADO
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
