const express = require('express');
const app = express();
const morgan = require('morgan');
const auth = require('./middlewares/auth.mdw');
require('express-async-errors');
const cors = require('cors');

const PORT = process.env.PORT || 3001;

app.get('/', function (req, res) {
    res.json({
        message: 'Welcome to Online Academy server!'
    })
})

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/', (req, res) => {
    res.send({ message: 'Online Academy server' });
});

app.use('/api/auth', require('./routes/auth.route'));
app.use('/api/users', require('./routes/user.route'));
app.use('/api/subjects', require('./routes/subject.route'));
app.use('/api/feedbacks', require('./routes/feedback.route'));
app.use('/api/categories', require('./routes/category.route'));
app.use('/api/courses', require('./routes/course.route'));
app.use('/api/transaction', require('./routes/transaction.route'));
app.use('/resources', express.static(__dirname + "/resources")); //HELPLESS WITH STREAMING THRU API

app.use((req, res, next) => {
    res.status(404).send({
        error_message: 'Endpoint not found!'
    })
});

app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).send({
        error_message: 'Something broke!'
    })
});

app.listen(PORT, function () {
    console.log(`Online Academy server is running at http://localhost:${PORT}`);
});

require('./ws');
