"use client"

import { useForm, useFieldArray, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { orderSchema, OrderFormValues } from "@/lib/schemas"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { createOrder } from "@/actions/orders"
import { toast } from "sonner"
import { useTransition } from "react"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Check, ChevronsUpDown, Plus, Trash } from "lucide-react"
import { ProductCombobox } from "@/components/products/product-combobox"

// Local type definitions
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

type Product = {
    id: string
    userId: string
    code: string
    name: string
    category: string
    range: string
    equivalence: string | null
    costPrice: number
    sellPrice: number
    stockQuantity: number
    notes: string | null
    size: string | null
    createdAt: Date
    updatedAt: Date
}

// Interface with number types for prices to avoid serialization issues
interface ProductWithNumbers extends Omit<Product, "costPrice" | "sellPrice"> {
    costPrice: number
    sellPrice: number
}

interface OrderFormProps {
    customers: Customer[]
    products: ProductWithNumbers[]
}

export function OrderForm({ customers, products }: OrderFormProps) {
    const [isPending, startTransition] = useTransition()

    const form = useForm<OrderFormValues>({
        resolver: zodResolver(orderSchema),
        defaultValues: {
            customerId: "",
            items: [{ productId: "", quantity: 1, unitPrice: 0 }],
        },
    })

    // Field Array for Items
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items",
    })

    // Watch items to calculate totals
    const items = useWatch({
        control: form.control,
        name: "items"
    })

    // Calculate Totals
    const { totalAmount, totalProfit } = items.reduce(
        (acc, item) => {
            const product = products.find(p => p.id === item.productId)
            if (!product || !item.quantity || !item.unitPrice) return acc

            const lineTotal = item.quantity * item.unitPrice
            const lineCost = product.costPrice * item.quantity

            return {
                totalAmount: acc.totalAmount + lineTotal,
                totalProfit: acc.totalProfit + (lineTotal - lineCost)
            }
        },
        { totalAmount: 0, totalProfit: 0 }
    )

    function onSubmit(data: OrderFormValues) {
        startTransition(async () => {
            try {
                await createOrder(data)
                toast.success("Encomenda criada com sucesso!")
                // Optional: Reset form or redirect handled by server action
            } catch (error: any) {
                toast.error(error.message || "Falha ao criar encomenda.")
            }
        })
    }

    // Helper to handle product selection and auto-fill price
    const handleProductSelect = (index: number, productId: string) => {
        const product = products.find(p => p.id === productId)
        if (product) {
            form.setValue(`items.${index}.productId`, productId)
            form.setValue(`items.${index}.unitPrice`, product.sellPrice)
            // Keep quantity if exists, or set 1
            const currentQty = form.getValues(`items.${index}.quantity`)
            if (!currentQty) form.setValue(`items.${index}.quantity`, 1)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Customer Selection */}
                <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Cliente</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className={cn(
                                                "w-[300px] justify-between",
                                                !field.value && "text-muted-foreground"
                                            )}
                                        >
                                            {field.value
                                                ? customers.find((customer) => customer.id === field.value)?.name
                                                : "Selecionar cliente"}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0">
                                    <Command>
                                        <CommandInput placeholder="Pesquisar cliente..." />
                                        <CommandList>
                                            <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                                            <CommandGroup>
                                                {customers.map((customer) => (
                                                    <CommandItem
                                                        value={customer.name}
                                                        key={customer.id}
                                                        onSelect={() => {
                                                            form.setValue("customerId", customer.id)
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                customer.id === field.value
                                                                    ? "opacity-100"
                                                                    : "opacity-0"
                                                            )}
                                                        />
                                                        {customer.name}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Items List */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Itens da Encomenda</h3>
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => append({ productId: "", quantity: 1, unitPrice: 0 })}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Adicionar Produto
                        </Button>
                    </div>

                    <div className="border rounded-md p-4 space-y-4">
                        {fields.map((field, index) => (
                            <div key={field.id} className="grid grid-cols-12 gap-4 items-end">
                                {/* Product Select */}
                                <div className="col-span-12 md:col-span-5">
                                    <FormField
                                        control={form.control}
                                        name={`items.${index}.productId`}
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel className={index !== 0 ? "sr-only" : ""}>Produto</FormLabel>
                                                <FormControl>
                                                    <ProductCombobox
                                                        value={field.value}
                                                        onSelect={(val) => handleProductSelect(index, val)}
                                                        products={products}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Quantity */}
                                <div className="col-span-6 md:col-span-2">
                                    <FormField
                                        control={form.control}
                                        name={`items.${index}.quantity`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className={index !== 0 ? "sr-only" : ""}>Qtd</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        {...field}
                                                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                                                        onFocus={(e) => e.target.select()}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Unit Price */}
                                <div className="col-span-6 md:col-span-2">
                                    <FormField
                                        control={form.control}
                                        name={`items.${index}.unitPrice`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className={index !== 0 ? "sr-only" : ""}>Preço (€)</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        {...field}
                                                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                                                        onFocus={(e) => e.target.select()}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Subtotal Display (Not a field) */}
                                <div className="col-span-6 md:col-span-2 flex items-center justify-end pb-2">
                                    <span className="text-sm font-medium">
                                        {new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(
                                            (form.watch(`items.${index}.quantity`) || 0) * (form.watch(`items.${index}.unitPrice`) || 0)
                                        )}
                                    </span>
                                </div>

                                {/* Remove Button */}
                                <div className="col-span-6 md:col-span-1">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-500"
                                        onClick={() => remove(index)}
                                        disabled={fields.length === 1}
                                    >
                                        <Trash className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Totals Section */}
                <div className="flex flex-col items-end space-y-2 border-t pt-4">
                    <div className="flex justify-between w-full max-w-sm">
                        <span className="text-muted-foreground">Lucro Total (Est.):</span>
                        <span className="font-medium text-green-600">
                            {new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(totalProfit)}
                        </span>
                    </div>
                    <div className="flex justify-between w-full max-w-sm text-lg font-bold">
                        <span>Total Encomenda:</span>
                        <span>
                            {new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(totalAmount)}
                        </span>
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button type="submit" size="lg" disabled={isPending}>
                        {isPending ? "A criar encomenda..." : "Criar Encomenda"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
