const axios = require('axios');


module.exports = {
    geocode : async (lat,long) => {
        const _res = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${long}&key=${process.env.GOOGLE_MAPS_APIKEY}`)

        console.log("GOOGLE RESPONSE : ", _res.data);

        
        const countryResult = _res.data.results.find(result => result.types.includes('country'));
        console.log("PAIS : ", countryResult)
        
        const cityResult = _res.data.results.find(result => result.types.includes('locality') || result.types.includes('administrative_area_level_3') ||
        result.types.includes('postal_code'));
        console.log("CIUDAD : ", cityResult)

        const communityResult = _res.data.results.find(result => result.types.includes('administrative_area_level_1'));
        console.log("COMUNIDAD: ", communityResult)
        
        const provinceResult = _res.data.results.find(result => result.types.includes('administrative_area_level_2'));
        console.log('PROVINCIA: ', provinceResult)

        const continentResult = _res.data.plus_code.global_code;
        console.log('CONTINENTE : ', continentResult)

        const relevantAddress = cityResult.formatted_address;

        const userlocation = {fullLoc : {
            country_id : countryResult.place_id,
            city_id : cityResult.place_id,
            area1_id : communityResult.place_id,
            area2_id : provinceResult.place_id,
            global_code : continentResult
        }, 
        formatAddr : relevantAddress};

        return userlocation;
    },
    placeDetails : async(placeId) => {
        try {
            const response = await axios.get(`https://maps.googleapis.com/maps/api/place/details/json?placeid=${placeId}&fields=address_components&key=${process.env.GOOGLE_MAPS_APIKEY}`);
            return response.data.result;
        } catch (error) {
            console.log('WRONG DETAIL............', error)
        }
    },
    placeAutocomplete : async () => {
        /*
        plus_code: {
            compound_code: 'FF2Q+RCX Madrid, Spain', ==> (+ = %2B & ' ' = %20) ===> FF2Q%2BRCX%20Madrid%20Spain
            global_code: '8CGRFF2Q+RCX'
        }

        url = https://maps.googleapis.com/maps/api/place/autocomplete/json?parameters

        *parameters : 

            - input (required) : 

            ie.  ?input=Vict
                &language=es
                &types=geocode
                &key=process.env.GOOGLE_MAPS_APIKEY

        */
    }
}