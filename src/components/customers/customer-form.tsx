"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { customerSchema, CustomerFormValues } from "@/lib/schemas"
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
import { Textarea } from "@/components/ui/textarea"
import { createCustomer, updateCustomer } from "@/actions/customers"
import { toast } from "sonner"
import { useTransition } from "react"

interface CustomerFormProps {
    initialData?: CustomerFormValues & { id: string }
    onOpenChange?: (open: boolean) => void
}

export function CustomerForm({ initialData, onOpenChange }: CustomerFormProps) {
    const [isPending, startTransition] = useTransition()

    const form = useForm<CustomerFormValues>({
        resolver: zodResolver(customerSchema),
        defaultValues: initialData ? {
            name: initialData.name,
            phone: initialData.phone,
            email: initialData.email ?? "",
            address: initialData.address ?? "",
            notes: initialData.notes ?? "",
        } : {
            name: "",
            phone: "",
            email: "",
            address: "",
            notes: "",
        },
    })

    function onSubmit(data: CustomerFormValues) {
        startTransition(async () => {
            try {
                if (initialData) {
                    await updateCustomer(initialData.id, data)
                    toast.success("Cliente atualizado com sucesso.")
                } else {
                    await createCustomer(data)
                    toast.success("Cliente criado com sucesso.")
                }
                onOpenChange?.(false)
            } catch (error) {
                toast.error("Something went wrong.")
            }
        })
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome</FormLabel>
                            <FormControl>
                                <Input placeholder="João Silva" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Telefone</FormLabel>
                            <FormControl>
                                <Input placeholder="123456789" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input placeholder="john@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Morada</FormLabel>
                            <FormControl>
                                <Input placeholder="Main St, 123" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Notas</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Additional notes..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" disabled={isPending} className="w-full">
                    {isPending ? "A guardar..." : initialData ? "Atualizar Cliente" : "Criar Cliente"}
                </Button>
            </form>
        </Form>
    )
}
