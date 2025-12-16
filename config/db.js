const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;
    const dbName = "cleanguard";
    const [baseUri, queryString] = mongoURI.split('?');
    const queryParams = queryString ? `?${queryString}` : '';
    const lastSlashIndex = baseUri.lastIndexOf('/');
    const afterSlash = baseUri.substring(lastSlashIndex + 1);
    let connectionString;
    if (lastSlashIndex === -1 || afterSlash === '' || afterSlash.includes('@') || afterSlash.includes(':')) {
      connectionString = `${baseUri}/${dbName}${queryParams}`;
    } else {
      connectionString = mongoURI;
    }
    
    const conn = await mongoose.connect(connectionString);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
