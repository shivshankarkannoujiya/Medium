import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono } from "hono";
import { sign } from "hono/jwt";


export const userRouter = new Hono<{
    Bindings: {
        DATABASE_URL: string;
        JWT_SECRET: string;
    }
}>();





// signup
userRouter.post('/signup', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env?.DATABASE_URL,
    }).$extends(withAccelerate());

    const body = await c.req.json();

    try {
        const user = await prisma.user.create({
            data: {
                name: body.name,
                email: body.email,
                password: body.password,
            },
        });

        //TODO: Generate token
        const token = await sign(
            {
                userId: user.id,
            },
            c.env?.JWT_SECRET,
        );

        return c.json(
            {
                message: 'User created successfully',
                userId: user.id,
                token: token,
            },
            201,
        );
    } catch (error) {
        console.error('Error while creating User', error);

        let errorMessage = `Something went wrong while creating User`;
        if (error instanceof Error) {
            errorMessage = error.message;
        }

        return c.json(
            {
                message: errorMessage,
            },
            500,
        );
    }
});



// signin
userRouter.post('/signin', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const body = await c.req.json();

    try {
        const user = await prisma.user.findUnique({
            where: {
                email: body.email,
                password: body.password,
            },
        });

        if (!user) {
            return c.json(
                {
                    message: 'User with email does not exist',
                },
                403,
            );
        }

        const token = await sign(
            {
                userId: user.id,
            },
            c.env.JWT_SECRET,
        );

        return c.json({
            message: 'User logged in successfully',
            token: token,
        });
    } catch (error) {
        console.log('Error while logged in User', error);
        return c.json({
            message: 'Something went wrong while logIn User',
        });
    }
});