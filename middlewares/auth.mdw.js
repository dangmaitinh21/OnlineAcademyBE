const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');

module.exports = (type) =>
    async (req, res, next) => {
        const accessToken = req.headers['x-access-token'];
        if (accessToken) {
            try {
                const { userId } = jwt.verify(accessToken, 'SECRET_KEY');
                const user = await userModel.single(userId);
                req.headers.userId = userId;
                req.headers.userType = user.type;

                if (!user.isActive) {
                    if (req.originalUrl.includes('/api/users/otp')) {
                        return next(); //go straight to otp resend/validate
                    }
                    user.type = 0;
                }
                if (user.type < type) {
                    return res.status(403).json({
                        message: 'Forbidden!'
                    });
                }

                next();
            } catch (err) {
                console.log(err);
                return res.status(401).json({
                    message: 'Invalid access token!'
                });
            }
        } else {
            return res.status(400).json({
                message: 'Access token not found!'
            });
        }
    }