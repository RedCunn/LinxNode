const User = require("../schemas/User");
const Account = require("../schemas/Account");

module.exports = {
    retrieveUsersWithActiveAccounts : async (user) => {
        return User
                .find({})
                .populate({
                    path: 'accountid',
                    match: { active: true }
                })
                .then(users => {
                    if(user !== null ){
                        return users.filter(u => u.userid !== user.userid);
                    }else{
                        return users;
                    }
                })
                .catch(err => {
                    console.log('ERROR RETRIEVING ACTIVE ACCOUNTS ', err)
                    return [];
                });
    },
    retrieveAccountsFromUsers : async (userids) => {
        try {
            const accounts = await Account.find({ userid: {$in : userids} });
            return accounts;
        } catch (error) {
            console.error('Error al buscar cuentas:', error);
            throw error;
        }
    },
    retrieveMatchingProfilesByLocation : async (user, searchgroup) => {
    
        try {
            let _filteredByUserLocationPref = [];
            const locationkey = user.preferences.proxyRange;
    
            const userPrefQuery = {
                '_id': { $in: searchgroup.map(doc => doc._id) }
            }
    
            if (locationkey === 'global') {
                _filteredByUserLocationPref = searchgroup
            } else {
                userPrefQuery[`geolocation.${locationkey}_id`] = user.geolocation[`${locationkey}_id`]
                _filteredByUserLocationPref = await User.find(userPrefQuery);
            }
    
            const userMatchQuery = {
                '_id': { $in: _filteredByUserLocationPref.map(doc => doc._id) },
                'preferences.proxyRange': locationkey
            }
    
            let matchingByUsersLocationPref = await User.find(userMatchQuery);
            console.log('FILTERED BY locat __________________________________________',matchingByUsersLocationPref);
            return matchingByUsersLocationPref;
    
        } catch (error) {
            console.error('Error al recuperar perfiles coincidentes por ubicación:', error);
            throw error;
        }
    },
    retrieveMatchingProfilesByGender : async (user, searchgroup) => {
        try {
            const userPrefQuery = {
                '_id': { $in: searchgroup.map(doc => doc._id) },
                'gender': { $in: user.preferences.genders }
            }
            let _filteredByUserGendersPref = await User.find(userPrefQuery)
    
            const userMatchQuery = {
                '_id': { $in: _filteredByUserGendersPref.map(doc => doc._id) },
                'preferences.genders': { $in: [user.gender] }
            }
            let matchingByUsersGendersPref = await User.find(userMatchQuery);
            console.log('FILTERED BY gen __________________________________________',matchingByUsersGendersPref);
            return matchingByUsersGendersPref;
    
        } catch (error) {
            console.error('Error al recuperar perfiles coincidentes por género:', error);
            throw error;
        }
    },
    retrieveMatchingProfilesByAge : async (user, searchgroup) => {
        try {
            const currentYear = new Date().getFullYear();
    
            const userPrefQuery = {
                '_id': { $in: searchgroup.map(doc => doc._id) },
                'birthday': {
                    $gte: new Date(currentYear - user.preferences.ageRange.fromAge,0,1),
                    $lte: new Date(currentYear - user.preferences.ageRange.toAge, 0 , 1) 
                }
            }
            let _filteredByUserAgePref = await User.find(userPrefQuery);
    
            const userMatchQuery = {
                '_id': { $in: _filteredByUserAgePref.map(doc => doc._id) },
                $and: [
                    { 'preferences.ageRange.fromAge': { $lte: user.birthday } },
                    { 'preferences.ageRange.toAge': { $gte: user.birthday } }
                ]
            }
            
            let matchingByUsersAgePref = await User.find(userMatchQuery);
            console.log('FILTERED BY age __________________________________________',matchingByUsersAgePref);
            return matchingByUsersAgePref;
        } catch (error) {
            console.error('Error al recuperar perfiles coincidentes por edad:', error);
            throw error;
        }
    },
    retrieveMatchingProfilesByLanguage : async (user, searchgroup) => {
        try {
            const userPrefQuery = {
                '_id': { $in: searchgroup.map(doc => doc._id) },
                'languages': { $in: [user.preferences.languages] }
            }
            let _filteredByUserLangsPref = await User.find(userPrefQuery)
    
            const userMatchQuery = {
                '_id': { $in: _filteredByUserLangsPref.map(doc => doc._id) },
                'preferences.languages': { $in: [user.languages] }
            }
            let matchingByUsersLangsPref = await User.find(userMatchQuery);
    
            return matchingByUsersLangsPref;
        } catch (error) {
            console.error('Error al recuperar perfiles coincidentes por lengua:', error);
            throw error;
        }
    }
    
}

