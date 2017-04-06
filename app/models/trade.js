var mongoose = require('mongoose');

var tokenSchema = mongoose.Schema({

    local            : {
        email        : String,
        master     : String,
        slave :      String,
    }

});

tradeSchema.methods.insertTrade = function(trade) {
    
};

module.exports = mongoose.model('Trade', tradeSchema);
