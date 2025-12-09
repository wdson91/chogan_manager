"use server"

import { getUserId } from "@/lib/supabase/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import Papa from "papaparse"

// Helper function to clean decimal values (comma to dot, remove currency symbols)
function cleanDecimal(value: any): number {
    if (!value) return 0
    const stringValue = String(value)
    if (stringValue.trim() === "") return 0
    // Remove currency symbols (€, $, etc.), extra spaces, and convert comma to dot
    const cleaned = stringValue.replace(/[€$£¥\s]/g, "").replace(",", ".")
    return parseFloat(cleaned) || 0
}

// Helper function to clean string values
function cleanString(value: any): string | null {
    if (!value) return null
    const stringValue = String(value)
    if (stringValue.trim() === "") return null
    return stringValue.trim()
}

// Helper function to get column value with flexible name matching
function getColumnValue(row: any, possibleNames: string[]): string {
    for (const name of possibleNames) {
        if (row[name] !== undefined && row[name] !== null && row[name] !== "") {
            return row[name]
        }
    }
    return ""
}

interface ImportResult {
    insertedCount: number
    updatedCount: number
    skippedCount: number
    errors: string[]
}

export async function importCustomers(formData: FormData): Promise<ImportResult> {
    const userId = await getUserId()

    const file = formData.get("file") as File
    if (!file) {
        throw new Error("No file provided")
    }

    const text = await file.text()

    return new Promise((resolve) => {
        Papa.parse(text, {
            header: true,
            delimiter: ";",
            skipEmptyLines: true,
            complete: async (results) => {
                const result: ImportResult = {
                    insertedCount: 0,
                    updatedCount: 0,
                    skippedCount: 0,
                    errors: []
                }

                try {
                    for (const row of results.data as any[]) {
                        try {
                            const name = cleanString(row.Nome)
                            const phone = cleanString(row.Telefone)

                            // Silently skip empty rows or rows missing required phone
                            if (!name || !phone) {
                                continue
                            }

                            // Check if customer already exists
                            const existing = await prisma.customer.findFirst({
                                where: {
                                    userId,
                                    OR: [
                                        { name },
                                        ...(phone ? [{ phone }] : [])
                                    ]
                                }
                            })

                            if (existing) {
                                result.skippedCount++
                                continue
                            }

                            // Create new customer
                            await prisma.customer.create({
                                data: {
                                    userId,
                                    name,
                                    phone,
                                    email: cleanString(row.Email),
                                    address: cleanString(row.Morada),
                                    notes: cleanString(row.Notas)
                                }
                            })

                            result.insertedCount++
                        } catch (error: any) {
                            result.errors.push(`Erro na linha: ${error.message}`)
                        }
                    }

                    revalidatePath("/customers")
                    resolve(result)
                } catch (error: any) {
                    result.errors.push(`Erro geral: ${error.message}`)
                    resolve(result)
                }
            }
        })
    })
}

export async function importProducts(formData: FormData): Promise<ImportResult> {
    const userId = await getUserId()

    const file = formData.get("file") as File
    if (!file) {
        throw new Error("No file provided")
    }

    const text = await file.text()

    return new Promise((resolve) => {
        Papa.parse(text, {
            header: true,
            delimiter: ";",
            skipEmptyLines: true,
            transformHeader: (header) => header.trim(), // Remove leading/trailing spaces from column names
            complete: async (results) => {
                const result: ImportResult = {
                    insertedCount: 0,
                    updatedCount: 0,
                    skippedCount: 0,
                    errors: []
                }

                try {
                    // First, collect all product codes from CSV
                    const allCodes = (results.data as any[])
                        .map(row => cleanString(row.Código))
                        .filter((code): code is string => !!code)

                    // Fetch ALL existing products for this user in ONE query
                    const existingProducts = await prisma.product.findMany({
                        where: {
                            userId,
                            code: { in: allCodes }
                        },
                        select: {
                            id: true,
                            code: true
                        }
                    })

                    // Create a map for O(1) lookup
                    const existingProductsMap = new Map(
                        existingProducts.map((p: { code: any; id: any }) => [p.code, p.id])
                    )

                    // Collect all products to insert/update
                    const productsToCreate = []
                    const productsToUpdate = []

                    for (const row of results.data as any[]) {
                        try {
                            const code = cleanString(row.Código)
                            const name = cleanString(row.Nome)

                            // Silently skip empty rows
                            if (!code || !name) {
                                continue
                            }

                            // Debug: log column names and values (first row only)
                            // if (result.insertedCount === 0 && result.updatedCount === 0) {
                            //     console.log("Column names:", Object.keys(row))
                            //     console.log("All row data:", row)
                            // }

                            // Try multiple column name variations for prices using helper
                            const costPriceValue = getColumnValue(row, [
                                "Preço Custo",
                                "Preco Custo",
                                "Custo",
                                "PreçoCusto",
                                "PrecoCusto",
                                "Preço de Custo",
                                "Preco de Custo"
                            ])
                            const sellPriceValue = getColumnValue(row, [
                                "Preço Cliente",
                                "Preco Cliente",
                                "Preço",
                                "Preco",
                                "Venda",
                                "PreçoCliente",
                                "PrecoCliente",
                                "Preço Venda",
                                "Preco Venda",
                                "Preço de Venda",
                                "Preco de Venda"
                            ])

                            const costPrice = cleanDecimal(costPriceValue)
                            const sellPrice = cleanDecimal(sellPriceValue)

                            // Store equivalence separately
                            const equivalence = cleanString(row.Equivalência) || null

                            // Build notes from Marca only (Tamanho now has its own column)
                            const noteParts = []
                            if (row.Marca) noteParts.push(`Marca: ${row.Marca}`)
                            const notes = noteParts.length > 0 ? noteParts.join(" | ") : null

                            const productData = {
                                code,
                                name,
                                category: cleanString(row.Categoria) || "Geral",
                                range: cleanString(row.Gama) || "Standard",
                                equivalence,
                                costPrice,
                                sellPrice,
                                notes,
                                size: cleanString(row.Tamanho)
                            }

                            // Check if product exists using Map (O(1) lookup - MUCH faster!)
                            const existingId = existingProductsMap.get(code)

                            if (existingId) {
                                productsToUpdate.push({
                                    id: existingId,
                                    ...productData
                                })
                            } else {
                                productsToCreate.push({
                                    userId,
                                    ...productData,
                                    stockQuantity: 0
                                })
                            }
                        } catch (error: any) {
                            result.errors.push(`Erro na linha: ${error.message}`)
                        }
                    }

                    // Batch create new products
                    if (productsToCreate.length > 0) {
                        await prisma.product.createMany({
                            data: productsToCreate,
                            skipDuplicates: true
                        })
                        result.insertedCount = productsToCreate.length
                    }

                    // Batch update existing products (unfortunately Prisma doesn't have updateMany with different data)
                    // So we'll do these in parallel
                    if (productsToUpdate.length > 0) {
                        await Promise.all(
                            productsToUpdate.map(product =>
                                prisma.product.update({
                                    where: { id: product.id },
                                    data: {
                                        name: product.name,
                                        category: product.category,
                                        range: product.range,
                                        equivalence: product.equivalence,
                                        costPrice: product.costPrice,
                                        sellPrice: product.sellPrice,
                                        notes: product.notes,
                                        size: product.size
                                    }
                                })
                            )
                        )
                        result.updatedCount = productsToUpdate.length
                    }

                    revalidatePath("/products")
                    resolve(result)
                } catch (error: any) {
                    result.errors.push(`Erro geral: ${error.message}`)
                    resolve(result)
                }
            }
        })
    })
}
