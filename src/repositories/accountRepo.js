const Account = require("../schemas/Account");
const User = require("../schemas/User");

module.exports = {
    addChain : async (userid, chainid, chainname) => {
      try {
        const accountUpdate = await Account.updateOne({userid : userid},{ $push : { chains : { chainid : chainid, chainname : chainname}}})
        return accountUpdate.modifiedCount === 1;
      } catch (error) {
        console.log('ADD CHAIN UPDATE : ', error);
        return false;
      }
    },
    getActiveAccounts : async () => {
        try {
            const activeAccounts = await Account.find({active : true});
            return activeAccounts;
        } catch (error) {
            console.log('ERROR RETRIEVING ACTIVE ACCOUNTS ', error)
            return [];
        }
    },
   retrieveAccounts : async (userids) => {
      try {
        const accounts = await Account.find({userid : {$in : userids}})
        return accounts;
      } catch (error) {
        console.log('ERROR RETRIEVING ACCOUNTS ', error)
        return [];
      }  
    },

}