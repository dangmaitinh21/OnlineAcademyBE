const { json } = require('express');
const db = require('../utils/db')

module.exports = {
    async all(){
        return await db('user').where('isDeleted', false);
    },
    async allTeacherStudent(){
        return await db('user').where('isDeleted', false).andWhere('type', 1).orWhere('type', 2);
    },
    async allTeacher(){
        return await db('user').where('isDeleted', false).andWhere('type', 2);
    },
    async allStudent(){
        return await db('user').where('isDeleted', false).andWhere('type', 1);
    },

    async single(id){
        const users = await db('user').where('id', id).andWhere('isDeleted', false);
        if(users.length === 0){
            return null;
        }
        return users[0];
    },
    async singleIDTeacher(id){
        const users = await db('user').where('id', id).andWhere('isDeleted', false).andWhere('type', 2);
        if(users.length === 0){
            return null;
        }
        return users[0];
    },
    async singleByEmail(email){
        const users = await db('user').where('email', email).andWhere('isDeleted', false);
        if(users.length === 0){
            return null;
        }
        return users[0];
    },

    async add(user){
        user.createdDate = new Date();
        const ids = await db('user').insert(user);
        return ids[0];
    },

    async update(user, id){
        user.modifiedDate = new Date();
        return await db('user').where('id', id).update(user);
    },

    del(id){
        return db('user').where('id', id).update('isDeleted', true);
    },

    updateRefreshToken(id, refreshToken){
      return db('user').where('id', id).update('rfToken', refreshToken).update('modifiedDate', new Date());
    },

    async isValidRefreshToken(id, refreshToken) {
        const list = await db('user').where('id', id).andWhere('rfToken', refreshToken);
        if(list.length > 0) {
            return true;
        }
        return false;
    },

    async addWatchList(userId, courseId){
        const getListCourse = await db('user').where('id', userId).select('watchlist');
        const list = JSON.parse(JSON.stringify(getListCourse));
        
        if(list[0].watchlist === null){
            let jsonInit = {};
            jsonInit.course = [];
            jsonInit.course.push(courseId);
            return await db('user').where('id', userId).update('watchlist', JSON.stringify(jsonInit));
        } else {
            let jsonTemp = JSON.parse(list[0].watchlist);
            let listTemp = jsonTemp.course;
            listTemp.push(courseId)
            jsonTemp.course = listTemp;
            return await db('user').where('id', userId).update('watchlist', JSON.stringify(jsonTemp));
        }
    },
    async delWatchList(userId, courseId){
        Array.prototype.remove = function() {
            var what, a = arguments, L = a.length, ax;
            while (L && this.length) {
                what = a[--L];
                while ((ax = this.indexOf(what)) !== -1) {
                    this.splice(ax, 1);
                }
            }
            return this;
        };
        const getListCourse = await db('user').where('id', userId).select('watchlist');
        const list = JSON.parse(JSON.stringify(getListCourse));
        
        if(list[0].watchlist === null){
            return null;
        } else {
            let jsonTemp = JSON.parse(list[0].watchlist);
            let listTemp = jsonTemp.course;
            listTemp.remove(courseId);
            jsonTemp.course = listTemp;
            return await db('user').where('id', userId).update('watchlist', JSON.stringify(jsonTemp));
        }
    }
};