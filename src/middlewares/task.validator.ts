import { body, validationResult } from 'express-validator';
import { type Request, type Response, type NextFunction } from 'express';
import { ValidationError } from '../utils/customErrors.js';
import { TaskType } from '../models/task.model.js';

function filterFutureRunDates(runDates: unknown) {
    if (!Array.isArray(runDates)) {
        return runDates;
    }

    const now = Date.now();
    return runDates.filter((runDate) => {
        const runDateTime = new Date(runDate).getTime();
        return Number.isFinite(runDateTime) && runDateTime > now;
    });
}

function validateSafeObjectKeys(value: unknown, path = 'inputArgs'): boolean {
    if (Array.isArray(value)) {
        return value.every((item, index) => validateSafeObjectKeys(item, `${path}.${index}`));
    }

    if (value === null || typeof value !== 'object') {
        return true;
    }

    for (const [key, nestedValue] of Object.entries(value)) {
        if (key.startsWith('$') || key.includes('.')) {
            throw new Error(`${path} contains unsafe key "${key}"`);
        }

        validateSafeObjectKeys(nestedValue, `${path}.${key}`);
    }

    return true;
}

export const validateTask = [
    body('script')
        .exists({ checkNull: true })
        .withMessage('script name is required')
        .isString()
        .withMessage(`script name must be a string`)
        .notEmpty()
        .withMessage(`script name must not be empty`)
        .isLength({ min: 2, max: 100 })
        .withMessage(`script name must be between 2 and 100 characters`),
    body('inputArgs')
        .optional()
        .isObject({ strict: true })
        .withMessage('inputArgs must be an object')
        .bail()
        .custom((inputArgs) => validateSafeObjectKeys(inputArgs)),
    body('type')
        .exists({ checkNull: true })
        .withMessage('type is required')
        .isIn(Object.values(TaskType))
        .withMessage(`type must be one of ${Object.values(TaskType).join(', ')}`),
    body('startDate')
        .if(body('type').equals(TaskType.RECURRING))
        .exists({ checkNull: true })
        .withMessage('startDate is required for recurring tasks')
        .isISO8601({ strict: true })
        .withMessage('startDate must be a valid ISO8601 date'),
    body('startDate')
        .if(body('type').not().equals(TaskType.RECURRING))
        .not()
        .exists({ checkNull: true })
        .withMessage('startDate is only allowed for recurring tasks'),
    body('endDate')
        .if(body('type').equals(TaskType.RECURRING))
        .optional()
        .isISO8601({ strict: true })
        .withMessage('endDate must be a valid ISO8601 date')
        .isAfter()
        .withMessage('endDate must be in the future')
        .custom((value: string, { req }) => {
            if (new Date(value) <= new Date(req.body.startDate)) {
                throw new Error('endDate must be after startDate');
            }
            return true;
        }),
    body('endDate')
        .if(body('type').not().equals(TaskType.RECURRING))
        .not()
        .exists({ checkNull: true })
        .withMessage('endDate is only allowed for recurring tasks'),
    body('anchorDate')
        .if(body('type').equals(TaskType.RECURRING))
        .optional()
        .isISO8601({ strict: true })
        .withMessage('anchorDate must be a valid ISO8601 date'),
    body('anchorDate')
        .if(body('type').not().equals(TaskType.RECURRING))
        .not()
        .exists({ checkNull: true })
        .withMessage('anchorDate is only allowed for recurring tasks'),
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
    body('runDates')
        .if(body('type').equals(TaskType.PROGRAMMED))
        .exists({ checkNull: true })
        .withMessage('runDates is required for programmed tasks')
        .isArray({ min: 1 })
        .withMessage('runDates must be a non-empty array of date strings'),
    body('runDates.*')
        .if(body('type').equals(TaskType.PROGRAMMED))
        .isISO8601({ strict: true })
        .withMessage('Each runDate must be a valid ISO8601 date string'),
    body('runDates')
        .if(body('type').equals(TaskType.PROGRAMMED))
        .customSanitizer(filterFutureRunDates)
        .custom((runDates) => Array.isArray(runDates) && runDates.length > 0)
        .withMessage('runDates must contain at least one future date'),
    body('runDates')
        .if(body('type').not().equals(TaskType.PROGRAMMED))
        .not()
        .exists({ checkNull: true })
        .withMessage('runDates is only allowed for programmed tasks'),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(new ValidationError('Validation failed', errors.array()));
        }
        next();
    },
];

export const validateTaskFilters = [
    body()
        .custom(
            (value) =>
                value === undefined ||
                (value !== null && typeof value === 'object' && !Array.isArray(value)),
        )
        .withMessage('filter body must be an object'),
    body('script').optional().isString().withMessage('script must be a string'),
    body('inputArgs')
        .optional()
        .isObject({ strict: true })
        .withMessage('inputArgs must be an object')
        .bail()
        .custom((inputArgs) => validateSafeObjectKeys(inputArgs)),
    body('type')
        .optional()
        .isIn(Object.values(TaskType))
        .withMessage(`type must be one of ${Object.values(TaskType).join(', ')}`),
    body('enabled').optional().isBoolean().withMessage('enabled must be a boolean').toBoolean(),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(new ValidationError('Validation failed', errors.array()));
        }
        next();
    },
];

export const validateTaskDeleteFilters = [
    body()
        .custom(
            (value) =>
                value === undefined ||
                (value !== null && typeof value === 'object' && !Array.isArray(value)),
        )
        .withMessage('filter body must be an object'),
    body('script').optional().isString().withMessage('script must be a string'),
    body('inputArgs')
        .optional()
        .isObject({ strict: true })
        .withMessage('inputArgs must be an object')
        .bail()
        .custom((inputArgs) => validateSafeObjectKeys(inputArgs)),
    body('type')
        .optional()
        .isIn(Object.values(TaskType))
        .withMessage(`type must be one of ${Object.values(TaskType).join(', ')}`),
    body('enabled').optional().isBoolean().withMessage('enabled must be a boolean').toBoolean(),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(new ValidationError('Validation failed', errors.array()));
        }
        next();
    },
];

export const validateTaskUpdateFilters = [
    body()
        .custom(
            (value) =>
                value === undefined ||
                (value !== null && typeof value === 'object' && !Array.isArray(value)),
        )
        .withMessage('filter body must be an object'),
    body('script').optional().isString().withMessage('script must be a string'),
    body('inputArgs')
        .optional()
        .isObject({ strict: true })
        .withMessage('inputArgs must be an object')
        .bail()
        .custom((inputArgs) => validateSafeObjectKeys(inputArgs)),
    body('type')
        .optional()
        .isIn(Object.values(TaskType))
        .withMessage(`type must be one of ${Object.values(TaskType).join(', ')}`),
    body('enabled').optional().isBoolean().withMessage('enabled must be a boolean').toBoolean(),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(new ValidationError('Validation failed', errors.array()));
        }
        next();
    },
];
