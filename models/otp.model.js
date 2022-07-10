const db = require('../utils/db')

module.exports = {
    async add(otp) {
        otp.createdDate = new Date();
        await db('otp').insert(otp);
    },
    async findLatestOtp(userId) {
        const otpList = await db('otp').where('userId', userId).orderBy('createdDate', 'desc');
        if (otpList.length > 0) {
            return otpList[0].value;
        }
        return null;
    }
};