import {z} from 'zod'
const cartSchema = z.object({
    productId: z.string(),
    quantity: z.coerce.number().int().positive()
});
export default cartSchema