import { getSupplierOrders } from "@/actions/supplier-orders"
import { columns } from "@/components/supplier-orders/columns"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

export default async function SupplierOrdersPage() {
    const orders = await getSupplierOrders()

    // Transform Decimal to number for the table if needed, though usually helper handles it
    // But our columns expect "any" or "SupplierOrderColumn"
    // Let's pass data directly, assuming serialization implies simple objects or we format properly.
    // Ensure dates are dates.

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

            <DataTable columns={columns} data={orders as any[]} filterColumn="status" filterPlaceholder="Filtrar por estado..." />
        </div>
    )
}
