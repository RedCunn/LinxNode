const Article = require("../schemas/Article")

module.exports = {
    retrieveAccountArticles : async (userid) => {
        try {
            
        } catch (error) {
            
        }
    },
    retrieveAccountsArticles : async (userids) => {
        try {
            const articles = await Article.find({userid : {$in : userids}});
            return articles;
        } catch (error) {
            console.log('ERROR RETRIEVING ACCOUNTSSS articles : ', error)
            return [];
        }
    }
}