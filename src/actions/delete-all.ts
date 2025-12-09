"use server"

import { getUserId } from "@/lib/supabase/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function deleteAllProducts() {
    const userId = await getUserId()

    const result = await prisma.product.deleteMany({
        where: {
            userId
        }
    })

    revalidatePath("/products")
    revalidatePath("/settings/data-import")

    return { deletedCount: result.count }
}
