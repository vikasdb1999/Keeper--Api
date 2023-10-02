const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const UserKeepSchema = new Schema({
    googleId: { type: String },
    displayName: { type: String },
    displayImage: {type: String}
})

const UserKeepModel = model('UserKeep', UserKeepSchema);

module.exports = UserKeepModel;