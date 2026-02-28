import { ZodError } from 'zod';

export const errorHandler = (err, _req, res, _next) => {
    console.error('❌', err);

    if (err instanceof ZodError) {
        return res.status(400).json({
            message: 'Validation error',
            errors: err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
        });
    }

    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(status).json({ message, ...(err.cooldownLeft ? { cooldownLeft: err.cooldownLeft } : {}) });
};
