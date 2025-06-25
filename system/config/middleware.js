const isEmpty = require('lodash.isempty');

const originWhitelist = ['http://localhost:8083',
    'http://localhost:4500',
    'http://localhost:4200',
];

function checkCorsOrigin(origin, callback) {
    if (originWhitelist.indexOf(origin) !== -1 || !origin) {
        callback(null, true);
    } else {
        callback(new Error('Not allowed by CORS'));
    }
}

const cors = {
    origin: checkCorsOrigin,
    allowedHeaders: 'Origin,X-Requested-With,Content-Type,Accept,Authorization,stripe-signature',
    methods: 'GET,HEAD,PUT,POST,DELETE,OPTIONS',
};

const morganRequestFormat = function (tokens, req, res) {
    return '[' + [
        tokens.method(req, res),
        tokens.url(req, res),
        tokens.status(req, res),
        tokens['response-time'](req, res)
    ].join('][') + ']';
};

module.exports = {
    cors: cors,
    morganRequestFormat
};