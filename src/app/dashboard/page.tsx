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


    if (profile?.role === 'admin') {
        return <AdminDashboard profile={profile} />
    }

    return <EmployeeDashboard profile={profile} todayEntries={todayEntries || []} />
}
