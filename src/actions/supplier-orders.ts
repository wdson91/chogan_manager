"use server"

import { prisma } from "@/lib/prisma"
import { getUser } from "@/lib/supabase/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function getSupplierOrders() {
    const user = await getUser()
    if (!user) return []

    return await prisma.supplierOrder.findMany({
        where: { userId: user.id },
        include: {
            items: {
                include: { product: true }
            }
        },
        orderBy: { orderDate: 'desc' }
    })
}

export async function getSupplierOrder(id: string) {
    const user = await getUser()
    if (!user) return null

    return await prisma.supplierOrder.findUnique({
        where: { id, userId: user.id },
        include: {
            items: {
                include: { product: true }
            }
        }
    })
}

export async function createSupplierOrder(data: {
    notes?: string
    items: {
        productId?: string
        quantity: number
        unitCost: number
    }[]
}) {
    const user = await getUser()
    if (!user) throw new Error("Unauthorized")

    // Calculate total
    const totalAmount = data.items.reduce((sum, item) => {
        return sum + (item.quantity * item.unitCost)
    }, 0)

    const order = await prisma.supplierOrder.create({
        data: {
            userId: user.id,
            notes: data.notes,
            totalAmount,
            status: "PENDING",
            items: {
                create: data.items.map(item => ({
                    productId: item.productId || null,
                    quantity: item.quantity,
                    unitCost: item.unitCost
                }))
            }
        }
    })

    revalidatePath("/supplier-orders")
    return order
}

export async function receiveSupplierOrder(id: string) {
    const user = await getUser()
    if (!user) throw new Error("Unauthorized")

    const order = await prisma.supplierOrder.findUnique({
        where: { id, userId: user.id },
        include: { items: true }
    })

    if (!order) throw new Error("Order not found")
    if (order.status === "COMPLETED") throw new Error("Order already received")

    // Transaction to update stock and order status
    await prisma.$transaction(async (tx) => {
        // 1. Update status
        await tx.supplierOrder.update({
            where: { id },
            data: { status: "COMPLETED" }
        })

        // 2. Update stock for linked products
        for (const item of order.items) {
            if (item.productId) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stockQuantity: { increment: item.quantity }
                    }
                })
            }
        }
    })

    revalidatePath("/supplier-orders")
    revalidatePath(`/supplier-orders/${id}`)
    revalidatePath("/products")
}

export async function deleteSupplierOrder(id: string) {
    const user = await getUser()
    if (!user) throw new Error("Unauthorized")

    await prisma.supplierOrder.delete({
        where: { id, userId: user.id }
    })

    revalidatePath("/supplier-orders")
}
