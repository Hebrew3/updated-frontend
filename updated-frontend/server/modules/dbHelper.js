import mongoose from 'mongoose';
import { productStatus } from '../constants.js';
/**
 * This module handles database-related operations.
 * @module dbHelper
 */
const dbHelper = {
    /**
     * Connects to the MongoDB instance
     * @function connect
     * @memberof module:dbHelper
     * @param {string} connectionString - The MongoDB connection string
     * @returns {Promise<void>} - A promise which resolves when the connection is established
     */
    connect: async (connectionString) => {
        try {
            const UserSchema = new mongoose.Schema({
                email: { type: String, required: true, unique: true },
                password: { type: String, required: true },
                createdAt: { type: String, required: true },
                updatedAt: { type: String, required: false },
                lastLoggedIn: { type: String, required: false }
            });

            const FeedSchema = new mongoose.Schema({
                hogId: { type: Number, required: true }, 
                userId: { type: String, required: true },
                taskName: { type: String, required: true },
                quantity: { type: Number, required: true },
                date: { type: String, required: true },
                time: { type: String, required: true },
                createdAt: { type: String, required: true },
                updatedAt: { type: String, required: false }
            });

            const VaccineSchema = new mongoose.Schema({
                hogId: { type: Number, required: true }, 
                userId: { type: String, required: true },
                taskName: { type: String, required: true },
                quantity: { type: Number, required: true },
                date: { type: String, required: true },
                time: { type: String, required: true },
                createdAt: { type: String, required: true },
                updatedAt: { type: String, required: false }
            });

            const CalendarSchema = new mongoose.Schema({
                userId: { type: String, required: true },
                title: { type: String, required: true },
                description: { type: String, required: false },
                startDate: { type: String, required: true },
                endDate: { type: String, required: false },
                startTime: { type: String, required: false },
                endTime: { type: String, required: false },
                createdAt: { type: String, required: true },
                updatedAt: { type: String, required: false }
            });

            const ToolSchema = new mongoose.Schema({
                userId: { type: String, required: true },
                date: { type: String, required: true },
                productId: { type: Number, required: true, unique: true },
                stockName: { type: String, required: true },
                quantity: { type: Number, required: true },
                expiration: { type: String, required: true },
                status: { type: String, required: true, enum: Object.values(productStatus)},
                createdAt: { type: String, required: true },
                updatedAt: { type: String, required: false }
            });

            const CounterSchema = new mongoose.Schema({
                _id: { type: String, required: true },
                sequence_value: { type: Number, default: 0 }
            });

            mongoose.model('user', UserSchema);
            mongoose.model('feed', FeedSchema);
            mongoose.model('vaccine', VaccineSchema);
            mongoose.model('schedule', CalendarSchema);
            mongoose.model('tool', ToolSchema);
            mongoose.model('counter', CounterSchema); 

            await mongoose.connect(connectionString);
            console.log('Connected to MongoDB: ' + connectionString);
        } catch (error) {
            console.error('Error connecting to MongoDB:', error);
        }
    },
    /**
     * Creates a new document in a given collection
     * @function create
     * @memberof module:dbHelper
     * @param {string} collectionName - The name of the collection to create the document in
     * @param {object} document - The document to create
     * @returns {Promise<Document>} - A promise which resolves to the created document
     */
    create: async (collectionName, document) => {
        return await mongoose.model(collectionName).create(document);
    },
    /**
     * Finds all documents in a given collection that match the query
     * @function find
     * @memberof module:dbHelper
     * @param {string} collectionName - The name of the collection to find the documents in
     * @param {object} query - The query to match the documents against
     * @returns {Promise<Document[]>} - A promise which resolves to an array of the matching documents
     */
    find: async (collectionName, query) => {
        return await mongoose.model(collectionName).find(query);
    },
    /**
     * Finds the first document that matches the query in a given collection
     * @function findOne
     * @memberof module:dbHelper
     * @param {string} collectionName - The name of the collection to find the document in
     * @param {object} query - The query to match the document against
     * @returns {Promise<Document | null>} - A promise which resolves to the first matching document, or null if no document matches
     */
    findOne: async (collectionName, query) => {
        return await mongoose.model(collectionName).findOne(query);
    },
    /**
     * Finds a single document and updates it atomically.
     * @function findOneAndUpdate
     * @memberof module:dbHelper
     * @param {string} collectionName - The name of the collection.
     * @param {object} query - The query to find the document.
     * @param {object} update - The update operations.
     * @param {object} options - The options for the operation.
     * @returns {Promise<Document | null>} - The updated document.
     */
    findOneAndUpdate: async (collectionName, query, update, options) => {
        return await mongoose.model(collectionName).findOneAndUpdate(query, update, options);
    },
    /**
     * Updates the first document that matches the query in a given collection
     * @function updateOne
     * @memberof module:dbHelper
     * @param {string} collectionName - The name of the collection to update the document in
     * @param {object} query - The query to match the document against
     * @param {object} update - The update object to apply to the matched document
     * @returns {Promise<Document | null>} - A promise which resolves to the updated document, or null if no document matches
     */
    updateOne: async (collectionName, query, update) => {
        return await mongoose.model(collectionName).updateOne(query, update);
    },

    /**
     * Deletes the first document that matches the query in a given collection
     * @function deleteOne
     * @memberof module:dbHelper
     * @param {string} collectionName - The name of the collection to delete the document from
     * @param {object} query - The query to match the document against
     * @returns {Promise<Document | null>} - A promise which resolves to the deleted document, or null if no document matches
     */
    deleteOne: async (collectionName, query) => {
        return await mongoose.model(collectionName).deleteOne(query);
    },
    
    /**
     * Returns the current version of the application.
     * @function getVersion
     * @memberof module:dbHelper
     * @return {string} The version number in the format 'vX.X.X'.
     */
    getVersion: () => {
        const version = 'v0.1.0';
        return version;
    }
};

export default dbHelper;
