"use server"

import { prisma } from "@/lib/prisma"
import { getUser } from "@/lib/supabase/auth"
import { revalidatePath } from "next/cache"

export async function getSupplierOrders() {
    const user = await getUser()
    if (!user) return []

    const orders = await prisma.supplierOrder.findMany({
        where: { userId: user.id },
        include: {
            items: {
                include: { product: true }
            }
        },
        orderBy: { orderDate: 'desc' }
    })

    // Convert Decimals to numbers for Client Components
    return orders.map((order) => ({
        ...order,
        totalAmount: Number(order.totalAmount),
        items: order.items.map((item) => ({
            ...item,
            unitCost: Number(item.unitCost),
            product: item.product ? {
                ...item.product,
                costPrice: Number(item.product.costPrice),
                sellPrice: Number(item.product.sellPrice),
            } : null
        }))
    }))
}

export async function getSupplierOrder(id: string) {
    const user = await getUser()
    if (!user) return null

    const order = await prisma.supplierOrder.findUnique({
        where: { id, userId: user.id },
        include: {
            items: {
                include: { product: true }
            }
        }
    })

    if (!order) return null

    // Convert Decimals to numbers for Client Components
    return {
        ...order,
        totalAmount: Number(order.totalAmount),
        items: order.items.map((item) => ({
            ...item,
            unitCost: Number(item.unitCost),
            product: item.product ? {
                ...item.product,
                costPrice: Number(item.product.costPrice),
                sellPrice: Number(item.product.sellPrice),
            } : null
        }))
    }
}

export async function createSupplierOrder(data: {
    orderNum?: string
    orderDate?: string
    expectedDate?: string
    receivedDate?: string
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
            orderNum: data.orderNum || null,
            orderDate: data.orderDate ? new Date(data.orderDate) : new Date(),
            expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
            receivedDate: data.receivedDate ? new Date(data.receivedDate) : null,
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
        // 1. Update status and receivedDate
        await tx.supplierOrder.update({
            where: { id },
            data: { 
                status: "COMPLETED",
                receivedDate: new Date()
            }
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
