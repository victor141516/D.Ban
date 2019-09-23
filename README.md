# D.Ban (_/di bæn/_)

Super simple (no external dependencies) **not intended for production** DB\
I don't know how many keys it can handle ¯\\\_(ツ)\_/¯

## Usage

Run it with: `node server.js [--memory[-m]] [--silent[-s]]`

Then use it with:

```
❯ curl -s -X POST http://localhost:3000 -d '{"name": "Jon Snow"}'

{"name":"Jon Snow","_id":"01690720cb339d3479bbc76ab7ed34eb","_created":1569260354219,"_modified":1569260354219}
```
```
❯ curl -s -X GET http://localhost:3000/01690720cb339d3479bbc76ab7ed34eb

{"name":"Jon Snow","_id":"01690720cb339d3479bbc76ab7ed34eb","_created":1569260354219,"_modified":1569260354219}
```
```
❯ curl -s -X PATCH http://localhost:3000/01690720cb339d3479bbc76ab7ed34eb -d '{"name": "Jon Water"}'

{"name":"Jon Water","_id":"01690720cb339d3479bbc76ab7ed34eb","_created":1569260354219,"_modified":1569260389954}
```
```
❯ curl -s -X GET http://localhost:3000/01690720cb339d3479bbc76ab7ed34eb

{"name":"Jon Water","_id":"01690720cb339d3479bbc76ab7ed34eb","_created":1569260354219,"_modified":1569260389954}
```
```
❯ curl -s -X DELETE http://localhost:3000/01690720cb339d3479bbc76ab7ed34eb

{"name":"Jon Water","_id":"01690720cb339d3479bbc76ab7ed34eb","_created":1569260354219,"_modified":1569260389954}
```
```
❯ curl -s -X GET http://localhost:3000/01690720cb339d3479bbc76ab7ed34eb

{"error":"key_not_found"}
```
