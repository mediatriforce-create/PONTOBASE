'use client'

import { useState, useTransition } from 'react'
import { updateWorkSchedule } from './actions'
import { Save } from 'lucide-react'

interface ScheduleProps {
    employeeId: string
    initialSchedule: {
        daily_hours: number
        start_time: string
        work_days: number[]
        schedule_type?: 'fixed' | 'flexible'
        tolerance_minutes?: number
    }
}

export default function EditScheduleForm({ employeeId, initialSchedule }: ScheduleProps) {
    const [isPending, startTransition] = useTransition()
    const [selectedDays, setSelectedDays] = useState<number[]>(initialSchedule?.work_days || [])

    const handleToggleDay = (dayIndex: number) => {
        if (selectedDays.includes(dayIndex)) {
            setSelectedDays(selectedDays.filter(d => d !== dayIndex))
        } else {
            setSelectedDays([...selectedDays, dayIndex])
        }
    }

    // We handle the form submission manually to consume the server action result
    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)

        // Manual override for workDays since we are controlling state
        formData.delete('workDays')
        selectedDays.forEach(day => formData.append('workDays', day.toString()))

        startTransition(async () => {
            const result = await updateWorkSchedule(employeeId, formData)
            if (result?.error) {
                alert(result.error)
            } else {
                alert('Escala atualizada com sucesso!')
            }
        })
    }

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Carga Horária Diária (Horas)</label>
                <input
                    name="dailyHours"
                    type="number"
                    defaultValue={initialSchedule?.daily_hours || 8}
                    className="input"
                    min="1"
                    max="24"
                    required
                />
            </div>

            <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Horário de Entrada Previsto</label>
                <input
                    name="startTime"
                    type="time"
                    defaultValue={initialSchedule?.start_time || '09:00'}
                    className="input"
                    required
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Tipo de Horário</label>
                    <select name="scheduleType" defaultValue={initialSchedule?.schedule_type || 'fixed'} className="input">
                        <option value="fixed">Fixo (Exige pontualidade)</option>
                        <option value="flexible">Flexível (Cobre total de horas)</option>
                    </select>
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Tolerância (Minutos)</label>
                    <input
                        name="tolerance"
                        type="number"
                        defaultValue={initialSchedule?.tolerance_minutes || 10}
                        className="input"
                        min="0"
                        max="60"
                    />
                </div>
            </div>

            <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Dias de Trabalho</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, idx) => {
                        const isSelected = selectedDays.includes(idx)
                        return (
                            <div
                                key={idx}
                                onClick={() => handleToggleDay(idx)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '2.5rem',
                                    height: '2.5rem',
                                    borderRadius: '50%',
                                    border: isSelected ? '2px solid hsl(var(--primary))' : '1px solid hsl(var(--border))',
                                    cursor: 'pointer',
                                    background: isSelected ? 'hsl(var(--primary))' : 'hsla(var(--card)/0.5)',
                                    color: isSelected ? 'white' : 'inherit',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{day}</span>
                            </div>
                        )
                    })}
                </div>
                <p style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '0.5rem' }}>*Dias marcados indicam jornada normal.</p>
            </div>

            <button type="submit" disabled={isPending} className="btn btn-primary" style={{ width: '100%' }}>
                <Save size={18} /> {isPending ? 'Salvando...' : 'Salvar Configurações'}
            </button>
        </form>
    )
}
