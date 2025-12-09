import { getUser } from "@/lib/supabase/auth"
import { prisma } from "@/lib/prisma"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "@/components/customers/columns"
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
import { CustomerForm } from "@/components/customers/customer-form"

export default async function CustomersPage() {
    const user = await getUser()

    if (!user) {
        redirect("/login")
    }

    const customers = await prisma.customer.findMany({
        where: {
            userId: user.id,
        },
        orderBy: {
            createdAt: 'desc'
        }
    })

    // Ensure plain objects avoiding Date objects issues if passing to Client Component directly?
    // Prisma Dates are JS Date objects. Use serialized logic if needed, but App Router handles it mostly.
    // Exception: Decimal? Customer model has no Decimals.

    return (
        <div className="container mx-auto py-6 md:py-10 px-4 md:px-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl md:text-3xl font-bold">Clientes</h1>
                <Sheet>
                    <SheetTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Adicionar Cliente
                        </Button>
                    </SheetTrigger>
                    <SheetContent>
                        <SheetHeader>
                            <SheetTitle>Adicionar Cliente</SheetTitle>
                        </SheetHeader>
                        <div className="mt-4 p-4">
                            <CustomerForm />
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
            <DataTable columns={columns} data={customers} filterColumn="name" />
        </div>
    )
}
