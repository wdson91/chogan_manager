import { getSupplierOrders } from "@/actions/supplier-orders"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"
import { SupplierOrdersClient } from "@/components/supplier-orders/supplier-orders-client"

export default async function SupplierOrdersPage() {
    const orders = await getSupplierOrders()

    return (
        <div className="container mx-auto py-10 px-5">
            <div className="flex items-center justify-between py-4">
                <h1 className="text-2xl font-bold tracking-tight">Pedidos à Empresa</h1>
                <Link href="/supplier-orders/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Novo Pedido
                    </Button>
                </Link>
            </div>

            <SupplierOrdersClient orders={orders} />
        </div>
    )
}
