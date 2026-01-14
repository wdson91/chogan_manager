"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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
// import { searchProducts } from "@/actions/products"
// Note: We might need a search action, or just fetch all and filter client side if list is small.
// For now let's assume we pass products or fetch them. Since we are using this in a form that might need async search,
// let's implementing a simple version that requires products to be passed or fetches them.
// Wait, the usage in supplier-order-form passed a value and onSelect. 
// It seems better to implement a client-side filterable combobox if `products` are passed to the parent.
// Re-reading `supplier-order-form.tsx`: it receives `products` as prop.
// But `ProductCombobox` in `supplier-order-form.tsx` didn't receive products prop in the code I wrote?
// Let me check `supplier-order-form.tsx` again.
// Ah, `SupplierOrderForm` receives `products`. But `ProductCombobox` usage was:
// <ProductCombobox value={field.value} onSelect={...} />
// It didn't receive `products`. So it must fetch them or use a hook?
// Simpler fix: Pass `products` from `SupplierOrderForm` to `ProductCombobox`.

// Let's create a robust version that can accept products OR fetch them.
// For now, I'll update `SupplierOrderForm` to pass products to `ProductCombobox`, and here I'll define it to accept them.

interface ProductComboboxProps {
    value?: string
    onSelect: (value: string) => void
    products?: { id: string; name: string; size?: string | null; stockQuantity?: number; code?: string }[]
}

export function ProductCombobox({ value, onSelect, products = [] }: ProductComboboxProps) {
    const [open, setOpen] = React.useState(false)
    // If products are not passed, we might need to fetch them.
    // For now, let's rely on parent passing them.

    // If products list is empty, we show empty.

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between min-w-0"
                >
                    <span className="truncate text-left flex-1">
                        {value
                            ? (() => {
                                const product = products.find((p) => p.id === value)
                                if (!product) return "Produto não encontrado"
                                return product.size
                                    ? `${product.name} - ${product.size} (${product.stockQuantity || 0})`
                                    : `${product.name} (${product.stockQuantity || 0})`
                            })()
                            : "Selecione um produto..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
                <Command>
                    <CommandInput placeholder="Procurar produto..." />
                    <CommandList>
                        <CommandEmpty>Produto não encontrado.</CommandEmpty>
                        <CommandGroup>
                            {products.map((product) => {
                                const displayName = product.size
                                    ? `${product.name} - ${product.size} (${product.stockQuantity || 0})`
                                    : `${product.name} (${product.stockQuantity || 0})`

                                return (
                                    <CommandItem
                                        key={product.id}
                                        value={displayName} // Search by full display name
                                        keywords={[product.name, product.code || "", product.size || ""]} // Extra keywords
                                        onSelect={() => {
                                            onSelect(product.id)
                                            setOpen(false)
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === product.id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {displayName}
                                    </CommandItem>
                                )
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
