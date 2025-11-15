import mongoose from 'mongoose';

export const safeCollectionCount = async (collectionName, query = {}) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.warn(`DB not connected, returning 0 for ${collectionName}`);
      return 0;
    }
    const collections = await mongoose.connection.db.listCollections().toArray();
    if (!collections.some(c => c.name === collectionName)) {
      console.warn(`Collection ${collectionName} missing`);
      return 0;
    }
    const count = await mongoose.connection.db.collection(collectionName).countDocuments(query);
    return count;
  } catch (error) {
    console.error(`Count error ${collectionName}:`, error.stack || error.message);
    return 0;
  }
};

export const safeAggregate = async (collectionName, pipeline) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.warn(`DB not connected, returning empty for ${collectionName}`);
      return [];
    }
    const collections = await mongoose.connection.db.listCollections().toArray();
    if (!collections.some(c => c.name === collectionName)) {
      console.warn(`Collection ${collectionName} missing`);
      return [];
    }
    const result = await mongoose.connection.db.collection(collectionName).aggregate(pipeline).toArray();
    return result;
  } catch (error) {
    console.error(`Aggregate error ${collectionName}:`, JSON.stringify(pipeline, null, 2), error.stack || error.message);
    return [];
  }
};
