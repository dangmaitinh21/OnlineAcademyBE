const express = require('express');
const feedbackModel = require('../models/feedback.model');
const feedback_schema = require('../schemas/feedback.json');
const validate = require('../middlewares/validate.mdw');
const auth = require('../middlewares/auth.mdw');

const router = express.Router();

router.get('/', async function(req, res){
    var point, result;
    if(typeof req.query.point !== 'undefined'){
        point = req.query.point;
        result = await feedbackModel.singleByPoint(point);
    }
    else{
        result = await feedbackModel.all();
    }
    res.json(result);
});

router.get('/:id', async function(req, res){
    const id = req.params.id || 0;
    const feedback = await feedbackModel.single(id);
    if (feedback === null){
        return res.status(204).end();
    }
    res.json(feedback);
});

router.post('/', auth(1), validate(feedback_schema), async function(req, res){
    const feedback = req.body;
    const id_list = await feedbackModel.add(feedback);
    feedback.id = id_list[0];
    res.status(201).json(feedback);
});

router.put('/:id', auth(1), validate(feedback_schema), async function(req, res){
    const id = req.params.id || 0;
    if (id === 0){
        return res.status(304).end();
    }
    const feedback = req.body;
    const id_list = await feedbackModel.update(feedback, id);
    feedback.id = id_list[0];
    res.status(201).json(feedback);
});

router.delete('/:id', auth(1), async function(req, res){
    const id = req.params.id || 0;
    if (id === 0){
        return res.status(304).end();
    }
    await feedbackModel.del(id);
    res.json({
        message: 'OK'
    });
});

module.exports = router;
