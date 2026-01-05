import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import AdminDashboard from './components/AdminDashboard'
import EmployeeDashboard from './components/EmployeeDashboard'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('*, companies(name, code)')
        .eq('id', user.id)
        .single()

    // Fetch last entry for Employee Dashboard (Optimization: only fetch if not admin?)
    // Actually, admins might have data too, but let's fetch only if employee for now or just fetch it safely.
    // We'll fetch the last valid entry to determine the "Big Button" state.

    // Fetch last entry or today's status
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const { data: todayEntries } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', user.id)
        .gte('timestamp', todayStart.toISOString())
        .order('timestamp', { ascending: true })

    const lastEntry = todayEntries && todayEntries.length > 0 ? todayEntries[todayEntries.length - 1] : null


    // If Admin, fetch stats
    let activeCount = 0
    if (profile?.role === 'admin') {
        // Fetch all entries for today for the company
        const { data: companyEntries } = await supabase
            .from('time_entries')
            .select('user_id, entry_type, timestamp')
            .eq('company_id', profile.company_id)
            .gte('timestamp', todayStart.toISOString())
            .order('timestamp', { ascending: true })

        // Calculate active users (last entry was 'entry')
        const userStatus: Record<string, string> = {}
        companyEntries?.forEach(entry => {
            userStatus[entry.user_id] = entry.entry_type
        })
        activeCount = Object.values(userStatus).filter(status => status === 'entry').length

        return <AdminDashboard profile={profile} activeCount={activeCount} />
    }

    return <EmployeeDashboard profile={profile} todayEntries={todayEntries || []} />
}
