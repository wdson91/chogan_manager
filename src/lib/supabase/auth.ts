import { createClient } from './server'

export async function getUser() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        return null
    }

    return user
}

export async function getUserId() {
    const user = await getUser()
    if (!user) {
        throw new Error('Unauthorized')
    }
    return user.id
}
