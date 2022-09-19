const mongoose = require("mongoose");
// mongoose.connect(process.env.MONGO_URL, {useNewUrlParser: true, useUnifiedTopology: true})

// const db = mongoose.connection;
// db.on('error', console.error.bind(console, 'connection error:'));
// db.once('open', function(){
//     console.log('connected')
// })


mongoose
.connect(process.env.MONGO_URL)
.then(()=>console.log("dbconnection successful"))
.catch((err) => {
    console.log(err)
})
require('./User')
require('./publicLinks')