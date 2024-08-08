const Account = require('../schemas/Account');
const HalfConnection = require('../schemas/HalfConnection');
const Connection = require('../schemas/Connection');
const usersFilterRepo = require('./usersFilterRepository');

const getMatchingLocation = async (user, searchgroup) => {

    try {
        let _filteredByUserPreferences = [];
        const locationkey = user.preferences.proxyRange;

        if (locationkey === 'global') {
            _filteredByUserPreferences = searchgroup;
        } else {
            _filteredByUserPreferences = searchgroup.filter(doc =>
                doc.geolocation[`${locationkey}_id`] === user.geolocation[`${locationkey}_id`]
            );
        }

        const filteredByOthersPreferences = _filteredByUserPreferences.filter(doc =>
            doc.geolocation[doc.preferences.proxyRange] === user.geolocation[doc.preferences.proxyRange]
        );

        return filteredByOthersPreferences;
    } catch (error) {
        console.error('Error al recuperar perfiles coincidentes por ubicación:', error);
        throw error;
    }
}

const getMatchingGenders = async (user, searchgroup) => {
    try {
        const _filteredByUserPreferences = searchgroup.filter(doc =>
            user.preferences.genders.includes(doc.gender)
        );

        const filteredByOthersPreferences = _filteredByUserPreferences.filter(doc =>
            doc.preferences.genders.includes(user.gender)
        );

        return filteredByOthersPreferences;
    } catch (error) {
        console.error('Error al recuperar perfiles coincidentes por género:', error);
        throw error;
    }
}

const getMatchingAge = async (user, searchgroup) => {
    try {
        const currentYear = new Date().getFullYear();
        const userAge = currentYear - new Date(user.birthday).getFullYear();

        const _filteredByUserPreferences = searchgroup.filter(doc => {
            return userAge >= user.preferences.ageRange.fromAge && userAge <= user.preferences.ageRange.toAge;
        });

        const filteredByOthersPreferences = _filteredByUserPreferences.filter(doc =>
            doc.preferences.ageRange.fromAge <= userAge && doc.preferences.ageRange.toAge >= userAge
        );

        return filteredByOthersPreferences;
    } catch (error) {
        console.error('Error al recuperar perfiles coincidentes por edad:', error);
        throw error;
    }
}

const getMatchingLanguages = async (user, searchgroup) => {
    try {
        const _filteredByUserPreferences = searchgroup.filter(doc =>
            doc.languages.some(lang => user.preferences.languages.includes(lang))
        );

        const filteredByOthersPreferences = _filteredByUserPreferences.filter(doc =>
            doc.preferences.languages.some(lang => user.languages.includes(lang))
        );

        return filteredByOthersPreferences;
    } catch (error) {
        console.error('Error al recuperar perfiles coincidentes por lengua:', error);
        throw error;
    }
}
const getAxisFromPolitics = (politics) => {
    if (politics === 'center' || politics === 'none') {
        return politics;
    } else {
        const [abs, ord] = politics.split('-');
        return { abs, ord };
    }
};
const compareAxis = (axisA, axisB) => {

    if (typeof axisA === 'string' && typeof axisB === 'string') {
        return axisA === axisB;
    }
    if (typeof axisA === 'object' && typeof axisB === 'object') {

        return axisA.abs === axisB.abs && axisA.ord === axisB.ord;
    }

    return false;
}

const comparePolitics = (userAxis, axisToCompare, preference) => {
    if (preference === 'true') {
        return compareAxis(userAxis, axisToCompare);
    } else if (preference === 'false') {
        return true;
    } else {
        const prefValue = preference.split('-')[1];
        switch (prefValue) {
            case 'center':
                return axisToCompare !== 'center';
            case 'autho':
                return axisToCompare.abs !== 'autho';
            case 'right':
                return axisToCompare.ord !== 'right';
            case 'left':
                return axisToCompare.ord !== 'left';
            case 'none':
                return axisToCompare !== 'none';
            default:
                return false;
        }
    }
};

