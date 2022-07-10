const db = require('../utils/db')

module.exports = {
    all(){
        return db('subject');
    },

    async single(id){
        const subjects = await db('subject').where('id', id);
        if(subjects.length === 0){
            return null;
        }
        return subjects[0];
    },

    async singleBySubjectTitle(title){
        const subjects = await db('subject').where('title', title);
        if(subjects.length === 0){
            return null;
        }
        return subjects[0];
    },

    async add(subject){
        subject.createdDate = new Date();
        const ids = await db('subject').insert(subject);
        return ids[0];
    },

    update(subject, id){
        subject.modifiedDate = new Date();
        return db('subject').where('id', id).update(subject);
    },

    del(id){
        return db('subject').where('id', id).update('isDeleted', true);
    }
};