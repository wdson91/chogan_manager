import { getUser } from "@/lib/supabase/auth"
import { prisma } from "@/lib/prisma"
import { OrdersClient } from "@/components/orders/orders-client"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default async function OrdersPage() {
    const user = await getUser()

    if (!user) {
        redirect("/login")
    }

    const orders = await prisma.order.findMany({
        where: {
            userId: user.id,
        },
        include: {
            customer: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    })

    const serializedOrders = orders.map((order: any) => ({
        ...order,
        totalAmount: Number(order.totalAmount),
        totalProfit: Number(order.totalProfit),
    }))

    return (
        <div className="container mx-auto py-6 md:py-10 px-4 md:px-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl md:text-3xl font-bold">Encomendas</h1>
                <Button asChild>
                    <Link href="/orders/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Nova Encomenda
                    </Link>
                </Button>
            </div>

            <OrdersClient data={serializedOrders} />
        </div>
    )
}