const getPoliticsCompatibility = (user, linx) => {
    //-----------POLITICS (2/4 = 0,5)
    try {
        let percentage = 0;
        const userAxis = getAxisFromPolitics(user.politics);
        const linxAxis = getAxisFromPolitics(linx.politics);
        const userPref = user.preferences.sharePolitics;
        const linxPref = linx.preferences.sharePolitics;
        const userMatch = comparePolitics(userAxis, linxAxis, userPref);
        const linxMatch = comparePolitics(linxAxis, userAxis, linxPref);

        if (userMatch && linxMatch) {
            percentage += 0.5;
        }

        return percentage;
    } catch (error) {
        console.error('Error al recuperar porcentaje de compatibilidad por política:', error);
        throw error;
    }
};

const compareDietPreferences = (share, dietA, dietB) => {

    if (share) {
        if (dietA === dietB) {
            return true;
        } else {
            return false;
        }
    } else {
        return true;
    }
}

const getDietCompatibility = (user, linx) => {
    //-----------DIET (1/4 = 0,25)
    try {
        let percentage = 0;

        const userPref = user.preferences.shareDiet;
        const linxPref = linx.preferences.shareDiet;
        const userMatch = compareDietPreferences(userPref, user.diet, linx.diet);
        const linxMatch = compareDietPreferences(linxPref, linx.diet, user.diet);

        if (userMatch && linxMatch) {
            percentage += 0.25;
        }

        return percentage;
    } catch (error) {
        console.error('Error al recuperar porcentaja de compatibilidad por dieta:', error);
        throw error;
    }
}

const compareWorkPreferences = (preference, workA, workB) => {
    switch (preference) {
        case 'true':
            return workA === workB;
        case 'false':
            return true;
        case 'avoid':
            return workA !== workB;
        default:
            return false;
    }
}


const getWorkCompatibility = (user, linx) => {
    //--------------WORK (1/4 = 0,25)
    try {
        // true || false || avoid
        let percentage = 0;
        const userWork = user.work.industry ? user.work.industry : user.work.other;
        const linxWork = linx.work.industry ? linx.work.industry : linx.work.other;

        if (userWork === '' && linxWork === '') {
            return 0.25;
        }

        const userPref = user.preferences.shareIndustry;
        const linxPref = linx.preferences.shareIndustry;
        const userMatch = compareWorkPreferences(userPref, userWork, linxWork);
        const linxMatch = compareWorkPreferences(linxPref, linxWork, userWork);

        if (userMatch && linxMatch) {
            percentage += 0.25;
        }

        return percentage;
    } catch (error) {
        console.error('Error al recuperar porcentaja de compatibilidad por trabajo:', error);
        throw error;
    }
}

const getCompatibilityPercentage = async (user, searchgroup) => {
    try {
        let candidateGroup = [];
        let rate = 0;
        searchgroup.map((linx) => {
            const politicsRate = getPoliticsCompatibility(user, linx);
            const dietRate = getDietCompatibility(user, linx);
            const workRate = getWorkCompatibility(user, linx);

            rate = politicsRate + dietRate + workRate;

            if (rate >= 0.5) {
                candidateGroup.push(linx)
            }
        })
        return candidateGroup;
    } catch (error) {
        console.error('Error al recuperar porcentaje de compatibilidad............:', error);
        throw error;
    }
}
const retrieveHalfMatches = async (user) => {
    try {
        let _halfMatches = await HalfConnection.find({ initiator: user.userid });
        return _halfMatches;
    } catch (error) {
        console.log('error retrieving HalfMatches...', error)
    }
}
const retrieveMatches = async (user) => {
    try {
        let _matches = await Connection.find({
            $or: [
                { userid_a: user.userid },
                { userid_b: user.userid }
            ]
        });
        return _matches;
    } catch (error) {
        console.log('error retrieving Matches...', error)
    }
}

