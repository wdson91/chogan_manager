import { getOrder } from "@/actions/orders"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { User, Phone, Mail, MapPin, Calendar, ReceiptEuro, Package } from "lucide-react"

export default async function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const order = await getOrder(id)

    if (!order) {
        notFound()
    }

    const formatter = new Intl.NumberFormat("pt-PT", {
        style: "currency",
        currency: "EUR",
    })

    const statusMap: Record<string, string> = {
        PENDING: "Pendente",
        PROCESSING: "Em Processamento",
        SHIPPED: "Enviado",
        DELIVERED: "Entregue",
        CANCELLED: "Cancelado",
    }

    return (
        <div className="container mx-auto py-6 md:py-10 px-4 md:px-6 flex flex-col gap-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Encomenda #{order.id.slice(-5)}</h1>
                    <p className="text-muted-foreground flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(order.createdAt).toLocaleDateString("pt-PT")} às {new Date(order.createdAt).toLocaleTimeString("pt-PT")}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-lg px-4 py-1">
                        {statusMap[order.status] || order.status}
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Customer Info */}
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Cliente
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="font-medium text-lg">{order.customer.name}</div>
                        <div className="space-y-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                <span>{order.customer.phone}</span>
                            </div>
                            {order.customer.email && (
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    <span>{order.customer.email}</span>
                                </div>
                            )}
                            {order.customer.address && (
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    <span>{order.customer.address}</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Products List */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Itens
                        </CardTitle>
                        <CardDescription>
                            {order.items.length} produtos na encomenda
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Produto</TableHead>
                                    <TableHead className="text-right">Qtd</TableHead>
                                    <TableHead className="text-right">Preço Unit.</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {order.items.map((item: any) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <div className="font-medium">{item.product.name}</div>
                                            <div className="text-xs text-muted-foreground">{item.product.code}</div>
                                        </TableCell>
                                        <TableCell className="text-right">{item.quantity}</TableCell>
                                        <TableCell className="text-right">{formatter.format(Number(item.unitPrice))}</TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatter.format(Number(item.subtotal))}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Order Summary */}
                <Card className="md:col-span-3">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ReceiptEuro className="h-5 w-5" />
                            Resumo
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-4 max-w-sm ml-auto">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span>{formatter.format(Number(order.totalAmount))}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-bold text-lg">
                                <span>Total a Pagar</span>
                                <span>{formatter.format(Number(order.totalAmount))}</span>
                            </div>
                            <div className="flex justify-between text-sm text-green-600 pt-2">
                                <span>Lucro Estimado</span>
                                <span>{formatter.format(Number(order.totalProfit))}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
