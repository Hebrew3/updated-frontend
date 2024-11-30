import bcrypt from 'bcryptjs';

import { Status } from '../constants.js';

/**
 * This module handles user-related operations.
 * @module userModule
 */
const userModule = {
    /**
     * Registers a new user
     * @function register
     * @memberof module:userModule
     * @param {object} dbHelper - The database helper object
     * @param {object} data - The registration data
     * @returns {Promise<object>} - A promise which resolves to an object containing the status and error message
     */
    register: async (dbHelper, session, data) => {
        const responseData = {
            status: Status.INTERNAL_SERVER_ERROR,
            error: 'Error on registering user'
        };
        try {
            const { email, password} = data;
            if (
                !isPresent(email) ||
                !isPresent(password) 

            ) {
                responseData.status = Status.BAD_REQUEST;
                responseData.error = 'Missing required fields';
                return responseData;
            }
            if (!isValidEmail(email)) {
                responseData.status = Status.BAD_REQUEST;
                responseData.error = 'Invalid email address';
                return responseData;
            }
            if (!isValidPassword(password)) {
                responseData.status = Status.BAD_REQUEST;
                responseData.error = 'Invalid password';
                return responseData;
            }

            const emailExists = await dbHelper.findOne('user', { email });
            if (emailExists) {
                responseData.status = Status.BAD_REQUEST;
                responseData.error = 'Email already exists';
                return responseData;
            } 

            try {
                const userCreated = await dbHelper.create('user', { 
                    email, 
                    password: await hashPassword(password), 
                    createdAt: new Date().valueOf(),
                    lastLoggedIn: null,
                });

                session.userId = userCreated._id.toString();
                session.email = email;

                responseData.status = Status.OK;
                responseData.error = null;
                responseData.userId = userCreated._id.toString();
            } catch (error) {
                console.error('Error registering user:', error);
            }
        } catch (error) {
            console.error('Error registering user:', error);
        }
        return responseData;
    },
    /**
     * Logs in a user
     * @function login
     * @memberof module:userModule
     * @param {object} dbHelper - The database helper object
     * @param {object} session - The user session object
     * @param {object} data - The login data
     * @param {string} data.email - The email address
     * @param {string} data.password - The password
     * @returns {Promise<object>} - A promise which resolves to an object containing the status and error message
     */
    login: async (dbHelper, session, data) => {
        const responseData = {
            status: Status.INTERNAL_SERVER_ERROR,
            error: 'Error on logging in user'
        };
        try {
            const { email, password } = data;
            if (!isPresent(email) || !isPresent(password)) {
                responseData.status = Status.BAD_REQUEST;
                responseData.error = 'Missing required fields';
                return responseData;
            }
            if (!isValidEmail(email)) {
                responseData.status = Status.BAD_REQUEST;
                responseData.error = 'Invalid email address';
                return responseData;
            }
            if (!isValidPassword(password)) {
                responseData.status = Status.BAD_REQUEST;
                responseData.error = 'Invalid password';
                return responseData;
            }

            const userObject = await dbHelper.findOne('user', { email });

            if (userObject) {
                if(await isMatchedPassword(password, userObject.password) == false){
                    responseData.status = Status.BAD_REQUEST;
                    responseData.error = 'Invalid Email and Password Combination';
                    return responseData;
                }
            } else {
                responseData.status = Status.BAD_REQUEST;
                responseData.error = 'Email does not exists';
                return responseData;
            }

            session.userEmail = email;
            session.userId = userObject._id.toString();
            session.role = userObject.role;
            session.cookie.maxAge = 30 * 60 * 1000 * 24;
            
            responseData.status = Status.OK;
            responseData.error = null;

            dbHelper.updateOne('user', { email }, { lastLoggedIn: new Date().valueOf() });
        } catch (error) {
            console.error('Error logging in user:', error);
        }
        return responseData;
    },
    /**
     * Logs out a user
     * @function logout
     * @memberof module:userModule
     * @param {object} session - The user session object
     * @returns {Promise<object>} - A promise which resolves to an object containing the status and error message
     */
    logout: (session) => {
        const responseData = {
            status: Status.INTERNAL_SERVER_ERROR,
            error: 'Error on logging out user'
        };
        try {
            session.destroy(err => {
                if (err) {
                    console.error('Error logging out user:', err);
                }
            });
            responseData.status = Status.OK;
            responseData.error = null;
        } catch (error) {
            console.error('Error logging out user:', error);
        }
        return responseData;
    }
};

export default userModule;

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPassword(password) {
    const minLength = 6;
    const maxLength = 14;
    return password.length >= minLength && password.length <= maxLength;
}

function isPresent(value) {
    return value !== null && value !== undefined && value.trim().length > 0;
}

async function hashPassword(password) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
}

async function isMatchedPassword(password, hashedPassword) {
    const match = await bcrypt.compare(password, hashedPassword);
    return match;
}