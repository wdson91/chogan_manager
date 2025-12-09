import { getUser } from "@/lib/supabase/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LogOut, Mail, User as UserIcon, Calendar } from "lucide-react"
import { logout } from "@/actions/auth"

export default async function ProfilePage() {
    const user = await getUser()

    if (!user) {
        redirect("/login")
    }

    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
            _count: {
                select: {
                    customers: true,
                    products: true,
                    orders: true,
                }
            }
        }
    })

    if (!dbUser) {
        return (
            <div className="container mx-auto py-10 px-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Erro</CardTitle>
                        <CardDescription>
                            Utilizador não encontrado na base de dados.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-6 md:py-10 px-4 md:px-6 max-w-2xl">
            <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold">Perfil</h1>
                <p className="text-muted-foreground">Gerir informações da conta</p>
            </div>

            <div className="space-y-6">
                {/* User Info Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Informações da Conta</CardTitle>
                        <CardDescription>
                            Detalhes do seu perfil
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                            <UserIcon className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium">Nome</p>
                                <p className="text-sm text-muted-foreground">
                                    {dbUser.name || "Não definido"}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Mail className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium">Email</p>
                                <p className="text-sm text-muted-foreground">
                                    {dbUser.email}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium">Membro desde</p>
                                <p className="text-sm text-muted-foreground">
                                    {new Date(dbUser.createdAt).toLocaleDateString('pt-PT', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Estatísticas</CardTitle>
                        <CardDescription>
                            Resumo da sua atividade
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold">{dbUser._count.customers}</p>
                                <p className="text-sm text-muted-foreground">Clientes</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold">{dbUser._count.products}</p>
                                <p className="text-sm text-muted-foreground">Produtos</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold">{dbUser._count.orders}</p>
                                <p className="text-sm text-muted-foreground">Encomendas</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Logout Button */}
                <Card>
                    <CardHeader>
                        <CardTitle>Sessão</CardTitle>
                        <CardDescription>
                            Gerir a sua sessão
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form action={logout}>
                            <Button
                                type="submit"
                                variant="destructive"
                                className="w-full"
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                Terminar Sessão
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
