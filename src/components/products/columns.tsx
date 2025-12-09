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
import { ProductForm } from "./product-form"
import { deleteProduct } from "@/actions/products"
import { toast } from "sonner"
import { ProductFormValues } from "@/lib/schemas"

// Define a type for the data that will be passed to the table (Decimals converted to numbers)
export type ProductRow = ProductFormValues & {
    id: string
    createdAt: Date
    // Calculated fields if we want, or compute in render
}

export const columns: ColumnDef<ProductRow>[] = [
    {
        accessorKey: "code",
        header: "Código",
    },
    {
        accessorKey: "name",
        header: "Nome",
        cell: ({ row }) => {
            const name = row.original.name
            return name.length > 50 ? `${name.substring(0, 50)}...` : name
        }
    },
    {
        accessorKey: "size",
        header: "Tamanho",
    },
    {
        accessorKey: "equivalence",
        header: "Equivalência",
        cell: ({ row }) => {
            return row.original.equivalence || "-"
        }
    },
    {
        accessorKey: "category",
        header: "Categoria",
    },
    {
        accessorKey: "range",
        header: "Gama",
    },
    {
        accessorKey: "costPrice",
        header: "Custo",
        cell: ({ row }) => {
            return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(row.original.costPrice)
        }
    },
    {
        accessorKey: "sellPrice",
        header: "Venda",
        cell: ({ row }) => {
            return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(row.original.sellPrice)
        }
    },
    {
        id: "margin",
        header: "Margem",
        cell: ({ row }) => {
            const cost = row.original.costPrice
            const sell = row.original.sellPrice
            const margin = sell - cost
            return (
                <span className={margin >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                    {new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(margin)}
                </span>
            )
        }
    },
    {
        accessorKey: "stockQuantity",
        header: "Stock",
    },
    {
        id: "actions",
        header: "Ações",
        cell: ({ row }) => {
            const product = row.original

            return <ProductActions product={product} />
        },
    },
]

function ProductActions({ product }: { product: ProductRow }) {
    const [open, setOpen] = useState(false)

    async function handleDelete() {
        try {
            await deleteProduct(product.id)
            toast.success("Produto eliminado.")
        } catch (error) {
            toast.error("Erro ao eliminar.")
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
                        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(product.code)}>
                            Copiar Código
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
                        <SheetTitle>Editar Produto</SheetTitle>
                    </SheetHeader>
                    <div className="mt-4">
                        <ProductForm initialData={product} onOpenChange={setOpen} />
                    </div>
                </SheetContent>
            </Sheet>
        </>
    )
}
