const asyncHandler = require("express-async-handler");
const constants = require('../constants');
// const constants = {
//   VALIDATION_ERROR: 400,
//   BAD_REQUEST: 400,
//   UNAUTHORIZED: 401,
//   FORBIDDEN: 403,
//   NOT_FOUND: 404,
//   SERVER_ERROR: 500,
//   SUCCESS:200
// };

// JavaScript object to store key-value pairs
const keyValueStore = {};

// JavaScript object to store queues
const queues = {};
const queueInUse = {};


function setKeyTimeout(key, expiry) {
  const timeout = parseInt(expiry, 10) * 1000;
  setTimeout(() => {
    delete keyValueStore[key];
  }, timeout);
}

const GetKey = asyncHandler(async (req, res) => {
  const command = req.body.command;
  const words = command.split(' ');
  if (words[0] != 'GET' && words.length != 2) {
    res.status(constants.BAD_REQUEST).send('Invalid GET command');
    return;
  }
  let key = words[1];
  value = keyValueStore[key];
  if (value) {
    res.send(value);
  } else {
    res.status(constants.NOT_FOUND).send('Key not found');
  }
});

const SetKey = asyncHandler(async (req, res) => {
  let key, value, expiry, condition = '';
  const command = req.body.command;
  const words = command.split(' ');

  if (words[0] != 'SET' || words.length < 3) {
    res.status(constants.BAD_REQUEST).send('Invalid SET command');
    return;
  }
  if(words.length ==3)console.log("TRUEEE")
  key = words[1];
  value = words[2];

  if (words[3] == 'EX' && (words.length == 5 || words.length == 6)) {
    expiry = words[4];
    if (words.length == 6 && (words[5] == 'XX' || words[5] == 'NX')) {
      condition = words[5];
    }

  } else if ((words[3] == 'XX' || words[3] == 'NX') && (words.length == 4)) {
    condition = words[3];
  } 

  if (condition === 'NX' && keyValueStore[key]) {
    res.status(constants.FORBIDDEN).send('Key already exists');
    return;
  } else if (condition === 'XX' && !keyValueStore[key]) {
    res.status(constants.NOT_FOUND).send('Key does not exist');
    return;
  } else {
    keyValueStore[key] = value;
    if (expiry) {
      setKeyTimeout(key, expiry);
    }
    res.status(constants.SUCCESS).send('OK');
  }

});


const Qpush = asyncHandler(async (req, res) => {

  const command = req.body.command;
  const words = command.split(' ');
  if (words[0] != 'QPUSH' && words.length < 3) {
    res.status(constants.BAD_REQUEST).send('Invalid command');
    return;
  }

  const key = words[1];
  const values = words.slice(2);


  if (!queues[key]) {
    queues[key] = [];
  }
  queues[key].push(...values);
  res.send('OK');
});

const Qpop = asyncHandler(async (req, res) => {
  
  const command = req.body.command;
  const words = command.split(' ');
  if (words[0] != 'QPOP' && words.length != 2) {
    res.status(constants.BAD_REQUEST).send('Invalid command');
    return;
  }
  const key = words[1];
  const queue = queues[key];
  if (queue && queue.length > 0) {
    res.send(queue.pop());
  } else {
    res.send(null);
  }
});

const BQpop = asyncHandler(async (req, res) => {

  const command = req.body.command;
  const words = command.split(' ');
  if (words[0] != 'BQPOP' && words.length != 3) {
    res.status(constants.BAD_REQUEST).send('Invalid command');
    return;
  }

  const key = words[1];
  const timeout = parseFloat(words[2]);

  if (queueInUse[key]) {
    res.status(constants.FORBIDDEN).send('API in use by another client');
    return;
  }

  if (!queues[key]) {
    res.status(constants.NOT_FOUND).send('Queue not found');
    return;
  }

  queueInUse[key] = true;

  await new Promise((resolve) => {
    setTimeout(resolve, timeout * 1000);
  });

  const value = queues[key].shift();

  queueInUse[key] = false;
  if (value) {
    res.send(value);
    return;
  }
  res.send(null);
});

module.exports = {
  GetKey,
  SetKey,
  Qpush,
  Qpop,
  BQpop,
  constants
};