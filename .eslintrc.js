module.exports = {
  "env": {
    "browser": true,
    "es2021": true,
  },
  "extends": [
    "plugin:react/recommended",
    "google",
  ],
  "overrides": [
  ],
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module",
  },
  "plugins": [
    "react",
  ],
  "rules": {
    "semi": ["error", "always"],
    "quotes": ["error", "double"],
    "max-len": ["off", {"code": 120}],
    "linebreak-style": ["error", process.platform === "win32" ? "windows" : "unix"],
  },
};
