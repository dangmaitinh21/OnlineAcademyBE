const express = require('express');
const courseModel = require('../models/course.model');
const userModal = require('../models/user.model');
const categoryModel = require('../models/category.model');
const course_schema = require('../schemas/course.json');
const validate = require('../middlewares/validate.mdw');
const feedback_schema = require('../schemas/feedback.json');
const feedbackModel = require('../models/feedback.model');
const auth = require('../middlewares/auth.mdw');

const router = express.Router();
const formidable = require('formidable');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { broadcastAll } = require('../ws');

router.get('/', async function (req, res) {
    const list = await courseModel.all();
    res.json(list);
});

router.get('/:id', async function (req, res) {
    const id = req.params.id || 0;
    const courseSpec = await courseModel.single(id);
    if (courseSpec === null) {
        return res.status(204).end();
    }
    res.status(200).json(courseSpec);
});

router.get('/category/:id', async function (req, res) {
    const id = req.params.id || 0;
    const courseSpec = await courseModel.singleCategoryID(id);
    if (courseSpec === null) {
        return res.status(204).end();
    }
    res.status(200).json(courseSpec);
});

router.get('/teacher/:id', auth(2), async function (req, res) {
    const id = req.params.id || 0;
    const courseSpec = await courseModel.allCourseTeacherID(id);
    if (courseSpec === null) {
        return res.status(204).end();
    }
    res.status(200).json(courseSpec);
});

router.post('/', auth(2), async function (req, res) {
    const resourceDir = path.join(__dirname, '../resources/');

    const uuid = uuidv4()
    const uploadDir = resourceDir + uuid;

    if (!fs.existsSync(resourceDir)) {
        fs.mkdirSync(resourceDir);
    }
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
    }

    const form = formidable({ multiples: true, uploadDir, keepExtensions: true, maxFileSize: 500 * 1024 * 1024 });

    let course = {};

    form.on('field', function (fieldName, fieldValue) {
        if (fieldName === 'metadata') {
            course = JSON.parse(fieldValue);
        }

    });

    let uploadFilenames = []
    form.on('file', function (field, file) {
        const uploadName = uuidv4() + '.' + file.type.split('/')[1];
        fs.rename(file.path, form.uploadDir + "/" + uploadName, (err) => {
            uploadFilenames.push(uploadName);
            if (err) {
                throw new Error(err);
            }
        });
    });

    form.parse(req, (err, fields, files) => {
        if (err) {
            throw new Error(err);
        }
    })

    form.on('end', async () => {
        course.teacherId = req.headers.userId;
        let userid = await userModal.singleIDTeacher(course.teacherId);
        if (!userid) {
            return res.status(404).json({
                message: 'Not allow user ID: ' + course.teacherId
            });
        }
        let categoryid = await categoryModel.single(course.categoryId);
        if (!categoryid) {
            return res.status(404).json({
                message: 'Category: ' + course.categoryId + ' doesn\'t exist'
            });
        }
        course.data = []
        course.outline.map((e, index) => {
            course.data.push({
                content: e,
                uploadFilename: uploadFilenames[index],
                uploadDir: uuid + "/"
            })
        })

        course.outline = JSON.stringify({ data: course.data })
        delete course.data

        // course.thumbnail = "LATER";
        const id_list = await courseModel.add(course);
        course.id = id_list[0];
        res.status(201).json(course);
    })

});

router.get("/:courseId/resources/:resourceId", async (req, res) => {

    const courseId = +req.params.courseId;
    const resourceId = req.params.resourceId;

    const course = await courseModel.single(courseId);
    const outline = JSON.parse(course.outline)

    const videoPath = path.join(__dirname, '../resources/' + outline.uploadDir + resourceId);
    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const contentType = 'video/' + resourceId.split(".")[1];

    const range = req.headers.range;
    if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1]
            ? parseInt(parts[1], 10)
            : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(videoPath, { start, end });
        const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': contentType,
        };
        res.writeHead(206, head);
        file.pipe(res);
    } else {
        const head = {
            'Content-Length': fileSize,
            'Content-Type': contentType,
        };
        res.writeHead(200, head);
        fs.createReadStream(videoPath).pipe(res);
    }

});

