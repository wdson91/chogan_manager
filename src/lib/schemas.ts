import { z } from "zod"

export const customerSchema = z.object({
    name: z.string().min(1, "Name is required"),
    phone: z.string().min(1, "Phone is required"),
    email: z.string().email().optional().or(z.literal("")),
    address: z.string().optional(),
    notes: z.string().optional(),
})

export type CustomerFormValues = z.infer<typeof customerSchema>

export const productSchema = z.object({
    code: z.string().min(1, "Code is required"),
    name: z.string().min(1, "Name is required"),
    category: z.string().min(1, "Category is required"),
    range: z.string().min(1, "Range is required"),
    equivalence: z.string().optional(),
    costPrice: z.number().min(0),
    sellPrice: z.number().min(0),
    stockQuantity: z.number().int().min(0),
    allowNegativeStock: z.boolean(),
    notes: z.string().optional(),
    size: z.string().optional(),
})

export type ProductFormValues = z.infer<typeof productSchema>

// Order Schemas
export const orderItemSchema = z.object({
    productId: z.string().min(1, "Product is required"),
    quantity: z.number().int().min(1, "Quantity must be at least 1"),
    unitPrice: z.number().min(0, "Price must be positive"),
    // costPrice snapshot for profit calculation? We'll fetch it on server or trust client?
    // Safer to fetch on server, but for UI estimation we use client data.
    // The server action will re-fetch product cost to be sure.
})

export const orderSchema = z.object({
    customerId: z.string().min(1, "Customer is required"),
    items: z.array(orderItemSchema).min(1, "Add at least one product"),
})

export type OrderFormValues = z.infer<typeof orderSchema>
