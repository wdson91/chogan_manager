import { getUser } from "@/lib/supabase/auth"
import { prisma } from "@/lib/prisma"
import { DataTable } from "@/components/ui/data-table"
import { columns, ProductRow } from "@/components/products/columns"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { ProductForm } from "@/components/products/product-form"

export default async function ProductsPage() {
    const user = await getUser()

    if (!user) {
        redirect("/login")
    }

    const productsRaw = await prisma.product.findMany({
        where: {
            userId: user.id,
        },
        orderBy: {
            createdAt: 'desc'
        }
    })

    // Convert Decimals to numbers for Client Components
    const products: ProductRow[] = productsRaw.map((p: any) => ({
        ...p,
        costPrice: Number(p.costPrice),
        sellPrice: Number(p.sellPrice)
    }))

    return (
        <div className="container mx-auto py-6 md:py-10 px-4 md:px-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl md:text-3xl font-bold">Produtos</h1>
                <Sheet>
                    <SheetTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Adicionar Produto
                        </Button>
                    </SheetTrigger>
                    <SheetContent>
                        <SheetHeader>
                            <SheetTitle>Adicionar Produto</SheetTitle>
                        </SheetHeader>
                        <div className="mt-4">
                            <ProductForm />
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
            <DataTable columns={columns} data={products} filterColumn="name" />
        </div>
    )
}