module.exports = {
    doMatch: async (userid, linxuserid, matchedAt, roomkey) => {
        try {
            let insertResult = await Connection.create({ connectedAt: matchedAt, userid_a: userid, userid_b: linxuserid, roomkey: roomkey })
            return insertResult;
        } catch (error) {
            console.log('error doing Connection...', error)
        }
    },
    doHalfMatch: async (userid, linxuserid) => {
        try {
            let insertResult = await HalfConnection.create({ initiator: userid, receiver: linxuserid });
            return insertResult;
        } catch (error) {
            console.log('error doing HalfConnection...', error)
        }
    },
    removeFromHalfMatches: async (userid, linxuserid) => {
        try {
            let removeResult = await HalfConnection.deleteOne(
                {
                    $or: [
                        { $and: [{ initiator: userid }, { receiver: linxuserid }] },
                        { $and: [{ initiator: linxuserid }, { receiver: userid }] }
                    ]
                }
            )
            return removeResult;
        } catch (error) {
            console.log('error removing from halfmatches...', error)
        }
    },
    removeFromMatches: async (userid, linxuserid) => {
        try {
            let removeResult = await Connection.deleteOne({
                $or: [
                    { $and: [{ userid_a: userid }, { userid_b: linxuserid }] },
                    { $and: [{ userid_a: linxuserid }, { userid_b: userid }] }
                ]  
            })
            return removeResult;
        } catch (error) {
            console.log('error removing from matches...', error)
        }
    },
    areHalfMatches: async (userid, linxuserid) => {
        try {
            let areHalfMatches = false;
            let _halfMatches = await HalfConnection.find({
                $or: [
                    { $and: [{ initiator: userid }, { receiver: linxuserid }] },
                    { $and: [{ initiator: linxuserid }, { receiver: userid }] }
                ]
            });

            if(_halfMatches.length > 0){
                areHalfMatches = true;
            }

            return areHalfMatches;
        } catch (error) {
            console.log('error in areHalfMatches...', error)
        }
    },
    retrieveProfilesBasedOnCompatibility: async (user) => {
        try {

            //----------- active accounts 
            let _activeAccounts = await usersFilterRepo.retrieveUsersWithActiveAccounts(user);
            //----------- exclude already on chain
            let _userAccount = await Account.findOne({userid : user.userid});
            let excludedUserIds = new Set();

            console.log('USSER ACCCCCOUNTS LINXS : ', _userAccount.linxs)

            if(_userAccount.linxs.length > 0){
                _userAccount.linxs.forEach(linx => {
                    excludedUserIds.add(linx.userid)
                })
            }
            //----------- exclude already matching
            let _matches = await retrieveMatches(user);

            if (_matches.length > 0) {
                _matches.forEach(match => {
                    excludedUserIds.add(match.userid_a === user.userid ? match.userid_b : match.userid_a);
                });
            }

            let _excludedAccounts = _activeAccounts;

            if(excludedUserIds.size > 0 ){
                _excludedAccounts = _activeAccounts.filter(acc => !excludedUserIds.has(acc.userid));
            }

            //-----------LOCATION
            let _filteredByLocation = await getMatchingLocation(user, _excludedAccounts);
            //--------------GENDER 
            let _filteredByGender = await getMatchingGenders(user, _filteredByLocation);
            //----------------AGE 
            let _filteredByAge = await getMatchingAge(user, _filteredByGender);
            //-----------LANG
            let _filteredByLang = await getMatchingLanguages(user, _filteredByAge);

            const finalGroup = await getCompatibilityPercentage(user, _filteredByLang);

            const halfMatches = await retrieveHalfMatches(user);
            let finalGroupUserIds = new Set(finalGroup.map(profile => profile.userid));
            if (halfMatches.length > 0) {    
                halfMatches.forEach(halfMatch => {
                    finalGroupUserIds.delete(halfMatch.receiver);
                });
            }            
            let finalGroupUserIdsToArray = Array.from(finalGroupUserIds);
            
            const accounts = await usersFilterRepo.retrieveAccountsFromUsers(finalGroupUserIdsToArray);

                return accounts;
            
        } catch (error) {
            console.error('ERROR AL RECUPERAR PERFILES COMPATIBLES', error);
            throw error;
        }
    }
}

