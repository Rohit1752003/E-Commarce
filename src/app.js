import express from 'express';
import cors from 'cors'
import cookieParser from 'cookie-parser';
import auth from './routes/auth.route.js'
import errorHandler from './middleware/errorHandler.js';
import rateLimit from 'express-rate-limit';
import category from './routes/category.route.js'
import product from './routes/product.route.js';
import cart from './routes/cart.route.js';
const app = express();
app.use(express.json())
app.use(cors({
    origin : 'http://localhost:5173'
}));
app.use(rateLimit({
  max : 60 * 1000 * 15,
  limit : 15
}))
app.use(cookieParser())

app.get('/', (req, res) => {
  res.send('Hello World!');
} );
app.use('/api/auth',auth)
app.use('/api/categories' , category)
app.use('/api/products' , product)
app.use('/api/cart' , cart)
app.use(errorHandler)
export default app;