const express = require('express');
const categoryModel = require('../models/category.model');
const courseModel = require('../models/course.model');
const category_schema = require('../schemas/category.json');
const validate = require('../middlewares/validate.mdw');
const auth = require('../middlewares/auth.mdw');

const router = express.Router();

router.get('/', async function(req, res){
    var title, result;
    if(typeof req.query.title !== 'undefined'){
        title = req.query.title;
        result = await categoryModel.singleByCategoryTitle(title);
    }
    else{
        result = await categoryModel.all();
    }
    res.status(200).json(result);
});

router.get('/:id', async function(req, res){
    const id = req.params.id || 0;
    const category = await categoryModel.single(id);
    if (category === null){
        return res.status(204).end();
    }
    res.status(200).json(category);
});

router.post('/', auth(3), validate(category_schema), async function(req, res){
    const category = req.body;
    const id_list = await categoryModel.add(category);
    category.id = id_list[0];
    res.status(201).json(category);
});

router.put('/:id', auth(3), validate(category_schema), async function(req, res){
    const id = req.params.id || 0;
    if (id === 0){
        return res.status(304).json({message: "ID not found"});
    }
    const category = req.body;
    if (category.level != 1) {
        let checkCategoryOwned = await categoryModel.single(category.owned);
        if (!checkCategoryOwned || checkCategoryOwned.level >= category.level) {
            return res.status(304).json({message: "Owned not found"});
        }
    }
    else {
        if (category.owned != 0) {
            return res.status(304).json({message:"Not allow owned"});
        }
    }
    
    const id_list = await categoryModel.update(category, id);
    category.id = id_list[0];
    res.status(201).json(category);
});

router.delete('/:id', auth(3), async function(req, res){
    const id = req.params.id || 0;
    if (id === 0){
        return res.status(304).end();
    }
    let course = await courseModel.singleCategoryID(id);
    if (course != null) {
        return res.status(304).end();
    }
    await categoryModel.del(id);
    res.status(200).json({
        message: 'OK'
    });
});

module.exports = router;
