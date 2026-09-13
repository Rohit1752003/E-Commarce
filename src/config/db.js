import mongoose from 'mongoose';
const connectDB = async () => {
  try {
    // console.log(process.env.MONGODB_URI);

    await mongoose.connect(`${process.env.MONGODB_URI}/${process.env.DB_NAME}`);

    console.log('MongoDB Connected Successfully ✅');
    console.log('Connected DB:', mongoose.connection.name);
  } catch (error) {
    console.error('MongoDB Connection Failed ❌');
    console.error(error.message);
  }
};
export default connectDB;
