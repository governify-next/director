import { body, validationResult } from 'express-validator';
import { type Request, type Response, type NextFunction } from 'express';
import { ValidationError } from '../utils/customErrors.js';

const commonScriptValidations = [
    body('name')
        .exists({ checkNull: true })
        .withMessage('Name is required')
        .isString()
        .withMessage('Name must be a string')
        .isLength({ min: 2 })
        .withMessage('Name must be at least 2 characters long')
        .isLength({ max: 100 })
        .withMessage('Name must be at most 100 characters long'),
    body('description').optional().isString().withMessage('Description must be a string'),
    body('moduleRef')
        .exists({ checkNull: true })
        .withMessage('Module reference is required')
        .isString()
        .withMessage('Module reference must be a string')
        .notEmpty()
        .withMessage('Module reference cannot be empty'),
    body('inputSchema')
        .exists({ checkNull: true })
        .withMessage('Input schema is required')
        .custom((value: unknown) => {
            if (typeof value !== 'object' || value === null || Array.isArray(value)) {
                throw new Error('Input schema must be an object');
            }
            return true;
        }),
];

export const validateCreateScript = [
    ...commonScriptValidations,
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(new ValidationError('Validation failed', errors.array()));
        }
        next();
    },
];

export const validateUpdateScript = [
    ...commonScriptValidations,
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(new ValidationError('Validation failed', errors.array()));
        }
        next();
    },
];
