const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const NoteSchema = new Schema({
    title: { type: String },
    content: { type: String },
    user: { type: String}
});

const NoteModel = model('Note', NoteSchema);

module.exports = NoteModel;