const express = require("express");
const {
    GetKey,
    SetKey,
    Qpush,
    Qpop,
    BQpop
} = require("../controllers/Controller");


const router = express.Router();

// For key-value pairs -:
router.post("/get", GetKey);

router.post('/set', SetKey);

router.post('/qpush', Qpush);

router.get('/qpop/:key', Qpop);
router.get('/bqpop/:key/:timeout', BQpop);


module.exports = router;
