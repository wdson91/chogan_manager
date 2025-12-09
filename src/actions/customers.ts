"use server"

import { getUserId } from "@/lib/supabase/auth"
import { prisma } from "@/lib/prisma"
import { customerSchema, CustomerFormValues } from "@/lib/schemas"
import { revalidatePath } from "next/cache"

export async function createCustomer(data: CustomerFormValues) {
    const userId = await getUserId()

    const validatedFields = customerSchema.safeParse(data)

    if (!validatedFields.success) {
        throw new Error("Invalid fields")
    }

    await prisma.customer.create({
        data: {
            userId,
            ...validatedFields.data,
        },
    })

    revalidatePath("/customers")
}

export async function updateCustomer(id: string, data: CustomerFormValues) {
    const userId = await getUserId()

    const validatedFields = customerSchema.safeParse(data)

    if (!validatedFields.success) {
        throw new Error("Invalid fields")
    }

    await prisma.customer.update({
        where: {
            id: id,
            userId, // Ensure ownership
        },
        data: validatedFields.data,
    })

    revalidatePath("/customers")
}

export async function deleteCustomer(id: string) {
    const userId = await getUserId()

    await prisma.customer.delete({
        where: {
            id: id,
            userId, // Ensure ownership
        },
    })

    revalidatePath("/customers")
}
