const db = require('../utils/db')

module.exports = {
    async all(){
        return await db('category').andWhere('isDeleted', false);
    },

    async single(id){
        const category = await db('category').where('id', id).andWhere('isDeleted', false);
        if(category.length === 0){
            return null;
        }
        return category[0];
    },

    async singleByCategoryTitle(title){
        const category = await db('category').where('title', title).andWhere('isDeleted', false);
        if(category.length === 0){
            return null;
        }
        return category[0];
    },

    async add(category){
        category.createdDate = new Date();
        const ids = await db('category').insert(category);
        return ids[0];
    },

    update(category, id){
        category.modifiedDate = new Date();
        return db('category').where('id', id).andWhere('isDeleted', false).update(category);
    },

    del(id){
        return db('category').where('id', id).andWhere('isDeleted', false).update('isDeleted', true);
    }
};