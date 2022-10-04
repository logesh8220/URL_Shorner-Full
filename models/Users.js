const mongoose = require("mongoose")
const UsersSchema = new mongoose.Schema({
    Name: {
        type: String,
        require: true,
    },
    Email: {
        type: String,
        require: true,
    },
    Password: {
        type: String,
        require: true,
    },
    resettoken: {
        data: String,
        default: ""
    },
    token: {
        data: String,
        default: ""
    }
})

module.exports = mongoose.model("Users", UsersSchema)