var express = require('express');
var router = express.Router();

/* GET home page. */
router.post('/', function (req, res, next) {
    console.log(req.body);
    var nick = req.body.nickname;
    var code = req.body.code;
    res.render('index', { title: 'Battleship | Game', content: 'game.ejs', name:nick, c:code});
});

module.exports = router;
