import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LogOut, LayoutDashboard, Clock, Users, Settings, FileText, AlertTriangle, Calendar } from 'lucide-react'
import DashboardShell from './components/DashboardShell'
import styles from './dashboard.module.css'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*, companies(name, code)')
        .eq('id', user.id)
        .single()

    if (!profile || !profile.company_id) {
        redirect('/onboarding')
    }

    return (
        <DashboardShell profile={profile}>
            {children}
        </DashboardShell>
    )
}
