"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
// import { SupplierOrderWithItems } from "@/types" // We might need to define this or use Prisma types if available
import { receiveSupplierOrder, deleteSupplierOrder } from "@/actions/supplier-orders"
import { toast } from "sonner"
import Link from "next/link"

// Define shape simply for now to avoid import issues until client is fully generated
export type SupplierOrderColumn = {
    id: string
    totalAmount: number // or Decimal
    status: string
    orderDate: Date
    notes: string | null
    items: any[]
}

export const columns: ColumnDef<SupplierOrderColumn>[] = [
    {
        accessorKey: "orderDate",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Data
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            return new Date(row.getValue("orderDate")).toLocaleDateString("pt-PT")
        },
    },
    {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => {
            const status = row.getValue("status") as string
            return (
                <Badge variant={status === "COMPLETED" ? "default" : "secondary"}>
                    {status === "COMPLETED" ? "Recebido" : "Pendente"}
                </Badge>
            )
        },
    },
    {
        accessorKey: "totalAmount",
        header: "Total",
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("totalAmount"))
            return <div>{formatCurrency(amount)}</div>
        },
    },
    {
        accessorKey: "items",
        header: "Itens",
        cell: ({ row }) => {
            const items = row.original.items
            return <div>{items.length} itens</div>
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const order = row.original

            const onReceive = async () => {
                try {
                    await receiveSupplierOrder(order.id)
                    toast.success("Encomenda recebida e stock atualizado!")
                } catch (error) {
                    toast.error("Erro ao receber encomenda")
                }
            }

            const onDelete = async () => {
                try {
                    await deleteSupplierOrder(order.id)
                    toast.success("Encomenda eliminada")
                } catch (error) {
                    toast.error("Erro ao eliminar encomenda")
                }
            }

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem
                            onClick={() => navigator.clipboard.writeText(order.id)}
                        >
                            Copiar ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {order.status !== "COMPLETED" && (
                            <DropdownMenuItem onClick={onReceive}>
                                Dar Entrada (Receber)
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                            onClick={onDelete}
                            className="text-red-600"
                        >
                            Eliminar
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]
