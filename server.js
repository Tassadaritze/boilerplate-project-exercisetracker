const express = require('express')
const app = express()
const cors = require('cors')
const bp = require("body-parser");
const mongoose = require("mongoose");
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

mongoose.connect(process.env.MONGO_URI);

const logSchema = new mongoose.Schema({
    description: String,
    duration: Number,
    date: String
 }, { _id: false });

const userSchema = new mongoose.Schema({
    username: String,
    count: Number,
    log: [logSchema]
});

const User = mongoose.model("User", userSchema);

app.post("/api/users", bp.urlencoded({ extended: false }), (req, res) => {
    User.create({ username: req.body.username }, (err, data) => {
        res.send(data);
    });
});

app.get("/api/users", (req, res) => {
    User.find({}, (err, data) => {
        res.send(data);
    });
});

app.post("/api/users/:_id/exercises", bp.urlencoded({ extended: false }), (req, res) => {
    let exercise = req.body;
    exercise.date = new Date(exercise.date).toDateString();
    if (exercise.date === "Invalid Date") {
        exercise.date = new Date(Date.now()).toDateString();
    }
    User.updateOne({ _id: req.params._id }, {
            $inc: { count: 1 },
            $push: { log: req.body }
        }, (err, data) => {
        User.findOne({ _id: req.params._id }, (err, data) => {
            const lastExercise = data.log[data.log.length - 1];
            res.send({
                username: data.username,
                description: lastExercise.description,
                duration: lastExercise.duration,
                date: lastExercise.date,
                _id: data._id
            });
        });
    });
});

app.get("/api/users/:_id/logs", (req, res) => {
    if (req.query) {
        User.findOne({ _id: req.params._id }, (err, data) => {
            let user = data;
            const filteredLog = user.log.filter((ele, i) => {
                let from = new Date(req.query.from);
                let to = new Date(req.query.to);
                date = new Date(ele.date);
                if ((!req.query.from || date > from)
                && (!req.query.to || date < to)
                && (!req.query.limit || user.count - i <= req.query.limit)) {
                    return true;
                }
                return false;
            });
            user.log = filteredLog;
            res.send(user);
        });
    } else {
        User.findOne({ _id: req.params._id }, (err, data) => {
            res.send(data);
        });
    }
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
