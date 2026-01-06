import { differenceInMinutes, format, isSameDay, parse, startOfDay, addMinutes } from 'date-fns'

export interface Schedule {
    daily_hours: number
    start_time: string // "09:00"
    work_days: number[] // 0-6
    tolerance_minutes?: number
    schedule_type?: 'fixed' | 'flexible'
}

export interface Inconsistency {
    type: 'LATE' | 'ABSENT' | 'MISSING_EXIT' | 'EARLY_EXIT'
    date: Date
    details: string
    minutesDiff?: number
}

export function calculateInconsistencies(
    schedule: Schedule,
    entries: any[], // Supabase time_entries
    startDate: Date,
    endDate: Date,
    profileCreatedAt?: string
): Inconsistency[] {
    // 0. Validate Schedule Exists
    if (!schedule || !schedule.work_days || schedule.work_days.length === 0) {
        return []
    }

    const issues: Inconsistency[] = []
    const tolerance = schedule.tolerance_minutes || 10 // Default 10 min tolerance
    const createdAtDate = profileCreatedAt ? new Date(profileCreatedAt) : null
    if (createdAtDate) createdAtDate.setHours(0, 0, 0, 0)

    // Iterate over each day in range
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        // Skip days before employee existed
        if (createdAtDate && d < createdAtDate) continue

        const dayOfWeek = d.getDay() // 0=Sun

        // 1. Check if it is a work day
        if (!schedule.work_days.includes(dayOfWeek)) continue

        // 2. Find entries for this day
        const dayEntries = entries.filter(e => isSameDay(new Date(e.timestamp), d))

        // Sort by time
        dayEntries.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

        const entry = dayEntries.find(e => e.entry_type === 'entry')
        const exit = dayEntries.find(e => e.entry_type === 'exit') // Simplified: takes first exit found

        // CHECK 1: ABSENCE
        if (!entry) {
            // Only mark absent if the day is fully past (e.g. yesterday) OR if it's today and significantly past start time
            // For simplicity: Mark absent if no entry on past days.
            if (d < startOfDay(new Date())) {
                issues.push({
                    type: 'ABSENT',
                    date: new Date(d),
                    details: 'Funcionário não trabalhou neste dia'
                })
            } else if (isSameDay(d, new Date())) {
                // REAL-TIME LATENESS CHECK
                // FIX: Use toLocaleString to get exact wall-clock time in Sao Paulo

                // Get current time string in Brazil: "HH:mm" or "HH:mm:ss"
                const brTime = new Date().toLocaleString("pt-BR", {
                    timeZone: "America/Sao_Paulo",
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                });

                // Parse "14:30" -> 14, 30
                const [hStr, mStr] = brTime.split(':');

                if (hStr && mStr) {
                    const currentMinutes = (parseInt(hStr) * 60) + parseInt(mStr);

                    const [sh, sm] = schedule.start_time.split(':').map(Number);
                    const scheduledMinutes = (sh * 60) + sm;
                    const tolerance = schedule.tolerance_minutes || 10;

                    const diff = currentMinutes - scheduledMinutes;

                    // If diff > tolerance, they are late (Check if positive to avoid negative "early")
                    if (diff > tolerance) {
                        issues.push({
                            type: 'LATE',
                            date: new Date(d), // Use the loop date 'd' which matches today
                            details: `Atrasado ${diff} minutos`,
                            minutesDiff: diff
                        });
                    }
                }
            }
            continue
        }

        // CHECK 2: LATENESS
        if (entry) {
            // FIX: Convert ENTRY timestamp to BRT Minutes directly.
            // Do NOT compare Date objects, as that introduces Server-Timezone artifacts.

            const entryDate = new Date(entry.timestamp)
            const entryTimeBR = entryDate.toLocaleString("pt-BR", {
                timeZone: "America/Sao_Paulo",
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            })

            const [eh, em] = entryTimeBR.split(':').map(Number)
            const entryMinutes = (eh * 60) + em

            // Schedule Minutes
            const [sh, sm] = schedule.start_time.split(':').map(Number)
            const scheduledMinutes = (sh * 60) + sm

            const diff = entryMinutes - scheduledMinutes
            const tolerance = schedule.tolerance_minutes || 10

            // Only count LATE if schedule type is NOT flexible (or if user wants strict everywhere)
            const isStrict = schedule.schedule_type === 'fixed' || !schedule.schedule_type

            if (isStrict && diff > tolerance) {
                issues.push({
                    type: 'LATE',
                    date: new Date(d),
                    details: `Funcionário começou atrasado (${diff}m)`,
                    minutesDiff: diff
                })
            }
        }

        // CHECK 3: MISSING EXIT (Only for past days)
        if (entry && !exit && d < startOfDay(new Date())) {
            issues.push({
                type: 'MISSING_EXIT',
                date: new Date(d),
                details: 'Funcionário não registrou saída'
            })
        }

        // CHECK 4: INCOMPLETE TIME (Only effectively check if Entry + Exit exist)
        if (entry && exit) {
            const workedMinutes = differenceInMinutes(new Date(exit.timestamp), new Date(entry.timestamp))
            const scheduledMinutes = schedule.daily_hours * 60
            // Tolerance for leaving early? Using same tolerance for now.
            if (scheduledMinutes - workedMinutes > tolerance) {
                issues.push({
                    type: 'EARLY_EXIT',
                    date: new Date(d),
                    details: `Funcionário não completou as ${schedule.daily_hours} horas (Feito: ${Math.floor(workedMinutes / 60)}h ${workedMinutes % 60}m)`,
                    minutesDiff: scheduledMinutes - workedMinutes
                })
            }
        }
    }

    return issues
}
