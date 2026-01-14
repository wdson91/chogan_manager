"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Order, Customer } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { updateOrderStatus } from "@/actions/orders"
import { toast } from "sonner"
import Link from "next/link"

// We need an extended type because we include the Customer relation
// Serialized version with Decimal fields converted to number
export type OrderWithCustomer = Omit<Order, 'totalAmount' | 'totalProfit'> & {
    customer: Customer
    totalAmount: number
    totalProfit: number
}

export const columns: ColumnDef<OrderWithCustomer>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "id",
        header: "Encomenda",
        cell: ({ row }) => {
            const id = row.getValue("id") as string
            return (
                <Link href={`/orders/${id}`} className="font-mono text-xs text-muted-foreground hover:underline">
                    #{id.slice(-5)}
                </Link>
            )
        }
    },
    {
        accessorKey: "customer.name",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Cliente
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status") as string
            const id = row.original.id

            const handleStatusChange = async (newStatus: string) => {
                try {
                    await updateOrderStatus(id, newStatus)
                    toast.success("Estado atualizado com sucesso!")
                } catch {
                    toast.error("Erro ao atualizar estado.")
                }
            }

            return (
                <Select defaultValue={status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-[130px] h-8">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="PENDING">Pendente</SelectItem>
                        <SelectItem value="PROCESSING">Em Processamento</SelectItem>
                        <SelectItem value="SHIPPED">Enviado</SelectItem>
                        <SelectItem value="DELIVERED">Entregue</SelectItem>
                        <SelectItem value="CANCELLED">Cancelado</SelectItem>
                    </SelectContent>
                </Select>
            )
        }
    },
    {
        accessorKey: "totalAmount",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    className="w-full justify-end"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Total
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("totalAmount"))
            const formatted = new Intl.NumberFormat("pt-PT", {
                style: "currency",
                currency: "EUR",
            }).format(amount)

            return <div className="text-right font-medium">{formatted}</div>
        },
    },
    {
        accessorKey: "totalProfit",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    className="w-full justify-end"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Lucro (Est.)
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("totalProfit"))
            const formatted = new Intl.NumberFormat("pt-PT", {
                style: "currency",
                currency: "EUR",
            }).format(amount)

            return <div className="text-right text-green-600 font-medium">{formatted}</div>
        },
    },
    {
        accessorKey: "createdAt",
        header: "Data",
        cell: ({ row }) => {
            return new Date(row.getValue("createdAt")).toLocaleDateString("pt-PT")
        }
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const order = row.original

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem
                            onClick={() => {
                                navigator.clipboard.writeText(order.id)
                                toast.success("ID copiado!")
                            }}
                        >
                            Copiar ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href={`/orders/${order.id}`}>Ver Detalhes</Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]
