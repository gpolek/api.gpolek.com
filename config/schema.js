'use strict'

exports.email = {
  "title": "Email",
  "description": "An email",
  "type": "object",
  "properties": {
    "email": {
      "type": "string",
    },
    "name": {
      "type": "string"
    },
    "phone": {
      "type": "string"
    },
    "message": {
      "type": "string"
    }
  },
  "required": ["email", "name", "phone", "message"]
}
