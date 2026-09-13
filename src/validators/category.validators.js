import {boolean, z} from 'zod'
const createCategorySchema = z.object({
    name : z.string().min(3),
    isActive : z.boolean().optional(),
})

 const categoryQuery = z.object({
  search: z.string().optional(),

  page: z.coerce.number().int().positive().default(1),

  limit: z.coerce.number().int().positive().default(10),

  sort: z.string().optional(),
});
const updateCategorySchmea = z.object({
    name : z.string().min(3).optional(),
    isActive : z.boolean().optional()
})
export {createCategorySchema , categoryQuery , updateCategorySchmea}