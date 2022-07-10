const express = require('express');
const bcrypt = require('bcryptjs')
const user_schema = require('../schemas/user.json');
const user_register_schema = require('../schemas/user_register.json');
const userModel = require('../models/user.model');
const auth = require('../middlewares/auth.mdw');
const validate = require('../middlewares/validate.mdw');
const router = express.Router();
require('dotenv').config();
const sendMail = require('../utils/emailSender');
const otpModel = require('../models/otp.model');
const otpGenerator = require('otp-agent');
const courseModel = require('../models/course.model');

router.post('/', validate(user_register_schema), async function (req, res) {
    const user = req.body;
    user.password = bcrypt.hashSync(user.password, 10);
    if (user.type === 1) {
        user.isActive = Boolean(process.env.SKIP_OTP==='true');
    } else {
        user.isActive = true;
    }
    
    const dbUser = await userModel.singleByEmail(user.email);
    if (dbUser) {
        return res.status(400).json({
            message: 'Email already exist!'
        });
    }
    user.id = await userModel.add(user);
    delete user.password;
    const otp = otpGenerator.generateOTP(6, { numbers: true });
    sendMail(user.email, otp);
    otpModel.add({ userId: user.id, value: otp });
    res.status(201).json(user);
});

router.get('/otp', auth(1), async function (req, res) {
    const user = await userModel.single(req.headers.userId);
    const otp = otpGenerator.generateOTP(6, { numbers: true });
    sendMail(user.email, otp);
    otpModel.add({ userId: user.id, value: otp });
    res.status(201).json({ message: 'OTP has been resent to ' + user.email });
});

router.post('/otp/validate', auth(1), async function (req, res) {
    const userId = req.headers.userId;
    const otp = await otpModel.findLatestOtp(userId);
    console.log(otp)
    console.log(req.body.otp)
    if (otp !== req.body.otp) {
        return res.status(400).json({
            message: 'Verify failed!'
        });
    }
    userModel.update({ isActive: true }, userId);
    res.status(200).json({
        message: 'User verified successfully!'
    });
});

router.get('/', auth(3), async function (req, res) {
    const list = await userModel.all();
    res.json(list);
});
router.get('/teacher', auth(3), async function (req, res) {
    const list = await userModel.allTeacher();
    res.json(list);
});

router.get('/allteacher', async function (req, res) {
    const list = await userModel.allTeacherStudent();
    res.json(list);
});
router.get('/student', auth(3), async function (req, res) {
    const list = await userModel.allStudent();
    res.json(list);
});

router.get('/:id', auth(1), async function (req, res) {
    const id = +req.params.id || 0;
    const user = await userModel.single(id);
    if (user === null) {
        return res.status(204).end();
    }
    res.json(user);
});

router.put('/:id', auth(1), validate(user_schema), async function (req, res) {
    const id = +req.params.id;
    let dbUser = await userModel.single(id);
    if (!dbUser) {
        return res.status(404).json({
            message: 'UserId: ' + id + ' doesn\'t exist'
        });
    }
    if (req.headers.userId !== id && req.headers.userType !== 3) {
        return res.status(403).json({
            message: 'Can\'t edit other user information'
        });
    }
    const user = req.body;
    dbUser = await userModel.singleByEmail(user.email);
    if (dbUser && dbUser.id !== id) {
        return res.status(400).json({
            message: 'Email already exist!'
        });
    }

    if (user.password) {
        user.password = bcrypt.hashSync(user.password, 10);
    }
    const id_list = await userModel.update(user, id);
    user.id = id_list[0];
    delete user.password;
    res.status(200).json(user);
});

router.delete('/:id', auth(3), async function (req, res) {
    const id = +req.params.id || 0;
    if (id === 0) {
        return res.status(304).end();
    }
    await userModel.del(id);
    res.status(200).json({
        message: 'Delete Complete!'
    });
});

router.post('/watchlist/:id', auth(1), async function (req, res) {
    const userId = req.headers.userId;
    const courseId = +req.params.id;
    const addCourse = await courseModel.single(courseId);
    if(addCourse === null){
        res.status(404).json({
            message: 'Course not found!'
        });
    }
    const add = await userModel.addWatchList(userId, courseId);
    if(add === null) {
        res.status(400).json({
            message: 'The course already exists!'
        })
    } else {
        res.status(200).json({
            addCourse,
            message: 'Added to watch list!'
        });
    }   
});
router.delete('/delete/watchlist/:id', auth(1), async function (req, res) {
    const userId = req.headers.userId;
    const courseId = +req.params.id;
    const addCourse = await courseModel.single(courseId);
    if(addCourse === null){
        res.status(404).json({
            message: 'Course not found!'
        });
    }
    const add = await userModel.delWatchList(userId, courseId);
    if(add === null) {
        res.status(400).json({
            message: 'The course already exists!'
        })
    } else {
        res.status(200).json({
            addCourse,
            message: 'Added to watch list!'
        });
    }   
});

module.exports = router;