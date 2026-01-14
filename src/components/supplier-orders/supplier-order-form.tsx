"use client"

import { useState } from "react"
import { useForm, useFieldArray, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Trash2, Plus } from "lucide-react"
import { ProductCombobox } from "@/components/products/product-combobox"
import { createSupplierOrder } from "@/actions/supplier-orders"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

const supplierOrderSchema = z.object({
    orderNum: z.string().optional(),
    orderDate: z.string().optional(),
    expectedDate: z.string().optional(),
    receivedDate: z.string().optional(),
    notes: z.string().optional(),
    items: z.array(z.object({
        productId: z.string().min(1, "Selecione um produto"), // Optional? As per plan, we enforce product linking for now.
        quantity: z.number().min(1, "Quantidade mínima é 1"),
        unitCost: z.number().min(0, "Custo não pode ser negativo")
    })).min(1, "Adicione pelo menos um item")
})

type SupplierOrderFormValues = z.infer<typeof supplierOrderSchema>

interface Product {
    id: string
    name: string
    size?: string | null
    stockQuantity: number
    costPrice: number // Decimal in DB, number here
}

interface SupplierOrderFormProps {
    products: Product[]
}

export function SupplierOrderForm({ products }: SupplierOrderFormProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<SupplierOrderFormValues>({
        resolver: zodResolver(supplierOrderSchema),
        defaultValues: {
            orderNum: "",
            orderDate: new Date().toISOString().split('T')[0], // Today's date as default
            expectedDate: "",
            receivedDate: "",
            notes: "",
            items: [{ productId: "", quantity: 1, unitCost: 0 }]
        }
    })

    const { fields, append, remove } = useFieldArray({
        name: "items",
        control: form.control,
    })

    // Watch items to recalculate total automatically
    const watchedItems = useWatch({
        control: form.control,
        name: "items"
    })

    const calculateTotal = () => {
        if (!watchedItems) return 0
        return watchedItems.reduce((total, item) => {
            const quantity = item?.quantity || 0
            const unitCost = item?.unitCost || 0
            return total + (quantity * unitCost)
        }, 0)
    }

    // Update unit cost when product is selected
    const handleProductSelect = (index: number, productId: string) => {
        const product = products.find(p => p.id === productId)
        if (product) {
            form.setValue(`items.${index}.unitCost`, Number(product.costPrice))
        }
    }

    async function onSubmit(data: SupplierOrderFormValues) {
        setIsLoading(true)
        try {
            await createSupplierOrder(data)
            toast.success("Pedido criado com sucesso!")
            router.push("/supplier-orders")
        } catch (error) {
            toast.error("Erro ao criar pedido")
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <Card>
                    <CardContent className="pt-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="orderNum"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nº da Encomenda</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: 2026-001" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="orderDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Data que foi pedido</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="expectedDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Data prevista</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="receivedDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Data que chegou</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="mt-4">
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notas</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Notas sobre o pedido..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Itens do Pedido</h2>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => append({ productId: "", quantity: 1, unitCost: 0 })}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Adicionar Item
                        </Button>
                    </div>

                    {fields.map((field, index) => (
                        <Card key={field.id}>
                            <CardContent className="pt-6">
                                <div className="grid gap-4 md:grid-cols-12 items-end">
                                    <div className="md:col-span-4">
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.productId`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Produto</FormLabel>
                                                    <FormControl>
                                                        <ProductCombobox
                                                            value={field.value}
                                                            onSelect={(val) => {
                                                                field.onChange(val)
                                                                handleProductSelect(index, val)
                                                            }}
                                                            products={products}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.quantity`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Qtd.</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            min="1"
                                                            {...field}
                                                            onChange={e => field.onChange(parseInt(e.target.value))}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="md:col-span-3">
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.unitCost`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Custo Unit. (€)</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            {...field}
                                                            onChange={e => field.onChange(parseFloat(e.target.value))}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="md:col-span-2 flex items-center justify-end pb-2">
                                        <div className="text-right">
                                            <div className="text-xs text-muted-foreground">Subtotal</div>
                                            <div className="font-medium">
                                                {formatCurrency(
                                                    (watchedItems?.[index]?.quantity || 0) * 
                                                    (watchedItems?.[index]?.unitCost || 0)
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="md:col-span-1">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => remove(index)}
                                            className="text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="flex justify-between items-center bg-muted/50 p-4 rounded-lg">
                    <div className="text-lg font-semibold">
                        Total Estimado:
                    </div>
                    <div className="text-2xl font-bold text-primary">
                        {formatCurrency(calculateTotal())}
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? "A Criar..." : "Criar Pedido"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
