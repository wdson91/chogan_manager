"use client"

import { useMemo, useState } from "react"
import { DataTable } from "@/components/ui/data-table"
import { columns, SupplierOrderColumn } from "@/components/supplier-orders/columns"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatCurrency } from "@/lib/utils"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

type Props = {
  orders: SupplierOrderColumn[]
}

export function SupplierOrdersClient({ orders }: Props) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<SupplierOrderColumn | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const selectedTotal = useMemo(() => {
    if (!selected) return null
    return formatCurrency(Number(selected.totalAmount ?? 0))
  }, [selected])

  const filteredOrders = useMemo(() => {
    if (statusFilter === "all") return orders
    return orders.filter((order) => order.status === statusFilter)
  }, [orders, statusFilter])

  return (
    <>
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <label htmlFor="status-filter" className="text-sm font-medium">
            Status:
          </label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger id="status-filter" className="w-[180px]">
              <SelectValue placeholder="Selecionar status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="PENDING">Pendente</SelectItem>
              <SelectItem value="COMPLETED">Recebido</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DataTable
        columns={columns}
        data={filteredOrders}
        onRowClick={(row) => {
          setSelected(row as SupplierOrderColumn)
          setOpen(true)
        }}
      />

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) setSelected(null)
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selected
                ? `Pedido à Empresa ${selected.orderNum ? `#${selected.orderNum}` : `#${selected.id.slice(-5)}`}`
                : "Pedido à Empresa"}
            </DialogTitle>
            <DialogDescription>
              {selected ? new Date(selected.orderDate).toLocaleString("pt-PT") : null}
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {selected.orderNum && (
                  <div className="rounded-md border p-3">
                    <div className="text-xs text-muted-foreground">Nº da Encomenda</div>
                    <div className="font-medium">{selected.orderNum}</div>
                  </div>
                )}
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Status</div>
                  <div className="font-medium">
                    {selected.status === "COMPLETED" ? "Recebido" : "Pendente"}
                  </div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Total</div>
                  <div className="font-medium">{selectedTotal}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Itens</div>
                  <div className="font-medium">{selected.items?.length ?? 0}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Data que foi pedido</div>
                  <div className="font-medium">
                    {new Date(selected.orderDate).toLocaleDateString("pt-PT")}
                  </div>
                </div>
                {selected.expectedDate && (
                  <div className="rounded-md border p-3">
                    <div className="text-xs text-muted-foreground">Data prevista</div>
                    <div className="font-medium">
                      {new Date(selected.expectedDate).toLocaleDateString("pt-PT")}
                    </div>
                  </div>
                )}
                {selected.receivedDate && (
                  <div className="rounded-md border p-3">
                    <div className="text-xs text-muted-foreground">Data que chegou</div>
                    <div className="font-medium">
                      {new Date(selected.receivedDate).toLocaleDateString("pt-PT")}
                    </div>
                  </div>
                )}
              </div>

              {selected.notes && (
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground mb-1">Notas</div>
                  <div className="whitespace-pre-wrap text-sm">{selected.notes}</div>
                </div>
              )}

              <div className="rounded-md border">
                <div className="border-b px-3 py-2 text-sm font-medium">Itens do pedido</div>
                <div className="divide-y">
                  {(selected.items ?? []).map((item) => {
                    const name = item.product?.name ?? "Produto (sem ligação)"
                    const qty = Number(item.quantity ?? 0)
                    const unitCost = Number(item.unitCost ?? 0)
                    const lineTotal = qty * unitCost

                    return (
                      <div key={item.id} className="px-3 py-2 text-sm">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="font-medium truncate">{name}</div>
                            {item.product?.code && (
                              <div className="text-xs text-muted-foreground">{item.product.code}</div>
                            )}
                          </div>
                          <div className="shrink-0 text-right">
                            <div className="font-medium">{formatCurrency(lineTotal)}</div>
                            <div className="text-xs text-muted-foreground">
                              {qty} × {formatCurrency(unitCost)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

