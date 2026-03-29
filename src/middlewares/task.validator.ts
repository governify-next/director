import { body, validationResult } from 'express-validator';
import { type Request, type Response, type NextFunction } from 'express';
import { ValidationError } from '../utils/customErrors.js';
import { TaskType } from '../models/task.model.js';

export const validateTask = [
    body('scriptId')
        .exists({ checkNull: true })
        .withMessage('scriptId is required')
        .isMongoId()
        .withMessage('scriptId must be a valid Mongo id'),
    body('inputArgs')
        .optional()
        .custom((value: unknown) => {
            if (typeof value !== 'object' || value === null || Array.isArray(value)) {
                throw new Error('inputArgs must be an object');
            }
            return true;
        }),
    body('type')
        .exists({ checkNull: true })
        .withMessage('type is required')
        .isIn(Object.values(TaskType))
        .withMessage(`type must be one of ${Object.values(TaskType).join(', ')}`),
    body('startDate')
        .exists({ checkNull: true })
        .withMessage('startDate is required')
        .isISO8601()
        .withMessage('startDate must be a valid ISO8601 date'),
    body('endDate')
        .optional()
        .isISO8601()
        .withMessage('endDate must be a valid ISO8601 date')
        .isAfter('startDate')
        .withMessage('endDate must be after startDate')
        .isAfter(new Date().toISOString())
        .withMessage('endDate must be in the future'),
    body('interval')
        .optional()
        .isInt({ min: 1 })
        .withMessage('interval must be an integer greater than 0')
        .custom((value: number, { req }) => {
            const taskType = req.body.type;
            if (taskType === TaskType.RECURRING && (value === undefined || value === null)) {
                throw new Error('interval is required for recurring tasks');
            }
            return true;
        }),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(new ValidationError('Validation failed', errors.array()));
        }
        next();
    },
];
