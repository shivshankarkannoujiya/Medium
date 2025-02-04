import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';
import { verify } from 'hono/jwt';


export const blogRouter = new Hono<{
    Bindings: {
        DATABASE_URL: string;
        JWT_SECRET: string;
    },
    Variables: {
        userId: string
    }
}>();

blogRouter.use('/*', async (c, next) => {
    const authHeader = c.req.header('Authorization') || ""
    const user = await verify(authHeader, c.env.JWT_SECRET);

    if (!user) {
        return c.json({
            message: 'You are not loggedIn'
        }, 403)
    }

    c.set('userId', user.userId as string);
    await next();
})

blogRouter.post('/', async (c) => {
    const body = await c.req.json();
    const authorId = c.get('userId')
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    try {
        const blog = await prisma.post.create({
            data: {
                title: body.title,
                content: body.content,
                authorId: authorId, //TODO: pass from middleware
            },
        });

        return c.json(
            {
                message: 'Blog created successfully',
                blogId: blog.id,
            },
            201,
        );
    } catch (error) {
        console.error('Error while creating blog post', error);
        return c.json(
            {
                message: 'Something went wrong while creating blogpost',
            },
            500,
        );
    }
});


blogRouter.put('/', async (c) => {
    const body = await c.req.json();
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    try {
        const updatedBlog = await prisma.post.update({
            where: {
                id: body.id,
            },
            data: {
                title: body.title,
                content: body.content,
            },
        });

        return c.json(
            {
                message: 'Blog updated successfully',
                blog: updatedBlog,
            },
            200,
        );
    } catch (error) {
        console.error('Error while updating the blog', error);
        return c.json(
            {
                message: 'Something went wrong while updating Blog Post',
            },
            500,
        );
    }
});


blogRouter.get('/', async (c) => {
    const body = await c.req.json();
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    try {
        const blog = await prisma.post.findFirst({
            where: {
                id: body.id,
            },
        });

        return c.json(
            {
                blog,
            },
            200,
        );
    } catch (error) {
        console.error('Error while fetching blog post', error);
        return c.json(
            {
                message: 'Something went wrong while fetching blog post',
            },
            500,
        );
    }
});


// TODO: Add Pagination
blogRouter.get('/bulk', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    try {
        const blogs = await prisma.post.findMany();
        return c.json({
            blogs,
        });
    } catch (error) {
        console.error('Error while fetching the blogs posts', error);
        return c.json(
            {
                message: 'Something went wrong while fetching blog posts',
            },
            500,
        );
    }
});
