"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Pencil, Trash } from "lucide-react"
import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { CustomerForm } from "./customer-form"
import { deleteCustomer } from "@/actions/customers"
import { toast } from "sonner"

type Customer = {
    id: string
    name: string
    phone: string
    email: string | null
    address: string | null
    notes: string | null
    userId: string
    createdAt: Date
    updatedAt: Date
}

export const columns: ColumnDef<Customer>[] = [
    {
        accessorKey: "name",
        header: "Nome",
    },
    {
        accessorKey: "phone",
        header: "Telefone",
    },
    {
        accessorKey: "email",
        header: "Email",
    },
    {
        accessorKey: "address",
        header: "Morada",
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const customer = row.original

            return <CustomerActions customer={customer} />
        },
    },
]

function CustomerActions({ customer }: { customer: Customer }) {
    const [open, setOpen] = useState(false)

    async function handleDelete() {
        try {
            await deleteCustomer(customer.id)
            toast.success("Cliente eliminado.")
        } catch {
            toast.error("Falha ao eliminar.")
        }
    }

    return (
        <>
            <Sheet open={open} onOpenChange={setOpen}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(customer.phone)}>
                            Copiar telefone
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <SheetTrigger asChild>
                            <DropdownMenuItem>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                            </DropdownMenuItem>
                        </SheetTrigger>
                        <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                            <Trash className="mr-2 h-4 w-4" />
                            Eliminar
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>Editar Cliente</SheetTitle>
                    </SheetHeader>
                    <div className="mt-4 p-4">
                        <CustomerForm
                            initialData={{
                                ...customer,
                                email: customer.email ?? undefined,
                                address: customer.address ?? undefined,
                                notes: customer.notes ?? undefined
                            }}
                            onOpenChange={setOpen}
                        />
                    </div>
                </SheetContent>
            </Sheet>
        </>
    )
}
