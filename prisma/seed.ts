import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Starting seeding...')

    // 1. Create a Test User
    // Use a fixed UUID for the seed user to maintain consistency
    const SEED_USER_ID = '00000000-0000-0000-0000-000000000001'

    const user = await prisma.user.upsert({
        where: { email: 'test@example.com' },
        update: {},
        create: {
            id: SEED_USER_ID,
            email: 'test@example.com',
            name: 'Test Reseller',
        },
    })

    console.log({ user })

    // 2. Create Customers
    const customer1 = await prisma.customer.create({
        data: {
            userId: user.id,
            name: 'Maria Silva',
            phone: '912345678',
            email: 'maria@client.com',
            address: 'Rua Principal, 123, Lisboa',
            notes: 'Cliente VIP',
        },
    })

    await prisma.customer.create({
        data: {
            userId: user.id,
            name: 'João Santos',
            phone: '965432109',
            address: 'Avenida Central, 45, Porto',
        },
    })

    // 3. Create Products with new fields
    const product1 = await prisma.product.create({
        data: {
            userId: user.id,
            code: 'CH001',
            name: 'Perfume Chogan 100ml',
            category: 'Perfumes',
            range: 'Luxo',
            equivalence: 'Sauvage',
            costPrice: 15.00,
            sellPrice: 30.00,
            stockQuantity: 10,
            notes: 'Marca: Dior | Tamanho: 100ml',
        },
    })

    const product2 = await prisma.product.create({
        data: {
            userId: user.id,
            code: 'CH002',
            name: 'Creme de Corpo',
            category: 'Cosméticos',
            range: 'Standard',
            costPrice: 8.50,
            sellPrice: 15.00,
            stockQuantity: 5,
        },
    })

    // 4. Create Order
    const order = await prisma.order.create({
        data: {
            userId: user.id,
            customerId: customer1.id,
            status: 'PENDING',
            totalAmount: 45.00,
            totalProfit: 21.50,
            orderDate: new Date(),
            items: {
                create: [
                    {
                        productId: product1.id,
                        quantity: 1,
                        unitPrice: 30.00,
                        subtotal: 30.00,
                    },
                    {
                        productId: product2.id,
                        quantity: 1,
                        unitPrice: 15.00,
                        subtotal: 15.00,
                    },
                ],
            },
        },
    })

    console.log({ order })
    console.log('Seeding finished.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
