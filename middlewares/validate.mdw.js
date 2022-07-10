const ajv = require('ajv');

module.exports = (schema) => (req, res, next) => {
    const validator = new ajv({ allErrors: true });
    const fn_validate = validator.compile(schema);
    let valid = fn_validate(req.body);
    if (!valid) {
        return res.status(400).json(fn_validate.errors);
    }
    next();
};