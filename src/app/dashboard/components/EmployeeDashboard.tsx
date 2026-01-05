'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { registerTimeEntry } from '../time-clock/actions'
import { format, addDays, startOfWeek, addWeeks, isSameDay, differenceInMinutes, differenceInSeconds, setHours, setMinutes, addMinutes } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Play, Pause, LogOut, Calendar as CalendarIcon, Clock, ChevronDown, ChevronUp } from 'lucide-react'

type EntryType = 'entry' | 'exit' | 'break_start' | 'break_end'

interface EmployeeDashboardProps {
    profile: any
    todayEntries: any[]
}

export default function EmployeeDashboard({ profile, todayEntries }: EmployeeDashboardProps) {
    const router = useRouter()
    const lastEntry = todayEntries.length > 0 ? todayEntries[todayEntries.length - 1] : null
    const [time, setTime] = useState<Date | null>(null)
    const [currentStatus, setCurrentStatus] = useState<EntryType | null>(lastEntry?.entry_type || null)

    // Calculate worked minutes if day is done
    let workedMinutes = 0
    let workedSeconds = 0
    let isDayComplete = false
    let isDayIncomplete = false

    if (currentStatus === 'exit') {
        const entry = todayEntries.find(e => e.entry_type === 'entry')
        const exit = todayEntries.find(e => e.entry_type === 'exit')
        if (entry && exit) {
            workedMinutes = differenceInMinutes(new Date(exit.timestamp), new Date(entry.timestamp))
            workedSeconds = differenceInSeconds(new Date(exit.timestamp), new Date(entry.timestamp))
            isDayComplete = true

            // Validate Schedule Existence
            if (profile.work_schedule && profile.work_schedule.daily_hours) {
                // Check against schedule (convert hours to minutes)
                const scheduledMinutes = profile.work_schedule.daily_hours * 60
                const tolerance = profile.work_schedule.tolerance_minutes || 10

                if (scheduledMinutes - workedMinutes > tolerance) {
                    isDayIncomplete = true
                }
            }
        }
    } const [isPending, startTransition] = useTransition()
    const [showSchedule, setShowSchedule] = useState(false)

    const schedule = profile.work_schedule

    const isWorking = currentStatus === 'entry' || currentStatus === 'break_end'
    const isOnBreak = currentStatus === 'break_start'
    const isOff = !currentStatus || currentStatus === 'exit'

    // Calculate Real-Time Late Status
    let isLateStart = false
    if (time && schedule && isOff && todayEntries.length === 0) {
        // Only for FIXED schedule types
        if (schedule.schedule_type === 'fixed' || !schedule.schedule_type) {
            const [sh, sm] = schedule.start_time.split(':').map(Number)
            const scheduleDate = new Date()
            scheduleDate.setHours(sh, sm, 0, 0)

            const tolerance = schedule.tolerance_minutes || 10
            const lateThreshold = addMinutes(scheduleDate, tolerance)

            // Check if today is a working day (Ensure robust type checking for days)
            const currentDay = time.getDay()
            const isWorkDay = schedule.work_days?.map((d: any) => Number(d)).includes(currentDay)

            if (isWorkDay && time > lateThreshold) {
                isLateStart = true
            }
        }
    }

    useEffect(() => {
        setTime(new Date())
        const timer = setInterval(() => setTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    const handleRegister = (type: EntryType) => {
        startTransition(async () => {
            const res = await registerTimeEntry(type)
            if (res?.success) {
                setCurrentStatus(type)
                router.refresh() // Force refresh todayEntries from server
            } else {
                alert(res?.error)
            }
        })
    }

    // Generate next 7 days for calendar view
    const nextDays = Array.from({ length: 7 }).map((_, i) => {
        const date = addDays(new Date(), i)
        const dayOfWeek = date.getDay()
        // Check if working day (default 1-5 if no schedule, or specific from schedule)
        // If schedule exists, use it. If not, assume no work defined yet? Or std M-F?
        // User logic: "If he defines schedule". If null, maybe empty?
        const isWorkDay = schedule?.work_days?.includes(dayOfWeek)
        return { date, isWorkDay }
    })

    if (!time) return null

    return (
        <div className="animate-fade-in container" style={{ maxWidth: '800px' }}>
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 700, letterSpacing: '-0.025em' }}>
                        Olá, {profile.full_name?.split(' ')[0]}
                    </h1>
                    <p style={{ opacity: 0.7, fontSize: '0.925rem' }}>
                        {format(time, "EEEE, d 'de' MMMM", { locale: ptBR })}
                    </p>
                </div>

                {/* Today's Schedule Info */}
                {schedule && schedule.work_days?.includes(new Date().getDay()) && (
                    <div style={{ padding: '0.5rem 1rem', background: 'hsl(var(--secondary))', borderRadius: 'var(--radius)', border: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Clock size={16} className="text-primary" />
                        <div>
                            <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.7, fontWeight: 600 }}>Entrada</div>
                            <div style={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1 }}>{schedule.start_time}</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Main Clock Card */}
            <div className="glass" style={{
                padding: '3rem 2rem',
                borderRadius: 'var(--radius)',
                marginBottom: '2rem',
                textAlign: 'center',
                // removed linear gradient, relying on .glass solid background from globals.css
            }}>

                <div style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    marginBottom: '1.5rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '999px',
                    background: isWorking ? 'hsla(142, 76%, 36%, 0.1)' : isOnBreak ? 'hsla(35, 90%, 50%, 0.1)' : 'hsla(var(--foreground)/0.05)',
                    color: isWorking ? 'hsl(142, 76%, 36%)' : isOnBreak ? 'hsl(35, 90%, 50%)' : 'hsl(var(--muted-foreground))',
                    border: '1px solid transparent',
                    borderColor: isWorking ? 'hsla(142, 76%, 36%, 0.2)' : isOnBreak ? 'hsla(35, 90%, 50%, 0.2)' : 'hsla(var(--foreground)/0.1)'
                }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor' }} />
                    {isWorking ? 'EM EXPEDIENTE' : isOnBreak ? 'EM PAUSA' : 'FORA DE EXPEDIENTE'}
                </div>

                {isLateStart && (
                    <div style={{
                        margin: '1rem auto',
                        padding: '0.75rem',
                        background: 'hsl(var(--destructive) / 0.1)',
                        color: 'hsl(var(--destructive))',
                        borderRadius: 'var(--radius)',
                        fontWeight: 600,
                        border: '1px solid hsl(var(--destructive) / 0.2)',
                        maxWidth: '80%',
                        fontSize: '0.9rem'
                    }}>
                        ⚠️ Você está atrasado para começar.
                    </div>
                )}

                <div style={{
                    fontSize: 'clamp(3rem, 14vw, 6rem)',
                    fontWeight: '700',
                    fontFamily: 'var(--font-inter)', // Use the system font, specialized mono not needed if numbers align well or use font-variant-numeric: tabular-nums
                    fontVariantNumeric: 'tabular-nums',
                    letterSpacing: '-0.05em',
                    lineHeight: 1,
                    margin: '1.5rem 0',
                    color: 'hsl(var(--foreground))'
                }}>
                    {format(time, 'HH:mm:ss')}
                </div>

                {/* Dynamic Action Buttons */}
                <div style={{ display: 'grid', gap: '1rem', maxWidth: '400px', margin: '2rem auto 0' }}>

                    {/* CASE: DAY COMPLETE (Exit registered today) */}
                    {isDayComplete ? (
                        <div style={{ padding: '1.5rem', background: isDayIncomplete ? 'hsl(var(--destructive)/0.1)' : 'hsl(var(--primary)/0.1)', borderRadius: 'var(--radius)', border: `1px dashed ${isDayIncomplete ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'}`, color: isDayIncomplete ? 'hsl(var(--destructive))' : 'hsl(var(--primary))' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                                {isDayIncomplete ? 'Jornada Incompleta' : 'Jornada Concluída'}
                            </h3>
                            {isDayIncomplete ? (
                                <>
                                    <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 500 }}>
                                        Notificado ao administrador.
                                    </p>
                                    <p style={{ fontSize: '0.875rem', opacity: 0.8 }}>
                                        Trabalhado: {Math.floor(workedMinutes / 60)}h {workedMinutes % 60}m
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.5rem 0', lineHeight: 1 }}>
                                        {Math.floor(workedSeconds / 3600)}<span style={{ fontSize: '0.8em' }}>h</span> {Math.floor((workedSeconds % 3600) / 60)}<span style={{ fontSize: '0.8em' }}>m</span>
                                    </p>
                                    <p style={{ fontSize: '0.875rem', opacity: 0.8 }}>Registro confirmado.</p>
                                </>
                            )}
                        </div>
                    ) : (
                        <>
                            {isOff && (
                                <button
                                    onClick={() => handleRegister('entry')}
                                    disabled={isPending}
                                    className="btn btn-primary"
                                    style={{
                                        fontSize: '1.125rem',
                                        padding: '1rem',
                                        height: 'auto',
                                        background: 'hsl(142, 70%, 40%)', // Custom Green for Entry
                                        color: 'white',
                                        opacity: isPending ? 0.7 : 1
                                    }}
                                >
                                    {isPending ? 'REGISTRANDO...' : <><Play fill="currentColor" size={20} /> REGISTRAR ENTRADA</>}
                                </button>
                            )}

                            {isWorking && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {/* Expected Exit Display */}
                                    {schedule && lastEntry && (
                                        <div style={{ padding: '0.75rem', background: 'hsl(var(--muted))', borderRadius: 'var(--radius)', fontSize: '0.875rem', border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}>
                                            Saída Prevista: <strong style={{ color: 'hsl(var(--foreground))' }}>{format(addWeeks(new Date(lastEntry.timestamp), 0).setHours(new Date(lastEntry.timestamp).getHours() + schedule.daily_hours), 'HH:mm')}</strong>
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        <button
                                            onClick={() => handleRegister('break_start')}
                                            disabled={isPending}
                                            className="btn"
                                            style={{
                                                flex: 1,
                                                background: 'hsl(35, 90%, 50%)',
                                                color: 'white',
                                                borderColor: 'transparent',
                                                padding: '1rem',
                                                opacity: isPending ? 0.7 : 1
                                            }}
                                        >
                                            {isPending ? '...' : <><Pause fill="currentColor" size={18} /> PAUSA</>}
                                        </button>
                                        <button
                                            onClick={() => handleRegister('exit')}
                                            disabled={isPending}
                                            className="btn"
                                            style={{
                                                flex: 1,
                                                background: 'hsl(0, 84%, 60%)',
                                                color: 'white',
                                                borderColor: 'transparent',
                                                padding: '1rem',
                                                opacity: isPending ? 0.7 : 1
                                            }}
                                        >
                                            {isPending ? '...' : <><LogOut size={18} /> ENCERRA</>}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {isOnBreak && (
                                <button
                                    onClick={() => handleRegister('break_end')}
                                    disabled={isPending}
                                    className="btn"
                                    style={{
                                        background: 'hsl(142, 70%, 40%)',
                                        color: 'white',
                                        fontSize: '1.125rem',
                                        padding: '1rem',
                                        opacity: isPending ? 0.7 : 1
                                    }}
                                >
                                    {isPending ? 'REGISTRANDO...' : <><Play fill="currentColor" size={20} /> VOLTAR DA PAUSA</>}
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Simple Feed / Last Actions */}
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))' }}>Atividade Recente</h3>
            <div className="glass" style={{ padding: '0', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                {lastEntry ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderLeft: '4px solid hsl(var(--primary))' }}>
                        <div>
                            <div style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase' }}>{lastEntry.entry_type.replace('_', ' ')}</div>
                            <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>Último registro</div>
                        </div>
                        <div style={{ fontFamily: 'var(--font-inter)', fontWeight: 600, fontSize: '1rem', fontVariantNumeric: 'tabular-nums' }}>{format(new Date(lastEntry.timestamp), 'HH:mm')}</div>
                    </div>
                ) : (
                    <p style={{ padding: '1.5rem', opacity: 0.6, fontSize: '0.875rem', textAlign: 'center' }}>Nenhum registro hoje ainda.</p>
                )}
            </div>

        </div>
    )
}
