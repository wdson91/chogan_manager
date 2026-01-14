import { getUser } from "@/lib/supabase/auth"
import { prisma } from "@/lib/prisma"
import { OrderForm } from "@/components/orders/order-form"
import { redirect } from "next/navigation"

export default async function NewOrderPage() {
    const user = await getUser()

    if (!user) {
        redirect("/login")
    }

    const [customers, products] = await Promise.all([
        prisma.customer.findMany({
            where: { userId: user.id },
            orderBy: { name: 'asc' }
        }),
        prisma.product.findMany({
            where: {
                userId: user.id
            },
            orderBy: { name: 'asc' }
        })
    ])

    const serializedProducts = products.map((p) => ({
        ...p,
        costPrice: Number(p.costPrice),
        sellPrice: Number(p.sellPrice)
    }))

    return (
        <div className="container mx-auto py-4 md:py-6 px-2 md:px-4 max-w-6xl">
            <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold">Nova Encomenda</h1>
                <p className="text-muted-foreground">Criar uma nova encomenda de venda.</p>
            </div>

            <OrderForm customers={customers} products={serializedProducts} />
        </div>
    )
}