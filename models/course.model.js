const db = require('../utils/db');

module.exports = {
    all(){
        return db('course').where('isDeleted', false);
    },

    async single(id){
        const courseSpec = await db('course').where('id', id).andWhere('isDeleted', false);
        if(courseSpec.length === 0){
            return null;
        }
        return courseSpec[0];
    },
    async singleCategoryID(id){
        const courseSpec = await db('course').where('categoryId', id).andWhere('isDeleted', false);
        if(courseSpec.length === 0){
            return null;
        }
        return courseSpec[0];
    },

    async allCourseTeacherID(id){
        const courseSpec = await db('course').where('teacherId', id).andWhere('isDeleted', false);
        if(courseSpec.length === 0){
            return null;
        }
        return courseSpec;
    },

    add(course){
        course.createdDate = new Date();
        return db('course').insert(course);
    },

    del(id){
        return db('course').where('id', id).andWhere('isDeleted', false).update('isDeleted', true);
    },
    
    update(course, id){
        course.modifiedDate = new Date();
        return db('course').where('id', id).andWhere('isDeleted', false).update(course);
    }
};