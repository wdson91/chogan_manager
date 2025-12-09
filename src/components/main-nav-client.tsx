"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Menu, LayoutDashboard, Users, Package, ShoppingCart, Settings, UserCircle, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { useState } from "react"
import { UserMenu } from "./user-menu"
import type { User } from "@supabase/supabase-js"

const navItems = [
    { href: "/dashboard", label: "Painel", icon: LayoutDashboard },
    { href: "/customers", label: "Clientes", icon: Users },
    { href: "/products", label: "Produtos", icon: Package },
    { href: "/orders", label: "Encomendas", icon: ShoppingCart },
    { href: "/supplier-orders", label: "Pedidos", icon: Truck },
    { href: "/settings/data-import", label: "Definições", icon: Settings },
]

interface MainNavClientProps {
    user: User | null
}

export function MainNavClient({ user }: MainNavClientProps) {
    const pathname = usePathname()
    const [open, setOpen] = useState(false)

    if (pathname === "/login") return null

    return (
        <div className="border-b">
            <div className="flex h-16 items-center px-4 md:px-6 container mx-auto">
                <Link href="/dashboard" className="font-bold text-lg md:text-xl mr-4 md:mr-8">
                    Chogan Manager
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center space-x-4 lg:space-x-6 mx-6">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "text-sm font-medium transition-colors hover:text-primary",
                                pathname.startsWith(item.href)
                                    ? "text-black dark:text-white"
                                    : "text-muted-foreground"
                            )}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>

                {/* User Menu - Desktop */}
                {user && (
                    <div className="ml-auto hidden md:block">
                        <UserMenu user={{ email: user.email!, name: user.user_metadata?.name }} />
                    </div>
                )}

                {/* Mobile Hamburger Menu */}
                <div className="ml-auto md:hidden">
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Alternar menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right">
                            <SheetHeader>
                                <SheetTitle>Menu</SheetTitle>
                            </SheetHeader>
                            <nav className="flex flex-col space-y-4 mt-6">
                                {navItems
                                    .filter(item => item.label !== "Definições")
                                    .map((item) => (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setOpen(false)}
                                            className={cn(
                                                "flex items-center text-base font-medium transition-colors hover:text-primary px-2 py-2 rounded-md",
                                                pathname.startsWith(item.href)
                                                    ? "bg-accent text-accent-foreground"
                                                    : "text-muted-foreground"
                                            )}
                                        >
                                            <item.icon className="mr-2 h-5 w-5" />
                                            {item.label}
                                        </Link>
                                    ))}

                                {/* Profile link in mobile menu */}
                                {user && (
                                    <Link
                                        href="/profile"
                                        onClick={() => setOpen(false)}
                                        className={cn(
                                            "flex items-center text-base font-medium transition-colors hover:text-primary px-2 py-2 rounded-md",
                                            pathname.startsWith("/profile")
                                                ? "bg-accent text-accent-foreground"
                                                : "text-muted-foreground"
                                        )}
                                    >
                                        <UserCircle className="mr-2 h-5 w-5" />
                                        Perfil
                                    </Link>
                                )}

                                <Link
                                    href="/settings/data-import"
                                    onClick={() => setOpen(false)}
                                    className={cn(
                                        "flex items-center text-base font-medium transition-colors hover:text-primary px-2 py-2 rounded-md",
                                        pathname.startsWith("/settings/data-import")
                                            ? "bg-accent text-accent-foreground"
                                            : "text-muted-foreground"
                                    )}
                                >
                                    <Settings className="mr-2 h-5 w-5" />
                                    Definições
                                </Link>
                            </nav>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </div>
    )
}

