"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { productSchema, ProductFormValues } from "@/lib/schemas"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { createProduct, updateProduct } from "@/actions/products"
import { toast } from "sonner"
import { useTransition } from "react"

interface ProductFormProps {
    initialData?: ProductFormValues & { id: string }
    onOpenChange?: (open: boolean) => void
}

export function ProductForm({ initialData, onOpenChange }: ProductFormProps) {
    const [isPending, startTransition] = useTransition()

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema),
        defaultValues: initialData || {
            code: "",
            name: "",
            category: "",
            range: "",
            costPrice: 0,
            sellPrice: 0,
            stockQuantity: 0,
            allowNegativeStock: true,
            size: "",
        },
    })

    function onSubmit(data: ProductFormValues) {
        startTransition(async () => {
            try {
                if (initialData) {
                    await updateProduct(initialData.id, data)
                    toast.success("Produto atualizado com sucesso.")
                } else {
                    await createProduct(data)
                    toast.success("Produto criado com sucesso.")
                }
                onOpenChange?.(false)
            } catch (error) {
                toast.error("Algo correu mal.")
            }
        })
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Código</FormLabel>
                                <FormControl>
                                    <Input placeholder="CH001" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="range"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Gama</FormLabel>
                                <FormControl>
                                    <Input placeholder="Luxury" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="size"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tamanho</FormLabel>
                                <FormControl>
                                    <Input placeholder="100ml" {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="equivalence"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Equivalência</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ref X" {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome</FormLabel>
                            <FormControl>
                                <Input placeholder="Perfume X" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Categoria</FormLabel>
                            <FormControl>
                                <Input placeholder="Perfumes" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="grid grid-cols-3 gap-4">
                    <FormField
                        control={form.control}
                        name="costPrice"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Custo (€)</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        {...field}
                                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                        onFocus={(e) => e.target.select()}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="sellPrice"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Venda (€)</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        {...field}
                                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                        onFocus={(e) => e.target.select()}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="stockQuantity"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Stock</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        {...field}
                                        onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                                        onFocus={(e) => e.target.select()}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="allowNegativeStock"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                    Stock Negativo
                                </FormLabel>
                                <FormDescription>
                                    Permitir vender este produto mesmo sem stock
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />

                <Button type="submit" disabled={isPending} className="w-full">
                    {isPending ? "A guardar..." : initialData ? "Atualizar Produto" : "Criar Produto"}
                </Button>
            </form>
        </Form>
    )
}
