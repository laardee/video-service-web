module.exports = {
  "extends": "airbnb",
  "plugins": [],
  "globals": {
    "fetch": false,
    "localStorage": false,
    "FileReader": false,
    "document": false
  },
  "rules": {
    "no-underscore-dangle": "off",
    "react/jsx-filename-extension": "off",
    "max-len": ["error", 150]
  },
  "env": {
    "mocha": true
  }
};
