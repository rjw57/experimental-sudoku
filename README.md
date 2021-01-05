```
$ pip install --user nodeenv
$ nodeenv nodeenv
$ source ./nodeenv/bin/activate
$ npm install
$ firebase emulators:start # in other tab
$ npm test
```

## Data model

* /puzzles/{puzzleId}: Puzzle
* /users/{userId}: User
