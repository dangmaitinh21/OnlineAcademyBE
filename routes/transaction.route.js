const express = require('express');
const transactionModel = require('../models/transaction.model');
const transaction_schema = require('../schemas/transaction.json');
const validate = require('../middlewares/validate.mdw');
const auth = require('../middlewares/auth.mdw');

const router = express.Router();

router.get('/', auth(1), async function(req, res){
    const list = await transactionModel.all();
    res.json(list);
});

router.get('/:id', auth(1), async function(req, res){
    const id = req.params.id || 0;
    const transaction = await transactionModel.single(id);
    if (transaction === null){
        return res.status(204).end();
    }
    res.json(transaction);
});
router.get('/user/:userID', auth(1), async function(req, res){
    const id = req.params.userID || 0;
    const transaction = await transactionModel.allWithUser(id);
    if (transaction === null){
        return res.status(204).end();
    }
    res.json(transaction);
});

router.post('/', auth(1), validate(transaction_schema), async function(req, res){
    const userId = +req.headers.userId;
    const transaction = req.body;
    const id_list = await transactionModel.add(userId, transaction);
    transaction.id = id_list[0];
    res.status(201).json(transaction);
});

router.put('/:transactionId/payment', auth(1), validate(transaction_schema), async function(req, res){
    const transactionId = +req.params.transactionId || 0;
    const transaction = await transactionModel.single(transactionId);
    if(transaction === null){
        return res.status(404).json({
            message: 'Transaction: ' + transactionId + ' doesn\'t exist'
        });
    } else if(transaction.isDeleted == true){
        return res.status(400).json({
            message : "This transaction has been deleted!"
        })
    } else if(transaction.isPayment == true){
        return res.status(400).json({
            message : "This transaction is paid!"
        })
    }
    await transactionModel.updatePayment(transactionId);
    res.status(200).json({
        message : "Payment Complete!" 
    });
});

router.put('/:transactionId/delete', auth(1), validate(transaction_schema), async function(req, res){
    const transactionId = +req.params.transactionId;
    const transaction = await transactionModel.single(transactionId);
    if(transaction === null){
        return res.status(404).json({
            message: 'Transaction: ' + transactionId + ' doesn\'t exist'
        });
    } else if(transaction.isDeleted == true){
        return res.status(400).json({
            message : "This transaction has been deleted!"
        })
    }
    await transactionModel.updateDel(transactionId);
    res.status(200).json({
        message : "Delete Complete!" 
    });
});


module.exports = router;