import { Status } from '../constants.js';
/**
 * This module handles calendar-related operations.
 * @module calendarModule
 */
const calendarModule = {
    /**
     * Creates a new schedule
     * @function createSchedule
     * @memberof module:calendarModule
     * @param {object} dbHelper - The database helper object
     * @param {object} session - The user session object
     * @param {object} data - The schedule data
     * @returns {Promise<object>} - A promise which resolves to an object containing the status and error message
     */
    createSchedule: async (dbHelper, session, data) => {
        const responseData = {
            status: Status.INTERNAL_SERVER_ERROR,
            error: 'Error on creating schedule'
        };
        try {
            const { title, description, startDate, endDate, startTime, endTime } = data;
            if (
                !isPresent(title) ||
                !isPresent(description) ||
                !isPresent(startDate) || 
                !isPresent(endDate)
            ) {
                responseData.status = Status.BAD_REQUEST;
                responseData.error = 'Missing required fields';
                return responseData;
            }

            if(!isValidTitle(title)) {
                responseData.status = Status.BAD_REQUEST;
                responseData.error = 'Invalid title';
                return responseData;
            }

            if(!isValidDescription(description)) {
                responseData.status = Status.BAD_REQUEST;
                responseData.error = 'Invalid description';
                return responseData;
            }

            if(!isValidDate(startDate)) {
                responseData.status = Status.BAD_REQUEST;
                responseData.error = 'Invalid start date';
                return responseData;
            }

            if(!isValidDate(endDate)) {
                responseData.status = Status.BAD_REQUEST;
                responseData.error = 'Invalid end date';
                return responseData;
            }

            if(!isValidTime(startTime)) {
                responseData.status = Status.BAD_REQUEST;
                responseData.error = 'Invalid start time';
                return responseData;
            }

            if(!isValidTime(endTime)) {
                responseData.status = Status.BAD_REQUEST;
                responseData.error = 'Invalid end time';
                return responseData;
            }

            const startDateTime = new Date(`${startDate}T${startTime}`);
            const endDateTime = new Date(`${endDate}T${endTime}`);

            if (endDateTime < startDateTime) {
                responseData.status = Status.BAD_REQUEST;
                responseData.error = 'End Date and Time cannot be earlier than Start Date and Time.';
                return responseData;
            }

            if(!session.userId) {
                responseData.status = Status.UNAUTHORIZED;
                responseData.error = 'Unauthorized';
                return responseData;
            }

            const schedule = await dbHelper.create('schedule', {
                userId: session.userId,
                title,
                description,
                startDate,
                endDate,
                startTime,
                endTime,
                createdAt: new Date().toISOString(),
                updatedAt: null
            });

            responseData.status = Status.OK;
            responseData.error = null;
            responseData.data = {
                scheduleId: schedule._id.toString(),
                title,
                description,
                startDate,
                endDate,
                startTime,
                endTime
            };
        } catch (error) {
            console.error('Error on creating schedule:', error);
        }
        return responseData;
    },
    
    /**
     * Get all schedules
     * @function getSchedules
     * @memberof module:scheduleModule
     * @param {object} dbHelper - The database helper object
     * @returns {Promise<object>} - A promise which resolves to an object containing the status, error message and schedule data
     */
    getSchedules: async (dbHelper, session) => {
        const responseData = {
            status: Status.INTERNAL_SERVER_ERROR,
            error: 'Error on getting schedules'
        };
        
        try {
            if (!session.userId) {
                responseData.status = Status.UNAUTHORIZED;
                responseData.error = 'Unauthorized';
                return responseData;
            }

            const schedules = await dbHelper.find('schedule', { userId: session.userId });
            const scheduleObjects = schedules.map(schedule => {
                const { _id, title, description, startDate, endDate, startTime, endTime } = schedule.toObject();
                return { 
                    scheduleId: _id.toString(), 
                    title, 
                    description, 
                    startDate, 
                    endDate, 
                    startTime, 
                    endTime 
                };
            });

            responseData.status = Status.OK;
            responseData.error = null;
            responseData.data = scheduleObjects;
        } catch (error) {
            console.error('Error on getting schedules:', error);
        }
        return responseData;
    }
};

export default calendarModule;

function isValidTitle(title) {
    const titleRegex = /^[A-Za-z0-9\s]+$/;
    return titleRegex.test(title);
}

function isValidDescription(description) {
    const descriptionRegex = /^[A-Za-z0-9\s]+$/;
    return descriptionRegex.test(description);
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
