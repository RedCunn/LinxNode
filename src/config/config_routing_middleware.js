const routingConnection = require('../routes/routingConnection');
const routingSearchmedia = require('../routes/routingSearchmedia');
const routingAccount = require('../routes/routingAccount');
const routingProfile = require('../routes/routingProfile');
const routingChain = require('../routes/routingChain');

module.exports = function(serverExpress){
    serverExpress.use('/api/Connection', routingConnection);
    serverExpress.use('/api/SearchMedia', routingSearchmedia);
    serverExpress.use('/api/Account', routingAccount);
    serverExpress.use('/api/Profile', routingProfile);
    serverExpress.use('/api/Chain', routingChain);
}