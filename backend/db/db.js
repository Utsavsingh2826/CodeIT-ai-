import mongoose from "mongoose";


async function connect() {
   await mongoose.connect(process.env.MONGO_URI)
        .then(() => {
            console.log("Connected to MongoDB");
        })
        .catch(err => {
            console.log(err);
        })
}

export default connect;