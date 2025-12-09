import { getUser } from "@/lib/supabase/auth"
import { MainNavClient } from "./main-nav-client"

export async function MainNav() {
    const user = await getUser()

    return <MainNavClient user={user} />
}