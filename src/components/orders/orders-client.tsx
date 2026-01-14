"use client"

import { DataTable } from "@/components/ui/data-table"
import { columns, OrderWithCustomer } from "@/components/orders/columns"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { bulkUpdateOrderStatus } from "@/actions/orders"
import { toast } from "sonner"
import { useState } from "react"
import { Loader2 } from "lucide-react"

interface OrdersClientProps {
    data: OrderWithCustomer[]
}

export function OrdersClient({ data }: OrdersClientProps) {
    const [isUpdating, setIsUpdating] = useState(false)
    const [selectedStatus, setSelectedStatus] = useState<string>("")

    return (
        <DataTable
            columns={columns}
            data={data}
            filterColumn="customer_name" // Note: accessor is customer.name, but filter might need adjustment if generic filter logic expects simple key. 
            // Actually, in columns.tsx accessorKey is "customer.name". DataTable filter uses getColumn(filterColumn). 
            // So we should pass "customer_name" if the id is "customer_name", or "customer_name" if the accessorKey is "customer.name" and id defaults to that?
            // TanStack table defaults id to accessorKey. So it should be "customer_name" (dot replaced by underscore? No, usually it's the accessorKey).
            // Let's check columns.tsx: accessorKey is "customer.name".
            // So filterColumn should be "customer_name" NO, wait. accessorKey "customer.name" usually results in id "customer_name".
            // Let's try "customer_name" but I'll double check if I can just use "customer_name".
            // Actually, let's look at internal implementation. 
            // Safe bet is to use the ID if we defined one. We didn't define ID for customer name column, just accessorKey. 
            // TanStack Table replaces dots with underscores for default IDs? I recall something like that. 
            // Let's stick with "customer_name" for now, or check column definition.
            // On second thought, let's verify column id in columns.tsx.
            // columns.tsx: accessorKey: "customer.name".
            // id is likely "customer_name".

            bulkActions={(table) => {
                const selectedRows = table.getFilteredSelectedRowModel().rows
                const hasSelection = selectedRows.length > 0

                const handleBulkUpdate = async () => {
                    if (!selectedStatus) return
                    setIsUpdating(true)
                    try {
                        const ids = selectedRows.map(row => row.original.id)
                        await bulkUpdateOrderStatus(ids, selectedStatus)
                        toast.success(`${ids.length} encomendas atualizadas!`)
                        table.resetRowSelection()
                        setSelectedStatus("")
                    } catch {
                        toast.error("Erro ao atualizar encomendas.")
                    } finally {
                        setIsUpdating(false)
                    }
                }

                if (!hasSelection) return null

                return (
                    <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-lg border animate-in fade-in slide-in-from-top-1">
                        <span className="text-sm font-medium whitespace-nowrap">
                            {selectedRows.length} selecionados
                        </span>
                        <Select
                            value={selectedStatus}
                            onValueChange={setSelectedStatus}
                        >
                            <SelectTrigger className="w-[180px] h-8 bg-background">
                                <SelectValue placeholder="Alterar Estado..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PENDING">Pendente</SelectItem>
                                <SelectItem value="PROCESSING">Em Processamento</SelectItem>
                                <SelectItem value="SHIPPED">Enviado</SelectItem>
                                <SelectItem value="DELIVERED">Entregue</SelectItem>
                                <SelectItem value="CANCELLED">Cancelado</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button
                            size="sm"
                            variant="default"
                            className="h-8"
                            onClick={handleBulkUpdate}
                            disabled={!selectedStatus || isUpdating}
                        >
                            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aplicar"}
                        </Button>
                    </div>
                )
            }}
        />
    )
}
