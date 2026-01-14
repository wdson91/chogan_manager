"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { importCustomers, importProducts } from "@/actions/data-import"
import { deleteAllProducts } from "@/actions/delete-all"
import { toast } from "sonner"
import { Upload, FileSpreadsheet, Trash2 } from "lucide-react"
import * as XLSX from "xlsx"

// Helper to convert Excel to CSV
const excelToCSV = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const data = e.target?.result
                const workbook = XLSX.read(data, { type: "binary" })
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
                const csv = XLSX.utils.sheet_to_csv(firstSheet, { FS: ";", RS: "\n" })
                resolve(csv)
            } catch (error) {
                reject(error)
            }
        }
        reader.onerror = reject
        reader.readAsBinaryString(file)
    })
}

export default function DataImportPage() {
    const [isPending, startTransition] = useTransition()
    const [customerFile, setCustomerFile] = useState<File | null>(null)
    const [productFile, setProductFile] = useState<File | null>(null)

    const handleCustomerImport = async () => {
        if (!customerFile) {
            toast.error("Por favor, selecione um ficheiro")
            return
        }

        startTransition(async () => {
            try {
                const formData = new FormData()

                // Check if it's an Excel file
                if (customerFile.name.endsWith('.xlsx') || customerFile.name.endsWith('.xls')) {
                    toast.info("A converter Excel para CSV...")
                    const csvContent = await excelToCSV(customerFile)
                    const csvBlob = new Blob([csvContent], { type: "text/csv" })
                    const csvFile = new File([csvBlob], customerFile.name.replace(/\.xlsx?$/, '.csv'), { type: "text/csv" })
                    formData.append("file", csvFile)
                } else {
                    formData.append("file", customerFile)
                }

                const result = await importCustomers(formData)

                if (result.errors.length > 0) {
                    toast.error(`Importação com erros: ${result.errors.slice(0, 3).join(", ")}${result.errors.length > 3 ? '...' : ''}`)
                } else {
                    toast.success(
                        `Clientes importados! Novos: ${result.insertedCount}, Ignorados: ${result.skippedCount}`
                    )
                }

                setCustomerFile(null)
                const input = document.getElementById("customer-file") as HTMLInputElement
                if (input) input.value = ""
            } catch (error) {
                const message = error instanceof Error ? error.message : "Erro desconhecido"
                toast.error(`Erro: ${message}`)
            }
        })
    }

    const handleProductImport = async () => {
        if (!productFile) {
            toast.error("Por favor, selecione um ficheiro")
            return
        }

        startTransition(async () => {
            try {
                const formData = new FormData()

                // Check if it's an Excel file
                if (productFile.name.endsWith('.xlsx') || productFile.name.endsWith('.xls')) {
                    toast.info("A converter Excel para CSV...")
                    const csvContent = await excelToCSV(productFile)

                    // DEBUG: Show first 3 lines of CSV
                    const lines = csvContent.split('\n').slice(0, 3)
                    console.log("=== CSV DEBUG ===")
                    console.log("First 3 lines:", lines)
                    toast.info(`Colunas: ${lines[0].substring(0, 100)}...`)

                    const csvBlob = new Blob([csvContent], { type: "text/csv" })
                    const csvFile = new File([csvBlob], productFile.name.replace(/\.xlsx?$/, '.csv'), { type: "text/csv" })
                    formData.append("file", csvFile)
                } else {
                    formData.append("file", productFile)
                }

                const result = await importProducts(formData)

                if (result.errors.length > 0) {
                    toast.error(`Importação com erros: ${result.errors.slice(0, 3).join(", ")}${result.errors.length > 3 ? '...' : ''}`)
                } else {
                    toast.success(
                        `Produtos importados! Novos: ${result.insertedCount}, Atualizados: ${result.updatedCount}`
                    )
                }

                setProductFile(null)
                const input = document.getElementById("product-file") as HTMLInputElement
                if (input) input.value = ""
            } catch (error) {
                const message = error instanceof Error ? error.message : "Erro desconhecido"
                toast.error(`Erro: ${message}`)
            }
        })
    }

    const handleDeleteAllProducts = async () => {
        if (!confirm("Tem a certeza que deseja apagar TODOS os seus produtos? Esta ação não pode ser revertida!")) {
            return
        }

        startTransition(async () => {
            try {
                const result = await deleteAllProducts()
                toast.success(`${result.deletedCount} produtos eliminados com sucesso!`)
            } catch (error) {
                const message = error instanceof Error ? error.message : "Erro desconhecido"
                toast.error(`Erro ao eliminar produtos: ${message}`)
            }
        })
    }

    return (
        <div className="container mx-auto py-6 md:py-10 px-4 md:px-6 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold">Importação de Dados</h1>
                <p className="text-muted-foreground">
                    Carregue ficheiros CSV ou Excel para importar clientes e produtos em massa
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Customer Import Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileSpreadsheet className="h-5 w-5" />
                            Importar Clientes
                        </CardTitle>
                        <CardDescription>
                            Formato esperado: Nome, Telefone, Email, Morada, Data_Registo, Notas
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="customer-file">Ficheiro CSV ou Excel</Label>
                            <Input
                                id="customer-file"
                                type="file"
                                accept=".csv,.xlsx,.xls"
                                onChange={(e) => setCustomerFile(e.target.files?.[0] || null)}
                                disabled={isPending}
                            />
                        </div>

                        {customerFile && (
                            <p className="text-sm text-muted-foreground">
                                Ficheiro selecionado: {customerFile.name}
                            </p>
                        )}

                        <Button
                            onClick={handleCustomerImport}
                            disabled={!customerFile || isPending}
                            className="w-full"
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            {isPending ? "A importar..." : "Importar Clientes"}
                        </Button>

                        <div className="text-xs text-muted-foreground space-y-1">
                            <p>• Clientes duplicados (mesmo nome ou telefone) serão ignorados</p>
                            <p>• Campos vazios serão tratados como nulos</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Product Import Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileSpreadsheet className="h-5 w-5" />
                            Importar Produtos
                        </CardTitle>
                        <CardDescription>
                            Formato esperado: Código, Nome, Categoria, Gama, Preço Cliente, Preço Custo
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="product-file">Ficheiro CSV ou Excel</Label>
                            <Input
                                id="product-file"
                                type="file"
                                accept=".csv,.xlsx,.xls"
                                onChange={(e) => setProductFile(e.target.files?.[0] || null)}
                                disabled={isPending}
                            />
                        </div>

                        {productFile && (
                            <p className="text-sm text-muted-foreground">
                                Ficheiro selecionado: {productFile.name}
                            </p>
                        )}

                        <Button
                            onClick={handleProductImport}
                            disabled={!productFile || isPending}
                            className="w-full"
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            {isPending ? "A importar..." : "Importar Produtos"}
                        </Button>

                        <div className="text-xs text-muted-foreground space-y-1">
                            <p>• Produtos existentes (mesmo código) serão atualizados</p>
                            <p>• Use vírgula (,) como separador decimal nos preços</p>
                            <p>• Stock inicial será definido como 0</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="mt-6 border-destructive">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                        <Trash2 className="h-5 w-5" />
                        Zona de Perigo
                    </CardTitle>
                    <CardDescription>
                        Ações irreversíveis que eliminam dados permanentemente
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-medium mb-2">Apagar Todos os Produtos</h4>
                            <p className="text-sm text-muted-foreground mb-4">
                                Remove permanentemente todos os seus produtos da base de dados.
                                Esta ação não pode ser revertida.
                            </p>
                            <Button
                                variant="destructive"
                                onClick={handleDeleteAllProducts}
                                disabled={isPending}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {isPending ? "A eliminar..." : "Apagar Todos os Produtos"}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Instruções</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <p><strong>Formatos aceites:</strong> CSV (.csv) ou Excel (.xlsx, .xls)</p>
                    <p><strong>Encoding:</strong> Certifique-se de que o ficheiro está em UTF-8.</p>
                    <p><strong>Preços:</strong> Use vírgula (,) como separador decimal (ex: 12,50).</p>
                    <p><strong>Primeira linha:</strong> Deve conter os cabeçalhos das colunas.</p>
                </CardContent>
            </Card>
        </div>
    )
}
