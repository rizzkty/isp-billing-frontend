import DOMPurify from 'dompurify';

/**
 * Sanitize a string to prevent XSS attacks.
 * @param {string} dirty 
 * @returns {string}
 */
export const sanitizeHtml = (dirty) => {
    if (!dirty) return dirty;
    return DOMPurify.sanitize(dirty);
};

/**
 * Sanitize an object's string properties.
 * @param {Object} obj 
 * @returns {Object}
 */
export const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }
    
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    }
    
    const sanitizedObj = {};
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            sanitizedObj[key] = DOMPurify.sanitize(value);
        } else if (typeof value === 'object') {
            sanitizedObj[key] = sanitizeObject(value);
        } else {
            sanitizedObj[key] = value;
        }
    }
    
    return sanitizedObj;
};