router.put('/:courseId', auth(2), async function (req, res) {

    const resourceDir = path.join(__dirname, '../resources/');

    const uuid = uuidv4()
    const uploadDir = resourceDir + uuid;

    if (!fs.existsSync(resourceDir)) {
        fs.mkdirSync(resourceDir);
    }
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
    }

    const form = formidable({ multiples: true, uploadDir, keepExtensions: true, maxFileSize: 500 * 1024 * 1024 });

    let course = {};

    form.on('field', function (fieldName, fieldValue) {
        if (fieldName === 'metadata') {
            course = JSON.parse(fieldValue);
        }

    });

    let uploadFilenames = []
    form.on('file', function (field, file) {
        const uploadName = uuidv4() + '.' + file.type.split('/')[1];
        fs.rename(file.path, form.uploadDir + "/" + uploadName, (err) => {
            uploadFilenames.push(uploadName);
            if (err) {
                throw new Error(err);
            }
        });
    });

    form.parse(req, (err, fields, files) => {
        if (err) {
            throw new Error(err);
        }
    })

    form.on('end', async () => {
        const courseId = +req.params.courseId;
        let dbCourse = await courseModel.single(courseId);
        if (!dbCourse) {
            return res.status(404).json({
                message: 'CourseId: ' + id + ' doesn\'t exist'
            });
        }
        if (req.headers.userId !== dbCourse.teacherId && req.headers.userType !== 3) {
            return res.status(403).json({
                message: 'Can\'t edit other user course'
            });
        }

        let categoryid = await categoryModel.single(course.categoryId);
        if (!categoryid) {
            return res.status(404).json({
                message: 'Category: ' + course.categoryId + ' doesn\'t exist'
            });
        }

        const courseData = JSON.parse(dbCourse.outline).data
        let uploadDir = uuid + "/"

        if (courseData && courseData.length > 0) {
            // uploadDir = courseData[0].uploadDir
            course.data = courseData
        }
        else {
            course.data = []
        }
        course.outline.map((e, index) => {
            course.data.push({
                content: e,
                uploadFilename: uploadFilenames[index],
                uploadDir: uploadDir
            })
        })

        course.outline = JSON.stringify({ data: course.data })
        delete course.data

        //course.thumbnail = "LATER";
        const id_list = await courseModel.update(course, courseId);
        course.id = id_list[0];
        const msgToSend = JSON.stringify({'courseId':courseId, 'title':course.title});
        broadcastAll(msgToSend);
        res.status(200).json(course);
    })
});

router.delete('/:id', auth(3), async function (req, res) {
    const id = req.params.id || 0;
    if (id === 0) {
        return res.status(304).end();
    }
    await courseModel.del(id);
    res.status(200).json({
        message: 'Delete Complete!'
    });
});

router.post('/:courseId/feedbacks', auth(1), validate(feedback_schema), async function (req, res) {
    const courseId = +req.params.courseId;
    const userId = req.headers.userId;
    const course = await courseModel.single(courseId);
    if (course === null) {
        return res.status(404).json({
            message: 'CourseId: ' + courseId + ' doesn\'t exist'
        });
    }
    const feedback = req.body;
    feedback.courseId = courseId;
    feedback.userId = userId;

    const dbFeedback = await feedbackModel.singleByUserIdAndCourseId(userId, courseId);
    if (dbFeedback === null) {
        const ids = await feedbackModel.add(feedback);
        feedback.id = ids[0];
        return res.status(201).json(feedback);
    }
    const ids = await feedbackModel.update(feedback, dbFeedback.id);
    feedback.id = ids[0];
    return res.status(200).json(feedback);
});

router.get('/:courseId/feedbacks', async function (req, res) {
    const courseId = +req.params.courseId;
    const course = await courseModel.single(courseId);
    if (course === null) {
        return res.status(404).json({
            message: 'CourseId: ' + courseId + ' doesn\'t exist'
        });
    }
    const feedbacks = await feedbackModel.findByCourseId(courseId);
    return res.status(200).json(feedbacks);
});

module.exports = router;