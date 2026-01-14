"use server"

import { getUserId } from "@/lib/supabase/auth"
import { prisma } from "@/lib/prisma"
import { productSchema, ProductFormValues } from "@/lib/schemas"
import { revalidatePath } from "next/cache"

export async function createProduct(data: ProductFormValues) {
    const userId = await getUserId()

    const validatedFields = productSchema.safeParse(data)

    if (!validatedFields.success) {
        throw new Error("Invalid fields")
    }

    await prisma.product.create({
        data: {
            userId,
            ...validatedFields.data,
            // Prisma accepts numbers for Decimal fields
        },
    })

    revalidatePath("/products")
}

export async function updateProduct(id: string, data: ProductFormValues) {
    const userId = await getUserId()

    const validatedFields = productSchema.safeParse(data)

    if (!validatedFields.success) {
        throw new Error("Invalid fields")
    }

    await prisma.product.update({
        where: {
            id: id,
            userId,
        },
        data: validatedFields.data,
    })

    revalidatePath("/products")
}

export async function deleteProduct(id: string) {
    const userId = await getUserId()

    await prisma.product.delete({
        where: {
            id: id,
            userId,
        },
    })

    revalidatePath("/products")
}

export async function getProducts() {
    const userId = await getUserId()

    const products = await prisma.product.findMany({
        where: {
            userId,
        },
        orderBy: {
            name: "asc",
        },
    })

    // Convert Decimals to numbers for Client Components
    return products.map((p) => ({
        ...p,
        costPrice: Number(p.costPrice),
        sellPrice: Number(p.sellPrice),
    }))
}
