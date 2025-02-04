import { Hono } from 'hono';
import { sign, verify } from 'hono/jwt';
import { userRouter } from './routes/user.routes';
import { blogRouter } from './routes/blog.routes';


const app = new Hono<{
    Bindings: {
        DATABASE_URL: string;
        JWT_SECRET: string;
    };
}>();


app.route('/api/v1/user', userRouter)
app.route('/api/v1/blog', blogRouter)


// Middleware
app.use('/api/v1/blog/*', async (c, next) => {
    const header = c.req.header('Authorization') || '';
    const token = header.split('')[1];
    const response = await verify(token, c.env.JWT_SECRET);
    if (!response.userId) {
        return c.json(
            {
                message: 'Unauthorized',
            },
            403,
        );
    }
    next();
});





export default app;
