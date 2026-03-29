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
        .isObject({ strict: true })
        .withMessage('inputArgs must be an object'),
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
        .isAfter()
        .withMessage('endDate must be in the future')
        .custom((value: string, { req }) => {
            if (new Date(value) <= new Date(req.body.startDate)) {
                throw new Error('endDate must be after startDate');
            }
            return true;
        }),
    body('interval')
        .if(body('type').equals(TaskType.RECURRING))
        .exists({ checkNull: true })
        .withMessage('interval is required for recurring tasks')
        .isInt({ min: 1 })
        .withMessage('interval must be an integer greater than 0'),
    body('interval')
        .if(body('type').not().equals(TaskType.RECURRING))
        .not()
        .exists({ checkNull: true })
        .withMessage('interval is only allowed for recurring tasks'),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(new ValidationError('Validation failed', errors.array()));
        }
        next();
    },
];
