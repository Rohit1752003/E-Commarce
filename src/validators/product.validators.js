import {z} from 'zod'
import { isBackEdge } from 'zod/v4/core';

const createProductSchema = z.object({
    name: z.string().min(3),
    description: z.string().min(10),
    price: z.coerce.number().nonnegative(),
    stock: z.coerce.number().int().nonnegative(),
    category: z.string(),
});
const updateProductSchema = z.object({
     name: z.string().min(3).optional().optional(),
    price: z.coerce.number().nonnegative().optional(),
    stock: z.coerce.number().int().nonnegative().optional(),
    category: z.string().optional(),
    isActive : z.boolean().optional()
})
const productQuerySchema = z.object({
 search: z.string().optional(),

  page: z.coerce.number().int().positive().default(1),

  limit: z.coerce.number().int().positive().default(10),

  sort: z.string().optional(),
})
export {createProductSchema , updateProductSchema , productQuerySchema}
