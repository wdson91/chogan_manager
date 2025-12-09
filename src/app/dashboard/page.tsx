import { getUser } from "@/lib/supabase/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Overview } from "@/components/dashboard/overview"

export default async function DashboardPage() {
    const user = await getUser()

    if (!user) {
        redirect("/login")
    }

    const dbUser = await prisma.user.findUnique({
        where: { id: user.id }
    })

    if (!dbUser) {
        return <div>User not found. Please execute the SQL trigger in Supabase.</div>
    }

    const orders = await prisma.order.findMany({
        where: { userId: dbUser.id },
        select: { orderDate: true, totalAmount: true }
    })

    const monthlyDataMap = new Map<string, number>();

    orders.forEach((order: { orderDate: Date; totalAmount: any }) => {
        const month = order.orderDate.toLocaleString('pt-PT', { month: 'short' });
        const amount = Number(order.totalAmount);
        monthlyDataMap.set(month, (monthlyDataMap.get(month) || 0) + amount);
    });

    const monthlyData = Array.from(monthlyDataMap.entries()).map(([name, total]) => ({
        name,
        total
    }));

    const totalRevenue = orders.reduce((sum: number, o: { totalAmount: any }) => sum + Number(o.totalAmount), 0);
    const totalOrders = orders.length;

    return (
        <div className="container mx-auto py-6 md:py-10 px-4 md:px-6">
            <h1 className="text-2xl md:text-3xl font-bold mb-6">Painel de Controlo</h1>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalRevenue.toFixed(2)} €</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Encomendas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalOrders}</div>
                    </CardContent>
                </Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Visão Geral Mensal</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <Overview data={monthlyData} />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}