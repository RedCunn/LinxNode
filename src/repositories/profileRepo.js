const User = require("../schemas/User");

module.exports = {
    retrieveProfiles : async (userids) => {
        try {
            const profiles = await User.find({userid : {$in : userids}})
            return profiles;
        } catch (error) {
            return [];
        }
    }
}