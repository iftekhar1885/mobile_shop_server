const express = require('express');
const cors = require('cors');
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

require('dotenv').config();
const port = process.env.PORT || 5000;



app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.nrl9whk.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req, res, next){
    
    const authHeader = req.headers.authorization;
    if(!authHeader){
        return res.status(401).send('unauthorized access');
    }
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function(err, decoded){
        if(err){
            return res.status(403).send({message: 'forbidden access'})
        }
        req.decoded = decoded;
        next();
    })
}

async function run() {

    try {
        const serviceCollection = client.db('mobileShop').collection('services');
        const brandCollection = client.db('mobileShop').collection('brandDetails');
        const bookingsCollection = client.db('mobileShop').collection('bookings');
        const usersCollection = client.db('mobileShop').collection('users');

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
        app.post('/bookings', async (req, res) =>{
            const booking = req.body
            console.log('hello', booking);
            const result = await bookingsCollection.insertOne(booking);
            res.send(result);
        })

        app.get('/bookings',verifyJWT, async (req, res) =>{
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            console.log(decodedEmail, email);

            if(email !== decodedEmail){
                return res.status(403).send({message: 'forbidden access'});
            }
            const query = { email : email };
            const bookings = await bookingsCollection.find(query).toArray();
            res.send(bookings);
        })

        app.get('/jwt', async(req, res) =>{
            const email = req.query.email;
            const query = {email: email};
            const user = await usersCollection.findOne(query);

            if(user){
                const token = jwt.sign({email}, process.env.ACCESS_TOKEN, )
                return res.send({accessToken: token});

            }
            console.log(user);
            res.status(403).send({accessToken: ''})
        })

        app.get('/users', async(req, res) =>{
            const query = {};
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        })
        app.post('/users', async (req, res) =>{
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });
       
          app.get ('/users/sellers/:email', async (req, res) =>{
            const email = req.params.email;
            console.log(req.params.email);
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({isSeller: user?.role === 'seller'});
          })

        app.get('/users/buyer/:email', async (req, res) =>{
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({isSeller: user?.role === 'buyer'});
          })

        app.get('/users/admin/:email', async (req, res) =>{
            const email = req.params.email;
            
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({isAdmin: user?.role === 'admin'});
        })
        app.put('/users/admin/:id',verifyJWT, async(req, res) =>{
            const decodedEmail = req.decoded.email;
            const query = {email: decodedEmail};
            const user = await usersCollection.findOne(query);

            if(user?.role !== 'admin'){
                return res.status(403).send({message: 'forbidden access'})
            }
            const  id = req.params.id;
            console.log('id', id)
            const filter =  { _id: ObjectId(id) }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        })
        app.get('/sell', async(req, res) =>{
            let query = {};
            if(req.query.email){
                query = {
                    email: req.query.email
                }
            }
            const cursor = brandCollection.find(query);
            const sells = await cursor.toArray();
            res.send(sells);
        })
      
        app.post('/sells', async(req, res) =>{
            const  order = req.body;
            const result = await brandCollection.insertOne(order);
            res.send(result);

        })

        app.put('/sell/:id', async (req, res) =>{
            const id = req.params.id;
            const filter = {_id: ObjectId(id) };
            const options = { upsert: true }
           
            const updatedDoc = {
                $set: {
                    advertise: true
                }
            }
            const result = await brandCollection.updateOne(filter, updatedDoc, options)
            res.send(result);
        })

        app.get('/addproduct', async(req, res) =>{
            const filter = {advertise: true }
            const result = await brandCollection.find(filter).toArray()
            res.send(result);
        })
        
        app.delete('/sell/:id', async(req, res) =>{
            const id = req.params.id;
            const query = {_id: ObjectId(id) };
            const result = await brandCollection.deleteOne(query);
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