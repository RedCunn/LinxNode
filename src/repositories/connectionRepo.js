const Account = require('../schemas/Account');
const HalfConnection = require('../schemas/HalfConnection');
const Connection = require('../schemas/Connection');
const usersFilterRepo = require('./usersFilterRepository');
const accountRepo = require('./accountRepo');
const profileRepo = require('./profileRepo');

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
const retrieveHalfConnections = async (userid) => {
    try {
        let _halfConns = await HalfConnection.find({ receiver: userid });
        return _halfConns;
    } catch (error) {
        console.log('error retrieving HalfMatches...', error)
        return [];
    }
}

const excludeConnectedProfiles = (userid, connections, profiles) => {
    if(connections.length > 0){
        let excludedUserIds = new Set();
        connections.forEach(conn => {
            excludedUserIds.add(conn.userid_a === userid ? conn.userid_b : conn.userid_a);
        });
        const notConnectedProfiles = profiles.filter(prof => !excludedUserIds.has(prof.userid));
        return notConnectedProfiles;
    }else{
        return profiles;
    }
}

const getUserConnections = async (userid) => {
    try {
        const connections = await Connection.find({
            $or: [
                { userid_a: userid },
                { userid_b: userid }
            ]
        });
        return connections;
    } catch (error) {
        console.log('ERROR GETTING USER CONNECTIONS : ', error)
        return [];
    }
}

module.exports = {
    doMatch: async (userid, linxuserid, matchedAt, roomkey) => {
        try {
            let insertResult = await Connection.create({ connectedAt: matchedAt, userid_a: userid, userid_b: linxuserid, roomkey: roomkey, active : true })
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
    findConnectionCandidates: async (user) => {
        try {

            //----------- active accounts 
            const _activeAccounts = await accountRepo.getActiveAccounts();
            const filteredAccounts = _activeAccounts.filter(account => account.userid !== user.userid);
            const useridSet = new Set(filteredAccounts.map(acc => acc.userid));
            const _activeProfiles = await profileRepo.retrieveProfiles(Array.from(useridSet));

            //----------- exclude already connected
            const connections = await getUserConnections(user.userid);
            const filteredProfiles = excludeConnectedProfiles(user.userid, connections , _activeProfiles);

            //-----------MATCH LOCATION
            const _filteredByLocation = await getMatchingLocation(user, filteredProfiles);
            //--------------MATCH GENDER 
            const _filteredByGender = await getMatchingGenders(user, _filteredByLocation);
            //----------------MATCH AGE 
            const _filteredByAge = await getMatchingAge(user, _filteredByGender);
            //-----------MATCH LANG
            const _filteredByLang = await getMatchingLanguages(user, _filteredByAge);

            const finalGroup = await getCompatibilityPercentage(user, _filteredByLang);

            const halfConnections = await retrieveHalfConnections(user.userid);

            let finalProfiles = [];

            if (halfConnections.length > 0) {    
                
                const halfUseridSet = new Set(halfConnections.map(half => half.initiator));
                const finalGroupUserIds = new Set(finalGroup.map(prof => prof.userid));

                const useridsToRetrieve = Array.from(halfUseridSet).filter(id => !finalGroupUserIds.has(id));

                if(useridsToRetrieve.length > 0){

                    const halfConnectedProfiles = await profileRepo.retrieveProfiles(useridsToRetrieve);
                    halfConnectedProfiles.forEach(prof => {
                        finalProfiles.push(prof);
                    });
                }

            }
            
            finalGroup.forEach(prof => {
                finalProfiles.push(prof)
            })
            
            let candidatesMap = new Map();

            finalProfiles.forEach(prof => {
                candidatesMap.set(prof.userid , {candidate : {profile : prof, account : {}}})    
            })

            const profilesAccounts = await accountRepo.retrieveAccounts(Array.from(candidatesMap.keys()));
            
            profilesAccounts.forEach(acc => {
                const candidateEntry = candidatesMap.get(acc.userid);
                if (candidateEntry) {
                    candidateEntry.candidate.account = acc;  
                }
            });
            
            return candidatesMap;
            
        } catch (error) {
            console.error('ERROR AL RECUPERAR PERFILES COMPATIBLES', error);
            throw error;
        }
    },
    retrieveConnections : async (userid) => {
        try {
            const connections = await getUserConnections(userid);
            return connections;
        } catch (error) {
            console.log('error retrieving Matches...', error)
        }
    }
}

