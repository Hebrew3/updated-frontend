import { Status } from '../constants.js';
/**
 * This module handles vaccine-related operations.
 * @module vaccineModule
 */
const vaccineModule = {
    /**
     * Atomically increments and retrieves the next sequence value for a given counter.
     * @function getNextSequence
     * @memberof module:vaccineModule
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
     * Creates a new task
     * @function createTask
     * @memberof module:vaccineModule
     * @param {object} dbHelper - The database helper object
     * @param {object} session - The user session object
     * @param {object} data - The vaccine data
     * @returns {Promise<object>} - A promise which resolves to an object containing the status and error message
     */
    createTask: async (dbHelper, session, data) => {
        const responseData = {
            status: Status.INTERNAL_SERVER_ERROR,
            error: 'Error on creating task'
        };
        try {
            const { taskName, quantity, date, time } = data;
            if (
                !isPresent(taskName) ||
                !isPresent(quantity) ||
                !isPresent(date) ||
                !isPresent(time)
            ) {
                responseData.status = Status.BAD_REQUEST;
                responseData.error = 'Missing required fields';
                return responseData;
            }

            if (!isValidTaskName(taskName)) {
                responseData.status = Status.BAD_REQUEST;
                responseData.error = 'Invalid task name';
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

            if (!isValidTime(time)) {
                responseData.status = Status.BAD_REQUEST;
                responseData.error = 'Invalid time';
                return responseData;
            }

            if(!session.userId) {
                responseData.status = Status.UNAUTHORIZED;
                responseData.error = 'Unauthorized';
                return responseData;
            }

            const hogId = await vaccineModule.getNextSequence(dbHelper, 'taskHogId'); 
            const task = await dbHelper.create('vaccine', {
                userId: session.userId,
                hogId: hogId,
                taskName,
                quantity,
                date,
                time,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            responseData.status = Status.OK;
            responseData.error = null;
            responseData.data = task._id.toString();
        } catch (error) {
            console.error('Error on creating task:', error);
        }
        return responseData;
    },

    /**
     * Get a task by ID
     * @function getTask
     * @memberof module:vaccineModule
     * @param {object} dbHelper - The database helper object
     * @param {string} taskId - The ID of the task to retrieve
     * @returns {Promise<object>} - A promise which resolves to an object containing the status, error message and task data
     */
    getTask: async (dbHelper, taskId) => {
        const responseData = {
            status: Status.INTERNAL_SERVER_ERROR,
            error: 'Error on getting task',
            data: null
        };
    
        try {
            if (!isPresent(taskId)) {
                responseData.status = Status.BAD_REQUEST;
                responseData.error = 'Task ID is required';
                return responseData;
            }

            const projection = {
                _id: 1,
                hogId: 1,
                taskName: 1,
                quantity: 1,
                date: 1,
                time: 1
            };
    

            const task = await dbHelper.findOne('vaccine', { _id: taskId }, projection);
    
            if (!task) {
                responseData.status = Status.NOT_FOUND;
                responseData.error = 'Task not found';
                return responseData;
            }
    
            const taskObject = {
                taskId: task._id.toString(),
                hogId: task.hogId,
                taskName: task.taskName,
                quantity: task.quantity,
                date: task.date,
                time: task.time
            };
    
            responseData.status = Status.OK;
            responseData.error = null;
            responseData.data = taskObject;
    
        } catch (error) {
            console.error('Error on getting task:', error);
        }
    
        return responseData;
    },

    /**
     * Gets all tasks
     * @function getTasks
     * @memberof module:vaccineModule
     * @param {object} dbHelper - The database helper object
     * @returns {Promise<object>} - A promise which resolves to an object containing the status, error message and task data
     */
    getTasks: async (dbHelper, session) => {
        const responseData = {
            status: Status.INTERNAL_SERVER_ERROR,
            error: 'Error on getting tasks'
        };
        
        try {
            const tasks = await dbHelper.find('vaccine', { userId: session.userId });
            const taskObjects = tasks.map(task => {
                const { _id, hogId, taskName, quantity, date, time } = task.toObject();
                return { taskId: _id.toString(), hogId, taskName, quantity, date, time };
            });

            responseData.status = Status.OK;
            responseData.error = null;
            responseData.data = taskObjects;
        } catch (error) {
            console.error('Error on getting tasks:', error);
        }
        return responseData;
    },

    /**
     * Updates a task
     * @function updateTask
     * @memberof module:vaccineModule
     * @param {object} dbHelper - The database helper object
     * @param {object} session - The user session object
     * @param {object} data - The task data
     * @returns {Promise<object>} - A promise which resolves to an object containing the status and error message
     */
    updateTask: async (dbHelper, session, data) => {
        const responseData = {
            status: Status.INTERNAL_SERVER_ERROR,
            error: 'Error on updating task'
        };
    
        try {
            const { taskId, taskName, quantity, date, time } = data;
    
            if (!isPresent(taskId)) {
                responseData.status = Status.BAD_REQUEST;
                responseData.error = 'Task ID is required';
                return responseData;
            }
    
            if (!session.userId) {
                responseData.status = Status.UNAUTHORIZED;
                responseData.error = 'Unauthorized';
                return responseData;
            }
    
            if (!taskName && !quantity && !date && !time) {
                responseData.status = Status.BAD_REQUEST;
                responseData.error = 'No fields provided to update';
                return responseData;
            }
    
            const fieldsToUpdate = {};
            if (taskName) fieldsToUpdate.taskName = taskName;
            if (quantity) fieldsToUpdate.quantity = quantity;
            if (date) fieldsToUpdate.date = date;
            if (time) fieldsToUpdate.time = time;
    
            const updatedTask = await dbHelper.findOneAndUpdate(
                'vaccine', 
                { _id: taskId, userId: session.userId }, 
                { $set: fieldsToUpdate }, 
                { new: true } 
            );
    
            if (!updatedTask) {
                responseData.status = Status.NOT_FOUND;
                responseData.error = 'Task not found';
                return responseData;
            }
    
            responseData.status = Status.OK;
            responseData.error = null;
        } catch (error) {
            console.error('Error on updating task:', error);
        }
    
        return responseData;
    },      

    /**
     * Deletes a task
     * @function deleteTask
     * @memberof module:vaccineModule
     * @param {object} dbHelper - The database helper object
     * @param {object} session - The user session object
     * @param {string} taskId - The ID of the task to delete
     * @returns {Promise<object>} - A promise which resolves to an object containing the status and error message
     */
    deleteTask: async (dbHelper, session, taskId) => {
        const responseData = {
            status: Status.INTERNAL_SERVER_ERROR,
            error: 'Error on deleting task'
        };
        try {
            if (!isPresent(taskId)) {
                responseData.status = Status.BAD_REQUEST;
                responseData.error = 'Task ID is required';
                return responseData;
            }
            if(!session.userId) {
                responseData.status = Status.UNAUTHORIZED;
                responseData.error = 'Unauthorized';
                return responseData;
            }

            const task = await dbHelper.findOne('vaccine', { _id: taskId, userId: session.userId });
            if (!task) {
                responseData.status = Status.NOT_FOUND;
                responseData.error = 'Task not found';
                return responseData;
            }

            await dbHelper.deleteOne('vaccine', { _id: taskId, userId: session.userId });


            responseData.status = Status.OK;
            responseData.error = null;
        } catch (error) {
            console.error('Error on deleting task:', error);
        }
        return responseData;
    }
};

export default vaccineModule;

function isValidTaskName(taskName) {
    const taskNameRegex = /^[a-zA-Z0-9\s]+$/;
    return taskNameRegex.test(taskName);
}

function isValidQuantity(quantity) {
    const quantityRegex = /^[0-9]+$/;
    return quantityRegex.test(quantity);
}

function isValidDate(date) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    return dateRegex.test(date);
}

function isValidTime(time) {
    const timeRegex = /^\d{2}:\d{2}$/;
    return timeRegex.test(time);
}

function isPresent(value) {
    return value !== null && value !== undefined && value.trim().length > 0;
}
