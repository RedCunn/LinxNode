const axios = require('axios');


async function requestSpotifyAccessToken() {

    let _credentials = Buffer.from(`${process.env.SPOTIFY_CLIENTID}:${process.env.SPOTIFY_CLIENTSECRET}`).toString('base64');
    try {
        let _res = await axios.post(
            'https://accounts.spotify.com/api/token',
            'grant_type=client_credentials',
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${_credentials}`
                }
            }
        );

        return _res;
    } catch (error) {
        console.log("fallo en la peticion de access token..........")
        return null;
    }



}

module.exports = {
    fetchSpotifyItems: async (req, res, next) => {

        let { q, type } = req.query;

        try {

            let _accessToken = await requestSpotifyAccessToken();

            let _result = await axios.get(`https://api.spotify.com/v1/search?q=${q}&type=${type}`,
                {
                    headers: { 'Authorization': `Bearer ${_accessToken.data.access_token}` }
                });


            console.log("RESULT DAATA : ", _result.data)

            let retrievedItems = [];

            switch (type) {
                case 'track':
                    _result.data.tracks.items.forEach(item => {
                        const empturl = 'https://community.spotify.com/t5/image/serverpage/image-id/55829iC2AD64ADB887E2A5/image-size/large?v=v2&px=999';
                        let { url } = '';
                        if (item.album && item.album.images.length > 0) {
                            // Verifica si la pista tiene un álbum asociado y si el álbum tiene imágenes
                            ({ url } = item.album.images.find(img => img.url));
                        }
                        const _artists = [];
                        item.artists.forEach(art => _artists.push({ id: art.id, name: art.name }));
                        const selectedTrack = {
                            id: item.id,
                            name: item.name,
                            album: {
                                id: item.album ? item.album.id : null,
                                total_tracks: item.album ? item.album.total_tracks : null,
                                imgurl: url !== '' ? url : empturl,
                                name: item.album ? item.album.name : null,
                                release_date: item.album ? item.album.release_date : null
                            },
                            artists: _artists
                        };
                        retrievedItems.push(selectedTrack);
                    });
                    break;
                case 'artist':
                    _result.data.artists.items.forEach(item => {
                    
                        const empturl = 'https://community.spotify.com/t5/image/serverpage/image-id/55829iC2AD64ADB887E2A5/image-size/large?v=v2&px=999';
                        let {url} = '';
                        if(item.images.length > 0){
                            ({url} = item.images.find(img => img.url));
                        }
                        const genres = [];
                        item.genres.forEach(g => genres.push(g));
                        const selectedArtist = {
                            id: item.id,
                            name: item.name,
                            genres: genres,
                            imgurl: url != '' ? url : empturl,
                            followers: item.followers.total
                        }
                        retrievedItems.push(selectedArtist);
                    });
                    break;
                case 'album':

                _result.data.albums.items.forEach(item => {
                    const empturl = 'https://community.spotify.com/t5/image/serverpage/image-id/55829iC2AD64ADB887E2A5/image-size/large?v=v2&px=999';
                    let {url} = '';
                    if(item.images.length > 0){
                        ({url} = item.images.find(img => img.url));
                    }

                    const _artists = [];
                    item.artists.forEach(art => _artists.push({ id: art.id, name: art.name }));
                    const selectedAlbum = {
                        id : item.id,
                        album_type : item.album_type,
                        total_tracks : item.total_tracks,
                        imgurl : url != '' ? url : empturl,
                        name : item.name,
                        release_date : item.release_date,
                        artists : _artists
                    }
                    retrievedItems.push(selectedAlbum);
                });                
                    break;
                case 'show' : 
                    _result.data.shows.items.forEach(item => {
                        const empturl = 'https://community.spotify.com/t5/image/serverpage/image-id/55829iC2AD64ADB887E2A5/image-size/large?v=v2&px=999';
                        let {url} = '';
                        if(item.images.length > 0){
                            ({url} = item.images.find(img => img.url));
                        }
                    
                        const selectedShow = {
                            id : item.id,
                            
                        }
                        retrievedItems.push(selectedShow);
                    });                
                    console.log("POsCAS RECUPERADOS : :: : :", retrievedItems);
                    break;
            }

            res.status(200).send({
                code: 0,
                error: null,
                message: `${type}s recuperados.......`,
                token: null,
                userData: null,
                others: retrievedItems
            })

        } catch (error) {


            res.status(400).send({
                code: 1,
                error: error.message,
                message: `ERROR AL RECUPERAR ${type}`,
                token: null,
                userData: null,
                others: null
            })
        }
    },
    fetchFilms: async (req, res, next) => {
        try {

        } catch (error) {

        }
    },
    fetchBooks: async (req, res, next) => {
        try {

        } catch (error) {

        }
    },
    fetchGames: async (req, res, next) => {
        try {

        } catch (error) {

        }
    }

}