
const mongoose = require('mongoose');

let ArticleSchema = new mongoose.Schema ({
    userid : {type : String, required : true},
    articleid : {type : String, required : true, unique : true},
    postedOn : {type : Date, default: Date.now},
    title : {type : String, maxLength : 100},
    body : {type : String, maxLength : 500},
    img : {type : String , default : null},
    imgUrl : {type : String, default : null},
    useAsProfilePic : {type : Boolean, default : false}
})

module.exports = mongoose.model('Article', ArticleSchema, 'Articles');


