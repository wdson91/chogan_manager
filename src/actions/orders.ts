"use server"

import { getUserId } from "@/lib/supabase/auth"
import { prisma } from "@/lib/prisma"
import { orderSchema, OrderFormValues } from "@/lib/schemas"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createOrder(data: OrderFormValues) {
    const userId = await getUserId()

    const validatedResult = orderSchema.safeParse(data)

    if (!validatedResult.success) {
        throw new Error("Invalid fields")
    }

    const { customerId, items } = validatedResult.data

    try {
        await prisma.$transaction(async (tx) => {
            let totalAmount = 0
            let totalProfit = 0

            // 1. Validate Items & Calculate Totals
            for (const item of items) {
                const product = await tx.product.findUnique({
                    where: { id: item.productId, userId }
                })

                if (!product) {
                    throw new Error(`Product not found: ${item.productId}`)
                }

                if (product.stockQuantity < item.quantity && !product.allowNegativeStock) {
                    throw new Error(`Insufficient stock for product: ${product.name}. Available: ${product.stockQuantity}`)
                }

                const lineTotal = item.unitPrice * item.quantity
                const lineCost = Number(product.costPrice) * item.quantity // Use current product cost for profit snapshot
                const lineProfit = lineTotal - lineCost

                totalAmount += lineTotal
                totalProfit += lineProfit
            }

            // 2. Create Order
            const order = await tx.order.create({
                data: {
                    userId,
                    customerId: customerId,
                    totalAmount: totalAmount,
                    totalProfit: totalProfit,
                    status: "PENDING",
                }
            })

            // 3. Create Order Items & Update Stock
            for (const item of items) {
                await tx.product.findUniqueOrThrow({ where: { id: item.productId } })

                // Create Item
                await tx.orderItem.create({
                    data: {
                        orderId: order.id,
                        productId: item.productId,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        subtotal: item.unitPrice * item.quantity
                    }
                })

                // Decrement Stock
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stockQuantity: {
                            decrement: item.quantity
                        }
                    }
                })
            }
        })
    } catch (error) {
        console.error("Transaction failed:", error)
        const message = error instanceof Error ? error.message : "Failed to create order"
        throw new Error(message)
    }

    revalidatePath("/dashboard")
    revalidatePath("/orders")
    redirect("/orders")
}

export async function updateOrderStatus(id: string, status: string) {
    const userId = await getUserId()

    if (!status) {
        throw new Error("Status is required")
    }

    try {
        await prisma.order.update({
            where: { id, userId },
            data: { status }
        })
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to update order status"
        throw new Error(message)
    }

    revalidatePath("/orders")
    revalidatePath(`/orders/${id}`)
}

export async function bulkUpdateOrderStatus(ids: string[], status: string) {
    const userId = await getUserId()

    if (!ids || ids.length === 0) {
        throw new Error("No orders selected")
    }

    if (!status) {
        throw new Error("Status is required")
    }

    try {
        await prisma.order.updateMany({
            where: {
                id: { in: ids },
                userId
            },
            data: { status }
        })
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to update orders"
        throw new Error(message)
    }

    revalidatePath("/orders")
}

export async function getOrder(id: string) {
    const userId = await getUserId()

    const order = await prisma.order.findUnique({
        where: { id, userId },
        include: {
            customer: true,
            items: {
                include: {
                    product: true
                }
            }
        }
    })

    if (!order) {
        return null
    }

    // Convert Decimals to numbers for Client Components
    return {
        ...order,
        totalAmount: Number(order.totalAmount),
        totalProfit: Number(order.totalProfit),
        items: order.items.map((item) => ({
            ...item,
            unitPrice: Number(item.unitPrice),
            subtotal: Number(item.subtotal),
            product: {
                ...item.product,
                costPrice: Number(item.product.costPrice),
                sellPrice: Number(item.product.sellPrice),
            }
        }))
    }
}
