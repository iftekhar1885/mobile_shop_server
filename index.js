const express = require('express');
const cors = require('cors');
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

require('dotenv').config();
const port = process.env.PORT || 5000;



app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.nrl9whk.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {

    try {
        const serviceCollection = client.db('mobileShop').collection('services');
        const brandCollection = client.db('mobileShop').collection('brandDetails');

        app.get('/services', async (req, res) => {
            const query = {}
            const users = await serviceCollection.find(query).toArray();
        
            res.send(users);
        })

        app.get('/category', async (req, res) =>{
            const category_id = req.query.category_id;
            const query = { category_id };
            const result = await brandCollection.find(query).toArray();
            res.send(result);
        })

    }
    finally {

    }

}

run().catch(err => console.error(err));


app.get('/', (req, res) => {
    res.send('Mobile Shop Server Is running')
})

app.listen(port, () => {
    console.log(`mobile shop server running on ${port}`);
})