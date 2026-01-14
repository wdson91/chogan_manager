import { SupplierOrderForm } from "@/components/supplier-orders/supplier-order-form"
import { getProducts } from "@/actions/products"

export default async function NewSupplierOrderPage() {
    const products = await getProducts()

    return (
        <div className="container mx-auto py-10">
            <h1 className="text-2xl font-bold tracking-tight mb-6">Novo Pedido à Empresa</h1>
            <SupplierOrderForm products={products} />
        </div>
    )
}
