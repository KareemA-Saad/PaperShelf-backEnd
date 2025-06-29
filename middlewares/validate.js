const validate = (schema, type = 'body') => {
    return (req, res, next) => {
        const dataToValidate = type === 'query' ? req.query : req.body;
        const { error } = schema.validate(dataToValidate);

        if (error) {
            const errorMessage = error.details.map(detail => detail.message).join(', ');
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errorMessage
            });
        }

        next();
    };
};

module.exports = validate; 