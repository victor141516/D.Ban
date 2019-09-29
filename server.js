const crypto = require('crypto');
const fs = require('fs');
const http = require('http');

const args = process.argv.slice(2);
let IN_MEMORY = false;
let VERBOSE = true;
if (args.includes('-m') || args.includes('--memory')) {
    IN_MEMORY = true;
    console.log('!!! MEMORY ONLY MODE !!!');
}

if (args.includes('-s') || args.includes('--silent')) {
    VERBOSE = false;
}

const DB_NAME = 'db.json';
let DATA;
if (IN_MEMORY) DATA = {};
else {
    if (fs.existsSync(DB_NAME)) {
        DATA = JSON.parse(fs.readFileSync(DB_NAME));
    } else {
        DATA = {};
        _writeToFile();
    }
}

function _writeToFile() {
    return fs.promises.writeFile(DB_NAME, JSON.stringify(DATA));
}

function _writeData(key, value) {
    DATA[key] = value;
    if (!IN_MEMORY) _writeToFile();
}

function _readData(key) {
    return DATA[key];
}

function _deleteData(key) {
    delete DATA[key];
    if (!IN_MEMORY) _writeToFile();
}

function handlePost(_, body, res) {
    if (VERBOSE) console.log('POST:', body);
    const key = crypto.randomBytes(16).toString('hex');
    const date = (new Date).getTime();
    let parsedBody;
    try {
        parsedBody = JSON.parse(body);
    } catch (error) {
        res.write(JSON.stringify({error: 'invalid_json'}))
        return res.end();
    }
    const newBody = {...parsedBody, _id: key, _created: date, _modified: date};
    _writeData(key, newBody);
    res.write(JSON.stringify(DATA[key]));
    res.end();
}

function handleFilter(queryParts, res) {
    if (VERBOSE) console.log('FILTER:', queryParts);
    const filters = queryParts.map(p => {
        const [type, filter ]= p.split('=');
        const [field, a] = filter.split(/(?=[:<>~])/);
        const value = a.substring(1);
        const operator = a.substring(0,1);

        return {type, field, operator, value};
    });
    let results = Object.values(DATA);
    filters.forEach(({type, field, operator, value}) => {
        if (type === 'where') {
            results = results.filter(d => {
                if (operator === ':') {
                    return d[field] === value;
                } else if (operator === '>') {
                    return d[field] > value;
                } else if (operator === '<') {
                    return d[field] < value;
                } else if (operator === '~') {
                    return RegExp(value).test(d[field]);
                }
            })
        }
    });
    res.write(JSON.stringify(results));
    res.end();
}

function handleGet(key, body, res) {
    if (VERBOSE) console.log('GET:', key);
    const value = _readData(key);
    if (value === undefined) {
        res.statusCode = 404;
        res.write(JSON.stringify({error: 'key_not_found'}));
        res.end();
    } else {
        res.write(JSON.stringify(value));
        res.end();
    }
}

function handlePatch(key, body, res) {
    if (VERBOSE) console.log('PATCH:', key, body);
    const value = DATA[key];
    if (value === undefined) {
        res.statusCode = 404;
        res.write(JSON.stringify({error: 'key_not_found'}));
        return res.end();
    }
    let parsedBody;
    try {
        parsedBody = JSON.parse(body);
    } catch (error) {
        res.write(JSON.stringify({error: 'invalid_json'}))
        return res.end();
    }

    const date = (new Date).getTime();
    const newBody = {...value, ...parsedBody, _id: key, _modified: date};
    _writeData(key, newBody);
    res.write(JSON.stringify(newBody));
    res.end();
}

function handleDelete(key, body, res) {
    if (VERBOSE) console.log('DELETE:', key);
    const value = DATA[key];
    if (value === undefined) {
        res.statusCode = 404;
        res.write(JSON.stringify({error: 'key_not_found'}));
        res.end();
    }
    _deleteData(key);
    res.write(JSON.stringify(value));
    res.end();
}

http.createServer(function (req, res) {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    res.setHeader('content-type', 'application/json');
    const path = req.url.substring(1)
    const pathParts = path.split('/');
    const maybeQueryString = pathParts[pathParts.length-1].split('?');
    pathParts[pathParts.length-1] = maybeQueryString[0];
    const queryParts = maybeQueryString.length > 1 ? decodeURI(maybeQueryString[1]).split('&') : [];

    if (req.method === 'POST') {
        req.on('end', () => handlePost(pathParts[0], body, res));
    } else if (req.method === 'GET') {
        if (pathParts[0] === 'filter') {
            req.on('end', () => handleFilter(queryParts, res));
        } else {
            req.on('end', () => handleGet(pathParts[0], body, res));
        }
    } else if (req.method === 'PUT' || req.method === 'PATCH') {
        req.on('end', () => handlePatch(pathParts[0], body, res));
    } else if (req.method === 'DELETE') {
        req.on('end', () => handleDelete(pathParts[0], body, res));
    } else {
        res.statusCode = 405;
        res.write(JSON.stringify({error: 'method_not_allowed'}));
        res.end()
    }
}).listen(process.env.PORT || 3000);

