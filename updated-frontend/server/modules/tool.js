import { Status, productStatus } from '../constants.js';
/**
 * This module handles tool-related operations.
 * @module toolModule
 */
const toolModule = {
    /**
     * Atomically increments and retrieves the next sequence value for a given counter.
     * @function getNextSequence
     * @memberof module:toolModule
     * @param {object} dbHelper - The database helper object
     * @param {string} name - The name of the counter
     * @returns {Promise<number>} - The next sequence value
     */
    getNextSequence: async (dbHelper, name) => {
        const counter = await dbHelper.findOneAndUpdate(
            'counter',
            { _id: name },
            { $inc: { sequence_value: 1 } },
            { new: true, upsert: true } 
        );
        return counter.sequence_value;
    },

    /**
     * Creates a new stock
     * @function createStock
     * @memberof module:toolModule
     * @param {object} dbHelper - The database helper object
     * @param {object} session - The user session object
     * @param {object} data - The stock data
     * @returns {Promise<object>} - A promise which resolves to an object containing the status and error message
     */
    createStock: async (dbHelper, session, data) => {
        const responseData = {
            status: Status.INTERNAL_SERVER_ERROR,
            error: 'Error on creating stock'
        };
        try {
            const { stockName, quantity, date, expiration, status } = data;

            if (
                !isPresent(stockName) ||
                !isPresent(quantity) ||
                !isPresent(date) ||
                !isPresent(expiration) ||
                !isPresent(status)
            ) {
                responseData.status = Status.BAD_REQUEST;
                responseData.error = 'Missing required fields';
                return responseData;
            }

            if (!isValidStockName(stockName)) {
                responseData.status = Status.BAD_REQUEST;
                responseData.error = 'Invalid stock name';
                return responseData;
            }

            if (!isValidQuantity(quantity)) {
                responseData.status = Status.BAD_REQUEST;
                responseData.error = 'Invalid quantity';
                return responseData;
            }

            if (!isValidDate(date)) {
                responseData.status = Status.BAD_REQUEST;
                responseData.error = 'Invalid date'; 
                return responseData;
            }

            if (!isValidDate(expiration)) {
                responseData.status = Status.BAD_REQUEST;
                responseData.error = 'Invalid expiration';
                return responseData;
            }

            if (!isValidStatus(status)) {
                responseData.status = Status.BAD_REQUEST;
                responseData.error = 'Invalid status';
                return responseData;
            }

            if(!session.userId) {
                responseData.status = Status.UNAUTHORIZED;
                responseData.error = 'Unauthorized';
                return responseData;
            }

            const productId = await toolModule.getNextSequence(dbHelper, 'productId'); 
            const stock = await dbHelper.create('tool', {
                userId: session.userId,
                productId: productId,
                stockName,
                quantity,
                date,
                expiration,
                status,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            responseData.status = Status.OK;
            responseData.error = null;
            responseData.data = stock._id.toString();
        } catch (error) {
            console.error('Error on creating stock:', error);
        }
        return responseData;
    },

    /**
     * Get a stock by ID
     * @function getStock
     * @memberof module:toolModule
     * @param {object} dbHelper - The database helper object
     * @param {string} stockId - The ID of the stock to retrieve
     * @returns {Promise<object>} - A promise which resolves to an object containing the status, error message and stock data
     */
    getStock: async (dbHelper, stockId) => {
        const responseData = {
            status: Status.INTERNAL_SERVER_ERROR,
            error: 'Error on getting stock',
            data: null
        };
    
        try {
            if (!isPresent(stockId)) {
                responseData.status = Status.BAD_REQUEST;
                responseData.error = 'Stock ID is required';
                return responseData;
            }

            const projection = {
                _id: 1,
                productId : 1,
                stockName: 1,
                quantity: 1,
                date: 1,
                expiration: 1,
                status: 1
            };
    

            const stock = await dbHelper.findOne('tool', { _id: stockId }, projection);
    
            if (!stock) {
                responseData.status = Status.NOT_FOUND;
                responseData.error = 'Stock not found';
                return responseData;
            }
    
            const stockObject = {
                stockId: stock._id.toString(),
                productId: stock.productId,
                stockName: stock.stockName,
                quantity: stock.quantity,
                date: stock.date,
                expiration: stock.expiration,
                status: stock.status
            };
    
            responseData.status = Status.OK;
            responseData.error = null;
            responseData.data = stockObject;
    
        } catch (error) {
            console.error('Error on getting stock:', error);
        }
    
        return responseData;
    },

    /**
     * Gets all stocks
     * @function getStocks
     * @memberof module:toolModule
     * @param {object} dbHelper - The database helper object
     * @returns {Promise<object>} - A promise which resolves to an object containing the status, error message and stock data
     */
    getStocks: async (dbHelper, session) => {
        const responseData = {
            status: Status.INTERNAL_SERVER_ERROR,
            error: 'Error on getting stocks'
        };
        
        try {
            const stocks = await dbHelper.find('tool', { userId: session.userId });
            const stockObjects = stocks.map(stock => {
                const { _id, productId, stockName, quantity, date, expiration, status } = stock.toObject();
                return { stockId: _id.toString(), productId, stockName, quantity, date, expiration, status };
            });

            responseData.status = Status.OK;
            responseData.error = null;
            responseData.data = stockObjects;
        } catch (error) {
            console.error('Error on getting stocks:', error);
        }
        return responseData;
    },

    /**
     * Updates a stock
     * @function updateStock
     * @memberof module:toolModule
     * @param {object} dbHelper - The database helper object
     * @param {object} session - The user session object
     * @param {object} data - The stock data
     * @returns {Promise<object>} - A promise which resolves to an object containing the status and error message
     */
    updateStock: async (dbHelper, session, data) => {
        const responseData = {
            status: Status.INTERNAL_SERVER_ERROR,
            error: 'Error on updating stock'
        };
    
        try {
            const { stockId, stockName, quantity, date, expiration, status } = data;
    
            if (!isPresent(stockId)) {
                responseData.status = Status.BAD_REQUEST;
                responseData.error = 'Stock ID is required';
                return responseData;
            }
    
            if (!session.userId) {
                responseData.status = Status.UNAUTHORIZED;
                responseData.error = 'Unauthorized';
                return responseData;
            }
    
            if (!stockName && !quantity && !date && !expiration && !status) {
                responseData.status = Status.BAD_REQUEST;
                responseData.error = 'No fields provided to update';
                return responseData;
            }
    
            const fieldsToUpdate = {};
            if (stockName) fieldsToUpdate.stockName = stockName;
            if (quantity) fieldsToUpdate.quantity = quantity;
            if (date) fieldsToUpdate.date = date;
            if (expiration) fieldsToUpdate.expiration = expiration;
            if (status) fieldsToUpdate.status = status;
    
            const updatedStock = await dbHelper.findOneAndUpdate(
                'tool', 
                { _id: stockId, userId: session.userId }, 
                { $set: fieldsToUpdate }, 
                { new: true } 
            );
    
            if (!updatedStock) {
                responseData.status = Status.NOT_FOUND;
                responseData.error = 'Stock not found';
                return responseData;
            }
    
            responseData.status = Status.OK;
            responseData.error = null;
        } catch (error) {
            console.error('Error on updating stock:', error);
        }
    
        return responseData;
    },      

    /**
     * Deletes a stock
     * @function deleteStock
     * @memberof module:toolModule
     * @param {object} dbHelper - The database helper object
     * @param {object} session - The user session object
     * @param {string} stockId - The ID of the stock to delete
     * @returns {Promise<object>} - A promise which resolves to an object containing the status and error message
     */
    deleteStock: async (dbHelper, session, stockId) => {
        const responseData = {
            status: Status.INTERNAL_SERVER_ERROR,
            error: 'Error on deleting stock'
        };
        try {
            if (!isPresent(stockId)) {
                responseData.status = Status.BAD_REQUEST;
                responseData.error = 'Stock ID is required';
                return responseData;
            }
            if(!session.userId) {
                responseData.status = Status.UNAUTHORIZED;
                responseData.error = 'Unauthorized';
                return responseData;
            }

            const stock = await dbHelper.findOne('tool', { _id: stockId, userId: session.userId });
            if (!stock) {
                responseData.status = Status.NOT_FOUND;
                responseData.error = 'Stock not found';
                return responseData;
            }

            await dbHelper.deleteOne('tool', { _id: stockId, userId: session.userId });


            responseData.status = Status.OK;
            responseData.error = null;
        } catch (error) {
            console.error('Error on deleting stock:', error);
        }
        return responseData;
    }
};

export default toolModule;

function isValidStockName(stockName) {
    return /^[a-zA-Z0-9 ]+$/.test(stockName);
}

function isValidQuantity(quantity) {
    return /^[0-9]+$/.test(quantity);
}

function isValidDate(date) {
    return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

function isValidStatus(status) {
    const trimmedStatus = status.trim();
    return Object.values(productStatus).includes(trimmedStatus);
}


function isPresent(value) {
    if (typeof value === 'string') {
        return value.trim().length > 0;
    } else if (typeof value === 'number') {
        return true; 
    } else {
        return value !== null && value !== undefined;
    }
}

